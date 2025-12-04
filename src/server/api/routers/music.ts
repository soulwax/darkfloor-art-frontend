// File: src/server/api/routers/music.ts

import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { z } from "zod";

import { ENABLE_AUDIO_FEATURES } from "@/config/features";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import type { db } from "@/server/db";
import {
  audioFeatures,
  favorites,
  listeningAnalytics,
  listeningHistory,
  playbackState,
  playerSessions,
  playlistTracks,
  playlists,
  recommendationCache,
  recommendationLogs,
  searchHistory,
  userPreferences,
  users,
} from "@/server/db/schema";
import {
  fetchDeezerRecommendations,
  fetchEnhancedRecommendations,
  fetchHybridRecommendations,
  fetchMultiSeedRecommendations,
  filterRecommendations,
  getCacheExpiryDate,
  shuffleWithDiversity,
} from "@/server/services/recommendations";
import { isTrack, type Track } from "@/types";

const trackSchema = z.object({
  id: z.number(),
  readable: z.boolean(),
  title: z.string(),
  title_short: z.string(),
  title_version: z.string(),
  link: z.string(),
  duration: z.number(),
  rank: z.number(),
  explicit_lyrics: z.boolean(),
  explicit_content_lyrics: z.number(),
  explicit_content_cover: z.number(),
  preview: z.string(),
  md5_image: z.string(),
  artist: z.object({
    id: z.number(),
    name: z.string(),
    link: z.string(),
    picture: z.string(),
    picture_small: z.string(),
    picture_medium: z.string(),
    picture_big: z.string(),
    picture_xl: z.string(),
    tracklist: z.string(),
    type: z.literal("artist"),
  }),
  album: z.object({
    id: z.number(),
    title: z.string(),
    cover: z.string(),
    cover_small: z.string(),
    cover_medium: z.string(),
    cover_big: z.string(),
    cover_xl: z.string(),
    md5_image: z.string(),
    tracklist: z.string(),
    type: z.literal("album"),
  }),
  type: z.literal("track"),
});

/**
 * Automatically sync favorites based on play count
 * Keeps top 8-16 most played tracks as favorites
 */
async function syncAutoFavorites(
  database: typeof db,
  userId: string,
) {
  // Get top tracks by play count (excluding skipped plays, requiring at least 50% completion)
  const topTracks = await database
    .select({
      trackId: listeningAnalytics.trackId,
      trackData: listeningAnalytics.trackData,
      playCount: sql<number>`COUNT(*) FILTER (WHERE ${listeningAnalytics.skipped} = false AND ${listeningAnalytics.completionPercentage} >= 50)`,
    })
    .from(listeningAnalytics)
    .where(eq(listeningAnalytics.userId, userId))
    .groupBy(listeningAnalytics.trackId, listeningAnalytics.trackData)
    .having(sql`COUNT(*) FILTER (WHERE ${listeningAnalytics.skipped} = false AND ${listeningAnalytics.completionPercentage} >= 50) >= 3`) // Minimum 3 plays
    .orderBy(desc(sql`COUNT(*) FILTER (WHERE ${listeningAnalytics.skipped} = false AND ${listeningAnalytics.completionPercentage} >= 50)`))
    .limit(16); // Top 16 tracks

  if (topTracks.length === 0) {
    return;
  }

  // Get current favorites
  const currentFavorites = await database.query.favorites.findMany({
    where: eq(favorites.userId, userId),
  });

  const currentFavoriteTrackIds = new Set(
    currentFavorites.map((f: { trackId: number }) => f.trackId),
  );
  const topTrackIds = new Set(topTracks.map((t: { trackId: number }) => t.trackId));

  // Remove favorites that are no longer in top tracks
  const toRemove = currentFavorites.filter(
    (f: { trackId: number }) => !topTrackIds.has(f.trackId),
  );
  if (toRemove.length > 0) {
    const trackIdsToRemove = toRemove.map((f: { trackId: number }) => f.trackId);
    await database
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          inArray(favorites.trackId, trackIdsToRemove),
        ),
      );
  }

  // Add new favorites that are in top tracks but not yet favorited
  const toAdd = topTracks.filter((t: { trackId: number }) => !currentFavoriteTrackIds.has(t.trackId));
  if (toAdd.length > 0) {
    await database.insert(favorites).values(
      toAdd.map((t: { trackId: number; trackData: unknown }) => ({
        userId,
        trackId: t.trackId,
        trackData: t.trackData,
      })),
    );
  }
}

export const musicRouter = createTRPCRouter({
  // ============================================
  // FAVORITES
  // ============================================

  addFavorite: protectedProcedure
    .input(z.object({ track: trackSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.favorites.findFirst({
        where: and(
          eq(favorites.userId, ctx.session.user.id),
          eq(favorites.trackId, input.track.id),
        ),
      });

      if (existing) {
        return { success: true, alreadyExists: true };
      }

      await ctx.db.insert(favorites).values({
        userId: ctx.session.user.id,
        trackId: input.track.id,
        trackData: input.track as unknown as Record<string, unknown>,
      });

      return { success: true, alreadyExists: false };
    }),

  removeFavorite: protectedProcedure
    .input(z.object({ trackId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(favorites)
        .where(
          and(
            eq(favorites.userId, ctx.session.user.id),
            eq(favorites.trackId, input.trackId),
          ),
        );

      return { success: true };
    }),

  getFavorites: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.query.favorites.findMany({
        where: eq(favorites.userId, ctx.session.user.id),
        orderBy: [desc(favorites.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });

      return items.map((item: { id: number; trackData: unknown; createdAt: Date }) => ({
        id: item.id,
        track: item.trackData as Track,
        createdAt: item.createdAt,
      }));
    }),

  isFavorite: protectedProcedure
    .input(z.object({ trackId: z.number() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.db.query.favorites.findFirst({
        where: and(
          eq(favorites.userId, ctx.session.user.id),
          eq(favorites.trackId, input.trackId),
        ),
      });

      return { isFavorite: !!item };
    }),

  syncAutoFavorites: protectedProcedure.mutation(async ({ ctx }) => {
    await syncAutoFavorites(ctx.db, ctx.session.user.id);
    return { success: true };
  }),

  // ============================================
  // PLAYLISTS
  // ============================================

  createPlaylist: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(256),
        description: z.string().optional(),
        isPublic: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [playlist] = await ctx.db
        .insert(playlists)
        .values({
          userId: ctx.session.user.id,
          name: input.name,
          description: input.description,
          isPublic: input.isPublic,
        })
        .returning();

      return playlist;
    }),

  updatePlaylistVisibility: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        isPublic: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const playlist = await ctx.db.query.playlists.findFirst({
        where: and(
          eq(playlists.id, input.id),
          eq(playlists.userId, ctx.session.user.id),
        ),
      });

      if (!playlist) {
        throw new Error("Playlist not found");
      }

      await ctx.db
        .update(playlists)
        .set({
          isPublic: input.isPublic,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(playlists.id, input.id),
            eq(playlists.userId, ctx.session.user.id),
          ),
        );

      return { success: true, isPublic: input.isPublic };
    }),

  updatePlaylistMetadata: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(256).optional(),
        description: z.string().max(1024).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const playlist = await ctx.db.query.playlists.findFirst({
        where: and(
          eq(playlists.id, input.id),
          eq(playlists.userId, ctx.session.user.id),
        ),
      });

      if (!playlist) {
        throw new Error("Playlist not found");
      }

      const updateData: Partial<typeof playlists.$inferInsert> = {};

      if (input.name !== undefined) {
        updateData.name = input.name;
      }

      if (input.description !== undefined) {
        updateData.description =
          input.description.trim().length > 0 ? input.description : null;
      }

      if (Object.keys(updateData).length === 0) {
        return { success: true };
      }

      updateData.updatedAt = new Date();

      await ctx.db
        .update(playlists)
        .set(updateData)
        .where(
          and(
            eq(playlists.id, input.id),
            eq(playlists.userId, ctx.session.user.id),
          ),
        );

      return { success: true };
    }),

  getPlaylists: protectedProcedure.query(async ({ ctx }) => {
    const playlistsResult = await ctx.db.query.playlists.findMany({
      where: eq(playlists.userId, ctx.session.user.id),
      orderBy: [desc(playlists.createdAt)],
      with: {
        tracks: {
          orderBy: [desc(playlistTracks.position)],
          limit: 4, // Preview tracks
        },
      },
    });

    // Type the result explicitly to avoid any type issues
    type PlaylistWithTracksFromQuery = {
      id: number;
      userId: string;
      name: string;
      description: string | null;
      isPublic: boolean;
      coverImage: string | null;
      createdAt: Date;
      updatedAt: Date | null;
      tracks: Array<{
        id: number;
        trackId: number;
        trackData: unknown;
        playlistId: number;
        position: number;
        addedAt: Date;
      }>;
    };

    return (playlistsResult as PlaylistWithTracksFromQuery[]).map((playlist) => ({
      ...playlist,
      tracks: playlist.tracks.map((t) => ({
        id: t.id,
        track: t.trackData as Track,
        position: t.position,
        addedAt: t.addedAt,
      })),
    }));
  }),

  getPlaylist: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const playlist = await ctx.db.query.playlists.findFirst({
        where: and(
          eq(playlists.id, input.id),
          eq(playlists.userId, ctx.session.user.id),
        ),
        with: {
          tracks: {
            orderBy: [desc(playlistTracks.position)],
          },
        },
      });

      if (!playlist) {
        throw new Error("Playlist not found");
      }

      return {
        ...playlist,
        tracks: playlist.tracks.map((t: { id: number; trackData: unknown; position: number; addedAt: Date }) => ({
          id: t.id,
          track: t.trackData as Track,
          position: t.position,
          addedAt: t.addedAt,
        })),
      };
    }),

  getPublicPlaylist: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const playlist = await ctx.db.query.playlists.findFirst({
        where: and(
          eq(playlists.id, input.id),
          eq(playlists.isPublic, true),
        ),
        with: {
          tracks: {
            orderBy: [desc(playlistTracks.position)],
          },
        },
      });

      if (!playlist) {
        throw new Error("Playlist not found or not public");
      }

      return {
        ...playlist,
        tracks: playlist.tracks.map((t: { id: number; trackData: unknown; position: number; addedAt: Date }) => ({
          id: t.id,
          track: t.trackData as Track,
          position: t.position,
          addedAt: t.addedAt,
        })),
      };
    }),

  addToPlaylist: protectedProcedure
    .input(
      z.object({
        playlistId: z.number(),
        track: trackSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const playlist = await ctx.db.query.playlists.findFirst({
        where: and(
          eq(playlists.id, input.playlistId),
          eq(playlists.userId, ctx.session.user.id),
        ),
      });

      if (!playlist) {
        throw new Error("Playlist not found");
      }

      // Check if track already exists in playlist
      const existing = await ctx.db.query.playlistTracks.findFirst({
        where: and(
          eq(playlistTracks.playlistId, input.playlistId),
          eq(playlistTracks.trackId, input.track.id),
        ),
      });

      if (existing) {
        return { success: true, alreadyExists: true };
      }

      // Get max position
      const maxPos = await ctx.db
        .select({ max: sql<number>`max(${playlistTracks.position})` })
        .from(playlistTracks)
        .where(eq(playlistTracks.playlistId, input.playlistId));

      const nextPosition = (maxPos[0]?.max ?? -1) + 1;

      await ctx.db.insert(playlistTracks).values({
        playlistId: input.playlistId,
        trackId: input.track.id,
        trackData: input.track as unknown as Record<string, unknown>,
        position: nextPosition,
      });

      return { success: true };
    }),

  removeFromPlaylist: protectedProcedure
    .input(
      z.object({
        playlistId: z.number(),
        trackEntryId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership through the playlist
      const playlist = await ctx.db.query.playlists.findFirst({
        where: and(
          eq(playlists.id, input.playlistId),
          eq(playlists.userId, ctx.session.user.id),
        ),
      });

      if (!playlist) {
        throw new Error("Playlist not found");
      }

      await ctx.db
        .delete(playlistTracks)
        .where(
          and(
            eq(playlistTracks.id, input.trackEntryId),
            eq(playlistTracks.playlistId, input.playlistId),
          ),
        );

      return { success: true };
    }),

  deletePlaylist: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(playlists)
        .where(
          and(
            eq(playlists.id, input.id),
            eq(playlists.userId, ctx.session.user.id),
          ),
        );

      return { success: true };
    }),

  reorderPlaylist: protectedProcedure
    .input(
      z.object({
        playlistId: z.number(),
        trackUpdates: z.array(
          z.object({
            trackEntryId: z.number(),
            newPosition: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const playlist = await ctx.db.query.playlists.findFirst({
        where: and(
          eq(playlists.id, input.playlistId),
          eq(playlists.userId, ctx.session.user.id),
        ),
      });

      if (!playlist) {
        throw new Error("Playlist not found");
      }

      // Update positions for all tracks
      for (const update of input.trackUpdates) {
        await ctx.db
          .update(playlistTracks)
          .set({ position: update.newPosition })
          .where(
            and(
              eq(playlistTracks.id, update.trackEntryId),
              eq(playlistTracks.playlistId, input.playlistId),
            ),
          );
      }

      return { success: true };
    }),

  // ============================================
  // LISTENING HISTORY
  // ============================================

  addToHistory: protectedProcedure
    .input(
      z.object({
        track: trackSchema,
        duration: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(listeningHistory).values({
        userId: ctx.session.user.id,
        trackId: input.track.id,
        trackData: input.track as unknown as Record<string, unknown>,
        duration: input.duration,
      });

      return { success: true };
    }),

  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.query.listeningHistory.findMany({
        where: eq(listeningHistory.userId, ctx.session.user.id),
        orderBy: [desc(listeningHistory.playedAt)],
        limit: input.limit,
        offset: input.offset,
      });

      return items.map((item: { id: number; trackData: unknown; playedAt: Date; duration: number | null }) => ({
        id: item.id,
        track: item.trackData as Track,
        playedAt: item.playedAt,
        duration: item.duration,
      }));
    }),

  // ============================================
  // SEARCH HISTORY
  // ============================================

  addSearchQuery: protectedProcedure
    .input(z.object({ query: z.string().min(1).max(512) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(searchHistory).values({
        userId: ctx.session.user.id,
        query: input.query,
      });

      return { success: true };
    }),

  getRecentSearches: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
    .query(async ({ ctx, input }) => {
      // Get unique queries with their most recent search time
      const items = await ctx.db
        .selectDistinct({
          query: searchHistory.query,
          searchedAt: sql<Date>`MAX(${searchHistory.searchedAt})`,
        })
        .from(searchHistory)
        .where(eq(searchHistory.userId, ctx.session.user.id))
        .groupBy(searchHistory.query)
        .orderBy(desc(sql`MAX(${searchHistory.searchedAt})`))
        .limit(input.limit);

      return items.map((item: { query: string }) => item.query);
    }),

  // ============================================
  // USER PREFERENCES
  // ============================================

  getUserPreferences: protectedProcedure.query(async ({ ctx }) => {
    let prefs = await ctx.db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, ctx.session.user.id),
    });

    // Create default preferences if they don't exist
    if (!prefs) {
      const [newPrefs] = await ctx.db
        .insert(userPreferences)
        .values({ userId: ctx.session.user.id })
        .returning();
      prefs = newPrefs;
    }

    return prefs;
  }),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        volume: z.number().min(0).max(1).optional(),
        playbackRate: z.number().min(0.5).max(2).optional(),
        repeatMode: z.enum(["none", "one", "all"]).optional(),
        shuffleEnabled: z.boolean().optional(),
        equalizerEnabled: z.boolean().optional(),
        equalizerPreset: z.string().optional(),
        equalizerBands: z.array(z.number()).optional(),
        equalizerPanelOpen: z.boolean().optional(),
        queuePanelOpen: z.boolean().optional(),
        visualizerType: z.enum(["bars", "wave", "circular", "oscilloscope", "spectrum", "spectral-waves", "radial-spectrum", "particles", "waveform-mirror", "frequency-rings", "frequency-bands", "frequency-circular", "frequency-layered", "frequency-waterfall", "frequency-radial", "frequency-particles"]).optional(),
        visualizerEnabled: z.boolean().optional(),
        compactMode: z.boolean().optional(),
        theme: z.enum(["dark", "light"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure preferences exist
      const existing = await ctx.db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, ctx.session.user.id),
      });

      if (!existing) {
        await ctx.db.insert(userPreferences).values({
          userId: ctx.session.user.id,
          ...input,
        });
      } else {
        await ctx.db
          .update(userPreferences)
          .set(input)
          .where(eq(userPreferences.userId, ctx.session.user.id));
      }

      return { success: true };
    }),

  resetPreferences: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .delete(userPreferences)
      .where(eq(userPreferences.userId, ctx.session.user.id));

    return { success: true };
  }),

  // ============================================
  // PLAYER SESSIONS
  // ============================================

  createSession: protectedProcedure
    .input(
      z.object({
        deviceId: z.string(),
        deviceName: z.string().optional(),
        userAgent: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if session already exists for this device
      const existing = await ctx.db.query.playerSessions.findFirst({
        where: and(
          eq(playerSessions.userId, ctx.session.user.id),
          eq(playerSessions.deviceId, input.deviceId),
        ),
      });

      if (existing) {
        // Update last active
        await ctx.db
          .update(playerSessions)
          .set({
            lastActive: new Date(),
            isActive: true,
            deviceName: input.deviceName ?? existing.deviceName,
            userAgent: input.userAgent ?? existing.userAgent,
          })
          .where(eq(playerSessions.id, existing.id));

        return { sessionId: existing.id, isNew: false };
      }

      // Create new session
      const [newSession] = await ctx.db
        .insert(playerSessions)
        .values({
          userId: ctx.session.user.id,
          deviceId: input.deviceId,
          deviceName: input.deviceName,
          userAgent: input.userAgent,
        })
        .returning();

      return { sessionId: newSession!.id, isNew: true };
    }),

  updateSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(playerSessions)
        .set({ lastActive: new Date() })
        .where(
          and(
            eq(playerSessions.id, input.sessionId),
            eq(playerSessions.userId, ctx.session.user.id),
          ),
        );

      return { success: true };
    }),

  endSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(playerSessions)
        .set({ isActive: false })
        .where(
          and(
            eq(playerSessions.id, input.sessionId),
            eq(playerSessions.userId, ctx.session.user.id),
          ),
        );

      return { success: true };
    }),

  getActiveSessions: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.playerSessions.findMany({
      where: and(
        eq(playerSessions.userId, ctx.session.user.id),
        eq(playerSessions.isActive, true),
      ),
      orderBy: [desc(playerSessions.lastActive)],
    });
  }),

  // ============================================
  // PLAYBACK STATE
  // ============================================

  savePlaybackState: protectedProcedure
    .input(
      z.object({
        sessionId: z.number().optional(),
        currentTrack: trackSchema.optional(),
        currentPosition: z.number().min(0).optional(),
        queue: z.array(trackSchema).optional(),
        history: z.array(trackSchema).optional(),
        isShuffled: z.boolean().optional(),
        repeatMode: z.enum(["none", "one", "all"]).optional(),
        originalQueueOrder: z.array(trackSchema).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if playback state exists
      const existing = await ctx.db.query.playbackState.findFirst({
        where: eq(playbackState.userId, ctx.session.user.id),
      });

      const stateData = {
        sessionId: input.sessionId,
        currentTrack: input.currentTrack as unknown as Record<string, unknown> | undefined,
        currentPosition: input.currentPosition,
        queue: input.queue as unknown as Record<string, unknown>[] | undefined,
        history: input.history as unknown as Record<string, unknown>[] | undefined,
        isShuffled: input.isShuffled,
        repeatMode: input.repeatMode,
        originalQueueOrder: input.originalQueueOrder as unknown as Record<string, unknown>[] | undefined,
        lastUpdated: new Date(),
      };

      if (!existing) {
        await ctx.db.insert(playbackState).values({
          userId: ctx.session.user.id,
          ...stateData,
        });
      } else {
        await ctx.db
          .update(playbackState)
          .set(stateData)
          .where(eq(playbackState.userId, ctx.session.user.id));
      }

      return { success: true };
    }),

  getPlaybackState: protectedProcedure.query(async ({ ctx }) => {
    const state = await ctx.db.query.playbackState.findFirst({
      where: eq(playbackState.userId, ctx.session.user.id),
      orderBy: [desc(playbackState.lastUpdated)],
    });

    if (!state) {
      return null;
    }

    return {
      ...state,
      currentTrack: state.currentTrack as Track | null,
      queue: (state.queue as Track[]) ?? [],
      history: (state.history as Track[]) ?? [],
      originalQueueOrder: (state.originalQueueOrder as Track[]) ?? [],
    };
  }),

  clearPlaybackState: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .delete(playbackState)
      .where(eq(playbackState.userId, ctx.session.user.id));

    return { success: true };
  }),

  // ============================================
  // LISTENING ANALYTICS
  // ============================================

  logPlay: protectedProcedure
    .input(
      z.object({
        track: trackSchema,
        sessionId: z.number().optional(),
        duration: z.number().optional(),
        totalDuration: z.number(),
        skipped: z.boolean().default(false),
        playContext: z.enum(["playlist", "search", "favorites", "queue", "album", "artist"]).optional(),
        contextId: z.number().optional(),
        deviceId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const completionPercentage = input.duration
        ? (input.duration / input.totalDuration) * 100
        : 0;

      await ctx.db.insert(listeningAnalytics).values({
        userId: ctx.session.user.id,
        trackId: input.track.id,
        trackData: input.track as unknown as Record<string, unknown>,
        sessionId: input.sessionId,
        duration: input.duration,
        totalDuration: input.totalDuration,
        completionPercentage,
        skipped: input.skipped,
        playContext: input.playContext,
        contextId: input.contextId,
        deviceId: input.deviceId,
      });

      // Sync auto-favorites periodically (every 5th play or when track completes)
      // This ensures favorites stay up-to-date without running on every single play
      const shouldSync = (input.track.id % 5 === 0) || (completionPercentage >= 80 && !input.skipped);
      if (shouldSync) {
        // Run in background without blocking
        syncAutoFavorites(ctx.db, ctx.session.user.id).catch((error) => {
          console.error("[logPlay] Error syncing auto-favorites:", error);
        });
      }

      return { success: true };
    }),

  getListeningStats: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const stats = await ctx.db
        .select({
          totalPlays: sql<number>`COUNT(*)`,
          totalDuration: sql<number>`SUM(${listeningAnalytics.duration})`,
          completedPlays: sql<number>`COUNT(*) FILTER (WHERE ${listeningAnalytics.skipped} = false)`,
          skippedPlays: sql<number>`COUNT(*) FILTER (WHERE ${listeningAnalytics.skipped} = true)`,
          avgCompletion: sql<number>`AVG(${listeningAnalytics.completionPercentage})`,
        })
        .from(listeningAnalytics)
        .where(
          and(
            eq(listeningAnalytics.userId, ctx.session.user.id),
            sql`${listeningAnalytics.playedAt} >= ${since}`,
          ),
        );

      return stats[0] ?? {
        totalPlays: 0,
        totalDuration: 0,
        completedPlays: 0,
        skippedPlays: 0,
        avgCompletion: 0,
      };
    }),

  getTopTracks: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        days: z.number().min(1).max(365).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const topTracks = await ctx.db
        .select({
          trackId: listeningAnalytics.trackId,
          trackData: listeningAnalytics.trackData,
          playCount: sql<number>`COUNT(*)`,
          totalDuration: sql<number>`SUM(${listeningAnalytics.duration})`,
        })
        .from(listeningAnalytics)
        .where(
          and(
            eq(listeningAnalytics.userId, ctx.session.user.id),
            sql`${listeningAnalytics.playedAt} >= ${since}`,
          ),
        )
        .groupBy(listeningAnalytics.trackId, listeningAnalytics.trackData)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(input.limit);

      return topTracks.map((item: { trackData: unknown; playCount: number; totalDuration: number | null }) => ({
        track: item.trackData as Track,
        playCount: item.playCount,
        totalDuration: item.totalDuration,
      }));
    }),

  getTopArtists: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        days: z.number().min(1).max(365).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const items = await ctx.db
        .select({
          trackData: listeningAnalytics.trackData,
        })
        .from(listeningAnalytics)
        .where(
          and(
            eq(listeningAnalytics.userId, ctx.session.user.id),
            sql`${listeningAnalytics.playedAt} >= ${since}`,
          ),
        );

      // Group by artist in memory (since artist is nested in JSON)
      const artistCounts = new Map<number, { name: string; count: number; artistData: Track["artist"] }>();

      for (const item of items) {
        const track = item.trackData as Track;
        const artistId = track.artist.id;

        if (!artistCounts.has(artistId)) {
          artistCounts.set(artistId, {
            name: track.artist.name,
            count: 0,
            artistData: track.artist,
          });
        }

        artistCounts.get(artistId)!.count++;
      }

      return Array.from(artistCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, input.limit)
        .map((item) => ({
          artist: item.artistData,
          playCount: item.count,
        }));
    }),

  // ============================================
  // SMART QUEUE & RECOMMENDATIONS
  // ============================================

  getRecommendations: protectedProcedure
    .input(
      z.object({
        seedTrackId: z.number(),
        limit: z.number().min(1).max(50).default(20),
        excludeTrackIds: z.array(z.number()).optional(),
        useCache: z.boolean().default(true),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Check cache first
      if (input.useCache) {
        const cached = await ctx.db.query.recommendationCache.findFirst({
          where: and(
            eq(recommendationCache.seedTrackId, input.seedTrackId),
            sql`${recommendationCache.expiresAt} > NOW()`,
          ),
        });

        if (cached) {
          let tracks = cached.recommendedTracksData as Track[];

          // Filter out excluded tracks
          if (input.excludeTrackIds && input.excludeTrackIds.length > 0) {
            tracks = tracks.filter((t) => !input.excludeTrackIds!.includes(t.id));
          }

          return tracks.slice(0, input.limit);
        }
      }

      // Get user's top artists for personalization
      const topArtists = await ctx.db
        .select({
          trackData: listeningAnalytics.trackData,
        })
        .from(listeningAnalytics)
        .where(eq(listeningAnalytics.userId, ctx.session.user.id))
        .limit(100);

      const artistCounts = new Map<number, number>();
      for (const item of topArtists) {
        const track = item.trackData as Track;
        artistCounts.set(track.artist.id, (artistCounts.get(track.artist.id) ?? 0) + 1);
      }

      const topArtistIds = Array.from(artistCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id);

      // Fetch fresh recommendations
      const seedTrackResponse = await fetch(
        `https://api.deezer.com/track/${input.seedTrackId}`,
      );
      const seedTrack = (await seedTrackResponse.json()) as Track;

      const recommendations = await fetchHybridRecommendations(
        seedTrack,
        topArtistIds,
        input.limit + 10, // Fetch extra for filtering
      );

      // Filter recommendations
      const filtered = filterRecommendations(recommendations, {
        excludeTrackIds: input.excludeTrackIds,
      });

      // Cache the results
      await ctx.db.insert(recommendationCache).values({
        seedTrackId: input.seedTrackId,
        recommendedTrackIds: filtered.map((t) => t.id) as unknown as Record<string, unknown>,
        recommendedTracksData: filtered as unknown as Record<string, unknown>,
        source: "deezer",
        expiresAt: getCacheExpiryDate(),
      });

      return filtered.slice(0, input.limit);
    }),

  // Get intelligent recommendations using HexMusic API
  getIntelligentRecommendations: protectedProcedure
    .input(
      z.object({
        trackNames: z.array(z.string()).min(1),
        count: z.number().min(1).max(50).default(10),
        excludeTrackIds: z.array(z.number()).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3222";

      try {
        // Get user's similarity preference from database
        const userPrefs = await ctx.db.query.userPreferences.findFirst({
          where: eq(userPreferences.userId, ctx.session.user.id),
        });

        // Map similarity preference to API mode
        // strict → 0, balanced → 1 (default), diverse → 2
        const similarityPreference = userPrefs?.similarityPreference ?? "balanced";
        const mode = similarityPreference === "strict" ? 0 
                    : similarityPreference === "diverse" ? 2 
                    : 1; // balanced is default

        console.log("[IntelligentRecommendations] Using mode:", {
          similarityPreference,
          mode,
          userId: ctx.session.user.id,
        });

        // Call the HexMusic recommendation API from server-side (no CORS issues)
        const response = await fetch(`${API_URL}/hexmusic/recommendations/deezer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            trackNames: input.trackNames,
            n: input.count * 2, // Request more to account for filtering
            mode, // Use user's preference
          }),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const payload = (await response.json()) as unknown;
        const tracks = Array.isArray(payload)
          ? payload.filter((item): item is Track => isTrack(item))
          : [];

        if (tracks.length === 0) {
          console.warn("[IntelligentRecommendations] Backend returned no valid tracks", {
            payloadPreview: Array.isArray(payload) ? payload.slice(0, 2) : payload,
          });
          return [];
        }

        // Filter out excluded tracks
        const filtered = filterRecommendations(tracks, {
          excludeTrackIds: input.excludeTrackIds,
        });

        return filtered.slice(0, input.count);
      } catch (error) {
        console.error("Failed to get intelligent recommendations:", error);
        return [];
      }
    }),

  getSimilarTracks: protectedProcedure
    .input(
      z.object({
        trackId: z.number(),
        limit: z.number().min(1).max(50).default(5),
        excludeTrackIds: z.array(z.number()).optional(),
        similarityLevel: z.enum(["strict", "balanced", "diverse"]).default("balanced"),
        useEnhanced: z.boolean().default(true),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.transaction(async () => {
        // Check cache first (basic recommendations can be cached)
        const cached = await ctx.db.query.recommendationCache.findFirst({
          where: and(
            eq(recommendationCache.seedTrackId, input.trackId),
            sql`${recommendationCache.expiresAt} > NOW()`,
          ),
        });

        // For non-enhanced mode, use cached results if available
        if (!input.useEnhanced && cached) {
          let tracks = cached.recommendedTracksData as Track[];

          if (input.excludeTrackIds && input.excludeTrackIds.length > 0) {
            tracks = tracks.filter((t) => !input.excludeTrackIds!.includes(t.id));
          }

          return tracks.slice(0, input.limit);
        }

        // NON-ENHANCED MODE: Use basic Deezer recommendations (cacheable)
        if (!input.useEnhanced) {
          const recommendations = await fetchDeezerRecommendations(
            input.trackId,
            input.limit + 5,
          );

          const filtered = filterRecommendations(recommendations, {
            excludeTrackIds: [
              ...(input.excludeTrackIds ?? []),
              input.trackId,
            ],
          });

          // Cache basic recommendations for faster subsequent requests
          if (filtered.length > 0 && !cached) {
            try {
              await ctx.db.insert(recommendationCache).values({
                seedTrackId: input.trackId,
                recommendedTrackIds: filtered.map((t) => t.id) as unknown as Record<string, unknown>,
                recommendedTracksData: filtered as unknown as Record<string, unknown>,
                source: "deezer",
                expiresAt: getCacheExpiryDate(),
              });
            } catch {
              // Cache insert may fail if there's a conflict, that's okay
            }
          }

          return filtered.slice(0, input.limit);
        }

        // ENHANCED MODE: Use personalized recommendations (not cached)
        // Fetch seed track details from Deezer
        let seedTrack: Track | null = null;
        try {
          const response = await fetch(`https://api.deezer.com/track/${input.trackId}`);
          if (response.ok) {
            seedTrack = await response.json() as Track;
          }
        } catch (error) {
          console.error("[getSimilarTracks] Error fetching seed track:", error);
        }

        if (!seedTrack) {
          // Fallback to basic recommendations if we can't get seed track
          const recommendations = await fetchDeezerRecommendations(
            input.trackId,
            input.limit + 5,
          );
          return filterRecommendations(recommendations, {
            excludeTrackIds: [
              ...(input.excludeTrackIds ?? []),
              input.trackId, // Exclude the seed track itself
            ],
          }).slice(0, input.limit);
        }

        // Get user's favorite artist IDs for personalization
        const userFavorites = await ctx.db.query.favorites.findMany({
          where: eq(favorites.userId, ctx.session.user.id),
          limit: 100,
        });
        
        const userFavoriteArtistIds = [... new Set<number>(
          userFavorites
            .map((f: { trackData: unknown }) => (f.trackData as Track | null)?.artist?.id)
            .filter((id: unknown): id is number => typeof id === "number")
        )];

        // Get recently played track IDs to avoid repeats
        const recentHistory = await ctx.db.query.listeningHistory.findMany({
          where: eq(listeningHistory.userId, ctx.session.user.id),
          orderBy: desc(listeningHistory.playedAt),
          limit: 50,
        });
        const recentlyPlayedTrackIds: number[] = recentHistory.map((h: { trackId: number }) => h.trackId);

        console.log("[getSimilarTracks] Enhanced recommendations:", {
          seedTrack: `${seedTrack.title} - ${seedTrack.artist.name}`,
          similarityLevel: input.similarityLevel,
          userFavoriteArtists: userFavoriteArtistIds.length,
          recentlyPlayed: recentlyPlayedTrackIds.length,
        });

        // Use enhanced personalized recommendations
        const recommendations = await fetchEnhancedRecommendations(seedTrack, {
          userFavoriteArtistIds,
          recentlyPlayedTrackIds,
          similarityLevel: input.similarityLevel,
          limit: input.limit + 10, // Fetch extra to allow filtering
        });

        const filtered = filterRecommendations(recommendations, {
          excludeTrackIds: [
            ...(input.excludeTrackIds ?? []),
            input.trackId, // Also exclude the seed track
          ],
        });

        // Enhanced recommendations are personalized, so we don't cache them
        // (they would be stale for future requests with different user state)

        return filtered.slice(0, input.limit);
      });
    }),

  generateSmartMix: protectedProcedure
    .input(
      z.object({
        seedTrackIds: z.array(z.number()).min(1).max(5),
        limit: z.number().min(10).max(100).default(50),
        diversity: z.enum(["strict", "balanced", "diverse"]).default("balanced"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3222";

      try {
        // Fetch seed tracks to get their names
        const seedTracks: Track[] = [];
        for (const trackId of input.seedTrackIds) {
          try {
            const response = await fetch(`https://api.deezer.com/track/${trackId}`);
            if (response.ok) {
              const track = (await response.json()) as Track;
              seedTracks.push(track);
            }
          } catch (error) {
            console.error(`Failed to fetch seed track ${trackId}:`, error);
          }
        }

        if (seedTracks.length === 0) {
          throw new Error("Could not fetch any seed tracks");
        }

        // Map diversity preference to API mode
        const mode = input.diversity === "strict" ? 0 
                    : input.diversity === "diverse" ? 2 
                    : 1; // balanced is default

        console.log("[SmartMix] Generating with mode:", {
          diversity: input.diversity,
          mode,
          seedCount: seedTracks.length,
          userId: ctx.session.user.id,
        });

        // Build track names for API
        const trackNames = seedTracks.map(t => `${t.artist.name} ${t.title}`);

        // Call intelligent API
        const response = await fetch(`${API_URL}/hexmusic/recommendations/deezer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            trackNames,
            n: input.limit * 2, // Request more for better variety
            mode,
          }),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const payload = (await response.json()) as unknown;
        if (!Array.isArray(payload)) {
          throw new Error("Unexpected recommendation response format");
        }

        const candidateTracks = payload
          .filter((item): item is Track => isTrack(item))
          .filter((track) => !input.seedTrackIds.includes(track.id));

        if (candidateTracks.length === 0) {
          throw new Error("No valid recommendation tracks received");
        }

        // Apply additional diversity shuffling if needed
        let finalMix: Track[];
        switch (input.diversity) {
          case "diverse":
            finalMix = candidateTracks
              .sort(() => Math.random() - 0.5)
              .slice(0, input.limit);
            break;
          case "balanced":
            finalMix = shuffleWithDiversity(candidateTracks).slice(0, input.limit);
            break;
          case "strict":
            finalMix = candidateTracks.slice(0, input.limit);
            break;
          default:
            finalMix = candidateTracks.slice(0, input.limit);
            break;
        }

        return {
          tracks: finalMix,
          seedCount: seedTracks.length,
          totalCandidates: candidateTracks.length,
        };
      } catch (error) {
        console.error("[SmartMix] Error generating mix, using enhanced fallback:", error);
        
        // Fallback to enhanced multi-seed recommendations
        // Get user's favorite artist IDs for personalization
        const userFavorites = await ctx.db.query.favorites.findMany({
          where: eq(favorites.userId, ctx.session.user.id),
          limit: 100,
        });
        
        const userFavoriteArtistIds = [...new Set<number>(
          userFavorites
            .map((f: { trackData: unknown }) => (f.trackData as Track | null)?.artist?.id)
            .filter((id: unknown): id is number => typeof id === "number")
        )];

        // Fetch seed tracks if not already available
        const seedTracksForFallback: Track[] = [];
        for (const trackId of input.seedTrackIds) {
          try {
            const response = await fetch(`https://api.deezer.com/track/${trackId}`);
            if (response.ok) {
              const track = await response.json() as Track;
              seedTracksForFallback.push(track);
            }
          } catch {
            // Skip failed fetches
          }
        }

        if (seedTracksForFallback.length === 0) {
          // Ultimate fallback - just use Deezer radio
          const allRecommendations: Track[] = [];
          const seenTrackIds = new Set<number>(input.seedTrackIds);

          for (const seedTrackId of input.seedTrackIds) {
            const recs = await fetchDeezerRecommendations(seedTrackId, 20);
            for (const track of recs) {
              if (!seenTrackIds.has(track.id)) {
                allRecommendations.push(track);
                seenTrackIds.add(track.id);
              }
            }
          }

          const finalMix = shuffleWithDiversity(allRecommendations).slice(0, input.limit);

          return {
            tracks: finalMix,
            seedCount: input.seedTrackIds.length,
            totalCandidates: allRecommendations.length,
          };
        }

        // Use the new multi-seed recommendations
        const diversityWeight = input.diversity === "diverse" ? 0.8 
                              : input.diversity === "strict" ? 0.2 
                              : 0.5;

        const multiSeedResult = await fetchMultiSeedRecommendations(seedTracksForFallback, {
          userFavoriteArtistIds,
          limit: input.limit,
          diversityWeight,
        });

        return {
          tracks: multiSeedResult.tracks,
          seedCount: seedTracksForFallback.length,
          totalCandidates: multiSeedResult.totalCandidates,
        };
      }
    }),

  // Log recommendation requests for analytics and debugging
  logRecommendation: protectedProcedure
    .input(
      z.object({
        seedTracks: z.array(trackSchema).min(1),
        recommendedTracks: z.array(trackSchema),
        source: z.enum(["hexmusic-api", "deezer-fallback", "artist-radio", "cached"]),
        requestParams: z.object({
          count: z.number().optional(),
          similarityLevel: z.enum(["strict", "balanced", "diverse"]).optional(),
          useAudioFeatures: z.boolean().optional(),
        }).optional(),
        responseTime: z.number().optional(),
        success: z.boolean(),
        errorMessage: z.string().optional(),
        context: z.enum(["auto-queue", "smart-mix", "manual", "similar-tracks"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(recommendationLogs).values({
        userId: ctx.session.user.id,
        seedTrackIds: input.seedTracks.map(t => t.id),
        seedTrackData: input.seedTracks as unknown as Record<string, unknown>,
        recommendedTrackIds: input.recommendedTracks.map(t => t.id),
        recommendedTracksData: input.recommendedTracks as unknown as Record<string, unknown>,
        source: input.source,
        requestParams: input.requestParams as unknown as Record<string, unknown>,
        responseTime: input.responseTime,
        success: input.success,
        errorMessage: input.errorMessage,
        context: input.context,
      });

      return { success: true };
    }),

  getSmartQueueSettings: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await ctx.db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, ctx.session.user.id),
    });

    if (!prefs) {
      // Return defaults
      return {
        autoQueueEnabled: false,
        autoQueueThreshold: 3,
        autoQueueCount: 5,
        smartMixEnabled: true,
        similarityPreference: "balanced" as const,
      };
    }

    return {
      autoQueueEnabled: prefs.autoQueueEnabled,
      autoQueueThreshold: prefs.autoQueueThreshold,
      autoQueueCount: prefs.autoQueueCount,
      smartMixEnabled: prefs.smartMixEnabled,
      similarityPreference: prefs.similarityPreference as "strict" | "balanced" | "diverse",
    };
  }),

  updateSmartQueueSettings: protectedProcedure
    .input(
      z.object({
        autoQueueEnabled: z.boolean().optional(),
        autoQueueThreshold: z.number().min(0).max(10).optional(),
        autoQueueCount: z.number().min(1).max(20).optional(),
        smartMixEnabled: z.boolean().optional(),
        similarityPreference: z.enum(["strict", "balanced", "diverse"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure preferences exist
      const existing = await ctx.db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, ctx.session.user.id),
      });

      if (!existing) {
        await ctx.db.insert(userPreferences).values({
          userId: ctx.session.user.id,
          ...input,
        });
      } else {
        await ctx.db
          .update(userPreferences)
          .set(input)
          .where(eq(userPreferences.userId, ctx.session.user.id));
      }

      return { success: true };
    }),

  // Clean up expired recommendation cache
  cleanupRecommendationCache: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .delete(recommendationCache)
      .where(lt(recommendationCache.expiresAt, new Date()));

    return { success: true };
  }),

  // ============================================
  // USER PROFILE
  // ============================================

  getCurrentUserProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      userHash: user.userHash,
      profilePublic: user.profilePublic,
      bio: user.bio,
    };
  }),

  // ============================================
  // PUBLIC PROFILE
  // ============================================

  getPublicProfile: publicProcedure
    .input(z.object({ userHash: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.userHash, input.userHash),
      });

      if (!user?.profilePublic) {
        return null;
      }

      // Get user stats
      const [favoriteCount, playlistCount, historyCount] = await Promise.all([
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(favorites)
          .where(eq(favorites.userId, user.id))
          .then((res: Array<{ count: number }>) => res[0]?.count ?? 0),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(playlists)
          .where(and(eq(playlists.userId, user.id), eq(playlists.isPublic, true)))
          .then((res: Array<{ count: number }>) => res[0]?.count ?? 0),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(listeningHistory)
          .where(eq(listeningHistory.userId, user.id))
          .then((res: Array<{ count: number }>) => res[0]?.count ?? 0),
      ]);

      return {
        userHash: user.userHash,
        name: user.name,
        image: user.image,
        bio: user.bio,
        stats: {
          favorites: favoriteCount,
          playlists: playlistCount,
          tracksPlayed: historyCount,
        },
      };
    }),

  getPublicListeningHistory: publicProcedure
    .input(z.object({ userHash: z.string(), limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.userHash, input.userHash),
      });

      if (!user?.profilePublic) {
        return [];
      }

      const history = await ctx.db.query.listeningHistory.findMany({
        where: eq(listeningHistory.userId, user.id),
        orderBy: desc(listeningHistory.playedAt),
        limit: (input.limit ?? 20) * 3, // Fetch more to account for deduplication
      });

      // Deduplicate by trackId, keeping only the most recent occurrence
      const seenTrackIds = new Set<number>();
      const deduplicated = [];

      for (const h of history) {
        const track = h.trackData as Track;
        if (!seenTrackIds.has(track.id)) {
          seenTrackIds.add(track.id);
          deduplicated.push({
            trackData: h.trackData,
            playedAt: h.playedAt,
          });

          if (deduplicated.length >= (input.limit ?? 20)) {
            break;
          }
        }
      }

      return deduplicated;
    }),

  getPublicFavorites: publicProcedure
    .input(z.object({ userHash: z.string(), limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.userHash, input.userHash),
      });

      if (!user?.profilePublic) {
        return [];
      }

      const favs = await ctx.db.query.favorites.findMany({
        where: eq(favorites.userId, user.id),
        orderBy: desc(favorites.createdAt),
        limit: input.limit ?? 20,
      });

      return favs.map((f: { trackData: unknown }) => f.trackData);
    }),

  getPublicPlaylists: publicProcedure
    .input(z.object({ userHash: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.userHash, input.userHash),
      });

      if (!user?.profilePublic) {
        return [];
      }

      const userPlaylists = await ctx.db.query.playlists.findMany({
        where: and(eq(playlists.userId, user.id), eq(playlists.isPublic, true)),
        orderBy: desc(playlists.createdAt),
        with: {
          tracks: {
            limit: 4,
            orderBy: playlistTracks.position,
          },
        },
      });

      // Generate 2x2 grid cover image from first 4 tracks if no coverImage exists
      return userPlaylists.map((playlist: {
        id: number;
        coverImage: string | null;
        tracks?: Array<{ trackData: unknown }>;
      }) => {
        let coverImage = playlist.coverImage;

        // If no custom cover image, generate from tracks
        if (!coverImage && playlist.tracks && playlist.tracks.length > 0) {
          const albumCovers = playlist.tracks
            .map((pt: { trackData: unknown }) => {
              const track = pt.trackData as Track;
              return track.album?.cover_medium ?? track.album?.cover;
            })
            .filter(Boolean)
            .slice(0, 4);

          // Store album covers as array for frontend to create 2x2 grid
          coverImage = JSON.stringify(albumCovers);
        }

        return {
          ...playlist,
          coverImage,
          trackCount: playlist.tracks?.length ?? 0,
        };
      });
    }),

  getPublicTopTracks: publicProcedure
    .input(
      z.object({
        userHash: z.string(),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.userHash, input.userHash),
      });

      if (!user?.profilePublic) {
        return [];
      }

      // Calculate top tracks from ALL TIME (no date filter)
      const topTracks = await ctx.db
        .select({
          trackId: listeningAnalytics.trackId,
          trackData: listeningAnalytics.trackData,
          playCount: sql<number>`COUNT(*)`,
          totalDuration: sql<number>`SUM(${listeningAnalytics.duration})`,
        })
        .from(listeningAnalytics)
        .where(eq(listeningAnalytics.userId, user.id))
        .groupBy(listeningAnalytics.trackId, listeningAnalytics.trackData)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(input.limit);

      return topTracks.map((item: { trackData: unknown; playCount: number; totalDuration: number | null }) => ({
        track: item.trackData as Track,
        playCount: item.playCount,
        totalDuration: item.totalDuration,
      }));
    }),

  getPublicTopArtists: publicProcedure
    .input(
      z.object({
        userHash: z.string(),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.userHash, input.userHash),
      });

      if (!user?.profilePublic) {
        return [];
      }

      // Calculate top artists from ALL TIME (no date filter)
      const items = await ctx.db
        .select({
          trackData: listeningAnalytics.trackData,
        })
        .from(listeningAnalytics)
        .where(eq(listeningAnalytics.userId, user.id));

      // Group by artist in memory (since artist is nested in JSON)
      const artistCounts = new Map<number, { name: string; count: number; artistData: Track["artist"] }>();

      for (const item of items) {
        const track = item.trackData as Track;
        const artistId = track.artist.id;

        if (!artistCounts.has(artistId)) {
          artistCounts.set(artistId, {
            name: track.artist.name,
            count: 0,
            artistData: track.artist,
          });
        }

        artistCounts.get(artistId)!.count++;
      }

      return Array.from(artistCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, input.limit)
        .map((item) => ({
          artist: item.artistData,
          playCount: item.count,
        }));
    }),

  getCurrentUserHash: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
    });
    return user?.userHash ?? null;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        bio: z.string().optional(),
        profilePublic: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set(input)
        .where(eq(users.id, ctx.session.user.id));

      return { success: true };
    }),

  // ============================================
  // AUDIO FEATURES (Future - Essentia)
  // ============================================

  getAudioFeatures: protectedProcedure
    .input(z.object({ trackId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ENABLE_AUDIO_FEATURES) {
        return null;
      }

      const features = await ctx.db.query.audioFeatures.findFirst({
        where: eq(audioFeatures.trackId, input.trackId),
      });

      return features ?? null;
    }),

  getBatchAudioFeatures: protectedProcedure
    .input(z.object({ trackIds: z.array(z.number()).max(50) }))
    .query(async ({ ctx, input }) => {
      if (!ENABLE_AUDIO_FEATURES) {
        return [];
      }

      // This would need a custom query with WHERE IN
      // For now, fetch individually (can be optimized later)
      const features = await Promise.all(
        input.trackIds.map(async (trackId) => {
          const feature = await ctx.db.query.audioFeatures.findFirst({
            where: eq(audioFeatures.trackId, trackId),
          });
          return feature;
        }),
      );

      return features.filter((f: unknown) => f !== undefined);
    }),
});

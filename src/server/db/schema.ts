// File: src/server/db/schema.ts

import { relations, sql } from "drizzle-orm";
import { index, pgTableCreator, primaryKey, unique } from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `hexmusic-stream_${name}`);

type AdapterAccountType = Extract<
  "email" | "oauth" | "oidc" | "webauthn",
  string
>;

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`),
  image: d.varchar({ length: 255 }),
  userHash: d
    .varchar({ length: 32 })
    .unique()
    .$defaultFn(() => {
      // Generate a short, URL-friendly hash from UUID
      return crypto.randomUUID().replace(/-/g, "").substring(0, 16);
    }),
  profilePublic: d.boolean().default(true).notNull(),
  bio: d.text(),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ============================================
// MUSIC LIBRARY TABLES
// ============================================

export const favorites = createTable(
  "favorite",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    trackId: d.bigint({ mode: "number" }).notNull(),
    trackData: d.jsonb().notNull(), // Store full track object for offline access
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    index("favorite_user_idx").on(t.userId),
    index("favorite_track_idx").on(t.trackId),
    index("favorite_user_track_idx").on(t.userId, t.trackId),
    unique("favorite_user_track_unique").on(t.userId, t.trackId),
  ],
);

export const playlists = createTable(
  "playlist",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: d.varchar({ length: 256 }).notNull(),
    description: d.text(),
    coverImage: d.varchar({ length: 512 }),
    isPublic: d.boolean().default(false).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("playlist_user_idx").on(t.userId),
    index("playlist_created_idx").on(t.createdAt),
  ],
);

export const playlistTracks = createTable(
  "playlist_track",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    playlistId: d
      .integer()
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    trackId: d.bigint({ mode: "number" }).notNull(),
    trackData: d.jsonb().notNull(),
    position: d.integer().notNull(),
    addedAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    index("playlist_track_playlist_idx").on(t.playlistId),
    index("playlist_track_position_idx").on(t.playlistId, t.position),
    unique("playlist_track_unique").on(t.playlistId, t.trackId),
  ],
);

export const listeningHistory = createTable(
  "listening_history",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    trackId: d.bigint({ mode: "number" }).notNull(),
    trackData: d.jsonb().notNull(),
    playedAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    duration: d.integer(), // seconds actually played
  }),
  (t) => [
    index("history_user_idx").on(t.userId),
    index("history_played_idx").on(t.playedAt),
    index("history_user_played_idx").on(t.userId, t.playedAt),
  ],
);

export const searchHistory = createTable(
  "search_history",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    query: d.varchar({ length: 512 }).notNull(),
    searchedAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    index("search_user_idx").on(t.userId),
    index("search_query_idx").on(t.query),
  ],
);

// ============================================
// PLAYER & PREFERENCES TABLES
// ============================================

export const userPreferences = createTable(
  "user_preferences",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    volume: d.real().default(0.7).notNull(),
    playbackRate: d.real().default(1.0).notNull(),
    repeatMode: d.varchar({ length: 20 }).default("none").notNull(), // 'none' | 'one' | 'all'
    shuffleEnabled: d.boolean().default(false).notNull(),
    equalizerEnabled: d.boolean().notNull().default(false),
    equalizerPreset: d.varchar({ length: 255 }).notNull().default("Flat"),
    equalizerBands: d
      .jsonb()
      .$type<number[]>()
      .default(sql`'[]'::jsonb`),
    equalizerPanelOpen: d.boolean().default(false).notNull(),
    queuePanelOpen: d.boolean().default(false).notNull(),
    visualizerType: d.varchar({ length: 30 }).default("flowfield"),
    visualizerEnabled: d.boolean().default(true).notNull(),
    compactMode: d.boolean().default(false).notNull(),
    theme: d.varchar({ length: 20 }).default("dark"), // 'dark' | 'light'
    // Smart Queue Settings
    autoQueueEnabled: d.boolean().default(false).notNull(),
    autoQueueThreshold: d.integer().default(3).notNull(), // Add tracks when queue has <= N tracks
    autoQueueCount: d.integer().default(5).notNull(), // Number of tracks to add
    smartMixEnabled: d.boolean().default(true).notNull(), // Use smart recommendations
    similarityPreference: d.varchar({ length: 20 }).default("balanced"), // 'strict' | 'balanced' | 'diverse'
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("user_preferences_user_idx").on(t.userId)],
);

export const playerSessions = createTable(
  "player_session",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deviceId: d.varchar({ length: 255 }).notNull(),
    deviceName: d.varchar({ length: 255 }),
    userAgent: d.text(),
    lastActive: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    isActive: d.boolean().default(true).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    index("session_user_idx").on(t.userId),
    index("session_device_idx").on(t.deviceId),
    index("session_active_idx").on(t.isActive, t.lastActive),
    index("session_user_device_idx").on(t.userId, t.deviceId),
  ],
);

export const playbackState = createTable(
  "playback_state",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionId: d
      .integer()
      .references(() => playerSessions.id, { onDelete: "set null" }),
    currentTrack: d.jsonb(), // Track object
    currentPosition: d.integer().default(0), // seconds
    queue: d.jsonb(), // Array of Track objects
    history: d.jsonb(), // Array of Track objects
    isShuffled: d.boolean().default(false).notNull(),
    repeatMode: d.varchar({ length: 20 }).default("none").notNull(),
    originalQueueOrder: d.jsonb(), // For unshuffle
    lastUpdated: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    index("playback_user_idx").on(t.userId),
    index("playback_session_idx").on(t.sessionId),
    index("playback_updated_idx").on(t.lastUpdated),
  ],
);

export const listeningAnalytics = createTable(
  "listening_analytics",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    trackId: d.bigint({ mode: "number" }).notNull(),
    trackData: d.jsonb().notNull(),
    sessionId: d
      .integer()
      .references(() => playerSessions.id, { onDelete: "set null" }),
    playedAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    duration: d.integer(), // seconds actually played
    totalDuration: d.integer(), // track total length
    completionPercentage: d.real(), // 0-100
    skipped: d.boolean().default(false).notNull(),
    playContext: d.varchar({ length: 50 }), // 'playlist', 'search', 'favorites', 'queue', 'album', 'artist'
    contextId: d.integer(), // playlist ID, album ID, etc.
    deviceId: d.varchar({ length: 255 }),
  }),
  (t) => [
    index("analytics_user_idx").on(t.userId),
    index("analytics_track_idx").on(t.trackId),
    index("analytics_played_idx").on(t.playedAt),
    index("analytics_session_idx").on(t.sessionId),
    index("analytics_context_idx").on(t.playContext, t.contextId),
    index("analytics_skipped_idx").on(t.skipped),
  ],
);

// ============================================
// SMART QUEUE & RECOMMENDATIONS
// ============================================

export const recommendationCache = createTable(
  "recommendation_cache",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    seedTrackId: d.bigint({ mode: "number" }).notNull(),
    recommendedTrackIds: d.jsonb().notNull(), // Array of track IDs
    recommendedTracksData: d.jsonb().notNull(), // Array of full track objects
    source: d.varchar({ length: 50 }).default("deezer").notNull(), // 'deezer', 'custom', 'ml'
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    expiresAt: d.timestamp({ withTimezone: true }).notNull(), // Cache expiry (24-48 hours)
  }),
  (t) => [
    index("rec_cache_seed_idx").on(t.seedTrackId),
    index("rec_cache_expires_idx").on(t.expiresAt),
    index("rec_cache_source_idx").on(t.source),
  ],
);

// Recommendation logs for analytics and debugging
export const recommendationLogs = createTable(
  "recommendation_log",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .references(() => users.id, { onDelete: "set null" }),
    seedTrackIds: d.jsonb().notNull(), // Array of track IDs used as seeds
    seedTrackData: d.jsonb().notNull(), // Full track objects for seeds
    recommendedTrackIds: d.jsonb().notNull(), // Array of recommended track IDs
    recommendedTracksData: d.jsonb().notNull(), // Full track objects returned
    source: d.varchar({ length: 50 }).notNull(), // 'hexmusic-api', 'deezer-fallback', 'artist-radio'
    requestParams: d.jsonb(), // { count, similarityLevel, useAudioFeatures }
    responseTime: d.integer(), // milliseconds
    success: d.boolean().notNull(),
    errorMessage: d.text(),
    context: d.varchar({ length: 50 }), // 'auto-queue', 'smart-mix', 'manual', 'similar-tracks'
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    index("rec_log_user_idx").on(t.userId),
    index("rec_log_source_idx").on(t.source),
    index("rec_log_created_idx").on(t.createdAt),
    index("rec_log_success_idx").on(t.success),
    index("rec_log_context_idx").on(t.context),
  ],
);

// Audio features from Essentia analysis (future integration)
// Feature flagged - only populated when ENABLE_AUDIO_FEATURES=true
export const audioFeatures = createTable(
  "audio_features",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    trackId: d.bigint({ mode: "number" }).notNull().unique(),
    bpm: d.real(), // Beats per minute
    key: d.varchar({ length: 10 }), // Musical key (e.g., "C", "Am")
    energy: d.real(), // 0-1 energy level
    danceability: d.real(), // 0-1 danceability score
    valence: d.real(), // 0-1 mood/positivity
    acousticness: d.real(), // 0-1 acoustic vs electronic
    instrumentalness: d.real(), // 0-1 instrumental content
    liveness: d.real(), // 0-1 live performance probability
    speechiness: d.real(), // 0-1 spoken word content
    loudness: d.real(), // Loudness in dB
    spectralCentroid: d.real(), // Brightness of sound
    analyzedAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    source: d.varchar({ length: 50 }).default("essentia"), // 'essentia', 'spotify', etc.
  }),
  (t) => [
    index("audio_features_track_idx").on(t.trackId),
    index("audio_features_bpm_idx").on(t.bpm),
    index("audio_features_energy_idx").on(t.energy),
    index("audio_features_key_idx").on(t.key),
  ],
);

// Relations
export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
}));

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  user: one(users, { fields: [playlists.userId], references: [users.id] }),
  tracks: many(playlistTracks),
}));

export const playlistTracksRelations = relations(playlistTracks, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistTracks.playlistId],
    references: [playlists.id],
  }),
}));

export const listeningHistoryRelations = relations(
  listeningHistory,
  ({ one }) => ({
    user: one(users, {
      fields: [listeningHistory.userId],
      references: [users.id],
    }),
  }),
);

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, {
    fields: [searchHistory.userId],
    references: [users.id],
  }),
}));

export const userPreferencesRelations = relations(
  userPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [userPreferences.userId],
      references: [users.id],
    }),
  }),
);

export const playerSessionsRelations = relations(
  playerSessions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [playerSessions.userId],
      references: [users.id],
    }),
    playbackStates: many(playbackState),
    analytics: many(listeningAnalytics),
  }),
);

export const playbackStateRelations = relations(playbackState, ({ one }) => ({
  user: one(users, {
    fields: [playbackState.userId],
    references: [users.id],
  }),
  session: one(playerSessions, {
    fields: [playbackState.sessionId],
    references: [playerSessions.id],
  }),
}));

export const listeningAnalyticsRelations = relations(
  listeningAnalytics,
  ({ one }) => ({
    user: one(users, {
      fields: [listeningAnalytics.userId],
      references: [users.id],
    }),
    session: one(playerSessions, {
      fields: [listeningAnalytics.sessionId],
      references: [playerSessions.id],
    }),
  }),
);

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccountType>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const recommendationCacheRelations = relations(
  recommendationCache,
  () => ({
    // No direct user relation as recommendations are shared across users
  }),
);

export const audioFeaturesRelations = relations(audioFeatures, () => ({
  // Track ID references Deezer API, no direct DB relation
}));

export const recommendationLogsRelations = relations(
  recommendationLogs,
  ({ one }) => ({
    user: one(users, {
      fields: [recommendationLogs.userId],
      references: [users.id],
    }),
  }),
);

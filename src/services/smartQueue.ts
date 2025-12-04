// File: src/services/smartQueue.ts

/**
 * Smart Queue Service
 * Integrates with the Starchild Music backend for intelligent track recommendations
 */

import { isTrack, type Track } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3222";

// Log configuration on module load (client-side only)
if (typeof window !== "undefined") {
  console.log("[SmartQueue] 🔧 Service initialized with config:", {
    apiBaseUrl: API_BASE_URL,
    hasEnvVar: !!process.env.NEXT_PUBLIC_API_URL,
  });
}

/**
 * Get authentication token from session storage or localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  // Try to get from next-auth session first
  const sessionData = localStorage.getItem("next-auth.session-token");
  if (sessionData) return sessionData;

  // Fallback to direct token storage
  return localStorage.getItem("auth_token");
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  console.log("[SmartQueue API] 🌐 Making API request:", {
    url: `${API_BASE_URL}${endpoint}`,
    method: options.method ?? "GET",
    hasToken: !!token,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  console.log("[SmartQueue API] 📡 API response:", {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText })) as { message?: string };
    console.error("[SmartQueue API] ❌ API error:", error);
    throw new Error(error.message ?? `API Error: ${response.status}`);
  }

  const data = await response.json() as Promise<T>;
  console.log("[SmartQueue API] ✅ Response data received");
  return data;
}

/**
 * Spotify Track Analysis Response
 */
interface SpotifyAudioFeatures {
  danceability: number;      // 0-1
  energy: number;            // 0-1
  key: number;               // 0-11 (C, C#, D, etc.)
  loudness: number;          // dB
  mode: number;              // 0 (minor) or 1 (major)
  speechiness: number;       // 0-1
  acousticness: number;      // 0-1
  instrumentalness: number;  // 0-1
  liveness: number;          // 0-1
  valence: number;           // 0-1 (happiness)
  tempo: number;             // BPM
  time_signature: number;
}

interface TrackAnalysis {
  spotifyId?: string;
  audioFeatures?: SpotifyAudioFeatures;
  bpm?: number;
  key?: string;
  mood?: string;
  energy?: number;
}

/**
 * HexMusic Recommendation Response
 */
interface HexMusicTrack {
  name: string;
  artist: string;
  album?: string;
  duration_ms?: number;
  preview_url?: string;
  spotify_id?: string;
  deezer_id?: string;
}

/**
 * Analyze a track using Spotify's audio analysis
 */
export async function analyzeTrack(
  spotifyTrackId: string
): Promise<TrackAnalysis | null> {
  try {
    const response = await apiRequest<TrackAnalysis>(
      `/spotify/tracks/analyze`,
      {
        method: "POST",
        body: JSON.stringify({ trackId: spotifyTrackId }),
      }
    );

    return response;
  } catch (error) {
    console.error("Failed to analyze track:", error);
    return null;
  }
}

/**
 * Analyze multiple tracks in batch
 */
export async function analyzeBatch(
  spotifyTrackIds: string[]
): Promise<TrackAnalysis[]> {
  try {
    const response = await apiRequest<TrackAnalysis[]>(
      `/spotify/tracks/analyze-batch`,
      {
        method: "POST",
        body: JSON.stringify({ trackIds: spotifyTrackIds }),
      }
    );

    return response;
  } catch (error) {
    console.error("Failed to batch analyze tracks:", error);
    return [];
  }
}

/**
 * Get audio features for a Spotify track
 */
export async function getAudioFeatures(
  spotifyTrackId: string
): Promise<SpotifyAudioFeatures | null> {
  try {
    const response = await apiRequest<SpotifyAudioFeatures>(
      `/spotify/tracks/${spotifyTrackId}/audio-features`
    );

    return response;
  } catch (error) {
    console.error("Failed to get audio features:", error);
    return null;
  }
}

/**
 * Search for tracks in HexMusic system
 */
export async function searchHexMusicTracks(
  query: string,
  limit = 20
): Promise<HexMusicTrack[]> {
  console.log("[SmartQueue] 🔍 Searching HexMusic:", {
    query,
    limit,
    apiUrl: API_BASE_URL,
  });

  try {
    const response = await apiRequest<{ tracks: HexMusicTrack[] }>(
      `/hexmusic/songs?query=${encodeURIComponent(query)}&limit=${limit}`
    );

    const tracks = response.tracks || [];
    console.log("[SmartQueue] ✅ HexMusic search results:", {
      count: tracks.length,
      tracks: tracks.slice(0, 3).map(t => `${t.name} - ${t.artist}`),
    });

    return tracks;
  } catch (error) {
    console.error("[SmartQueue] ❌ Failed to search HexMusic tracks:", error);
    return [];
  }
}

/**
 * Get recommendations from a playlist
 */
export async function getRecommendationsFromPlaylist(
  playlistId: string
): Promise<HexMusicTrack[]> {
  try {
    const response = await apiRequest<{ recommendations: HexMusicTrack[] }>(
      `/hexmusic/recommendations/playlist/${playlistId}`
    );

    return response.recommendations || [];
  } catch (error) {
    console.error("Failed to get playlist recommendations:", error);
    return [];
  }
}

/**
 * Get playlist recommendations based on query
 */
export async function getPlaylistRecommendations(
  query: string
): Promise<HexMusicTrack[]> {
  try {
    const response = await apiRequest<{ playlists: HexMusicTrack[] }>(
      `/hexmusic/playlist-recommendations?query=${encodeURIComponent(query)}`
    );

    return response.playlists ?? [];
  } catch (error) {
    console.error("Failed to get playlist recommendations:", error);
    return [];
  }
}

/**
 * Deezer Recommendation Response from HexMusic API
 */

/**
 * Get Deezer recommendations based on track names using HexMusic API
 * This uses the intelligent recommendation engine
 */
export async function getDeezerRecommendations(
  trackNames: string[],
  count = 10
): Promise<Track[]> {
  console.log("[SmartQueue] 🎯 getDeezerRecommendations called", {
    trackNames,
    count,
    apiUrl: API_BASE_URL,
  });

  try {
    const response = await fetch(`${API_BASE_URL}/hexmusic/recommendations/deezer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        trackNames,
        n: count,
      }),
    });

    console.log("[SmartQueue] 📡 Deezer recommendations API response:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText })) as { message?: string };
      console.error("[SmartQueue] ❌ Deezer recommendations API error:", error);
      throw new Error(error.message ?? `API Error: ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const tracks = Array.isArray(payload)
      ? payload.filter((item): item is Track => isTrack(item))
      : [];

    console.log("[SmartQueue] ✅ Deezer recommendations received:", {
      count: tracks.length,
      sample: tracks.slice(0, 3).map(t => `${t.title} - ${t.artist.name}`),
    });

    if (tracks.length === 0) {
      return [];
    }

    return tracks.slice(0, count);
  } catch (error) {
    console.error("[SmartQueue] ❌ Failed to get Deezer recommendations:", error);
    return [];
  }
}

/**
 * Convert HexMusic track to internal Track format
 * This attempts to match HexMusic tracks with Deezer tracks
 */
export async function convertHexMusicToTracks(
  hexMusicTracks: HexMusicTrack[]
): Promise<Track[]> {
  const tracks: Track[] = [];

  for (const hexTrack of hexMusicTracks) {
    try {
      // If we have a deezer_id, use it directly
      if (hexTrack.deezer_id) {
        const deezerTrack = await fetchDeezerTrack(hexTrack.deezer_id);
        if (deezerTrack) {
          tracks.push(deezerTrack);
          continue;
        }
      }

      // Otherwise, search Deezer for a match
      const searchQuery = `${hexTrack.artist} ${hexTrack.name}`;
      const searchResults = await searchDeezerTrack(searchQuery);

      if (searchResults.length > 0 && searchResults[0]) {
        tracks.push(searchResults[0]);
      }
    } catch (error) {
      console.error(`Failed to convert track: ${hexTrack.name}`, error);
    }
  }

  return tracks;
}

/**
 * Fetch a single track from Deezer by ID
 */
async function fetchDeezerTrack(trackId: string): Promise<Track | null> {
  try {
    const response = await fetch(`https://api.deezer.com/track/${trackId}`);
    if (!response.ok) return null;

    const track = (await response.json()) as Track;
    return track;
  } catch (error) {
    console.error("Failed to fetch Deezer track:", error);
    return null;
  }
}

/**
 * Search Deezer for a track
 */
async function searchDeezerTrack(query: string): Promise<Track[]> {
  try {
    const response = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=1`
    );

    if (!response.ok) return [];

    const data = (await response.json()) as { data: Track[] };
    return data.data ?? [];
  } catch (error) {
    console.error("Failed to search Deezer:", error);
    return [];
  }
}

/**
 * Recommendation result with metadata for logging
 */
export interface RecommendationResult {
  tracks: Track[];
  source: "hexmusic-api" | "deezer-fallback" | "artist-radio" | "cached";
  responseTime: number;
  success: boolean;
  errorMessage?: string;
}

/**
 * Get smart queue recommendations based on current track
 * This is the main function that ties everything together
 */
export async function getSmartQueueRecommendations(
  currentTrack: Track,
  options: {
    count?: number;
    similarityLevel?: "strict" | "balanced" | "diverse";
    useAudioFeatures?: boolean;
  } = {}
): Promise<RecommendationResult> {
  const {
    count = 5,
    similarityLevel = "balanced",
    useAudioFeatures = true,
  } = options;

  console.log("[SmartQueue] 🎯 getSmartQueueRecommendations called", {
    track: `${currentTrack.title} - ${currentTrack.artist.name}`,
    trackId: currentTrack.id,
    count,
    similarityLevel,
    useAudioFeatures,
  });

  const startTime = performance.now();

  try {
    // Try the intelligent HexMusic Deezer recommendations API first
    console.log("[SmartQueue] 🧠 Attempting intelligent recommendations from HexMusic API...");
    const trackName = `${currentTrack.artist.name} ${currentTrack.title}`;
    const intelligentTracks = await getDeezerRecommendations([trackName], count * 2);

    if (intelligentTracks.length > 0) {
      console.log("[SmartQueue] ✅ Got recommendations from HexMusic API");

      // Filter out the current track
      const filteredTracks = intelligentTracks.filter(track => track.id !== currentTrack.id);
      console.log("[SmartQueue] 🔍 After filtering current track:", {
        before: intelligentTracks.length,
        after: filteredTracks.length,
      });

      // Apply similarity level filtering
      console.log("[SmartQueue] 🎚️ Applying similarity filter:", similarityLevel);
      const finalTracks = applySimilarityFilter(
        filteredTracks,
        currentTrack,
        similarityLevel
      );
      console.log("[SmartQueue] 📊 After similarity filtering:", {
        count: finalTracks.length,
      });

      const result = finalTracks.slice(0, count);
      const responseTime = performance.now() - startTime;

      console.log("[SmartQueue] ✅ Returning recommendations:", {
        count: result.length,
        tracks: result.map(t => `${t.title} - ${t.artist.name}`),
        responseTime: `${responseTime.toFixed(0)}ms`,
      });

      return {
        tracks: result,
        source: "hexmusic-api",
        responseTime: Math.round(responseTime),
        success: true,
      };
    }

    // Fallback to direct Deezer API
    console.log("[SmartQueue] 🔄 Falling back to direct Deezer API...");
    const tracks = await fetchDeezerRadio(currentTrack.id, count * 2);

    if (tracks.length > 0) {
      // Filter out the current track
      const filteredTracks = tracks.filter(track => track.id !== currentTrack.id);
      console.log("[SmartQueue] 🔍 After filtering current track:", {
        before: tracks.length,
        after: filteredTracks.length,
      });

      // Apply similarity level filtering
      console.log("[SmartQueue] 🎚️ Applying similarity filter:", similarityLevel);
      const finalTracks = applySimilarityFilter(
        filteredTracks,
        currentTrack,
        similarityLevel
      );
      console.log("[SmartQueue] 📊 After similarity filtering:", {
        count: finalTracks.length,
      });

      const result = finalTracks.slice(0, count);
      const responseTime = performance.now() - startTime;

      console.log("[SmartQueue] ✅ Returning recommendations:", {
        count: result.length,
        tracks: result.map(t => `${t.title} - ${t.artist.name}`),
        responseTime: `${responseTime.toFixed(0)}ms`,
      });

      return {
        tracks: result,
        source: "deezer-fallback",
        responseTime: Math.round(responseTime),
        success: true,
      };
    }

    console.log("[SmartQueue] ⚠️ No recommendations found");
    const responseTime = performance.now() - startTime;
    return {
      tracks: [],
      source: "deezer-fallback",
      responseTime: Math.round(responseTime),
      success: false,
      errorMessage: "No recommendations found",
    };
  } catch (error) {
    console.error("[SmartQueue] ❌ Failed to get smart queue recommendations:", error);
    const responseTime = performance.now() - startTime;
    return {
      tracks: [],
      source: "deezer-fallback",
      responseTime: Math.round(responseTime),
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch similar tracks using Deezer artist recommendations (fallback)
 * Uses artist top tracks and related artists since radio endpoint is deprecated
 */
async function fetchDeezerRadio(
  trackId: number,
  limit: number
): Promise<Track[]> {
  console.log("[SmartQueue] 📻 Fetching Deezer recommendations:", {
    trackId,
    limit,
  });

  try {
    // First, fetch the track to get the artist ID
    const trackResponse = await fetch(`https://api.deezer.com/track/${trackId}`);

    if (!trackResponse.ok) {
      console.log("[SmartQueue] ⚠️ Failed to fetch track details");
      return [];
    }

    const trackData = (await trackResponse.json()) as Track;
    const artistId = trackData.artist.id;

    console.log("[SmartQueue] 👤 Got artist:", {
      artistId,
      artistName: trackData.artist.name,
    });

    // Fetch artist's top tracks
    const topTracksResponse = await fetch(
      `https://api.deezer.com/artist/${artistId}/top?limit=${Math.min(limit, 50)}`
    );

    if (!topTracksResponse.ok) {
      console.log("[SmartQueue] ⚠️ Failed to fetch artist top tracks");
      return [];
    }

    const topTracksData = (await topTracksResponse.json()) as { data: Track[] };
    let tracks = topTracksData.data ?? [];

    // Filter out the current track
    tracks = tracks.filter(t => t.id !== trackId);

    console.log("[SmartQueue] ✅ Deezer recommendations received:", {
      count: tracks.length,
      tracks: tracks.slice(0, 3).map(t => `${t.title} - ${t.artist.name}`),
    });

    // If we need more tracks, fetch from related artists
    if (tracks.length < limit) {
      console.log("[SmartQueue] 🔍 Fetching related artists for more variety...");

      const relatedResponse = await fetch(
        `https://api.deezer.com/artist/${artistId}/related`
      );

      if (relatedResponse.ok) {
        const relatedData = (await relatedResponse.json()) as { data: Array<{ id: number }> };
        const relatedArtists = relatedData.data ?? [];

        // Get top tracks from first related artist
        if (relatedArtists[0]) {
          const relatedTracksResponse = await fetch(
            `https://api.deezer.com/artist/${relatedArtists[0].id}/top?limit=${limit - tracks.length}`
          );

          if (relatedTracksResponse.ok) {
            const relatedTracksData = (await relatedTracksResponse.json()) as { data: Track[] };
            const relatedTracks = relatedTracksData.data ?? [];
            tracks.push(...relatedTracks);

            console.log("[SmartQueue] ✅ Added tracks from related artists:", {
              addedCount: relatedTracks.length,
              totalCount: tracks.length,
            });
          }
        }
      }
    }

    return tracks.slice(0, limit);
  } catch (error) {
    console.error("[SmartQueue] ❌ Failed to fetch Deezer recommendations:", error);
    return [];
  }
}

/**
 * Apply similarity filtering based on user preference
 */
function applySimilarityFilter(
  tracks: Track[],
  seedTrack: Track,
  level: "strict" | "balanced" | "diverse"
): Track[] {
  if (level === "strict") {
    // Only same artist or same genre
    return tracks.filter(
      track => track.artist.id === seedTrack.artist.id
    );
  } else if (level === "diverse") {
    // Mix it up - prefer different artists
    const diverseTracks: Track[] = [];
    const artistIds = new Set<number>();

    for (const track of tracks) {
      if (!artistIds.has(track.artist.id) || diverseTracks.length < tracks.length / 2) {
        diverseTracks.push(track);
        artistIds.add(track.artist.id);
      }
    }

    return diverseTracks;
  }

  // Balanced - return as-is
  return tracks;
}

/**
 * Generate a smart mix from multiple seed tracks
 */
export async function generateSmartMix(
  seedTracks: Track[],
  count = 20
): Promise<Track[]> {
  console.log("[SmartQueue] ⚡ generateSmartMix called", {
    seedCount: seedTracks.length,
    targetCount: count,
    seeds: seedTracks.map(t => `${t.title} - ${t.artist.name}`),
  });

  if (seedTracks.length === 0) {
    console.log("[SmartQueue] ❌ No seed tracks provided");
    return [];
  }

  try {
    // Get recommendations for each seed track
    const allRecommendations: Track[] = [];
    const tracksPerSeed = Math.ceil(count / seedTracks.length);

    console.log("[SmartQueue] 📋 Will fetch", tracksPerSeed, "tracks per seed");

    for (let i = 0; i < seedTracks.length; i++) {
      const seedTrack = seedTracks[i];
      if (!seedTrack) continue;

      console.log(`[SmartQueue] 🔍 Processing seed ${i + 1}/${seedTracks.length}:`, {
        track: `${seedTrack.title} - ${seedTrack.artist.name}`,
      });

      const result = await getSmartQueueRecommendations(
        seedTrack,
        { count: tracksPerSeed, similarityLevel: "balanced" }
      );

      console.log(`[SmartQueue] 📦 Received ${result.tracks.length} recommendations for seed ${i + 1}`);
      allRecommendations.push(...result.tracks);
    }

    console.log("[SmartQueue] 📊 Total recommendations collected:", allRecommendations.length);

    // Remove duplicates
    const uniqueTracks = Array.from(
      new Map(allRecommendations.map(track => [track.id, track])).values()
    );

    console.log("[SmartQueue] 🔍 After deduplication:", {
      before: allRecommendations.length,
      after: uniqueTracks.length,
    });

    // Shuffle for variety
    const shuffled = shuffleArray(uniqueTracks).slice(0, count);
    console.log("[SmartQueue] ✅ Returning smart mix:", {
      count: shuffled.length,
      targetCount: count,
    });

    return shuffled;
  } catch (error) {
    console.error("[SmartQueue] ❌ Failed to generate smart mix:", error);
    return [];
  }
}

/**
 * Shuffle array helper
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    if (temp !== undefined && shuffled[j] !== undefined) {
      shuffled[i] = shuffled[j]!;
      shuffled[j] = temp;
    }
  }
  return shuffled;
}

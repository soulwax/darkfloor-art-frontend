// File: src/types/index.ts

/**
 * ============================================================================
 * CORE MUSIC ENTITIES
 * ============================================================================
 * Base types representing music catalog entities from the streaming service
 */

/**
 * Artist entity from music service
 */
export interface Artist {
  id: number;
  name: string;
  link: string;
  picture: string;
  picture_small: string;
  picture_medium: string;
  picture_big: string;
  picture_xl: string;
  tracklist: string;
  type: "artist";
}

/**
 * Album entity from music service
 */
export interface Album {
  id: number;
  title: string;
  cover: string;
  cover_small: string;
  cover_medium: string;
  cover_big: string;
  cover_xl: string;
  md5_image: string;
  tracklist: string;
  type: "album";
  release_date?: string;
  genres?: Array<{ id: number; name: string }>;
  artist?: Artist;
}

/**
 * Track entity from music service
 */
export interface Track {
  id: number;
  readable: boolean;
  title: string;
  title_short: string;
  title_version: string;
  link: string;
  duration: number; // Duration in seconds
  rank: number; // Popularity rank
  explicit_lyrics: boolean;
  explicit_content_lyrics: number;
  explicit_content_cover: number;
  preview: string; // 30-second preview URL
  md5_image: string;
  artist: Artist;
  album: Album;
  type: "track";
  bpm?: number;
  gain?: number;
  release_date?: string;
}

/**
 * ============================================================================
 * QUEUE SYSTEM
 * ============================================================================
 * Types for queue management, smart queue, and playback order
 */

/**
 * Source identifier for where a track was added to the queue
 */
export type QueueSource =
  | 'user'           // Manually added by user
  | 'smart'          // Added by smart queue algorithm
  | 'playlist'       // Added from playlist
  | 'album'          // Added from album
  | 'artist'         // Added from artist page
  | 'radio'          // Added from radio/autoplay
  | 'recommendation'; // Added from recommendations

/**
 * Individual track in the queue with metadata
 */
export interface QueuedTrack {
  track: Track;
  queueSource: QueueSource;
  addedAt: Date;
  queueId: string; // Unique ID for drag-drop stability and React keys
  addedBy?: string; // User ID who added the track (for collaborative queues)
  smartQueueMetadata?: SmartQueueMetadata;
}

/**
 * Metadata for tracks added by smart queue
 */
export interface SmartQueueMetadata {
  seedTrackId: number;
  similarity: number; // 0-1 score
  reason: string; // Human-readable reason
  method: SimilarityMethod;
}

/**
 * Complete queue state
 */
export interface QueueState {
  queuedTracks: QueuedTrack[]; // [0] is currently playing, [1..n] are upcoming
  history: Track[]; // Previously played tracks
  originalQueue?: QueuedTrack[]; // Original order before shuffle
  isShuffled: boolean;
  repeatMode: RepeatMode;
  currentTime: number; // Current playback position in seconds
  smartQueueState: SmartQueueState;
}

/**
 * Repeat mode options
 */
export type RepeatMode = 'none' | 'one' | 'all';

/**
 * Smart queue operational state
 */
export interface SmartQueueState {
  isActive: boolean;
  lastRefreshedAt: Date | null;
  seedTrackId: number | null;
  trackCount: number; // Number of smart tracks currently in queue
}

/**
 * User preferences for smart queue behavior
 */
export interface SmartQueueSettings {
  autoQueueEnabled: boolean;
  autoQueueThreshold: number; // Add tracks when queue has <= N tracks
  autoQueueCount: number; // Number of tracks to add at once
  smartMixEnabled: boolean;
  similarityPreference: SimilarityPreference;
  diversityFactor: number; // 0-1, higher = more diverse recommendations
  excludeExplicit: boolean;
  preferLiveVersions: boolean;
}

/**
 * Similarity preference for recommendations
 */
export type SimilarityPreference =
  | 'strict'     // Same artists only
  | 'balanced'   // Related artists, similar sound
  | 'diverse';   // Genre variety, exploration

/**
 * Queue sections for UI organization
 */
export interface QueueSections {
  nowPlaying: QueuedTrack | null;
  userQueue: QueuedTrack[];
  smartQueue: QueuedTrack[];
}

/**
 * ============================================================================
 * PLAYLIST SYSTEM
 * ============================================================================
 * Types for user-created playlists and playlist management
 */

/**
 * Playlist visibility and access control
 */
export type PlaylistVisibility = 'public' | 'private' | 'unlisted';

/**
 * Playlist with full metadata
 */
export interface Playlist {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  visibility: PlaylistVisibility;
  isPublic: boolean; // Legacy field, use visibility instead
  coverImage: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  trackCount: number;
  totalDuration: number; // Total duration in seconds
  isCollaborative: boolean;
  collaborators?: string[]; // User IDs
  tags?: string[];
  mood?: PlaylistMood;
}

/**
 * Playlist mood/vibe classification
 */
export type PlaylistMood =
  | 'energetic'
  | 'chill'
  | 'happy'
  | 'sad'
  | 'focused'
  | 'party'
  | 'workout'
  | 'sleep'
  | 'romantic'
  | 'melancholic';

/**
 * Track within a playlist
 */
export interface PlaylistTrack {
  id: number;
  playlistId: number;
  track: Track;
  position: number;
  addedAt: Date;
  addedBy: string; // User ID
  note?: string; // User note about why they added this track
}

/**
 * Playlist with populated tracks
 */
export interface PlaylistWithTracks extends Playlist {
  tracks: PlaylistTrack[];
}

/**
 * Playlist with track inclusion status (for "Add to Playlist" modal)
 */
export interface PlaylistWithTrackStatus extends Playlist {
  hasTrack: boolean; // Whether a specific track is in this playlist
}

/**
 * Playlist reorder operation
 */
export interface PlaylistReorderPayload {
  playlistId: number;
  order: Array<{ trackId: number; position: number }>;
}

/**
 * Playlist merge operation
 */
export interface PlaylistMergePayload {
  sourcePlaylistId: number;
  targetPlaylistId: number;
  removeSource: boolean;
}

/**
 * Playlist statistics
 */
export interface PlaylistStats {
  playlistId: number;
  totalPlays: number;
  uniqueListeners: number;
  averageRating: number | null;
  topGenres: Array<{ genre: string; count: number }>;
  topArtists: Array<{ artist: Artist; count: number }>;
  createdAt: Date;
  lastPlayedAt: Date | null;
}

/**
 * ============================================================================
 * USER PROFILE & IDENTITY
 * ============================================================================
 * Types for user profiles, authentication, and social features
 */

/**
 * User profile visibility settings
 */
export type ProfileVisibility = 'public' | 'friends' | 'private';

/**
 * Complete user profile
 */
export interface UserProfile {
  userId: string;
  userHash: string; // Public identifier for profile URLs
  name: string | null;
  displayName: string; // Display name or fallback to username
  username: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  visibility: ProfileVisibility;
  isVerified: boolean;
  isPro: boolean;
  createdAt: Date;
  lastActiveAt: Date | null;
  stats: UserStats;
  preferences: UserPreferences;
  socialLinks?: SocialLinks;
}

/**
 * User statistics
 */
export interface UserStats {
  favorites: number;
  playlists: number;
  publicPlaylists: number;
  tracksPlayed: number;
  totalListeningTime: number; // In seconds
  followers: number;
  following: number;
  topGenres: string[];
  joinedAt: Date;
  listeningStreak: number; // Days
}

/**
 * Extended user statistics with analytics
 */
export interface DetailedUserStats extends UserStats {
  thisWeek: {
    tracksPlayed: number;
    uniqueArtists: number;
    listeningTime: number;
  };
  thisMonth: {
    tracksPlayed: number;
    uniqueArtists: number;
    listeningTime: number;
  };
  allTime: {
    topTrack: Track | null;
    topArtist: Artist | null;
    topAlbum: Album | null;
    mostPlayedHour: number; // 0-23
    averageSessionDuration: number;
  };
}

/**
 * Social media links
 */
export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  spotify?: string;
  soundcloud?: string;
  youtube?: string;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: ThemePreference;
  language: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  playback: PlaybackPreferences;
  visualizer: VisualizerPreferences;
  smartQueue: SmartQueueSettings;
  equalizerPanelOpen: boolean;
  queuePanelOpen: boolean;
  visualizerEnabled: boolean;
}

/**
 * Theme preference
 */
export type ThemePreference = 'dark' | 'light' | 'auto';

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  newFollowers: boolean;
  playlistUpdates: boolean;
  recommendations: boolean;
  friendActivity: boolean;
  email: boolean;
  push: boolean;
}

/**
 * Privacy preferences
 */
export interface PrivacyPreferences {
  showListeningActivity: boolean;
  showPlaylists: boolean;
  showFavorites: boolean;
  showFollowers: boolean;
  allowMessages: boolean;
  shareHistory: boolean;
}

/**
 * Playback preferences
 */
export interface PlaybackPreferences {
  crossfade: number; // 0-12 seconds
  gaplessPlayback: boolean;
  normalizeVolume: boolean;
  defaultVolume: number; // 0-1
  defaultQuality: AudioQuality;
  autoplay: boolean;
  downloadQuality: AudioQuality;
}

/**
 * Audio quality options
 */
export type AudioQuality = 'low' | 'normal' | 'high' | 'lossless';

/**
 * Visualizer preferences
 */
export interface VisualizerPreferences {
  enabled: boolean;
  pattern: string;
  colorScheme: 'track' | 'album' | 'custom';
  customColors?: string[];
  sensitivity: number; // 0-1
  particleCount: number;
  animationSpeed: number; // 0-1
}

/**
 * ============================================================================
 * PLAYBACK & AUDIO
 * ============================================================================
 * Types for audio playback, player state, and audio processing
 */

/**
 * Player state
 */
export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error' | 'buffering';

/**
 * Complete player state
 */
export interface AudioPlayerState {
  currentTrack: Track | null;
  queue: QueueState;
  playbackState: PlayerState;
  isPlaying: boolean;
  isMuted: boolean;
  isLoading: boolean;
  volume: number; // 0-1
  currentTime: number; // seconds
  duration: number; // seconds
  buffered: number; // 0-1, percentage buffered
  playbackRate: number; // 0.5-2.0
  error: PlayerError | null;
  streamUrl: string | null;
}

/**
 * Player error information
 */
export interface PlayerError {
  code: PlayerErrorCode;
  message: string;
  timestamp: Date;
  trackId?: number;
  recoverable: boolean;
}

/**
 * Player error codes
 */
export type PlayerErrorCode =
  | 'NETWORK_ERROR'
  | 'DECODE_ERROR'
  | 'SRC_NOT_SUPPORTED'
  | 'ABORTED'
  | 'STREAM_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'UNKNOWN';

/**
 * Audio features and analysis
 */
export interface AudioFeatures {
  trackId: number;
  // Rhythm features
  bpm: number | null;
  timeSignature: string | null; // e.g., "4/4"
  rhythm: number | null; // 0-1

  // Tonal features
  key: string | null; // e.g., "C", "F#"
  mode: 'major' | 'minor' | null;
  harmonicComplexity: number | null; // 0-1

  // Spectral features
  energy: number | null; // 0-1
  danceability: number | null; // 0-1
  valence: number | null; // 0-1, positivity
  acousticness: number | null; // 0-1
  instrumentalness: number | null; // 0-1
  liveness: number | null; // 0-1
  speechiness: number | null; // 0-1
  loudness: number | null; // dB
  spectralCentroid: number | null;
  spectralRolloff: number | null;

  // Metadata
  analyzedAt: Date;
  source: AudioAnalysisSource;
  confidence: number; // 0-1, confidence in analysis
}

/**
 * Audio analysis source
 */
export type AudioAnalysisSource = 'essentia' | 'spotify' | 'librosa' | 'manual';

/**
 * Equalizer settings
 */
export interface EqualizerSettings {
  enabled: boolean;
  preset: EqualizerPreset;
  bands: EqualizerBand[];
}

/**
 * Equalizer preset name
 */
export type EqualizerPreset =
  | 'Flat'
  | 'Rock'
  | 'Pop'
  | 'Jazz'
  | 'Classical'
  | 'Bass Boost'
  | 'Treble Boost'
  | 'Vocal'
  | 'Electronic'
  | 'Hip Hop'
  | 'Acoustic'
  | 'Custom';

/**
 * Individual equalizer band
 */
export interface EqualizerBand {
  frequency: number; // Hz
  gain: number; // dB, typically -12 to +12
  Q: number; // Quality factor, typically 0.5-2.0
}

/**
 * ============================================================================
 * LISTENING HISTORY & ANALYTICS
 * ============================================================================
 * Types for tracking user listening behavior and generating insights
 */

/**
 * Individual listening history entry
 */
export interface ListeningHistoryItem {
  id: number;
  userId: string;
  track: Track;
  playedAt: Date;
  duration: number | null; // How long the track was played (seconds)
  completionRate: number | null; // 0-1, percentage of track played
  source: PlaybackSource;
  context?: PlaybackContext;
  skipped: boolean;
  device?: DeviceInfo;
}

/**
 * Source of playback initiation
 */
export type PlaybackSource =
  | 'queue'
  | 'playlist'
  | 'album'
  | 'artist'
  | 'search'
  | 'radio'
  | 'recommendation'
  | 'history'
  | 'favorite';

/**
 * Playback context information
 */
export interface PlaybackContext {
  type: 'playlist' | 'album' | 'artist' | 'radio' | 'queue';
  id?: number | string;
  name?: string;
}

/**
 * Device information
 */
export interface DeviceInfo {
  type: 'browser' | 'desktop' | 'mobile' | 'tablet';
  name: string;
  os?: string;
  browser?: string;
}

/**
 * Aggregated listening statistics for a time period
 */
export interface ListeningStats {
  period: TimePeriod;
  totalTracks: number;
  totalTime: number; // seconds
  uniqueTracks: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  topTracks: TopTrackItem[];
  topArtists: TopArtistItem[];
  topAlbums: TopAlbumItem[];
  topGenres: GenreStats[];
  listeningByHour: number[]; // 24-element array
  listeningByDay: number[]; // 7-element array (Mon-Sun)
}

/**
 * Time period for statistics
 */
export type TimePeriod = 'week' | 'month' | 'year' | 'all-time';

/**
 * Top track statistics
 */
export interface TopTrackItem {
  track: Track;
  playCount: number;
  totalDuration: number | null; // Total time listened in seconds
  lastPlayed: Date;
}

/**
 * Top artist statistics
 */
export interface TopArtistItem {
  artist: Artist;
  playCount: number;
  uniqueTracks: number;
  totalDuration: number | null;
  lastPlayed: Date;
}

/**
 * Top album statistics
 */
export interface TopAlbumItem {
  album: Album;
  playCount: number;
  tracksPlayed: number;
  totalDuration: number | null;
  lastPlayed: Date;
}

/**
 * Genre statistics
 */
export interface GenreStats {
  genre: string;
  playCount: number;
  percentage: number; // 0-100
  tracks: number;
  artists: number;
}

/**
 * ============================================================================
 * FAVORITES & LIKES
 * ============================================================================
 * Types for user favorites and liked content
 */

/**
 * Favorited track
 */
export interface FavoriteItem {
  id: number;
  userId: string;
  track: Track;
  createdAt: Date;
  note?: string; // Optional user note
  playlistIds?: number[]; // Playlists this favorite is in
}

/**
 * Favorite collection metadata
 */
export interface FavoriteCollection {
  userId: string;
  totalFavorites: number;
  totalDuration: number;
  lastAdded: Date | null;
  topGenres: string[];
  topArtists: Artist[];
}

/**
 * ============================================================================
 * RECOMMENDATIONS & DISCOVERY
 * ============================================================================
 * Types for music recommendations and discovery features
 */

/**
 * Recommendation context and metadata
 */
export interface RecommendationContext {
  source: RecommendationSource;
  seedTrackId: number;
  reason: string; // Human-readable explanation
  similarity: number; // 0-1 similarity score
  method: SimilarityMethod;
  confidence: number; // 0-1 confidence in recommendation
}

/**
 * Recommendation source
 */
export type RecommendationSource =
  | 'deezer'           // From Deezer API
  | 'custom'           // Custom algorithm
  | 'ml'               // Machine learning model
  | 'audio-features'   // Based on audio analysis
  | 'collaborative'    // Collaborative filtering
  | 'content-based';   // Content-based filtering

/**
 * Track with recommendation metadata
 */
export interface RecommendedTrack extends Track {
  recommendationContext: RecommendationContext;
}

/**
 * Similarity method used for recommendations
 */
export type SimilarityMethod =
  | 'same-artist'
  | 'same-album'
  | 'same-genre'
  | 'bpm-match'
  | 'key-match'
  | 'energy-match'
  | 'mood-match'
  | 'collaborative-filtering'
  | 'audio-similarity'
  | 'lyric-similarity'
  | 'user-taste-profile';

/**
 * Options for fetching similar tracks
 */
export interface SimilarTrackOptions {
  limit: number;
  excludeTrackIds: number[];
  excludeArtistIds?: number[];
  preferredMethods: SimilarityMethod[];
  useAudioFeatures: boolean;
  diversityFactor: number; // 0-1, higher = more diverse
  minSimilarity: number; // 0-1, minimum similarity threshold
}

/**
 * Cached recommendation entry
 */
export interface RecommendationCacheEntry {
  id: number;
  seedTrackId: number;
  recommendedTrackIds: number[];
  recommendedTracksData: Track[];
  source: RecommendationSource;
  metadata: Record<string, unknown>;
  createdAt: Date;
  expiresAt: Date;
  hitCount: number;
}

/**
 * ============================================================================
 * API & NETWORK
 * ============================================================================
 * Types for API interactions and network requests
 */

/**
 * Search response from music API
 */
export interface SearchResponse {
  data: Track[];
  total: number;
  next?: string;
  prev?: string;
}

/**
 * Stream URL parameters
 */
export interface StreamUrlParams {
  query?: string;
  id?: number;
  quality?: AudioQuality;
}

/**
 * API error response
 */
export interface ApiError {
  message: string;
  status: number;
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * ============================================================================
 * SOCIAL FEATURES
 * ============================================================================
 * Types for social interactions and collaborative features
 */

/**
 * User follow relationship
 */
export interface FollowRelationship {
  id: number;
  followerId: string;
  followingId: string;
  createdAt: Date;
  followerProfile?: UserProfile;
  followingProfile?: UserProfile;
}

/**
 * Activity feed item
 */
export interface ActivityItem {
  id: number;
  userId: string;
  activityType: ActivityType;
  data: ActivityData;
  createdAt: Date;
  isPublic: boolean;
}

/**
 * Activity type
 */
export type ActivityType =
  | 'track_played'
  | 'playlist_created'
  | 'playlist_updated'
  | 'track_favorited'
  | 'user_followed'
  | 'achievement_unlocked';

/**
 * Activity data (polymorphic based on type)
 */
export type ActivityData =
  | { type: 'track_played'; track: Track }
  | { type: 'playlist_created'; playlist: Playlist }
  | { type: 'playlist_updated'; playlist: Playlist }
  | { type: 'track_favorited'; track: Track }
  | { type: 'user_followed'; user: UserProfile }
  | { type: 'achievement_unlocked'; achievement: Achievement };

/**
 * Achievement
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
  progress?: number; // 0-1 for progressive achievements
}

/**
 * Share link
 */
export interface ShareLink {
  id: string;
  type: 'track' | 'playlist' | 'album' | 'artist' | 'profile';
  entityId: number | string;
  shortUrl: string;
  fullUrl: string;
  createdAt: Date;
  expiresAt?: Date;
  views: number;
}

/**
 * ============================================================================
 * UI STATE & CONTROLS
 * ============================================================================
 * Types for UI state management and component props
 */

/**
 * Modal state
 */
export interface ModalState {
  isOpen: boolean;
  type: ModalType | null;
  data?: unknown;
}

/**
 * Modal types
 */
export type ModalType =
  | 'add-to-playlist'
  | 'create-playlist'
  | 'edit-playlist'
  | 'share'
  | 'equalizer'
  | 'queue'
  | 'settings'
  | 'user-profile';

/**
 * Toast notification
 */
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
  action?: ToastAction;
}

/**
 * Toast action button
 */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

/**
 * Keyboard shortcut
 */
export interface KeyboardShortcut {
  key: string;
  modifiers: Array<'ctrl' | 'shift' | 'alt' | 'meta'>;
  action: string;
  description: string;
  handler: () => void;
}

/**
 * ============================================================================
 * TYPE GUARDS
 * ============================================================================
 * Runtime type checking utilities
 */

export function isTrack(obj: unknown): obj is Track {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "title" in obj &&
    "artist" in obj &&
    "album" in obj
  );
}

export function isSearchResponse(obj: unknown): obj is SearchResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "data" in obj &&
    Array.isArray((obj as SearchResponse).data)
  );
}

export function isRecommendedTrack(obj: unknown): obj is RecommendedTrack {
  return isTrack(obj) && "recommendationContext" in obj;
}

export function isQueuedTrack(obj: unknown): obj is QueuedTrack {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "track" in obj &&
    "queueSource" in obj &&
    "addedAt" in obj &&
    "queueId" in obj &&
    isTrack((obj as QueuedTrack).track)
  );
}

export function isPlaylist(obj: unknown): obj is Playlist {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "name" in obj &&
    "userId" in obj
  );
}

export function isUserProfile(obj: unknown): obj is UserProfile {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "userId" in obj &&
    "userHash" in obj &&
    "stats" in obj
  );
}

/**
 * ============================================================================
 * UTILITY TYPES
 * ============================================================================
 * Helper types for common patterns
 */

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Deep partial (recursive)
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Readonly deep (recursive)
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Extract enum values
 */
export type ValueOf<T> = T[keyof T];

/**
 * Nullable
 */
export type Nullable<T> = T | null;

/**
 * Optional nullable
 */
export type Maybe<T> = T | null | undefined;

/**
 * ============================================================================
 * LEGACY TYPE ALIASES
 * ============================================================================
 * Deprecated types maintained for backward compatibility
 */

/**
 * @deprecated Use Playlist instead
 */
export type PlaylistType = Playlist;

/**
 * @deprecated Use QueuedTrack instead
 */
export interface QueueItem {
  id: string;
  track: Track;
  addedAt: Date;
}

/**
 * @deprecated Use EqualizerSettings instead
 */
export interface EQPreferences {
  enabled: boolean;
  preset: string;
  bands: number[];
}

/**
 * @deprecated Use RecommendationContext['reason'] instead
 */
export type EqualizerType = EqualizerPreset;

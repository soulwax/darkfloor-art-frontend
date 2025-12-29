// File: src/components/Player.tsx

"use client";

import { PLAYBACK_RATES } from "@/config/player";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import { hapticLight, hapticMedium, hapticSuccess } from "@/utils/haptics";
import { formatTime } from "@/utils/time";
import { useSession } from "next-auth/react";
import { Heart, Layers, ListPlus, Maximize2, Minimize2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

interface PlayerProps {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: "none" | "one" | "all";
  playbackRate: number;
  isLoading: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onToggleQueue?: () => void;
  onToggleEqualizer?: () => void;
  onToggleVisualizer?: () => void;
  visualizerEnabled?: boolean;
  onTogglePatternControls?: () => void;
}

export default function MaturePlayer({
  currentTrack,
  queue,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffled,
  repeatMode,
  playbackRate,
  isLoading,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onCycleRepeat,
  onPlaybackRateChange,
  onSkipForward,
  onSkipBackward,
  onToggleQueue,
  onToggleEqualizer,
  onToggleVisualizer,
  visualizerEnabled,
  onTogglePatternControls,
}: PlayerProps) {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const { hideUI, setHideUI } = useGlobalPlayer();

  const utils = api.useUtils();
  const { data: session } = useSession();
  const isAuthenticated = !!session;

  // Favorite queries and mutations
  const { data: favoriteData } = api.music.isFavorite.useQuery(
    { trackId: currentTrack?.id ?? 0 },
    { enabled: !!currentTrack && isAuthenticated },
  );

  const addFavorite = api.music.addFavorite.useMutation({
    onSuccess: async () => {
      if (currentTrack) {
        await utils.music.isFavorite.invalidate({ trackId: currentTrack.id });
        await utils.music.getFavorites.invalidate();
      }
    },
  });

  const removeFavorite = api.music.removeFavorite.useMutation({
    onSuccess: async () => {
      if (currentTrack) {
        await utils.music.isFavorite.invalidate({ trackId: currentTrack.id });
        await utils.music.getFavorites.invalidate();
      }
    },
  });

  // Playlist queries and mutations
  const { data: playlists, refetch: refetchPlaylists } =
    api.music.getPlaylists.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  const addToPlaylist = api.music.addToPlaylist.useMutation({
    onSuccess: () => {
      hapticMedium();
      setShowPlaylistSelector(false);
      void refetchPlaylists();
    },
    onError: (error) => {
      console.error("Failed to add to playlist:", error);
      hapticMedium();
    },
  });

  const toggleFavorite = () => {
    if (!currentTrack) return;

    if (favoriteData?.isFavorite) {
      hapticLight();
      removeFavorite.mutate({ trackId: currentTrack.id });
    } else {
      hapticSuccess();
      addFavorite.mutate({ track: currentTrack });
    }
    setIsHeartAnimating(true);
    setTimeout(() => setIsHeartAnimating(false), 600);
  };

  // Wrapper functions with haptic feedback
  const handlePlayPause = () => {
    hapticMedium();
    onPlayPause();
  };

  const handleNext = () => {
    hapticLight();
    onNext();
  };

  const handlePrevious = () => {
    hapticLight();
    onPrevious();
  };

  const handleToggleShuffle = () => {
    hapticLight();
    onToggleShuffle();
  };

  const handleCycleRepeat = () => {
    hapticLight();
    onCycleRepeat();
  };

  useKeyboardShortcuts({
    onPlayPause,
    onNext,
    onPrevious,
    onVolumeUp: () => onVolumeChange(Math.min(1, volume + 0.1)),
    onVolumeDown: () => onVolumeChange(Math.max(0, volume - 0.1)),
    onMute: onToggleMute,
    onSeekForward: onSkipForward,
    onSeekBackward: onSkipBackward,
    onToggleShuffle,
    onToggleRepeat: onCycleRepeat,
    onToggleVisualizer: onToggleVisualizer,
  });

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * duration);
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    onSeek(percentage * duration);
  };

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div
        ref={progressRef}
        className="group relative h-1.5 w-full cursor-pointer rounded-full bg-[rgba(255,255,255,0.12)] transition-all hover:h-2"
        onClick={handleProgressClick}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseMove={handleProgressDrag}
        onMouseLeave={() => setIsDragging(false)}
      >
        <div
          className="accent-gradient h-full rounded-full shadow-sm transition-all"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute h-3 w-3 rounded-full bg-white opacity-70 shadow-lg transition-all group-hover:scale-125 group-hover:opacity-100"
          style={{
            left: `${progress}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-4">
        {/* Track Info */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative flex-shrink-0">
            {currentTrack.album.cover_small ? (
              <Image
                src={currentTrack.album.cover_small}
                alt={currentTrack.title}
                width={56}
                height={56}
                className="rounded-lg"
                priority
                quality={75}
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[rgba(244,178,102,0.08)] text-[var(--color-muted)]">
                🎵
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60">
                <div className="border-accent h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-medium text-[var(--color-text)]">
              {currentTrack.title}
            </h4>
            <p className="truncate text-sm text-[var(--color-subtext)]">
              {currentTrack.artist.name}
            </p>
          </div>

          {/* Add to Playlist Button */}
          <div className="relative">
            <button
              onClick={() => {
                hapticLight();
                setShowPlaylistSelector(!showPlaylistSelector);
              }}
              className={`rounded-full p-2 transition-all ${
                showPlaylistSelector
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-subtext)] hover:text-[var(--color-text)]"
              }`}
              title="Add to playlist"
            >
              <ListPlus className="h-5 w-5" />
            </button>

            {/* Playlist Selector Dropdown */}
            {showPlaylistSelector && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowPlaylistSelector(false)}
                />
                <div className="absolute bottom-full left-1/2 z-20 mb-2 w-64 max-h-72 overflow-y-auto -translate-x-1/2 rounded-xl border border-[rgba(244,178,102,0.18)] bg-[rgba(12,18,27,0.98)] shadow-xl backdrop-blur-xl">
                  <div className="p-3 border-b border-[rgba(255,255,255,0.08)]">
                    <h3 className="text-sm font-semibold text-[var(--color-text)]">
                      Add to Playlist
                    </h3>
                  </div>
                  <div className="py-2">
                    {playlists && playlists.length > 0 ? (
                      playlists.map((playlist) => (
                        <button
                          key={playlist.id}
                          onClick={() => {
                            if (currentTrack) {
                              addToPlaylist.mutate({
                                playlistId: playlist.id,
                                track: currentTrack,
                              });
                            }
                          }}
                          disabled={addToPlaylist.isPending}
                          className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-[rgba(244,178,102,0.1)] disabled:opacity-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-[var(--color-text)]">
                                {playlist.name}
                              </p>
                              <p className="text-xs text-[var(--color-subtext)]">
                                {playlist.trackCount ?? 0}{" "}
                                {playlist.trackCount === 1
                                  ? "track"
                                  : "tracks"}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-[var(--color-subtext)]">
                          No playlists yet
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          Create one from the Playlists page
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Favorite Button */}
          <button
            onClick={toggleFavorite}
            disabled={addFavorite.isPending || removeFavorite.isPending}
            className={`rounded-full p-2 transition-all ${
              favoriteData?.isFavorite
                ? "text-red-500 hover:text-red-400"
                : "text-[var(--color-subtext)] hover:text-[var(--color-text)]"
            } ${addFavorite.isPending || removeFavorite.isPending ? "opacity-50" : ""}`}
            title={favoriteData?.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`h-5 w-5 transition-transform ${
                favoriteData?.isFavorite ? "fill-current" : ""
              } ${isHeartAnimating ? "scale-125" : ""}`}
            />
          </button>
        </div>

        {/* Main Controls */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            {/* Shuffle */}
            <button
              onClick={handleToggleShuffle}
              className={`rounded p-2 transition ${
                isShuffled
                  ? "bg-[rgba(244,178,102,0.16)] text-[var(--color-accent)] shadow-[0_0_16px_rgba(244,178,102,0.2)]"
                  : "text-[var(--color-subtext)] hover:text-[var(--color-text)]"
              }`}
              title="Shuffle (S)"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Previous */}
            <button
              onClick={handlePrevious}
              className="text-[var(--color-subtext)] transition hover:text-[var(--color-text)]"
              title="Previous (Shift + ←)"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
              </svg>
            </button>

            {/* Skip Backward */}
            <button
              onClick={onSkipBackward}
              className="text-[var(--color-subtext)] transition hover:text-[var(--color-text)]"
              title="Skip backward 10s (←)"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
                />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-text)] text-[#0f141d] shadow-[0_10px_28px_rgba(244,178,102,0.35)] transition hover:scale-105 active:scale-95"
              title="Play/Pause (Space)"
            >
              {isPlaying ? (
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="ml-0.5 h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            {/* Skip Forward */}
            <button
              onClick={onSkipForward}
              className="text-[var(--color-subtext)] transition hover:text-[var(--color-text)]"
              title="Skip forward 10s (→)"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
                />
              </svg>
            </button>

            {/* Next */}
            <button
              onClick={handleNext}
              className="text-[var(--color-subtext)] transition hover:text-[var(--color-text)]"
              disabled={queue.length === 0}
              title="Next (Shift + →)"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
              </svg>
            </button>

            {/* Repeat */}
            <button
              onClick={handleCycleRepeat}
              className={`rounded p-2 transition ${
                repeatMode !== "none"
                  ? "bg-[rgba(244,178,102,0.16)] text-[var(--color-accent)] shadow-[0_0_16px_rgba(244,178,102,0.2)]"
                  : "text-[var(--color-subtext)] hover:text-[var(--color-text)]"
              }`}
              title={`Repeat: ${repeatMode} (R)`}
            >
              {repeatMode === "one" ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                  <text
                    x="12"
                    y="16"
                    fontSize="10"
                    fill="currentColor"
                    textAnchor="middle"
                  >
                    1
                  </text>
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Time Display */}
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-subtext)]">
            <span>{formatTime(currentTime)}</span>
            <span className="text-[var(--color-muted)]">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-1 items-center justify-end gap-3">
          {/* Queue indicator */}
          {queue.length > 0 && (
            <span className="hidden text-sm text-[var(--color-subtext)] lg:block">
              {queue.length} in queue
            </span>
          )}

          {/* Playback Speed */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="rounded px-2 py-1 text-xs font-medium text-[var(--color-subtext)] transition hover:bg-[rgba(244,178,102,0.12)] hover:text-[var(--color-text)]"
            >
              {playbackRate}x
            </button>
            {showSpeedMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSpeedMenu(false)}
                />
                <div className="absolute right-0 bottom-full z-20 mb-2 rounded-lg border border-[rgba(244,178,102,0.18)] bg-[rgba(12,18,27,0.95)] py-2 shadow-lg shadow-[rgba(5,10,18,0.6)] backdrop-blur-lg">
                  {PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        onPlaybackRateChange(rate);
                        setShowSpeedMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition hover:bg-[rgba(244,178,102,0.12)] ${
                        playbackRate === rate
                          ? "text-[var(--color-accent)]"
                          : "text-[var(--color-subtext)]"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Volume Control */}
          <div className="relative hidden items-center gap-2 md:flex">
            <button
              onClick={onToggleMute}
              className="text-[var(--color-subtext)] transition hover:text-[var(--color-text)]"
              title="Mute/Unmute (M)"
            >
              {isMuted || volume === 0 ? (
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : volume < 0.5 ? (
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
            <div className="flex w-24 items-center">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="accent-accent h-1 w-full cursor-pointer appearance-none rounded-full bg-[rgba(255,255,255,0.12)]"
                title="Volume (↑↓)"
              />
            </div>
          </div>

          {/* Queue Button */}
          {onToggleQueue && (
            <button
              onClick={onToggleQueue}
              className="text-[var(--color-subtext)] transition hover:text-[var(--color-text)]"
              title="Queue (Q)"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}

          {/* Equalizer Button */}
          {onToggleEqualizer && (
            <button
              onClick={onToggleEqualizer}
              className="text-[var(--color-subtext)] transition hover:text-[var(--color-text)]"
              title="Equalizer (E)"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </button>
          )}

          {/* Visualizer Toggle */}
          {onToggleVisualizer && (
            <button
              onClick={onToggleVisualizer}
              className={`rounded p-2 transition ${
                visualizerEnabled
                  ? "bg-[rgba(244,178,102,0.16)] text-[var(--color-accent)] shadow-[0_0_16px_rgba(244,178,102,0.2)]"
                  : "text-[var(--color-subtext)] hover:text-[var(--color-text)]"
              }`}
              title={
                visualizerEnabled
                  ? "Hide visualizer (V)"
                  : "Show visualizer (V)"
              }
              aria-pressed={visualizerEnabled}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"
                />
                <path
                  strokeLinecap="round"
                  strokeWidth={2}
                  d="M3 16c2-4 4-4 6 0s4 4 6 0 4-4 6 0"
                />
              </svg>
            </button>
          )}

          {/* Pattern Controls Button - Only show when visualizer is enabled */}
          {onTogglePatternControls && visualizerEnabled && (
            <button
              onClick={onTogglePatternControls}
              className="text-[var(--color-subtext)] transition hover:text-[var(--color-text)]"
              title="Pattern Controls"
            >
              <Layers className="h-5 w-5" />
            </button>
          )}

          {/* Hide UI Button - Desktop only */}
          <button
            onClick={() => {
              hapticLight();
              setHideUI(!hideUI);
            }}
            className={`rounded p-2 transition ${
              hideUI
                ? "bg-[rgba(244,178,102,0.16)] text-[var(--color-accent)] shadow-[0_0_16px_rgba(244,178,102,0.2)]"
                : "text-[var(--color-subtext)] hover:text-[var(--color-text)]"
            }`}
            title={hideUI ? "Show UI" : "Hide UI to enjoy visuals"}
            aria-pressed={hideUI}
          >
            {hideUI ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

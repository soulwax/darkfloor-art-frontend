// File: src/components/MobilePlayer.tsx

"use client";

import { PLAYBACK_RATES } from "@/config/player";
import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useAudioReactiveBackground } from "@/hooks/useAudioReactiveBackground";
import type { Track } from "@/types";
import {
  extractColorsFromImage,
  type ColorPalette,
} from "@/utils/colorExtractor";
import { hapticLight, hapticMedium } from "@/utils/haptics";
import { getCoverImage } from "@/utils/images";
import { STORAGE_KEYS } from "@/config/storage";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { springPresets } from "@/utils/spring-animations";
import { formatTime } from "@/utils/time";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import {
  Activity,
  ChevronDown,
  Heart,
  ListMusic,
  ListPlus,
  MoreHorizontal,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Sliders,
  Volume2,
  VolumeX,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface MobilePlayerProps {
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
  onClose?: () => void;
  forceExpanded?: boolean;
}

export default function MobilePlayer(props: MobilePlayerProps) {
  const {
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
    onToggleMute,
    onToggleShuffle,
    onCycleRepeat,
    onPlaybackRateChange,
    onSkipForward,
    onSkipBackward,
    onToggleQueue,
    onToggleEqualizer,
    onClose,
    forceExpanded = false,
  } = props;

  const { audioElement: contextAudioElement } = useGlobalPlayer();

  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const { data: preferences } = api.music.getUserPreferences.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    },
  );

  const [isExpanded, setIsExpanded] = useState(forceExpanded);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [hideAlbumCover, setHideAlbumCover] = useState(false);
  const [visualizerEnabled, setVisualizerEnabled] = useState(true);
  const [albumColorPalette, setAlbumColorPalette] =
    useState<ColorPalette | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  );
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const [seekDirection, setSeekDirection] = useState<
    "forward" | "backward" | null
  >(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const artworkRef = useRef<HTMLDivElement>(null);

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

  const dragY = useMotionValue(0);
  const opacity = useTransform(dragY, [0, 100], [1, 0.7]);
  const artworkScale = useTransform(dragY, [0, 100], [1, 0.9]);

  const seekX = useMotionValue(0);

  const shouldIgnoreTouch = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    if (target.closest("[data-drag-exempt='true']")) return true;
    return Boolean(
      target.closest("button") ??
        target.closest("input") ??
        target.closest("select"),
    );
  };

  const handlePlayPause = useCallback(() => {
    hapticMedium();
    onPlayPause();
  }, [onPlayPause]);

  const handleNext = useCallback(() => {
    hapticLight();
    onNext();
  }, [onNext]);

  const handlePrevious = useCallback(() => {
    hapticLight();
    onPrevious();
  }, [onPrevious]);

  const handleToggleShuffle = () => {
    hapticLight();
    onToggleShuffle();
  };

  const handleCycleRepeat = () => {
    hapticLight();
    onCycleRepeat();
  };

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

  useEffect(() => {
    if (currentTrack) {
      const coverUrl = getCoverImage(currentTrack, "big");
      extractColorsFromImage(coverUrl)
        .then(setAlbumColorPalette)
        .catch((error) => {
          console.error("Failed to extract colors:", error);
          setAlbumColorPalette(null);
        });
    } else {
      setAlbumColorPalette(null);
    }
  }, [currentTrack]);

  useEffect(() => {

    if (contextAudioElement) {
      setAudioElement(contextAudioElement);
    } else if (typeof window !== "undefined") {
      const audio = document.querySelector("audio");
      if (audio) {
        setAudioElement(audio);
      }
    }
  }, [contextAudioElement]);

  useEffect(() => {
    if (preferences) {
      setVisualizerEnabled(preferences.visualizerEnabled ?? true);
    }
  }, [preferences]);

  useEffect(() => {
    if (isAuthenticated) return;
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem(STORAGE_KEYS.VISUALIZER_ENABLED);
    if (stored !== null) {
      try {
        const parsed: unknown = JSON.parse(stored);
        setVisualizerEnabled(parsed === true);
      } catch {

        setVisualizerEnabled(stored === "true");
      }
    }
  }, [isAuthenticated]);

  useAudioReactiveBackground(audioElement, isPlaying, visualizerEnabled);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayTime = isSeeking ? seekTime : currentTime;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    hapticLight();
    onSeek(percentage * duration);
  };

  const handleProgressTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    setIsSeeking(true);
    setSeekTime(percentage * duration);
  };

  const handleProgressTouchEnd = () => {
    if (isSeeking) {
      hapticLight();
      onSeek(seekTime);
      setIsSeeking(false);
    }
  };

  const handleArtworkDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offset = info.offset.x;
      if (Math.abs(offset) > 30) {
        const seekAmount = (offset / artworkRef.current!.offsetWidth) * 30;
        const newTime = Math.max(
          0,
          Math.min(duration, currentTime + seekAmount),
        );
        setSeekTime(newTime);
        setIsSeeking(true);
        setSeekDirection(offset > 0 ? "forward" : "backward");
      }
    },
    [currentTime, duration],
  );

  const handleArtworkDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offset = info.offset.x;
      const velocity = info.velocity.x;

      if (Math.abs(offset) > 50 || Math.abs(velocity) > 300) {
        if (isSeeking) {
          hapticMedium();
          onSeek(seekTime);
        }
      }
      setIsSeeking(false);
      setSeekDirection(null);
      seekX.set(0);
    },
    [isSeeking, seekTime, onSeek, seekX],
  );

  const handleExpandedDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (forceExpanded) return;
    const offset = info.offset.y;
    const velocity = info.velocity.y;

    if (offset > 100 || velocity > 500) {
      hapticLight();
      setIsExpanded(false);
    }
  };

  const handleMiniTap = (event: PointerEvent | MouseEvent | TouchEvent) => {
    const target = event.target as HTMLElement;
    if (shouldIgnoreTouch(target)) return;

    event.preventDefault();
    hapticLight();
    if (forceExpanded) return;
    setIsExpanded(true);
  };

  if (!currentTrack) return null;

  const coverArt =
    currentTrack.album.cover_xl ??
    currentTrack.album.cover_big ??
    currentTrack.album.cover_medium ??
    currentTrack.album.cover;

  const dynamicGradient = albumColorPalette
    ? `linear-gradient(165deg, ${albumColorPalette.primary.replace("0.8)", "0.22)")}, rgba(8,13,20,0.95) 50%)`
    : "linear-gradient(165deg, rgba(13,20,29,0.98), rgba(8,13,20,0.92))";

  return (
    <>
      {}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={springPresets.gentle}
            className="safe-bottom fixed right-0 bottom-0 left-0 z-50 border-t border-[rgba(244,178,102,0.14)] bg-[rgba(10,16,24,0.98)] shadow-[0_-12px_32px_rgba(5,10,18,0.6)]"
          >
            {}
            <div
              className="h-1 w-full cursor-pointer bg-[rgba(255,255,255,0.12)]"
              data-drag-exempt="true"
              onClick={handleProgressClick}
              onTouchMove={handleProgressTouch}
              onTouchEnd={handleProgressTouchEnd}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)]"
                style={{ width: `${progress}%` }}
                layoutId="miniProgress"
              />
            </div>

            {}
            <motion.div
              className="flex cursor-pointer items-center gap-3 px-4 py-3"
              onTap={handleMiniTap}
              whileTap={{ scale: 0.99 }}
              transition={springPresets.snappy}
            >
              {}
              <div className="relative flex-shrink-0">
                {currentTrack.album.cover_small ? (
                  <Image
                    src={currentTrack.album.cover_small}
                    alt={currentTrack.title}
                    width={48}
                    height={48}
                    className="rounded-lg shadow-lg"
                    priority
                    quality={75}
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(244,178,102,0.12)] text-[var(--color-muted)]">
                    🎵
                  </div>
                )}
                {}
                {isPlaying && (
                  <motion.div
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1 rounded-full bg-[var(--color-accent)]"
                          animate={{
                            height: [4, 12, 4],
                          }}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            delay: i * 0.1,
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {}
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-semibold text-[var(--color-text)]">
                  {currentTrack.title}
                </h4>
                <p className="truncate text-sm text-[var(--color-subtext)]">
                  {currentTrack.artist.name}
                </p>
              </div>

              {}
              <div className="flex items-center gap-1">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayPause();
                  }}
                  whileTap={{ scale: 0.85 }}
                  transition={springPresets.immediate}
                  className="touch-target-lg flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(244,178,102,0.15)] text-[var(--color-accent)]"
                  aria-label={isPlaying ? "Pause track" : "Play track"}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6 fill-current" />
                  ) : (
                    <Play className="ml-0.5 h-6 w-6 fill-current" />
                  )}
                </motion.button>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  disabled={queue.length === 0}
                  whileTap={{ scale: 0.85 }}
                  transition={springPresets.immediate}
                  className="touch-target flex-shrink-0 p-2 text-[var(--color-subtext)] hover:text-[var(--color-text)] disabled:opacity-50"
                  aria-label="Next track"
                >
                  <SkipForward className="h-5 w-5" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {isExpanded && (
          <>
            {}
            {!forceExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[98] bg-black/90"
                onClick={() => {
                  hapticLight();
                  if (onClose) {
                    onClose();
                  } else {
                    setIsExpanded(false);
                  }
                }}
              />
            )}

            {}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              drag={forceExpanded ? false : "y"}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.2 }}
              onDragEnd={handleExpandedDragEnd}
              style={{ y: dragY, opacity }}
              transition={springPresets.gentle}
              className="safe-bottom fixed inset-0 z-[99] flex flex-col overflow-hidden"
            >
              {}
              <div
                className="absolute inset-0 transition-all duration-1000"
                style={{ background: dynamicGradient }}
              />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(8,13,20,0.8)_70%)]" />

              {}
              <div className="relative z-10 flex flex-1 flex-col">
                {}
                {!forceExpanded && (
                  <div className="flex items-center justify-between px-6 pt-4">
                    <motion.button
                      onClick={() => {
                        hapticLight();
                        if (onClose) {
                          onClose();
                        } else {
                          setIsExpanded(false);
                        }
                      }}
                      whileTap={{ scale: 0.9 }}
                      className="touch-target rounded-full p-2 text-[var(--color-subtext)]"
                      aria-label="Collapse player"
                    >
                      <ChevronDown className="h-6 w-6" />
                    </motion.button>
                    <span className="text-xs font-semibold tracking-widest text-[var(--color-muted)] uppercase">
                      Now Playing
                    </span>
                    <motion.button
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      whileTap={{ scale: 0.9 }}
                      className="touch-target rounded-full p-2 text-[var(--color-subtext)]"
                    >
                      <MoreHorizontal className="h-6 w-6" />
                    </motion.button>
                  </div>
                )}

                {}
                <div className="flex flex-1 items-center justify-center px-8 py-6">
                  <motion.div
                    ref={artworkRef}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ scale: artworkScale }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.1}
                    onDrag={handleArtworkDrag}
                    onDragEnd={handleArtworkDragEnd}
                    transition={springPresets.smooth}
                    className="relative w-full max-w-[360px] cursor-grab active:cursor-grabbing"
                  >
                    {}
                    {!hideAlbumCover && coverArt ? (
                      <div className="relative">
                        <Image
                          src={coverArt}
                          alt={currentTrack.title}
                          width={450}
                          height={450}
                          className="aspect-square w-full rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1)] ring-1 ring-white/10"
                          priority
                          quality={90}
                        />
                        {}
                        <div
                          className="absolute inset-0 -z-10 blur-3xl opacity-30 rounded-3xl"
                          style={{
                            background: "radial-gradient(circle, rgba(244,178,102,0.6) 0%, transparent 70%)",
                          }}
                        />
                      </div>
                    ) : !hideAlbumCover ? (
                      <div className="flex aspect-square w-full items-center justify-center rounded-3xl bg-[rgba(244,178,102,0.12)] text-6xl text-[var(--color-muted)]">
                        🎵
                      </div>
                    ) : null}

                    {}
                    {

}

                    {}
                    <AnimatePresence>
                      {isSeeking && seekDirection && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/75"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-4xl font-bold text-[var(--color-text)] tabular-nums">
                              {formatTime(seekTime)}
                            </span>
                            <span
                              className={`text-sm ${seekDirection === "forward" ? "text-[var(--color-accent-strong)]" : "text-[var(--color-accent)]"}`}
                            >
                              {seekDirection === "forward" ? "+" : "-"}
                              {Math.abs(Math.round(seekTime - currentTime))}s
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {}
                    <motion.button
                      onClick={() => {
                        hapticLight();
                        setHideAlbumCover(!hideAlbumCover);
                      }}
                      whileTap={{ scale: 0.9 }}
                      className={`touch-target absolute top-3 right-3 rounded-full p-3 transition-all ${
                        hideAlbumCover
                          ? "bg-[rgba(244,178,102,0.3)] text-[var(--color-accent)]"
                          : "bg-black/40 text-[var(--color-subtext)]"
                      }`}
                      title={hideAlbumCover ? "Show album cover" : "Hide album cover to enjoy visuals"}
                    >
                      <Activity className="h-5 w-5" />
                    </motion.button>

                    {}
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/60">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="h-12 w-12 rounded-full border-4 border-[var(--color-accent)] border-t-transparent"
                        />
                      </div>
                    )}
                  </motion.div>
                </div>

                {}
                <div className="px-8 pb-4 text-center">
                  <motion.h2
                    key={currentTrack.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-1 text-2xl font-bold text-[var(--color-text)]"
                  >
                    {currentTrack.title}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg text-[var(--color-accent)]"
                  >
                    {currentTrack.artist.name}
                  </motion.p>
                </div>

                {}
                <div className="px-8 pb-4">
                  <div
                    ref={progressRef}
                    className="group relative h-2 cursor-pointer rounded-full bg-[rgba(255,255,255,0.14)]"
                    onClick={handleProgressClick}
                    onTouchMove={handleProgressTouch}
                    onTouchEnd={handleProgressTouchEnd}
                    role="slider"
                    aria-label="Seek"
                    aria-valuemin={0}
                    aria-valuemax={duration}
                    aria-valuenow={displayTime}
                  >
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)]"
                      style={{
                        width: `${isSeeking ? (seekTime / duration) * 100 : progress}%`,
                      }}
                    />
                    <motion.div
                      className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-lg"
                      style={{
                        left: `${isSeeking ? (seekTime / duration) * 100 : progress}%`,
                        x: "-50%",
                      }}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-sm text-[var(--color-subtext)] tabular-nums">
                    <span>{formatTime(displayTime)}</span>
                    <span>
                      -{formatTime(Math.max(0, duration - displayTime))}
                    </span>
                  </div>
                </div>

                {}
                <div className="flex items-center justify-center gap-6 px-8 pb-6">
                  {}
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleShuffle();
                    }}
                    whileTap={{ scale: 0.9 }}
                    className={`touch-target rounded-full p-3 transition-colors ${
                      isShuffled
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-subtext)]"
                    }`}
                    aria-label={isShuffled ? "Disable shuffle" : "Enable shuffle"}
                  >
                    <Shuffle className="h-5 w-5" />
                  </motion.button>

                  {}
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePrevious();
                    }}
                    whileTap={{ scale: 0.9 }}
                    className="touch-target-lg text-[var(--color-text)]"
                    aria-label="Previous track"
                  >
                    <SkipBack className="h-8 w-8 fill-current" />
                  </motion.button>

                  {}
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      hapticLight();
                      onSkipBackward();
                    }}
                    whileTap={{ scale: 0.9 }}
                    className="touch-target text-[var(--color-subtext)] transition-colors hover:text-[var(--color-text)]"
                    title="Skip backward 10s"
                    aria-label="Skip backward 10 seconds"
                  >
                    <svg
                      className="h-6 w-6"
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
                  </motion.button>

                  {}
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePlayPause();
                    }}
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.05 }}
                    className="relative flex h-18 w-18 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-text)] to-[var(--color-accent)] text-[#0f141d] shadow-[0_8px_32px_rgba(244,178,102,0.5)] ring-2 ring-[var(--color-accent)]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ width: 72, height: 72 }}
                    aria-label={isPlaying ? "Pause track" : "Play track"}
                    disabled={isLoading}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
                    {isPlaying ? (
                      <Pause className="relative h-8 w-8 fill-current" />
                    ) : (
                      <Play className="relative ml-0.5 h-8 w-8 fill-current" />
                    )}
                  </motion.button>

                  {}
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      hapticLight();
                      onSkipForward();
                    }}
                    whileTap={{ scale: 0.9 }}
                    className="touch-target text-[var(--color-subtext)] transition-colors hover:text-[var(--color-text)]"
                    title="Skip forward 10s"
                    aria-label="Skip forward 10 seconds"
                  >
                    <svg
                      className="h-6 w-6"
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
                  </motion.button>

                  {}
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (queue.length > 0) {
                        handleNext();
                      }
                    }}
                    disabled={queue.length === 0}
                    whileTap={{ scale: 0.9 }}
                    className="touch-target-lg text-[var(--color-text)] disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Next track"
                  >
                    <SkipForward className="h-8 w-8 fill-current" />
                  </motion.button>

                  {}
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCycleRepeat();
                    }}
                    whileTap={{ scale: 0.9 }}
                    className={`touch-target rounded-full p-3 transition-colors ${
                      repeatMode !== "none"
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-subtext)]"
                    }`}
                    aria-label={
                      repeatMode === "none"
                        ? "Enable repeat"
                        : repeatMode === "one"
                          ? "Repeat one (click to repeat all)"
                          : "Repeat all (click to disable)"
                    }
                  >
                    {repeatMode === "one" ? (
                      <Repeat1 className="h-5 w-5" />
                    ) : (
                      <Repeat className="h-5 w-5" />
                    )}
                  </motion.button>
                </div>

                {}
                <div className="flex items-center justify-around border-t border-[rgba(255,255,255,0.08)] px-8 py-4">
                  {}
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleMute();
                    }}
                    whileTap={{ scale: 0.9 }}
                    className="touch-target text-[var(--color-subtext)]"
                    aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </motion.button>

                  {}
                  <div className="relative">
                    <motion.button
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      whileTap={{ scale: 0.9 }}
                      className="touch-target rounded-full px-4 py-2 text-sm font-semibold text-[var(--color-subtext)]"
                    >
                      {playbackRate}x
                    </motion.button>
                    <AnimatePresence>
                      {showSpeedMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowSpeedMenu(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={springPresets.snappy}
                            className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-xl border border-[rgba(244,178,102,0.18)] bg-[rgba(12,18,27,1)] py-2 shadow-xl"
                          >
                            {PLAYBACK_RATES.map((rate) => (
                              <button
                                key={rate}
                                onClick={() => {
                                  hapticLight();
                                  onPlaybackRateChange(rate);
                                  setShowSpeedMenu(false);
                                }}
                                className={`w-full px-6 py-3 text-center text-sm transition-colors ${
                                  playbackRate === rate
                                    ? "text-[var(--color-accent)]"
                                    : "text-[var(--color-subtext)] hover:bg-[rgba(244,178,102,0.1)]"
                                }`}
                              >
                                {rate}x
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {}
                  {onToggleQueue && (
                    <motion.button
                      onClick={onToggleQueue}
                      whileTap={{ scale: 0.9 }}
                      className="touch-target relative text-[var(--color-subtext)]"
                    >
                      <ListMusic className="h-5 w-5" />
                      {queue.length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-[#0f141d]">
                          {queue.length > 9 ? "9+" : queue.length}
                        </span>
                      )}
                    </motion.button>
                  )}

                  {}
                  {onToggleEqualizer && (
                    <motion.button
                      onClick={onToggleEqualizer}
                      whileTap={{ scale: 0.9 }}
                      className="touch-target text-[var(--color-subtext)]"
                    >
                      <Sliders className="h-5 w-5" />
                    </motion.button>
                  )}

                  {}
                  <div className="relative">
                    <motion.button
                      onClick={() => {
                        if (!isAuthenticated) {
                          hapticMedium();
                          return;
                        }
                        hapticLight();
                        setShowPlaylistSelector(!showPlaylistSelector);
                      }}
                      whileTap={{ scale: 0.9 }}
                      className={`touch-target ${!isAuthenticated ? "opacity-50" : ""} ${showPlaylistSelector ? "text-[var(--color-accent)]" : "text-[var(--color-subtext)]"}`}
                      title={
                        isAuthenticated
                          ? "Add to playlist"
                          : "Sign in to add to playlists"
                      }
                    >
                      <ListPlus className="h-5 w-5" />
                    </motion.button>

                    {}
                    <AnimatePresence>
                      {showPlaylistSelector && isAuthenticated && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowPlaylistSelector(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={springPresets.snappy}
                            className="absolute bottom-full right-0 z-20 mb-2 w-64 max-h-72 overflow-y-auto rounded-xl border border-[rgba(244,178,102,0.18)] bg-[rgba(12,18,27,0.98)] shadow-xl backdrop-blur-xl"
                          >
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
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {}
                  <motion.button
                    onClick={() => hapticMedium()}
                    whileTap={{ scale: 0.9 }}
                    className="touch-target text-[var(--color-subtext)]"
                  >
                    <Heart className="h-5 w-5" />
                  </motion.button>
                </div>

                {}
                {}
                {

}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

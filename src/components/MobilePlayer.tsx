// File: src/components/MobilePlayer.tsx

"use client";

import { PLAYBACK_RATES } from "@/config/player";
import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useAudioReactiveBackground } from "@/hooks/useAudioReactiveBackground";
import type { Track } from "@/types";
import { extractColorsFromImage, type ColorPalette } from "@/utils/colorExtractor";
import { hapticLight, hapticMedium } from "@/utils/haptics";
import { getCoverImage } from "@/utils/images";
import { STORAGE_KEYS } from "@/config/storage";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { springPresets } from "@/utils/spring-animations";
import { formatTime } from "@/utils/time";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import {
  Activity,
  ChevronDown,
  Heart,
  ListMusic,
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

// Dynamic import for visualizer - DISABLED (keeping for future use)
// const AudioVisualizer = dynamic(
//   () => import("./AudioVisualizer").then((mod) => mod.AudioVisualizer),
//   { ssr: false },
// );

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
    onToggleQueue,
    onToggleEqualizer,
    forceExpanded = false,
  } = props;

  // Get audio element from context
  const { audioElement: contextAudioElement } = useGlobalPlayer();

  // Get session and preferences for visualizer state
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const { data: preferences } = api.music.getUserPreferences.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const updatePreferences = api.music.updatePreferences.useMutation();

  const [isExpanded, setIsExpanded] = useState(forceExpanded);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [visualizerEnabled, setVisualizerEnabled] = useState(true);
  const [albumColorPalette, setAlbumColorPalette] = useState<ColorPalette | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const [seekDirection, setSeekDirection] = useState<"forward" | "backward" | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const artworkRef = useRef<HTMLDivElement>(null);
  
  // Motion values for smooth drag interactions
  const dragY = useMotionValue(0);
  const opacity = useTransform(dragY, [0, 100], [1, 0.7]);
  const artworkScale = useTransform(dragY, [0, 100], [1, 0.9]);
  
  // Gesture seeking motion values
  const seekX = useMotionValue(0);

  const shouldIgnoreTouch = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    if (target.closest("[data-drag-exempt='true']")) return true;
    return Boolean(
      target.closest("button") ?? target.closest("input") ?? target.closest("select")
    );
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

  // Extract colors from album art when track changes
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

  // Get audio element from context or DOM
  useEffect(() => {
    // Prefer context audio element, fall back to DOM query
    if (contextAudioElement) {
      setAudioElement(contextAudioElement);
    } else if (typeof window !== "undefined") {
      const audio = document.querySelector("audio");
      if (audio) {
        setAudioElement(audio);
      }
    }
  }, [contextAudioElement]);

  // Sync visualizer state with database preferences
  useEffect(() => {
    if (preferences) {
      setVisualizerEnabled(preferences.visualizerEnabled ?? true);
    }
  }, [preferences]);

  // Load visualizer preference from localStorage when not authenticated
  useEffect(() => {
    if (isAuthenticated) return; // Skip if authenticated (preferences come from DB)
    if (typeof window === "undefined") return;
    
    const stored = window.localStorage.getItem(STORAGE_KEYS.VISUALIZER_ENABLED);
    if (stored !== null) {
      try {
        const parsed: unknown = JSON.parse(stored);
        setVisualizerEnabled(parsed === true);
      } catch {
        // Fallback for old format
        setVisualizerEnabled(stored === "true");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Audio-reactive background effects (respects visualizer preference)
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

  // Gesture seeking on artwork
  const handleArtworkDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offset = info.offset.x;
      if (Math.abs(offset) > 30) {
        const seekAmount = (offset / artworkRef.current!.offsetWidth) * 30; // Max 30 seconds
        const newTime = Math.max(0, Math.min(duration, currentTime + seekAmount));
        setSeekTime(newTime);
        setIsSeeking(true);
        setSeekDirection(offset > 0 ? "forward" : "backward");
      }
    },
    [currentTime, duration]
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
    [isSeeking, seekTime, onSeek, seekX]
  );

  const handleExpandedDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
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
    hapticLight();
    if (forceExpanded) return;
    setIsExpanded(true);
  };

  if (!currentTrack) return null;

  const coverArt = currentTrack.album.cover_xl ?? currentTrack.album.cover_big ?? currentTrack.album.cover_medium ?? currentTrack.album.cover;

  // Dynamic gradient based on album colors
  const dynamicGradient = albumColorPalette
    ? `linear-gradient(165deg, ${albumColorPalette.primary.replace('0.8)', '0.22)')}, rgba(8,13,20,0.95) 50%)`
    : "linear-gradient(165deg, rgba(13,20,29,0.98), rgba(8,13,20,0.92))";

  return (
    <>
      {/* Mini Player */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={springPresets.gentle}
            className="safe-bottom fixed right-0 bottom-0 left-0 z-50 border-t border-[rgba(244,178,102,0.14)] bg-[rgba(10,16,24,0.94)] backdrop-blur-xl shadow-[0_-12px_32px_rgba(5,10,18,0.6)]"
          >
            {/* Progress Bar */}
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

            {/* Mini Player Content */}
            <motion.div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              onTap={handleMiniTap}
              whileTap={{ scale: 0.99 }}
              transition={springPresets.snappy}
            >
              {/* Album Art with Playing Animation */}
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
                {/* Playing indicator */}
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

              {/* Track Info */}
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-semibold text-[var(--color-text)]">
                  {currentTrack.title}
                </h4>
                <p className="truncate text-sm text-[var(--color-subtext)]">
                  {currentTrack.artist.name}
                </p>
              </div>

              {/* Controls */}
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

      {/* Expanded Player */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            {!forceExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[98] bg-black/90"
                onClick={() => {
                  hapticLight();
                  setIsExpanded(false);
                }}
              />
            )}

            {/* Full Player */}
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
              {/* Dynamic Background */}
              <div 
                className="absolute inset-0 transition-all duration-1000"
                style={{ background: dynamicGradient }}
              />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(8,13,20,0.8)_70%)]" />

              {/* Content */}
              <div className="relative z-10 flex flex-1 flex-col">
                {/* Header */}
                {!forceExpanded && (
                  <div className="flex items-center justify-between px-6 pt-4">
                    <motion.button
                      onClick={() => {
                        hapticLight();
                        setIsExpanded(false);
                      }}
                      whileTap={{ scale: 0.9 }}
                      className="touch-target rounded-full p-2 text-[var(--color-subtext)]"
                      aria-label="Collapse player"
                    >
                      <ChevronDown className="h-6 w-6" />
                    </motion.button>
                    <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
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

                {/* Album Art with Gesture Seeking */}
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
                    className="relative w-full max-w-[320px] cursor-grab active:cursor-grabbing"
                  >
                    {/* Album Art */}
                    {!showVisualizer && coverArt ? (
                      <motion.div
                        animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                        transition={isPlaying ? { duration: 20, repeat: Infinity, ease: "linear" } : {}}
                        className="relative"
                      >
                        <Image
                          src={coverArt}
                          alt={currentTrack.title}
                          width={400}
                          height={400}
                          className="aspect-square w-full rounded-3xl shadow-2xl ring-1 ring-white/10"
                          priority
                          quality={90}
                        />
                        {/* Vinyl effect for playing state */}
                        {isPlaying && (
                          <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.1)_100%)]" />
                        )}
                      </motion.div>
                    ) : !showVisualizer ? (
                      <div className="flex aspect-square w-full items-center justify-center rounded-3xl bg-[rgba(244,178,102,0.12)] text-6xl text-[var(--color-muted)]">
                        🎵
                      </div>
                    ) : null}

                    {/* Visualizer - DISABLED */}
                    {/* {showVisualizer && audioElement && (
                      <div className="aspect-square w-full overflow-hidden rounded-3xl bg-[rgba(0,0,0,0.3)]">
                        <AudioVisualizer
                          audioElement={audioElement}
                          isPlaying={isPlaying}
                          width={400}
                          height={400}
                          barCount={64}
                          type="spectrum"
                          colorPalette={albumColorPalette}
                          blendWithBackground={true}
                        />
                      </div>
                    )} */}

                    {/* Seek Indicator Overlay */}
                    <AnimatePresence>
                      {isSeeking && seekDirection && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/60 backdrop-blur-md"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-4xl font-bold tabular-nums text-[var(--color-text)]">
                              {formatTime(seekTime)}
                            </span>
                            <span className={`text-sm ${seekDirection === "forward" ? "text-[var(--color-accent-strong)]" : "text-[var(--color-accent)]"}`}>
                              {seekDirection === "forward" ? "+" : "-"}
                              {Math.abs(Math.round(seekTime - currentTime))}s
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Corner Buttons */}
                    <motion.button
                      onClick={() => {
                        hapticLight();
                        setShowVisualizer(!showVisualizer);
                      }}
                      whileTap={{ scale: 0.9 }}
                      className={`absolute right-3 top-3 touch-target rounded-full p-3 backdrop-blur-md transition-all ${
                        showVisualizer
                          ? "bg-[rgba(244,178,102,0.3)] text-[var(--color-accent)]"
                          : "bg-black/40 text-[var(--color-subtext)]"
                      }`}
                    >
                      <Activity className="h-5 w-5" />
                    </motion.button>

                    {/* Loading Indicator */}
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/60">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-12 w-12 rounded-full border-4 border-[var(--color-accent)] border-t-transparent"
                        />
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Track Info */}
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

                {/* Progress Bar */}
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
                      style={{ width: `${isSeeking ? (seekTime / duration) * 100 : progress}%` }}
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
                  <div className="mt-2 flex justify-between text-sm tabular-nums text-[var(--color-subtext)]">
                    <span>{formatTime(displayTime)}</span>
                    <span>-{formatTime(Math.max(0, duration - displayTime))}</span>
                  </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-center gap-6 px-8 pb-6">
                  {/* Shuffle */}
                  <motion.button
                    onClick={handleToggleShuffle}
                    whileTap={{ scale: 0.9 }}
                    className={`touch-target rounded-full p-3 transition-colors ${
                      isShuffled
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-subtext)]"
                    }`}
                  >
                    <Shuffle className="h-5 w-5" />
                  </motion.button>

                  {/* Previous */}
                  <motion.button
                    onClick={handlePrevious}
                    whileTap={{ scale: 0.9 }}
                    className="touch-target-lg text-[var(--color-text)]"
                  >
                    <SkipBack className="h-8 w-8 fill-current" />
                  </motion.button>

                  {/* Play/Pause */}
                  <motion.button
                    onClick={handlePlayPause}
                    whileTap={{ scale: 0.9 }}
                    className="flex h-18 w-18 items-center justify-center rounded-full bg-[var(--color-text)] text-[#0f141d] shadow-[0_8px_32px_rgba(244,178,102,0.4)]"
                    style={{ width: 72, height: 72 }}
                  >
                    {isPlaying ? (
                      <Pause className="h-8 w-8 fill-current" />
                    ) : (
                      <Play className="ml-1 h-8 w-8 fill-current" />
                    )}
                  </motion.button>

                  {/* Next */}
                  <motion.button
                    onClick={handleNext}
                    disabled={queue.length === 0}
                    whileTap={{ scale: 0.9 }}
                    className="touch-target-lg text-[var(--color-text)] disabled:opacity-40"
                  >
                    <SkipForward className="h-8 w-8 fill-current" />
                  </motion.button>

                  {/* Repeat */}
                  <motion.button
                    onClick={handleCycleRepeat}
                    whileTap={{ scale: 0.9 }}
                    className={`touch-target rounded-full p-3 transition-colors ${
                      repeatMode !== "none"
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-subtext)]"
                    }`}
                  >
                    {repeatMode === "one" ? (
                      <Repeat1 className="h-5 w-5" />
                    ) : (
                      <Repeat className="h-5 w-5" />
                    )}
                  </motion.button>
                </div>

                {/* Secondary Controls */}
                <div className="flex items-center justify-around border-t border-[rgba(255,255,255,0.08)] px-8 py-4">
                  {/* Volume */}
                  <motion.button
                    onClick={onToggleMute}
                    whileTap={{ scale: 0.9 }}
                    className="touch-target text-[var(--color-subtext)]"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </motion.button>

                  {/* Playback Speed */}
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
                            className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-xl border border-[rgba(244,178,102,0.18)] bg-[rgba(12,18,27,0.98)] py-2 shadow-xl backdrop-blur-xl"
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

                  {/* Queue */}
                  {onToggleQueue && (
                    <motion.button
                      onClick={onToggleQueue}
                      whileTap={{ scale: 0.9 }}
                      className="touch-target relative text-[var(--color-subtext)]"
                    >
                      <ListMusic className="h-5 w-5" />
                      {queue.length > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-[#0f141d]">
                          {queue.length > 9 ? "9+" : queue.length}
                        </span>
                      )}
                    </motion.button>
                  )}

                  {/* Equalizer */}
                  {onToggleEqualizer && (
                    <motion.button
                      onClick={onToggleEqualizer}
                      whileTap={{ scale: 0.9 }}
                      className="touch-target text-[var(--color-subtext)]"
                    >
                      <Sliders className="h-5 w-5" />
                    </motion.button>
                  )}

                  {/* Favorite */}
                  <motion.button
                    onClick={() => hapticMedium()}
                    whileTap={{ scale: 0.9 }}
                    className="touch-target text-[var(--color-subtext)]"
                  >
                    <Heart className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

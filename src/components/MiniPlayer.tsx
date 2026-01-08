// File: src/components/MiniPlayer.tsx

"use client";

import type { Track } from "@/types";
import { hapticLight, hapticMedium } from "@/utils/haptics";
import { springPresets } from "@/utils/spring-animations";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import Image from "next/image";
import { AutoQueueBadge } from "./AutoQueueBadge";

interface MiniPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  queue: Track[];
  lastAutoQueueCount?: number;
  onPlayPause: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onTap: () => void;
}

export default function MiniPlayer({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  queue,
  lastAutoQueueCount = 0,
  onPlayPause,
  onNext,
  onSeek,
  onTap,
}: MiniPlayerProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const dragY = useMotionValue(0);
  const opacity = useTransform(dragY, [0, -50], [1, 0.85]);
  const scale = useTransform(dragY, [0, -50], [1, 0.96]);
  
  // Visual feedback: show hint when dragging up
  const swipeHintOpacity = useTransform(dragY, [0, -20, -50], [0, 1, 1]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * duration);
    e.stopPropagation();
  };

  const handleProgressTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    onSeek(percentage * duration);
    e.stopPropagation();
  };

  const shouldIgnoreTap = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;

    return Boolean(
      target.closest("button") ??
        target.closest("input") ??
        target.closest("select") ??
        target.closest("[data-drag-exempt='true']"),
    );
  };

  const handleContainerTap = (event: PointerEvent | MouseEvent | TouchEvent) => {

    if (shouldIgnoreTap(event.target)) {
      return;
    }
    hapticLight();
    onTap();
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const offset = info.offset.y;
    const velocity = info.velocity.y;

    // Very low threshold for easier swipe-up: 20px or velocity > 150
    // This makes it much easier to pop up the player
    if (offset < -20 || velocity < -150) {
      hapticMedium();
      onTap();
    }
    
    // Reset drag position
    dragY.set(0);
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={springPresets.gentle}
      className="safe-bottom fixed right-0 bottom-0 left-0 z-50 border-t border-[rgba(244,178,102,0.16)] bg-[rgba(10,16,24,0.96)] shadow-[0_-16px_48px_rgba(5,10,18,0.8)] backdrop-blur-2xl relative"
    >
      {}
      <AutoQueueBadge count={lastAutoQueueCount} />

      {}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <motion.div
          animate={{
            y: [0, -3, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-10 h-1 rounded-full bg-[var(--color-accent)]/60 shadow-lg shadow-[var(--color-accent)]/30" />
          <svg
            className="h-4 w-4 text-[var(--color-accent)]/40"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
        </motion.div>
      </div>

      {}
      <div
        className="h-1 w-full cursor-pointer bg-[rgba(255,255,255,0.12)]"
        data-drag-exempt="true"
        onClick={handleProgressClick}
        onTouchMove={handleProgressTouch}
      >
        <div
          className="accent-gradient h-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {}
      <motion.div
        className="flex cursor-pointer items-center gap-4 px-5 py-4 relative group"
        onTap={handleContainerTap}
        drag="y"
        dragConstraints={{ top: -80, bottom: 0 }}
        dragElastic={{ top: 0.5, bottom: 0 }}
        onDragEnd={handleDragEnd}
        style={{ y: dragY, opacity, scale }}
        whileTap={{ scale: 0.99 }}
        transition={springPresets.snappy}
      >
        {}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: swipeHintOpacity }}
        >
          <div className="bg-[var(--color-accent)]/30 backdrop-blur-md px-5 py-2.5 rounded-full border-2 border-[var(--color-accent)]/50 shadow-lg">
            <span className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-wider">
              Swipe Up to Expand
            </span>
          </div>
        </motion.div>
        
        {}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-[var(--color-accent)]/20 backdrop-blur-sm px-4 py-2 rounded-full border border-[var(--color-accent)]/30">
            <span className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wide">
              Tap to Expand
            </span>
          </div>
        </div>
        {currentTrack.album.cover_small ? (
          <Image
            src={currentTrack.album.cover_small}
            alt={currentTrack.title}
            width={64}
            height={64}
            className="flex-shrink-0 rounded-lg shadow-lg ring-2 ring-[rgba(244,178,102,0.3)]"
            priority
            quality={75}
          />
        ) : (
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(244,178,102,0.12)] text-[var(--color-muted)] ring-2 ring-[rgba(244,178,102,0.3)]">
            🎵
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-medium text-[var(--color-text)]">
            {currentTrack.title}
          </h4>
          <p className="truncate text-sm text-[var(--color-subtext)]">
            {currentTrack.artist.name}
          </p>
        </div>
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            hapticLight();
            onPlayPause();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            hapticLight();
            onPlayPause();
          }}
          data-drag-exempt="true"
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.05 }}
          transition={springPresets.snappy}
          className="touch-target-lg flex-shrink-0 text-[var(--color-text)] active:bg-[var(--color-accent)]/10 rounded-full p-2 transition-colors"
          aria-label={isPlaying ? "Pause track" : "Play track"}
          type="button"
        >
          {isPlaying ? (
            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </motion.button>
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            hapticLight();
            onNext();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            hapticLight();
            onNext();
          }}
          data-drag-exempt="true"
          disabled={queue.length === 0}
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.05 }}
          transition={springPresets.snappy}
          className="touch-target-lg flex-shrink-0 text-[var(--color-subtext)] hover:text-[var(--color-text)] disabled:opacity-50 active:bg-[var(--color-accent)]/10 rounded-full p-2 transition-colors disabled:active:bg-transparent"
          aria-label="Next track"
          aria-disabled={queue.length === 0}
          type="button"
        >
          <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
          </svg>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

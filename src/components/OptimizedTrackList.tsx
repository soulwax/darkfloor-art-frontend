// File: src/components/OptimizedTrackList.tsx

"use client";

import { motion } from "framer-motion";
import type { Track } from "@/types";
import TrackCard from "./TrackCard";
import { listAnimation, listItemAnimation } from "@/utils/spring-animations";

export interface OptimizedTrackListProps {
  tracks: Track[];
  onPlay: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
  showActions?: boolean;
  className?: string;
}

export function OptimizedTrackList({
  tracks,
  onPlay,
  onAddToQueue,
  showActions = true,
  className = "",
}: OptimizedTrackListProps) {
  return (
    <motion.div
      variants={listAnimation}
      initial="hidden"
      animate="show"
      className={`space-y-2 ${className}`}
    >
      {tracks.map((track, index) => (
        <motion.div key={track.id} variants={listItemAnimation} custom={index}>
          <TrackCard
            track={track}
            onPlay={onPlay}
            onAddToQueue={onAddToQueue}
            showActions={showActions}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

export default OptimizedTrackList;

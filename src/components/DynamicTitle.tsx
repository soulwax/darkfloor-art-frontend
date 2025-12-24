// File: src/components/DynamicTitle.tsx

"use client";

import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useEffect, useState } from "react";

/**
 * DynamicTitle - Updates the browser/window title based on playback state
 *
 * Rules:
 * - When playing: Shows "Artist - Track Title"
 * - When not playing in Electron: Shows "Starchild"
 * - When not playing on web: Shows "darkfloor.art"
 */
export function DynamicTitle() {
  const { currentTrack, isPlaying } = useGlobalPlayer();
  const [isElectron, setIsElectron] = useState(false);

  // Detect if running in Electron
  useEffect(() => {
    setIsElectron(!!window.electron?.isElectron);
  }, []);

  // Update document title based on playback state
  useEffect(() => {
    if (currentTrack && isPlaying && typeof currentTrack === 'object' && 'artist' in currentTrack && 'title' in currentTrack) {
      // Playing: Show "Artist - Track Title"
      const track = currentTrack as { artist: unknown; title: unknown };
      const artistObj = track.artist;
      const artist = typeof artistObj === 'object' && artistObj !== null && 'name' in artistObj 
        ? String((artistObj as { name: unknown }).name) 
        : "Unknown Artist";
      const title = typeof track.title === 'string' ? track.title : "Unknown Track";
      document.title = `${artist} - ${title}`;
    } else {
      // Not playing: Show app name (conditional based on platform)
      document.title = isElectron ? "Starchild" : "darkfloor.art";
    }
  }, [currentTrack, isPlaying, isElectron]);

  return null; // This component doesn't render anything
}

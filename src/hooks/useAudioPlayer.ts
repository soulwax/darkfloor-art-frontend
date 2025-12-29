// File: src/hooks/useAudioPlayer.ts

"use client";

import { AUDIO_CONSTANTS } from "@/config/constants";
import { STORAGE_KEYS } from "@/config/storage";
import { localStorage } from "@/services/storage";
import type { SmartQueueSettings, Track } from "@/types";
import { getStreamUrlById } from "@/utils/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadPersistedQueueState } from "./useQueuePersistence";

type RepeatMode = "none" | "one" | "all";

interface UseAudioPlayerOptions {
  onTrackChange?: (track: Track) => void;
  onTrackEnd?: (track: Track) => void;
  onDuplicateTrack?: (track: Track) => void;
  onAutoQueueTrigger?: (
    currentTrack: Track,
    currentQueueLength: number,
  ) => Promise<Track[]>;
  onError?: (error: string, trackId?: number) => void;
  smartQueueSettings?: SmartQueueSettings;
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const { onTrackChange, onTrackEnd, onDuplicateTrack, onError } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // NEW QUEUE-FIRST APPROACH: currentTrack is always queue[0]
  // queue[0] = current track, queue[1..n] = upcoming tracks
  const [queue, setQueue] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("none");
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [originalQueueOrder, setOriginalQueueOrder] = useState<Track[]>([]);
  // COMMENTED OUT - Auto-queue disabled
  // const autoQueueTriggeredRef = useRef(false);
  const [lastAutoQueueCount] = useState(0); // Keep for compatibility but always 0
  const loadIdRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const failedTracksRef = useRef<Set<number>>(new Set());
  const isInitialMountRef = useRef(true); // Track if this is the first render

  // Derived state: currentTrack is always queue[0]
  const currentTrack = queue[0] ?? null;

  // Load persisted settings and queue state
  useEffect(() => {
    const savedVolume = localStorage.getOrDefault(STORAGE_KEYS.VOLUME, 0.7);
    const savedRate = localStorage.getOrDefault(STORAGE_KEYS.PLAYBACK_RATE, 1);

    setVolume(savedVolume);
    setPlaybackRate(savedRate);

    // Load persisted queue state
    const persistedState = loadPersistedQueueState();
    if (persistedState) {
      // In queue-first approach, queue[0] is always the current track
      // persistedState.queue already includes currentTrack at position 0
      // So we use it directly without merging to avoid duplication
      setQueue(persistedState.queue);
      setHistory(persistedState.history);
      setIsShuffled(persistedState.isShuffled);
      setRepeatMode(persistedState.repeatMode);
      // Don't auto-restore currentTime to avoid unexpected jumps
    }
  }, []);

  // Persist volume
  useEffect(() => {
    localStorage.set(STORAGE_KEYS.VOLUME, volume);
  }, [volume]);

  // Persist playback rate
  useEffect(() => {
    localStorage.set(STORAGE_KEYS.PLAYBACK_RATE, playbackRate);
  }, [playbackRate]);

  // Persist queue state
  useEffect(() => {
    const queueState = {
      queue,
      history,
      currentTrack,
      currentTime,
      isShuffled,
      repeatMode,
    };
    localStorage.set(STORAGE_KEYS.QUEUE_STATE, queueState);
  }, [queue, history, currentTrack, currentTime, isShuffled, repeatMode]);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  // Initialize audio source for restored track (from previous session)
  // DO NOT auto-play - only load the source
  useEffect(() => {
    if (audioRef.current && currentTrack && !audioRef.current.src) {
      // Only initialize if there's no source already set
      // This happens when state is restored from localStorage
      console.log("[useAudioPlayer] 🔄 Restoring audio source from localStorage (no autoplay)");
      const streamUrl = getStreamUrlById(currentTrack.id.toString());
      audioRef.current.src = streamUrl;
      audioRef.current.load();
      // DO NOT call play() here - browser autoplay policy requires user gesture
    }
  }, [currentTrack]);

  // Update audio element properties
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate]);

  // Memoize handleTrackEnd with proper dependencies
  const handleTrackEnd = useCallback(() => {
    if (!currentTrack) return;

    if (repeatMode === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // Playback failed, likely due to autoplay restrictions
        });
      }
      return;
    }

    // NEW QUEUE-FIRST APPROACH:
    // queue[0] is current track, queue[1..n] are upcoming
    if (queue.length > 1) {
      // Move current track (queue[0]) to history and advance queue
      setHistory((prev) => [...prev, currentTrack]);
      setQueue((prev) => prev.slice(1)); // Remove queue[0], queue[1] becomes new queue[0]
    } else if (repeatMode === "all") {
      // Restart the queue with all played tracks (history + current track)
      if (history.length > 0) {
        const allTracks = [...history, currentTrack];
        setQueue(allTracks);
        setHistory([]);
      }
    } else {
      // No more tracks in queue, playback ends
      onTrackEnd?.(currentTrack);
      // Clear the queue since playback is complete
      setQueue([]);
      setIsPlaying(false);
      console.log(
        "[useAudioPlayer] 🏁 Playback ended, queue cleared",
      );
    }
  }, [currentTrack, queue, repeatMode, history, onTrackEnd]);

  // Media Session API integration for background playback
  useEffect(() => {
    if (
      !currentTrack ||
      typeof navigator === "undefined" ||
      !("mediaSession" in navigator)
    )
      return;

    // Set metadata for lock screen and notification controls
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist.name,
      album: currentTrack.album.title,
      artwork: [
        currentTrack.album.cover_small
          ? {
              src: currentTrack.album.cover_small,
              sizes: "56x56",
              type: "image/jpeg",
            }
          : undefined,
        currentTrack.album.cover_medium
          ? {
              src: currentTrack.album.cover_medium,
              sizes: "250x250",
              type: "image/jpeg",
            }
          : undefined,
        currentTrack.album.cover_big
          ? {
              src: currentTrack.album.cover_big,
              sizes: "500x500",
              type: "image/jpeg",
            }
          : undefined,
        currentTrack.album.cover_xl
          ? {
              src: currentTrack.album.cover_xl,
              sizes: "1000x1000",
              type: "image/jpeg",
            }
          : undefined,
      ].filter(
        (artwork): artwork is NonNullable<typeof artwork> =>
          artwork !== undefined,
      ),
    });

    // Set playback state
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [currentTrack, isPlaying]);

  // Media Session action handlers for background controls
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;

    const togglePlayPause = () => {
      if (audioRef.current) {
        // Use actual audio element state for media session controls too
        const isActuallyPlaying = !audioRef.current.paused;
        if (isActuallyPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch((error) => {
            console.error("Playback failed:", error);
          });
        }
      }
    };

    const handleNextTrack = () => {
      // NEW: queue[0] is current, queue[1] is next
      if (queue.length > 1) {
        setHistory((prev) => [...prev, currentTrack!]);
        setQueue((prev) => prev.slice(1));
      }
    };

    const handlePreviousTrack = () => {
      // If more than 3 seconds in, restart current track
      if (audioRef.current && audioRef.current.currentTime > 3) {
        audioRef.current.currentTime = 0;
      } else if (history.length > 0) {
        // Go to previous track
        const prevTrack = history[history.length - 1];
        if (prevTrack && currentTrack) {
          setQueue((prev) => [prevTrack, ...prev]); // Insert prevTrack at queue[0]
        }
        setHistory((prev) => prev.slice(0, -1));
      }
    };

    const handleSeekBackward = (details: MediaSessionActionDetails) => {
      if (audioRef.current) {
        const seekTime = details.seekOffset ?? 10;
        audioRef.current.currentTime = Math.max(
          0,
          audioRef.current.currentTime - seekTime,
        );
      }
    };

    const handleSeekForward = (details: MediaSessionActionDetails) => {
      if (audioRef.current) {
        const seekTime = details.seekOffset ?? 10;
        audioRef.current.currentTime = Math.min(
          audioRef.current.duration,
          audioRef.current.currentTime + seekTime,
        );
      }
    };

    const handleSeekTo = (details: MediaSessionActionDetails) => {
      if (audioRef.current && details.seekTime !== undefined) {
        audioRef.current.currentTime = details.seekTime;
      }
    };

    // Register action handlers
    try {
      navigator.mediaSession.setActionHandler("play", togglePlayPause);
      navigator.mediaSession.setActionHandler("pause", togglePlayPause);
      navigator.mediaSession.setActionHandler("nexttrack", handleNextTrack);
      navigator.mediaSession.setActionHandler(
        "previoustrack",
        handlePreviousTrack,
      );
      navigator.mediaSession.setActionHandler(
        "seekbackward",
        handleSeekBackward,
      );
      navigator.mediaSession.setActionHandler("seekforward", handleSeekForward);
      navigator.mediaSession.setActionHandler("seekto", handleSeekTo);
    } catch (error) {
      console.error("Failed to set media session handlers:", error);
    }

    // Cleanup - remove handlers on unmount
    return () => {
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
        navigator.mediaSession.setActionHandler("seekbackward", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
        navigator.mediaSession.setActionHandler("seekto", null);
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [currentTrack, queue, history, isPlaying]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const newTime = audio.currentTime;
      // Log every 5 seconds to help diagnose if time is progressing
      if (Math.floor(newTime) % 5 === 0 && Math.floor(newTime) !== Math.floor(currentTime)) {
        console.log("[useAudioPlayer] Time update:", {
          currentTime: newTime,
          paused: audio.paused,
          readyState: audio.readyState,
          src: audio.src.substring(0, 50) + "...",
        });
      }
      setCurrentTime(newTime);
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => handleTrackEnd();
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = (e: Event) => {
      // Ignore abort errors - these are normal when switching tracks quickly
      const target = e.target as HTMLAudioElement;
      const error = target.error;

      if (error?.code === MediaError.MEDIA_ERR_ABORTED) {
        // This is expected when switching tracks, not a real error
        return;
      }

      // Check for HTTP errors (503, 404, etc.) in error message
      const errorMessage = error?.message ?? "";

      // Check if this is an aborted fetch (common when skipping tracks quickly)
      const isAborted =
        errorMessage.includes("aborted") ||
        errorMessage.includes("AbortError") ||
        (errorMessage.includes("fetching process") &&
          errorMessage.includes("aborted"));

      if (isAborted) {
        // This is expected when switching tracks quickly, not a real error
        console.debug(
          "[useAudioPlayer] Fetch aborted (normal during rapid track changes)",
        );
        return;
      }

      const isHttpError =
        /^\d{3}:/.test(errorMessage) ||
        errorMessage.includes("Service Unavailable") ||
        errorMessage.includes("503");
      const isUpstreamError =
        errorMessage.includes("upstream error") ||
        errorMessage.includes("ServiceUnavailableException");

      if (isHttpError && currentTrack) {
        // For upstream errors, don't mark as permanently failed - might be temporary
        if (isUpstreamError) {
          console.warn(
            `[useAudioPlayer] Upstream error for track ${currentTrack.id} - may be temporary:`,
            errorMessage,
          );
          setIsLoading(false);
          setIsPlaying(false);
          onError?.(errorMessage, currentTrack.id);
          // Don't add to failed tracks - allow retry later
          retryCountRef.current = 0;
          return;
        }

        // Mark this track as failed to prevent infinite retries (for other 503 errors)
        failedTracksRef.current.add(currentTrack.id);
        console.error(
          `Audio error for track ${currentTrack.id}:`,
          errorMessage,
        );
        setIsLoading(false);
        setIsPlaying(false);

        // Notify parent of error
        onError?.(errorMessage, currentTrack.id);

        // Reset retry count for this track
        retryCountRef.current = 0;
        return;
      }

      // Log other errors for debugging
      console.error("Audio error:", errorMessage || "Unknown error");
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
    };
  }, [handleTrackEnd, currentTrack, onError]);

  const loadTrack = useCallback(
    (track: Track, streamUrl: string) => {
      if (!audioRef.current) return;

      // Check if this track has already failed (prevent infinite retries)
      if (failedTracksRef.current.has(track.id)) {
        console.warn(
          `[useAudioPlayer] Track ${track.id} previously failed, skipping load`,
        );
        setIsLoading(false);
        setIsPlaying(false);
        return;
      }

      // Increment load ID to track this specific load
      const currentLoadId = ++loadIdRef.current;

      // Cancel any pending retry
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      // Reset retry count for new track
      if (currentTrack?.id !== track.id) {
        retryCountRef.current = 0;
      }

      // Pause and reset current audio to prevent "aborted" errors on rapid track changes
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (error) {
        console.debug("[useAudioPlayer] Error resetting audio:", error);
      }

      // NEW QUEUE-FIRST APPROACH: Don't manually update history or currentTrack
      // Those are handled by the queue management functions
      // This function is only for loading the audio source

      // Set new source and load
      const applySource = () => {
        // Check if this load is still current
        if (currentLoadId !== loadIdRef.current) {
          console.debug(
            "[useAudioPlayer] Load cancelled, newer load in progress",
          );
          return false;
        }

        if (!audioRef.current) return false;

        try {
          console.log("[useAudioPlayer] Setting audio source:", {
            streamUrl,
            currentSrc: audioRef.current.src,
            readyState: audioRef.current.readyState,
          });
          audioRef.current.src = streamUrl;
          audioRef.current.load(); // Explicitly load the new source
          console.log("[useAudioPlayer] Audio source set and load() called");
          return true;
        } catch (error) {
          // Ignore abort errors - these are normal when switching tracks quickly
          if (
            error instanceof DOMException &&
            (error.name === "AbortError" ||
              error.message?.includes("aborted") ||
              error.message?.includes("fetching process"))
          ) {
            console.debug(
              "[useAudioPlayer] Loading aborted for new source (ignored).",
            );
            return false;
          } else {
            console.error(
              "[useAudioPlayer] Failed to load new audio source:",
              error,
            );
            return false;
          }
        }
      };

      const applied = applySource();
      if (!applied) {
        // Retry with exponential backoff, but only if we haven't exceeded max retries
        if (retryCountRef.current < maxRetries) {
          const delay =
            AUDIO_CONSTANTS.AUDIO_LOAD_RETRY_DELAY_MS *
            Math.pow(2, retryCountRef.current);
          retryCountRef.current++;

          retryTimeoutRef.current = setTimeout(() => {
            if (currentLoadId === loadIdRef.current && audioRef.current) {
              applySource();
            }
          }, delay);
        } else {
          // Max retries exceeded, mark track as failed
          console.error(
            `[useAudioPlayer] Max retries (${maxRetries}) exceeded for track ${track.id}`,
          );
          failedTracksRef.current.add(track.id);
          retryCountRef.current = 0;
          setIsLoading(false);
          setIsPlaying(false);
          onError?.(
            `Failed to load track after ${maxRetries} retries`,
            track.id,
          );
        }
      } else {
        // Successfully applied, reset retry count
        retryCountRef.current = 0;
      }

      onTrackChange?.(track);
    },
    [currentTrack, onTrackChange, onError],
  );

  const play = useCallback(async () => {
    if (!audioRef.current) {
      console.warn("[useAudioPlayer] play() called but audioRef.current is null");
      return;
    }

    try {
      console.log("[useAudioPlayer] Attempting to play audio", {
        src: audioRef.current.src,
        readyState: audioRef.current.readyState,
        paused: audioRef.current.paused,
        currentTime: audioRef.current.currentTime,
      });

      // If audio element is connected to Web Audio API, ensure context is resumed
      // Check if there's a connection via the audio context manager
      const { getAudioConnection, ensureConnectionChain } = await import("@/utils/audioContextManager");
      const connection = getAudioConnection(audioRef.current);
      if (connection) {
        console.log("[useAudioPlayer] Audio connected to Web Audio API", {
          contextState: connection.audioContext.state,
          hasAnalyser: !!connection.analyser,
          hasFilters: !!connection.filters,
        });
        
        // CRITICAL: When an audio element is connected to MediaElementSourceNode,
        // it MUST have a complete connection chain to destination, otherwise audio won't play.
        // Ensure the chain is complete before attempting playback.
        ensureConnectionChain(connection);
        
        if (connection.audioContext.state === "suspended") {
          console.log("[useAudioPlayer] Resuming suspended audio context");
          await connection.audioContext.resume();
        }
      } else {
        console.log("[useAudioPlayer] Audio not connected to Web Audio API (normal playback)");
      }

      // Ensure source is loaded
      if (!audioRef.current.src) {
        console.warn("[useAudioPlayer] No audio source set, cannot play");
        setIsPlaying(false);
        return;
      }

      // Check if audio is ready to play
      if (audioRef.current.readyState < 2) {
        console.log("[useAudioPlayer] Audio not ready, waiting for canplay event");
        // Wait for canplay event
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Audio load timeout"));
          }, 10000);
          
          const handleCanPlay = () => {
            clearTimeout(timeout);
            audioRef.current?.removeEventListener("canplay", handleCanPlay);
            audioRef.current?.removeEventListener("error", handleError);
            resolve();
          };
          
          const handleError = () => {
            clearTimeout(timeout);
            audioRef.current?.removeEventListener("canplay", handleCanPlay);
            audioRef.current?.removeEventListener("error", handleError);
            reject(new Error("Audio load error"));
          };
          
          audioRef.current?.addEventListener("canplay", handleCanPlay, { once: true });
          audioRef.current?.addEventListener("error", handleError, { once: true });
        });
      }

      const playPromise = audioRef.current.play();
      console.log("[useAudioPlayer] play() called, waiting for promise...");
      
      await playPromise;
      console.log("[useAudioPlayer] Playback started successfully", {
        paused: audioRef.current.paused,
        currentTime: audioRef.current.currentTime,
        readyState: audioRef.current.readyState,
      });

      // Double-check connection chain after play
      if (connection) {
        console.log("[useAudioPlayer] Verifying connection chain after play...");
        const { verifyConnectionChain } = await import("@/utils/audioContextManager");
        const isValid = verifyConnectionChain(connection);
        if (!isValid) {
          console.warn("[useAudioPlayer] Connection chain invalid, rebuilding...");
          const { ensureConnectionChain } = await import("@/utils/audioContextManager");
          ensureConnectionChain(connection);
        } else {
          console.log("[useAudioPlayer] Connection chain verified");
        }
      }

      setIsPlaying(true);
    } catch (err) {
      console.error("[useAudioPlayer] Playback failed:", err);
      console.error("[useAudioPlayer] Error details:", {
        name: err instanceof Error ? err.name : "Unknown",
        message: err instanceof Error ? err.message : String(err),
        audioState: audioRef.current ? {
          src: audioRef.current.src,
          paused: audioRef.current.paused,
          readyState: audioRef.current.readyState,
          currentTime: audioRef.current.currentTime,
        } : "no audio element",
      });
      setIsPlaying(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (!audioRef.current) {
      console.warn("[useAudioPlayer] Cannot pause: audio element not initialized");
      setIsPlaying(false);
      return;
    }

    try {
      audioRef.current.pause();
      // Note: setIsPlaying(false) will be called by the 'pause' event listener
      // But we also set it here as a backup in case the event doesn't fire
      setIsPlaying(false);
    } catch (error) {
      console.error("[useAudioPlayer] Error pausing audio:", error);
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(async () => {
    // Use actual audio element state as source of truth to prevent state sync issues
    // This ensures pause button works even if React state is out of sync
    const isActuallyPlaying = audioRef.current && !audioRef.current.paused;

    console.log("[useAudioPlayer] togglePlay called", {
      reactState_isPlaying: isPlaying,
      audioElement_paused: audioRef.current?.paused,
      isActuallyPlaying,
      willCall: isActuallyPlaying ? "pause()" : "play()",
    });

    if (isActuallyPlaying) {
      pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const playPrevious = useCallback(() => {
    if (history.length === 0) return null;

    const previousTracks = [...history];
    const prevTrack = previousTracks.pop()!;
    setHistory(previousTracks);

    // NEW: Insert prevTrack at queue[0], keeping rest of queue intact
    setQueue((prev) => [prevTrack, ...prev]);

    return prevTrack;
  }, [history]);

  // NEW: Validate track data integrity
  const isValidTrack = useCallback(
    (track: Track | null | undefined): track is Track => {
      if (!track) return false;

      // Check essential fields
      return (
        typeof track.id === "number" &&
        track.id > 0 &&
        typeof track.title === "string" &&
        track.title.length > 0 &&
        typeof track.duration === "number" &&
        track.duration > 0 &&
        track.artist?.id != null &&
        typeof track.artist?.name === "string" &&
        track.artist.name.length > 0 &&
        track.album?.id != null &&
        typeof track.album?.title === "string" &&
        track.album.title.length > 0
      );
    },
    [],
  );

  const addToQueue = useCallback(
    (track: Track | Track[], checkDuplicates = true) => {
      const tracks = Array.isArray(track) ? track : [track];

      console.log("[useAudioPlayer] 📥 addToQueue called:", {
        trackCount: tracks.length,
        checkDuplicates,
        currentQueueSize: queue.length,
        tracks: tracks.map((t) => `${t.title} - ${t.artist.name}`),
      });

      // NEW: First, filter out invalid tracks
      const validTracks = tracks.filter((t): t is Track => {
        const valid = isValidTrack(t);
        if (!valid) {
          console.warn(
            `[useAudioPlayer] ⚠️ Rejecting invalid track:`,
            t && typeof t === "object" && "title" in t
              ? (t as Track).title
              : "any",
          );
        }
        return valid;
      });

      if (validTracks.length === 0) {
        console.warn("[useAudioPlayer] ❌ No valid tracks to add to queue");
        return;
      }

      if (checkDuplicates) {
        // NEW: Check against entire queue (including queue[0] which is current track)
        const duplicates = validTracks.filter((t) =>
          queue.some((q) => q.id === t.id),
        );

        if (duplicates.length > 0 && onDuplicateTrack) {
          duplicates.forEach((dup) => onDuplicateTrack?.(dup));
        }

        // Only add non-duplicate, valid tracks
        const uniqueTracks = validTracks.filter(
          (t) => !queue.some((q) => q.id === t.id),
        );

        console.log("[useAudioPlayer] 🔍 After validation & duplicate check:", {
          original: tracks.length,
          valid: validTracks.length,
          duplicates: duplicates.length,
          uniqueTracks: uniqueTracks.length,
        });

        if (uniqueTracks.length > 0) {
          setQueue((prev) => {
            console.log("[useAudioPlayer] ✅ Adding tracks to queue:", {
              previousSize: prev.length,
              adding: uniqueTracks.length,
              newSize: prev.length + uniqueTracks.length,
            });
            // Append to end of queue (queue[0] stays as current track)
            return [...prev, ...uniqueTracks];
          });
        } else {
          console.log(
            "[useAudioPlayer] ⚠️ No unique valid tracks to add (filtered out)",
          );
        }
      } else {
        console.log(
          "[useAudioPlayer] ➕ Adding valid tracks without duplicate check",
        );
        setQueue((prev) => {
          console.log("[useAudioPlayer] ✅ Queue updated:", {
            previousSize: prev.length,
            adding: validTracks.length,
            newSize: prev.length + validTracks.length,
          });
          return [...prev, ...validTracks];
        });
      }
    },
    [queue, onDuplicateTrack, isValidTrack],
  );

  const addToPlayNext = useCallback(
    (track: Track | Track[]) => {
      const tracks = Array.isArray(track) ? track : [track];

      // NEW: Validate tracks before adding
      const validTracks = tracks.filter((t): t is Track => {
        const valid = isValidTrack(t);
        if (!valid) {
          console.warn(
            `[useAudioPlayer] ⚠️ Rejecting invalid track in addToPlayNext:`,
            t && typeof t === "object" && "title" in t
              ? (t as Track).title
              : "Unknown",
          );
        }
        return valid;
      });

      if (validTracks.length === 0) {
        console.warn("[useAudioPlayer] ❌ No valid tracks to add to play next");
        return;
      }

      // NEW: Insert at position 1 (right after current track at queue[0])
      setQueue((prev) => {
        if (prev.length === 0) {
          return validTracks; // No current track, these become the queue
        }
        const [current, ...rest] = prev;
        return [current!, ...validTracks, ...rest];
      });
    },
    [isValidTrack],
  );

  const removeFromQueue = useCallback((index: number) => {
    // NEW: Prevent removing queue[0] (current track)
    if (index === 0) {
      console.warn(
        "[useAudioPlayer] Cannot remove currently playing track (queue[0])",
      );
      return;
    }
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearQueue = useCallback(() => {
    // NEW: Clear only upcoming tracks (queue[1..n]), keep current track (queue[0])
    setQueue((prev) => (prev.length > 0 ? [prev[0]!] : []));
  }, []);

  const reorderQueue = useCallback((oldIndex: number, newIndex: number) => {
    // NEW: Prevent reordering queue[0] (current track)
    if (oldIndex === 0 || newIndex === 0) {
      console.warn(
        "[useAudioPlayer] Cannot reorder currently playing track (queue[0])",
      );
      return;
    }

    setQueue((prev) => {
      const newQueue = [...prev];
      const [removed] = newQueue.splice(oldIndex, 1);

      if (removed) {
        newQueue.splice(newIndex, 0, removed);
      }

      return newQueue;
    });
  }, []);

  const playFromQueue = useCallback(
    (index: number) => {
      if (index < 0 || index >= queue.length) return null;

      const selectedTrack = queue[index];
      if (!selectedTrack) return null;

      // NEW QUEUE-FIRST APPROACH:
      // Move selected track to position 0
      // All tracks before it (including queue[0]) go to history
      // All tracks after it stay in queue
      const tracksToHistory = queue.slice(0, index); // Everything before selected
      const tracksAfter = queue.slice(index + 1); // Everything after selected

      setHistory((prev) => [...prev, ...tracksToHistory]);
      setQueue([selectedTrack, ...tracksAfter]); // Selected becomes queue[0]

      return selectedTrack;
    },
    [queue],
  );

  const smartShuffle = useCallback(() => {
    setQueue((prev) => {
      if (prev.length <= 1) return prev;

      // NEW: Preserve queue[0] (current track), only shuffle rest
      const [currentTrack, ...rest] = prev;
      if (rest.length === 0) return prev;

      const shuffled = [...rest];
      const artists = new Map<number, Track[]>();

      // Group tracks by artist
      shuffled.forEach((track) => {
        const artistId = track.artist.id;

        if (!artists.has(artistId)) {
          artists.set(artistId, []);
        }

        artists.get(artistId)!.push(track);
      });

      const result: Track[] = [];
      const artistIds = Array.from(artists.keys());

      // Fisher-Yates shuffle for artist order
      for (let i = artistIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [artistIds[i], artistIds[j]] = [artistIds[j]!, artistIds[i]!];
      }

      // Distribute tracks to avoid consecutive same-artist tracks
      let lastArtistId: number | null = null;
      const tempPool = [...shuffled];

      while (tempPool.length > 0) {
        let foundDifferent = false;

        // Try to find a track from a different artist
        for (let i = 0; i < tempPool.length; i++) {
          const track = tempPool[i];

          if (!track) continue;

          if (!lastArtistId || track.artist.id !== lastArtistId) {
            result.push(track);
            lastArtistId = track.artist.id;
            tempPool.splice(i, 1);
            foundDifferent = true;
            break;
          }
        }

        // If all remaining tracks are from the same artist, just add them
        if (!foundDifferent && tempPool.length > 0) {
          const track = tempPool.shift();

          if (track) {
            result.push(track);
            lastArtistId = track.artist.id;
          }
        }
      }

      // Return current track at queue[0] followed by shuffled rest
      return [currentTrack!, ...result];
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => {
      const newShuffleState = !prev;

      if (newShuffleState) {
        // Save original order before shuffling (excluding queue[0])
        const [...rest] = queue;
        setOriginalQueueOrder(rest);
        smartShuffle();
      } else {
        // Restore original order (preserving current queue[0])
        if (originalQueueOrder.length > 0 && queue.length > 0) {
          const [current] = queue;
          setQueue([current!, ...originalQueueOrder]);
          setOriginalQueueOrder([]);
        }
      }

      return newShuffleState;
    });
  }, [queue, originalQueueOrder, smartShuffle]);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === "none") return "all";
      if (prev === "all") return "one";
      return "none";
    });
  }, []);

  const adjustVolume = useCallback((delta: number) => {
    setVolume((prev) => Math.max(0, Math.min(1, prev + delta)));
  }, []);

  const skipForward = useCallback(
    (seconds = 10) => {
      if (!audioRef.current) return;

      seek(Math.min(duration, currentTime + seconds));
    },
    [currentTime, duration, seek],
  );

  const skipBackward = useCallback(
    (seconds = 10) => {
      if (!audioRef.current) return;

      seek(Math.max(0, currentTime - seconds));
    },
    [currentTime, seek],
  );

  // COMMENTED OUT - Smart Queue auto-queue disabled
  // useEffect(() => {
  //   // Auto-queue functionality disabled - users will manually add tracks to queue
  // }, []);

  // NEW: Auto-load track when queue[0] changes
  useEffect(() => {
    // Skip auto-play on initial mount (when restoring from localStorage)
    // This prevents "NotAllowedError" from browser autoplay policy
    // User must explicitly click play or select a song
    if (isInitialMountRef.current) {
      console.log("[useAudioPlayer] 🚫 Skipping auto-play on initial mount (browser autoplay policy)");
      isInitialMountRef.current = false;
      return;
    }

    if (currentTrack && audioRef.current) {
      const streamUrl = getStreamUrlById(currentTrack.id.toString());
      // Only load if the track is different from what's currently loaded
      if (audioRef.current.src !== streamUrl || !audioRef.current.src) {
        console.log(`[useAudioPlayer] 🎶 Loading new track: ${currentTrack.title}`, {
          streamUrl,
          currentSrc: audioRef.current.src,
        });
        loadTrack(currentTrack, streamUrl);
        // Auto-play when user explicitly selects a song
        // Wait a bit for source to be set and connection chain to be ready
        setTimeout(() => {
          play().catch((error) => {
          // Ignore abort errors - these are normal when switching tracks quickly
          if (
            error instanceof DOMException &&
            (error.name === "AbortError" ||
              error.message?.includes("aborted") ||
              error.message?.includes("fetching process"))
          ) {
            console.debug(
              "[useAudioPlayer] Playback aborted (normal during rapid track changes)",
            );
            return;
          }
          console.error("Playback failed:", error);
          });
        }, 150); // Small delay to ensure source is set and connection chain is ready
      }
      // Don't auto-play if track is already loaded - user might have paused it intentionally
      // Auto-play only happens when loading a NEW track (handled above)
    }
  }, [currentTrack, loadTrack, play]); // Don't include isPlaying - we don't want to trigger on pause/play state changes

  // Sync React state with actual audio element state (polling fallback)
  // This ensures UI stays in sync even if events are missed
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (audioRef.current) {
        const actuallyPlaying = !audioRef.current.paused;
        if (actuallyPlaying !== isPlaying) {
          console.log("[useAudioPlayer] 🔄 Syncing state: audio is", actuallyPlaying ? "playing" : "paused", "but state says", isPlaying);
          setIsPlaying(actuallyPlaying);
        }
      }
    }, 500); // Check every 500ms

    return () => clearInterval(syncInterval);
  }, [isPlaying]);

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const clearFailedTrack = useCallback((trackId: number) => {
    failedTracksRef.current.delete(trackId);
  }, []);

  const clearAllFailedTracks = useCallback(() => {
    failedTracksRef.current.clear();
  }, []);

  // NEW: Remove duplicate tracks from queue
  const removeDuplicates = useCallback(() => {
    setQueue((prev) => {
      if (prev.length <= 1) return prev;

      const seen = new Set<number>();
      const deduplicated: Track[] = [];

      for (const track of prev) {
        if (!seen.has(track.id)) {
          seen.add(track.id);
          deduplicated.push(track);
        }
      }

      const removedCount = prev.length - deduplicated.length;
      if (removedCount > 0) {
        console.log(
          `[useAudioPlayer] 🧹 Removed ${removedCount} duplicate track${removedCount === 1 ? "" : "s"} from queue`,
        );
      }

      return deduplicated;
    });
  }, []);

  // NEW: Clean invalid tracks from queue
  const cleanInvalidTracks = useCallback(() => {
    setQueue((prev) => {
      const valid = prev.filter((track) => isValidTrack(track));
      const removedCount = prev.length - valid.length;

      if (removedCount > 0) {
        console.warn(
          `[useAudioPlayer] 🧹 Removed ${removedCount} invalid track${removedCount === 1 ? "" : "s"} from queue`,
        );
      }

      return valid;
    });
  }, [isValidTrack]);

  // NEW: Full queue cleanup (duplicates + invalid tracks)
  const cleanQueue = useCallback(() => {
    setQueue((prev) => {
      if (prev.length === 0) return prev;

      // First, remove invalid tracks
      const valid = prev.filter((track) => isValidTrack(track));

      // Then, remove duplicates
      const seen = new Set<number>();
      const cleaned: Track[] = [];

      for (const track of valid) {
        if (!seen.has(track.id)) {
          seen.add(track.id);
          cleaned.push(track);
        }
      }

      const removedInvalid = prev.length - valid.length;
      const removedDuplicates = valid.length - cleaned.length;
      const totalRemoved = removedInvalid + removedDuplicates;

      if (totalRemoved > 0) {
        console.log(
          `[useAudioPlayer] 🧹 Queue cleaned: removed ${removedInvalid} invalid, ${removedDuplicates} duplicate track${totalRemoved === 1 ? "" : "s"}`,
        );
      }

      return cleaned;
    });
  }, [isValidTrack]);

  // NEW: Clear entire queue and history (for login/logout)
  const clearQueueAndHistory = useCallback(() => {
    console.log(
      "[useAudioPlayer] 🧹 Clearing queue and history (user session change)",
    );
    setQueue([]);
    setHistory([]);
    setOriginalQueueOrder([]);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Wrapper for setVolume with validation to prevent crashes
  const setVolumeWithValidation = useCallback((newVolume: number) => {
    // Clamp volume between 0 and 1 to prevent crashes
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
  }, []);

  // NEW: High-level "play track" function
  // This implements the queue-preserving behavior:
  // - If track is not in queue: INSERT at position 0, keep rest of queue intact
  // - If track is in queue: playFromQueue to move it to position 0
  const playTrack = useCallback(
    (track: Track) => {
      // NEW: Validate track before playing
      if (!isValidTrack(track)) {
        console.error(
          "[useAudioPlayer] ❌ Cannot play invalid track:",
          typeof track === "object" && track && "title" in track
            ? (track as Track).title
            : "Unknown",
        );
        return null;
      }

      const trackIndex = queue.findIndex((t) => t.id === track.id);

      if (trackIndex === -1) {
        // Track not in queue - FIX: INSERT at position 0, preserving the queue
        console.log(
          "[useAudioPlayer] 🎵 Playing new track, inserting at queue position 0, preserving existing queue",
          {
            newTrack: track.title,
            currentQueueSize: queue.length,
          },
        );
        if (queue.length > 0 && currentTrack) {
          // Move current track to history
          setHistory((prev) => [...prev, currentTrack]);
        }
        // FIX: Insert new track at position 0, keep rest of queue
        setQueue([track, ...queue.slice(1)]); // Keep queue[1..n], replace queue[0]
      } else if (trackIndex === 0) {
        // Track is already playing (queue[0]), just restart it
        console.log(
          "[useAudioPlayer] 🔄 Track already playing, restarting from beginning",
        );
        if (audioRef.current) {
          const streamUrl = getStreamUrlById(track.id.toString());
          // Ensure audio source is set and loaded before playing
          if (audioRef.current.src !== streamUrl || !audioRef.current.src) {
            // Source is different or missing, reload the track
            console.log(
              "[useAudioPlayer] Audio source missing or different, reloading track",
              {
                currentSrc: audioRef.current.src,
                expectedSrc: streamUrl,
              },
            );
            loadTrack(track, streamUrl);
          } else {
            // Source is correct, just restart playback
            console.log(
              "[useAudioPlayer] Restarting playback from beginning",
              {
                src: audioRef.current.src,
                currentTime: audioRef.current.currentTime,
                paused: audioRef.current.paused,
                readyState: audioRef.current.readyState,
              },
            );
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((error) => {
              console.error("Playback failed:", error);
              setIsPlaying(false);
              // If play fails, try reloading the track
              console.log(
                "[useAudioPlayer] Play failed, reloading track as fallback",
              );
              loadTrack(track, streamUrl);
            });
          }
        }
      } else {
        // Track is in queue but not at position 0 - use playFromQueue
        console.log(
          "[useAudioPlayer] ⏩ Track found in queue at position",
          trackIndex,
          ", playing from queue",
        );
        playFromQueue(trackIndex);
      }

      return track;
    },
    [queue, currentTrack, playFromQueue, isValidTrack, loadTrack],
  );

  return {
    // State
    currentTrack,
    queue,
    history,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    playbackRate,
    isLoading,
    lastAutoQueueCount,

    // Actions
    loadTrack,
    play,
    pause,
    togglePlay,
    seek,
    playTrack, // NEW: High-level play function with queue management
    playNext: useCallback(() => {
      // NEW: queue[0] is current, queue[1] is next
      if (queue.length < 2) return null; // Need at least 2 tracks (current + next)

      const [currentTrack, nextTrack, ...remainingQueue] = queue;

      // Move current track to history
      setHistory((prev) => [...prev, currentTrack!]);

      // Shift queue: nextTrack becomes queue[0]
      setQueue([nextTrack!, ...remainingQueue]);
      return nextTrack!;
    }, [queue]),
    playPrevious,
    addToQueue,
    addToPlayNext,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    playFromQueue,
    toggleShuffle,
    cycleRepeatMode,
    setVolume: setVolumeWithValidation,
    setIsMuted,
    setPlaybackRate,
    adjustVolume,
    skipForward,
    skipBackward,
    clearFailedTrack,
    clearAllFailedTracks,

    // NEW: Queue safety functions
    removeDuplicates,
    cleanInvalidTracks,
    cleanQueue,
    clearQueueAndHistory,
    isValidTrack,

    // Ref
    audioRef,
  };
}

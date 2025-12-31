// File: src/hooks/useAudioPlayer.ts

"use client";

import { AUDIO_CONSTANTS } from "@/config/constants";
import { STORAGE_KEYS } from "@/config/storage";
import { localStorage } from "@/services/storage";
import type {
  QueuedTrack,
  SmartQueueSettings,
  SmartQueueState,
  Track,
} from "@/types";
import { getStreamUrlById } from "@/utils/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loadPersistedQueueState,
  clearPersistedQueueState,
} from "./useQueuePersistence";

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
  initialQueueState?: {
    queuedTracks: QueuedTrack[];
    smartQueueState: SmartQueueState;
    history: Track[];
    isShuffled: boolean;
    repeatMode: RepeatMode;
  } | null;
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const {
    onTrackChange,
    onTrackEnd,
    onDuplicateTrack,
    onError,
    initialQueueState,
  } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // SPOTIFY-STYLE QUEUE: QueuedTrack with metadata for user vs smart queue
  const [queuedTracks, setQueuedTracks] = useState<QueuedTrack[]>([]);
  const [smartQueueState, setSmartQueueState] = useState<SmartQueueState>({
    isActive: false,
    lastRefreshedAt: null,
    seedTrackId: null,
    trackCount: 0,
  });

  const [history, setHistory] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  // Keep ref in sync with state for event handlers
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
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
  const isPlayPauseOperationRef = useRef(false); // Prevent rapid play/pause loops
  const lastStateSyncRef = useRef<{ time: number; wasPlaying: boolean } | null>(
    null,
  ); // Track state sync to prevent loops
  const isPlayingRef = useRef(isPlaying); // Track current playing state for event handlers

  // Derived state: queue is extracted from queuedTracks for backward compatibility
  const queue = useMemo(
    () => queuedTracks.map((qt) => qt.track),
    [queuedTracks],
  );
  const currentTrack = queue[0] ?? null;

  // Helper functions for queue management
  const generateQueueId = useCallback(() => {
    return `queue-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  const createQueuedTrack = useCallback(
    (track: Track, source: "user" | "smart"): QueuedTrack => {
      return {
        track,
        queueSource: source,
        addedAt: new Date(),
        queueId: generateQueueId(),
      };
    },
    [generateQueueId],
  );

  const getQueueSections = useCallback(() => {
    const userTracks: QueuedTrack[] = [];
    const smartTracks: QueuedTrack[] = [];

    // Skip queue[0] (current track) when splitting sections
    queuedTracks.slice(1).forEach((qt) => {
      if (qt.queueSource === "smart") {
        smartTracks.push(qt);
      } else {
        userTracks.push(qt);
      }
    });

    return { userTracks, smartTracks };
  }, [queuedTracks]);

  // Load persisted settings and queue state
  useEffect(() => {
    const savedVolume = localStorage.getOrDefault(STORAGE_KEYS.VOLUME, 0.7);
    const savedRate = localStorage.getOrDefault(STORAGE_KEYS.PLAYBACK_RATE, 1);

    setVolume(savedVolume);
    setPlaybackRate(savedRate);

    // Priority: initialQueueState (from database) > localStorage
    if (initialQueueState && initialQueueState.queuedTracks.length > 0) {
      console.log("[useAudioPlayer] 📥 Restoring queue state from database");
      setQueuedTracks(initialQueueState.queuedTracks);
      setSmartQueueState(initialQueueState.smartQueueState);
      setHistory(initialQueueState.history);
      setIsShuffled(initialQueueState.isShuffled);
      setRepeatMode(initialQueueState.repeatMode);
      return; // Don't load from localStorage if we have database state
    }

    // Load persisted queue state from localStorage (for non-logged-in users)
    const persistedState = loadPersistedQueueState();
    if (persistedState) {
      // Check if queue was intentionally cleared (empty or only has current track)
      // If queue is empty, don't restore it (it was intentionally cleared)

      // Type guard for V2 format
      interface PersistedStateV2 {
        version: 2;
        queuedTracks: QueuedTrack[];
        smartQueueState?: SmartQueueState;
        history: Track[];
        isShuffled: boolean;
        repeatMode: RepeatMode;
        currentTime: number;
      }

      const isV2State = (state: unknown): state is PersistedStateV2 => {
        return (
          typeof state === "object" &&
          state !== null &&
          "queuedTracks" in state &&
          Array.isArray(state.queuedTracks)
        );
      };

      const hasQueuedTracks =
        isV2State(persistedState) && persistedState.queuedTracks.length > 0;
      const hasLegacyQueue =
        "queue" in persistedState &&
        Array.isArray(persistedState.queue) &&
        persistedState.queue.length > 0;

      // Only restore if there are tracks to restore
      if (hasQueuedTracks || hasLegacyQueue) {
        // Persistence migration will be handled in useQueuePersistence.ts
        // For now, check if we have queuedTracks (V2) or queue (V1)
        if (isV2State(persistedState)) {
          setQueuedTracks(persistedState.queuedTracks);
          if (persistedState.smartQueueState) {
            setSmartQueueState(persistedState.smartQueueState);
          }
        } else if ("queue" in persistedState && persistedState.queue) {
          // Migrate old V1 format: convert Track[] to QueuedTrack[]
          const migratedTracks = persistedState.queue.map((track, idx) => ({
            track,
            queueSource: "user" as const,
            addedAt: new Date(),
            queueId: `migrated-${track.id}-${idx}`,
          }));
          setQueuedTracks(migratedTracks);
        }
        setHistory(persistedState.history);
        setIsShuffled(persistedState.isShuffled);
        setRepeatMode(persistedState.repeatMode);
        // Don't auto-restore currentTime to avoid unexpected jumps
      } else {
        // Queue was empty (intentionally cleared), don't restore
        console.log(
          "[useAudioPlayer] Queue was cleared, not restoring from persistence",
        );
      }
    }
  }, [initialQueueState]);

  // Persist volume
  useEffect(() => {
    localStorage.set(STORAGE_KEYS.VOLUME, volume);
  }, [volume]);

  // Persist playback rate
  useEffect(() => {
    localStorage.set(STORAGE_KEYS.PLAYBACK_RATE, playbackRate);
  }, [playbackRate]);

  // Persist queue state (V2 format)
  useEffect(() => {
    const queueState = {
      version: 2 as const,
      queuedTracks,
      smartQueueState,
      history,
      currentTime,
      isShuffled,
      repeatMode,
    };
    localStorage.set(STORAGE_KEYS.QUEUE_STATE, queueState);
  }, [
    queuedTracks,
    smartQueueState,
    history,
    currentTime,
    isShuffled,
    repeatMode,
  ]);

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
      console.log(
        "[useAudioPlayer] 🔄 Restoring audio source from localStorage (no autoplay)",
      );
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

    // QUEUE-FIRST APPROACH with QueuedTrack:
    // queuedTracks[0] is current track, queuedTracks[1..n] are upcoming
    if (queuedTracks.length > 1) {
      // Move current track (queuedTracks[0]) to history and advance queue
      setHistory((prev) => [...prev, currentTrack]);
      setQueuedTracks((prev) => prev.slice(1)); // Remove queuedTracks[0], queuedTracks[1] becomes new queuedTracks[0]
    } else if (repeatMode === "all") {
      // Restart the queue with all played tracks (history + current track)
      if (history.length > 0) {
        const allTracks = [...history, currentTrack];
        const newQueuedTracks = allTracks.map((track, idx) => ({
          track,
          queueSource: "user" as const,
          addedAt: new Date(),
          queueId: `repeat-${track.id}-${idx}`,
        }));
        setQueuedTracks(newQueuedTracks);
        setHistory([]);
      }
    } else {
      // No more tracks in queue, playback ends
      onTrackEnd?.(currentTrack);
      // Clear the queue since playback is complete
      setQueuedTracks([]);
      setIsPlaying(false);
      console.log("[useAudioPlayer] 🏁 Playback ended, queue cleared");
    }
  }, [currentTrack, queuedTracks, repeatMode, history, onTrackEnd]);

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

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const newTime = audio.currentTime;
      // Log every 5 seconds to help diagnose if time is progressing
      if (
        Math.floor(newTime) % 5 === 0 &&
        Math.floor(newTime) !== Math.floor(currentTime)
      ) {
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
    const handlePlay = () => {
      // Guard: Only update if state is actually different and we're not in a play/pause operation
      // Use ref to get current state value (avoids stale closure issues)
      if (!isPlayPauseOperationRef.current && !isPlayingRef.current) {
        setIsPlaying(true);
      }
    };
    const handlePause = () => {
      // Guard: Only update if state is actually different and we're not in a play/pause operation
      // Use ref to get current state value (avoids stale closure issues)
      if (!isPlayPauseOperationRef.current && isPlayingRef.current) {
        setIsPlaying(false);
      }
    };
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
  }, [handleTrackEnd, currentTrack, onError, currentTime]);

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
      console.warn(
        "[useAudioPlayer] play() called but audioRef.current is null",
      );
      return;
    }

    // Guard: Prevent rapid play/pause loops
    if (isPlayPauseOperationRef.current) {
      console.debug(
        "[useAudioPlayer] Play operation already in progress, skipping",
      );
      return;
    }

    isPlayPauseOperationRef.current = true;

    try {
      console.log("[useAudioPlayer] Attempting to play audio", {
        src: audioRef.current.src,
        readyState: audioRef.current.readyState,
        paused: audioRef.current.paused,
        currentTime: audioRef.current.currentTime,
      });

      // If audio element is connected to Web Audio API, ensure context is resumed
      // Check if there's a connection via the audio context manager
      const { getAudioConnection, ensureConnectionChain } =
        await import("@/utils/audioContextManager");
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
        console.log(
          "[useAudioPlayer] Audio not connected to Web Audio API (normal playback)",
        );
      }

      // Ensure source is loaded
      if (!audioRef.current.src) {
        console.warn("[useAudioPlayer] No audio source set, cannot play");
        setIsPlaying(false);
        return;
      }

      // Check if audio is ready to play
      if (audioRef.current.readyState < 2) {
        console.log(
          "[useAudioPlayer] Audio not ready, waiting for canplay event",
        );
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

          audioRef.current?.addEventListener("canplay", handleCanPlay, {
            once: true,
          });
          audioRef.current?.addEventListener("error", handleError, {
            once: true,
          });
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
        console.log(
          "[useAudioPlayer] Verifying connection chain after play...",
        );
        const { verifyConnectionChain } =
          await import("@/utils/audioContextManager");
        const isValid = verifyConnectionChain(connection);
        if (!isValid) {
          console.warn(
            "[useAudioPlayer] Connection chain invalid, rebuilding...",
          );
          const { ensureConnectionChain } =
            await import("@/utils/audioContextManager");
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
        audioState: audioRef.current
          ? {
              src: audioRef.current.src,
              paused: audioRef.current.paused,
              readyState: audioRef.current.readyState,
              currentTime: audioRef.current.currentTime,
            }
          : "no audio element",
      });
      setIsPlaying(false);
    } finally {
      // Reset the guard after a short delay to allow state to settle
      setTimeout(() => {
        isPlayPauseOperationRef.current = false;
      }, 100);
    }
  }, []);

  const pause = useCallback(() => {
    if (!audioRef.current) {
      console.warn(
        "[useAudioPlayer] Cannot pause: audio element not initialized",
      );
      setIsPlaying(false);
      return;
    }

    // Guard: Prevent rapid play/pause loops
    if (isPlayPauseOperationRef.current) {
      console.debug(
        "[useAudioPlayer] Pause operation already in progress, skipping",
      );
      return;
    }

    isPlayPauseOperationRef.current = true;

    try {
      audioRef.current.pause();
      // Note: setIsPlaying(false) will be called by the 'pause' event listener
      // But we also set it here as a backup in case the event doesn't fire
      setIsPlaying(false);
    } catch (error) {
      console.error("[useAudioPlayer] Error pausing audio:", error);
      setIsPlaying(false);
    } finally {
      // Reset the guard after a short delay to allow state to settle
      setTimeout(() => {
        isPlayPauseOperationRef.current = false;
      }, 100);
    }
  }, []);

  // Media Session action handlers for background controls
  // Moved here after play/pause are defined to avoid "cannot access before initialization" error
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;

    const togglePlayPause = () => {
      if (audioRef.current && !isPlayPauseOperationRef.current) {
        // Use actual audio element state for media session controls too
        const isActuallyPlaying = !audioRef.current.paused;
        if (isActuallyPlaying) {
          pause();
        } else {
          play().catch((error) => {
            console.error("Playback failed:", error);
          });
        }
      }
    };

    const handleNextTrack = () => {
      // NEW: queue[0] is current, queue[1] is next
      if (queue.length > 1) {
        setHistory((prev) => [...prev, currentTrack!]);
        setQueuedTracks((prev) => prev.slice(1));
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
          setQueuedTracks((prev) => [
            createQueuedTrack(prevTrack, "user"),
            ...prev,
          ]); // Insert prevTrack at queue[0]
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
  }, [currentTrack, queue, history, isPlaying, play, pause, createQueuedTrack]);

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

    // Validate that time is a finite number
    if (!isFinite(time)) {
      console.error(`[useAudioPlayer] ❌ Invalid seek time: ${time}`);
      return;
    }

    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const playPrevious = useCallback(() => {
    if (history.length === 0) return null;

    const previousTracks = [...history];
    const prevTrack = previousTracks.pop()!;
    setHistory(previousTracks);

    // NEW: Insert prevTrack at queue[0], keeping rest of queue intact
    setQueuedTracks((prev) => [createQueuedTrack(prevTrack, "user"), ...prev]);

    return prevTrack;
  }, [history, createQueuedTrack]);

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
        currentQueueSize: queuedTracks.length,
        tracks: tracks.map((t) => `${t.title} - ${t.artist.name}`),
      });

      // Filter out invalid tracks
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
        // Check against entire queue (including queuedTracks[0] which is current track)
        const duplicates = validTracks.filter((t) =>
          queuedTracks.some((qt) => qt.track.id === t.id),
        );

        if (duplicates.length > 0 && onDuplicateTrack) {
          duplicates.forEach((dup) => onDuplicateTrack?.(dup));
        }

        // Only add non-duplicate, valid tracks
        const uniqueTracks = validTracks.filter(
          (t) => !queuedTracks.some((qt) => qt.track.id === t.id),
        );

        console.log("[useAudioPlayer] 🔍 After validation & duplicate check:", {
          original: tracks.length,
          valid: validTracks.length,
          duplicates: duplicates.length,
          uniqueTracks: uniqueTracks.length,
        });

        if (uniqueTracks.length > 0) {
          const newQueuedTracks = uniqueTracks.map((t) =>
            createQueuedTrack(t, "user"),
          );
          setQueuedTracks((prev) => {
            console.log("[useAudioPlayer] ✅ Adding tracks to queue:", {
              previousSize: prev.length,
              adding: newQueuedTracks.length,
              newSize: prev.length + newQueuedTracks.length,
            });
            // Append to end of queue (queuedTracks[0] stays as current track)
            return [...prev, ...newQueuedTracks];
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
        const newQueuedTracks = validTracks.map((t) =>
          createQueuedTrack(t, "user"),
        );
        setQueuedTracks((prev) => {
          console.log("[useAudioPlayer] ✅ Queue updated:", {
            previousSize: prev.length,
            adding: newQueuedTracks.length,
            newSize: prev.length + newQueuedTracks.length,
          });
          return [...prev, ...newQueuedTracks];
        });
      }
    },
    [queuedTracks, createQueuedTrack, onDuplicateTrack, isValidTrack],
  );

  const addToPlayNext = useCallback(
    (track: Track | Track[]) => {
      const tracks = Array.isArray(track) ? track : [track];

      // Validate tracks before adding
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

      // Insert at position 1 (right after current track at queuedTracks[0])
      const newQueuedTracks = validTracks.map((t) =>
        createQueuedTrack(t, "user"),
      );
      setQueuedTracks((prev) => {
        if (prev.length === 0) {
          return newQueuedTracks; // No current track, these become the queue
        }
        const [current, ...rest] = prev;
        return [current!, ...newQueuedTracks, ...rest];
      });
    },
    [createQueuedTrack, isValidTrack],
  );

  const removeFromQueue = useCallback((index: number) => {
    console.log("[useAudioPlayer] removeFromQueue called", {
      index,
      isCurrentTrack: index === 0,
    });

    // Prevent removing queuedTracks[0] (current track)
    if (index === 0) {
      console.warn(
        "[useAudioPlayer] Cannot remove currently playing track (queuedTracks[0])",
      );
      return;
    }

    setQueuedTracks((prev) => {
      const newQueue = prev.filter((_, i) => i !== index);
      console.log("[useAudioPlayer] Queue updated after removal", {
        previousLength: prev.length,
        newLength: newQueue.length,
        removedIndex: index,
      });
      return newQueue;
    });
  }, []);

  const clearQueue = useCallback(() => {
    // Clear only upcoming tracks (queuedTracks[1..n]), keep current track (queuedTracks[0])
    const newQueue = queuedTracks.length > 0 ? [queuedTracks[0]!] : [];
    setQueuedTracks(newQueue);

    // If queue is now empty (no current track), clear persisted state
    // Otherwise, persist will happen automatically via the useEffect
    if (newQueue.length === 0) {
      clearPersistedQueueState();
    }
  }, [queuedTracks]);

  const reorderQueue = useCallback((oldIndex: number, newIndex: number) => {
    // Prevent reordering queuedTracks[0] (current track)
    if (oldIndex === 0 || newIndex === 0) {
      console.warn(
        "[useAudioPlayer] Cannot reorder currently playing track (queuedTracks[0])",
      );
      return;
    }

    setQueuedTracks((prev) => {
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
      setQueuedTracks([
        createQueuedTrack(selectedTrack, "user"),
        ...tracksAfter.map((t) => createQueuedTrack(t, "user")),
      ]); // Selected becomes queue[0]

      return selectedTrack;
    },
    [queue, createQueuedTrack],
  );

  const smartShuffle = useCallback(() => {
    setQueuedTracks((prev) => {
      if (prev.length <= 1) return prev;

      // NEW: Preserve queue[0] (current track), only shuffle rest
      const [currentQueuedTrack, ...rest] = prev;
      if (rest.length === 0) return prev;

      const shuffled = rest.map((qt) => qt.track);
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
      return [
        currentQueuedTrack!,
        ...result.map((t) => createQueuedTrack(t, "user")),
      ];
    });
  }, [createQueuedTrack]);

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
          setQueuedTracks([
            createQueuedTrack(current!, "user"),
            ...originalQueueOrder.map((t) => createQueuedTrack(t, "user")),
          ]);
          setOriginalQueueOrder([]);
        }
      }

      return newShuffleState;
    });
  }, [queue, originalQueueOrder, smartShuffle, createQueuedTrack]);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === "none") return "all";
      if (prev === "all") return "one";
      return "none";
    });
  }, []);

  // Smart Queue Operations
  const addSmartTracks = useCallback(
    async (count = 5): Promise<Track[]> => {
      const currentQueuedTrack = queuedTracks[0];
      if (!currentQueuedTrack) {
        console.warn(
          "[useAudioPlayer] ⚠️ Cannot add smart tracks: no current track",
        );
        return [];
      }

      const seedTrack = currentQueuedTrack.track;
      console.log(
        "[useAudioPlayer] 🎵 Adding smart tracks based on:",
        seedTrack.title,
      );

      try {
        // Call the smart queue service (will be wired up in AudioPlayerContext)
        if (options.onAutoQueueTrigger) {
          const recommendedTracks = await options.onAutoQueueTrigger(
            seedTrack,
            queuedTracks.length,
          );
          const tracksToAdd = recommendedTracks.slice(0, count);

          if (tracksToAdd.length > 0) {
            const smartQueuedTracks = tracksToAdd.map((t) =>
              createQueuedTrack(t, "smart"),
            );
            setQueuedTracks((prev) => [...prev, ...smartQueuedTracks]);
            setSmartQueueState({
              isActive: true,
              lastRefreshedAt: new Date(),
              seedTrackId: seedTrack.id,
              trackCount: tracksToAdd.length,
            });
            console.log(
              `[useAudioPlayer] ✅ Added ${tracksToAdd.length} smart tracks to queue`,
            );
            return tracksToAdd;
          }
        }
        return [];
      } catch (error) {
        console.error("[useAudioPlayer] ❌ Failed to add smart tracks:", error);
        return [];
      }
    },
    [queuedTracks, createQueuedTrack, options],
  );

  const refreshSmartTracks = useCallback(async (): Promise<void> => {
    console.log("[useAudioPlayer] 🔄 Refreshing smart tracks");
    // Remove all current smart tracks
    setQueuedTracks((prev) => prev.filter((qt) => qt.queueSource !== "smart"));
    // Add new smart tracks
    await addSmartTracks();
  }, [addSmartTracks]);

  const clearSmartTracks = useCallback(() => {
    console.log("[useAudioPlayer] 🧹 Clearing smart tracks");
    setQueuedTracks((prev) => prev.filter((qt) => qt.queueSource !== "smart"));
    setSmartQueueState({
      isActive: false,
      lastRefreshedAt: null,
      seedTrackId: null,
      trackCount: 0,
    });
  }, []);

  const adjustVolume = useCallback((delta: number) => {
    setVolume((prev) => Math.max(0, Math.min(1, prev + delta)));
  }, []);

  const skipForward = useCallback(
    (seconds = 10) => {
      if (!audioRef.current) return;

      // Validate seconds parameter
      const validSeconds = isFinite(seconds) ? seconds : 10;

      // Read actual time from audio element, not potentially stale state
      const currentTime = audioRef.current.currentTime;
      const duration = audioRef.current.duration;

      // Validate that duration and currentTime are finite
      if (!isFinite(currentTime) || !isFinite(duration)) {
        console.warn(
          `[useAudioPlayer] ⚠️ Skip forward failed: audio not ready (currentTime: ${currentTime}, duration: ${duration})`,
        );
        return;
      }

      const newTime = Math.min(duration, currentTime + validSeconds);

      // Final validation before seeking
      if (!isFinite(newTime)) {
        console.error(
          `[useAudioPlayer] ❌ Skip forward calculated invalid time: ${newTime} (currentTime: ${currentTime}, duration: ${duration}, seconds: ${validSeconds})`,
        );
        return;
      }

      console.log(
        `[useAudioPlayer] ⏩ Skip forward ${validSeconds}s: ${currentTime.toFixed(1)}s → ${newTime.toFixed(1)}s`,
      );
      seek(newTime);
    },
    [seek],
  );

  const skipBackward = useCallback(
    (seconds = 10) => {
      if (!audioRef.current) return;

      // Validate seconds parameter
      const validSeconds = isFinite(seconds) ? seconds : 10;

      // Read actual time from audio element, not potentially stale state
      const currentTime = audioRef.current.currentTime;

      // Validate that currentTime is finite
      if (!isFinite(currentTime)) {
        console.warn(
          `[useAudioPlayer] ⚠️ Skip backward failed: audio not ready (currentTime: ${currentTime})`,
        );
        return;
      }

      const newTime = Math.max(0, currentTime - validSeconds);

      // Final validation before seeking
      if (!isFinite(newTime)) {
        console.error(
          `[useAudioPlayer] ❌ Skip backward calculated invalid time: ${newTime} (currentTime: ${currentTime}, seconds: ${validSeconds})`,
        );
        return;
      }

      console.log(
        `[useAudioPlayer] ⏪ Skip backward ${validSeconds}s: ${currentTime.toFixed(1)}s → ${newTime.toFixed(1)}s`,
      );
      seek(newTime);
    },
    [seek],
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
      console.log(
        "[useAudioPlayer] 🚫 Skipping auto-play on initial mount (browser autoplay policy)",
      );
      isInitialMountRef.current = false;
      return;
    }

    if (currentTrack && audioRef.current) {
      const streamUrl = getStreamUrlById(currentTrack.id.toString());
      // Only load if the track is different from what's currently loaded
      if (audioRef.current.src !== streamUrl || !audioRef.current.src) {
        console.log(
          `[useAudioPlayer] 🎶 Loading new track: ${currentTrack.title}`,
          {
            streamUrl,
            currentSrc: audioRef.current.src,
          },
        );
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
  // Added guards to prevent feedback loops that cause rapid pause/unpause
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (audioRef.current && !isPlayPauseOperationRef.current) {
        const actuallyPlaying = !audioRef.current.paused;

        // Only sync if there's a real mismatch and we haven't just synced this state
        if (actuallyPlaying !== isPlaying) {
          const now = Date.now();
          const lastSync = lastStateSyncRef.current;

          // Prevent rapid syncs: only sync if it's been at least 200ms since last sync
          // or if the state has been consistently different
          const shouldSync =
            !lastSync ||
            now - lastSync.time > 200 ||
            lastSync.wasPlaying !== actuallyPlaying;

          if (shouldSync) {
            console.log(
              "[useAudioPlayer] 🔄 Syncing state: audio is",
              actuallyPlaying ? "playing" : "paused",
              "but state says",
              isPlaying,
            );
            setIsPlaying(actuallyPlaying);
            lastStateSyncRef.current = {
              time: now,
              wasPlaying: actuallyPlaying,
            };
          }
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
    setQueuedTracks((prev) => {
      if (prev.length <= 1) return prev;

      const seen = new Set<number>();
      const deduplicated: QueuedTrack[] = [];

      for (const qt of prev) {
        if (!seen.has(qt.track.id)) {
          seen.add(qt.track.id);
          deduplicated.push(qt);
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
    setQueuedTracks((prev) => {
      const valid = prev.filter((qt) => isValidTrack(qt.track));
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
    setQueuedTracks((prev) => {
      if (prev.length === 0) return prev;

      // First, remove invalid tracks
      const valid = prev.filter((qt) => isValidTrack(qt.track));

      // Then, remove duplicates
      const seen = new Set<number>();
      const cleaned: QueuedTrack[] = [];

      for (const qt of valid) {
        if (!seen.has(qt.track.id)) {
          seen.add(qt.track.id);
          cleaned.push(qt);
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
    setQueuedTracks([]);
    setHistory([]);
    setOriginalQueueOrder([]);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Clear persisted state immediately to prevent restoration on tab switch
    clearPersistedQueueState();
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
        setQueuedTracks((prev) => [
          createQueuedTrack(track, "user"),
          ...prev.slice(1),
        ]); // Keep queue[1..n], replace queue[0]
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
            console.log("[useAudioPlayer] Restarting playback from beginning", {
              src: audioRef.current.src,
              currentTime: audioRef.current.currentTime,
              paused: audioRef.current.paused,
              readyState: audioRef.current.readyState,
            });
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
    [queue, currentTrack, playFromQueue, isValidTrack, loadTrack, createQueuedTrack],
  );

  return {
    // State
    currentTrack,
    queue,
    queuedTracks,
    smartQueueState,
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
      setQueuedTracks((prev) => prev.slice(1));
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

    // Smart Queue Operations
    addSmartTracks,
    refreshSmartTracks,
    clearSmartTracks,
    getQueueSections,

    // Ref
    audioRef,
  };
}

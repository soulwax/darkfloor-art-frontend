// File: src/components/PersistentPlayer.tsx

"use client";

import { STORAGE_KEYS } from "@/config/storage";
import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useMobilePanes } from "@/contexts/MobilePanesContext";
import { useEqualizer } from "@/hooks/useEqualizer";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { api } from "@/trpc/react";
// import { extractColorsFromImage, type ColorPalette } from "@/utils/colorExtractor";
// import { getCoverImage } from "@/utils/images";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useAudioReactiveBackground } from "@/hooks/useAudioReactiveBackground";
import { LightweightParticleBackground } from "./LightweightParticleBackground";
import { KaleidoscopeBackground } from "./KaleidoscopeBackground";
import MaturePlayer from "./Player";

const Equalizer = dynamic(
  () => import("./Equalizer").then((mod) => mod.Equalizer),
  { ssr: false },
);

const EnhancedQueue = dynamic(
  () => import("./EnhancedQueue").then((mod) => mod.EnhancedQueue),
  { ssr: false },
);

export default function PersistentPlayer() {
  const player = useGlobalPlayer();
  const isMobile = useIsMobile();
  const { navigateToPane } = useMobilePanes();

  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  // Fetch user preferences for visualizer settings and panel visibility
  const { data: preferences } = api.music.getUserPreferences.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    },
  );

  // Mutation to update preferences
  const updatePreferences = api.music.updatePreferences.useMutation();

  // Initialize equalizer hook (persists across panel open/close)
  const equalizer = useEqualizer(player.audioElement);

  // Initialize state from database preferences, with fallback to false
  const [showQueue, setShowQueue] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [visualizerEnabled, setVisualizerEnabled] = useState(true);
  const [visualizerEnsureToken, setVisualizerEnsureToken] = useState(0);

  // Sync state with database preferences when they load
  useEffect(() => {
    if (preferences) {
      setShowQueue(preferences.queuePanelOpen ?? false);
      setShowEqualizer(preferences.equalizerPanelOpen ?? false);
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
  }, [isAuthenticated]); // Only run when auth status changes or on mount

  // Audio-reactive background effects (only when visualizer enabled)
  useAudioReactiveBackground(
    player.audioElement,
    player.isPlaying,
    visualizerEnabled,
  );

  // Extract colors from album art when track changes - DISABLED (visualizer is disabled)
  // useEffect(() => {
  //   if (player.currentTrack) {
  //     const coverUrl = getCoverImage(player.currentTrack, "medium");
  //     extractColorsFromImage(coverUrl)
  //       .then(setAlbumColorPalette)
  //       .catch((error) => {
  //         console.error("Failed to extract colors from album art:", error);
  //         setAlbumColorPalette(null);
  //       });
  //   } else {
  //     setAlbumColorPalette(null);
  //   }
  // }, [player.currentTrack]);

  // Persist queue panel state to database
  useEffect(() => {
    if (
      isAuthenticated &&
      preferences &&
      showQueue !== preferences.queuePanelOpen
    ) {
      updatePreferences.mutate({ queuePanelOpen: showQueue });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQueue]);

  // Persist equalizer panel state to database
  useEffect(() => {
    if (
      isAuthenticated &&
      preferences &&
      showEqualizer !== preferences.equalizerPanelOpen
    ) {
      updatePreferences.mutate({ equalizerPanelOpen: showEqualizer });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEqualizer]);

  const persistVisualizerPreference = useCallback(
    (next: boolean) => {
      setVisualizerEnabled(next);
      if (isAuthenticated) {
        updatePreferences.mutate({ visualizerEnabled: next });
      } else if (typeof window !== "undefined") {
        window.localStorage.setItem(
          STORAGE_KEYS.VISUALIZER_ENABLED,
          JSON.stringify(next),
        );
      }
    },
    [isAuthenticated, updatePreferences],
  );

  const handleVisualizerToggle = useCallback(() => {
    const next = !visualizerEnabled;
    persistVisualizerPreference(next);
    // Visualizer is disabled - token setting removed
    // if (next) {
    //   setVisualizerEnsureToken(Date.now());
    // }
  }, [persistVisualizerPreference, visualizerEnabled]);

  const playerProps = {
    currentTrack: player.currentTrack,
    queue: player.queue,
    isPlaying: player.isPlaying,
    currentTime: player.currentTime,
    duration: player.duration,
    volume: player.volume,
    isMuted: player.isMuted,
    isShuffled: player.isShuffled,
    repeatMode: player.repeatMode,
    playbackRate: player.playbackRate,
    isLoading: player.isLoading,
    onPlayPause: player.togglePlay,
    onNext: player.playNext,
    onPrevious: player.playPrevious,
    onSeek: player.seek,
    onVolumeChange: player.setVolume,
    onToggleMute: () => player.setIsMuted(!player.isMuted),
    onToggleShuffle: player.toggleShuffle,
    onCycleRepeat: player.cycleRepeatMode,
    onPlaybackRateChange: player.setPlaybackRate,
    onSkipForward: player.skipForward,
    onSkipBackward: player.skipBackward,
    onToggleQueue:
      isMobile && navigateToPane
        ? () => navigateToPane(1) // Navigate to queue pane on mobile
        : () => setShowQueue(!showQueue),
    onToggleEqualizer: () => setShowEqualizer(!showEqualizer),
    onToggleVisualizer: !isMobile ? handleVisualizerToggle : undefined,
    visualizerEnabled,
  };

  return (
    <>
      {/* Desktop Player - Always render on desktop, hidden on mobile */}
      {!isMobile && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-50">
            <div className="player-backdrop">
              <div className="player-backdrop-inner">
                <MaturePlayer {...playerProps} />
              </div>
            </div>
          </div>

          {/* Enhanced Queue Panel - Desktop only */}
          {showQueue && (
            <EnhancedQueue
              queue={player.queue}
              currentTrack={player.currentTrack}
              onClose={() => setShowQueue(false)}
              onRemove={player.removeFromQueue}
              onClear={player.clearQueue}
              onReorder={player.reorderQueue}
              onPlayFrom={player.playFromQueue}
              onSaveAsPlaylist={player.saveQueueAsPlaylist}
              onAddSimilarTracks={
                player.addSimilarTracks ??
                (() => {
                  /* No similar tracks available */
                })
              }
              onGenerateSmartMix={
                player.generateSmartMix ??
                (() => {
                  /* Smart mix not available */
                })
              }
              isAutoQueueing={player.isAutoQueueing ?? false}
            />
          )}
        </>
      )}

      {/* Mobile Player - Handled by MobileSwipeablePanes, nothing to render here */}

      {/* Equalizer Panel */}
      {showEqualizer && (
        <Equalizer
          equalizer={equalizer}
          onClose={() => setShowEqualizer(false)}
        />
      )}

      {/* Fullscreen Kaleidoscope Background */}
      {player.audioElement && player.currentTrack && visualizerEnabled && (
        <KaleidoscopeBackground
          audioElement={player.audioElement}
          isPlaying={player.isPlaying}
        />
      )}

      {/* Lightweight particle background when visualizer is disabled */}
      {!visualizerEnabled && <LightweightParticleBackground />}
    </>
  );
}

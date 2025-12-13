// File: src/components/EnhancedTrackCard.tsx

import { useToast } from "@/contexts/ToastContext";
import { useWebShare } from "@/hooks/useWebShare";
import { api } from "@/trpc/react";
import type { Track, PlaylistWithTracks } from "@/types";
import { hapticLight, hapticSuccess } from "@/utils/haptics";
import { getCoverImage } from "@/utils/images";
import { formatDuration } from "@/utils/time";
import Image from "next/image";
import { useState } from "react";

export interface EnhancedTrackCardProps {
  track: Track;
  onPlay: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  showActions?: boolean;
}

export default function EnhancedTrackCard({
  track,
  onPlay,
  onAddToQueue,
  showActions = true,
}: EnhancedTrackCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const utils = api.useUtils();
  const { showToast } = useToast();
  const { share, isSupported: isShareSupported } = useWebShare();

  const { data: favoriteData } = api.music.isFavorite.useQuery(
    { trackId: track.id },
    { enabled: showActions },
  );

  const addFavorite = api.music.addFavorite.useMutation({
    onSuccess: async () => {
      await utils.music.isFavorite.invalidate({ trackId: track.id });
      await utils.music.getFavorites.invalidate();
      showToast(`Added "${track.title}" to favorites`, "success");
    },
    onError: (error) => {
      showToast(`Failed to add to favorites: ${error.message}`, "error");
    },
  });

  const removeFavorite = api.music.removeFavorite.useMutation({
    onSuccess: async () => {
      await utils.music.isFavorite.invalidate({ trackId: track.id });
      await utils.music.getFavorites.invalidate();
      showToast(`Removed "${track.title}" from favorites`, "info");
    },
    onError: (error) => {
      showToast(`Failed to remove from favorites: ${error.message}`, "error");
    },
  });

  const { data: playlists } = api.music.getPlaylists.useQuery(undefined, {
    enabled: showMenu && showActions,
  });

  const addToPlaylist = api.music.addToPlaylist.useMutation({
    onSuccess: async (_, variables) => {
      await utils.music.getPlaylists.invalidate();
      const playlistName =
        playlists?.find(
          (p: PlaylistWithTracks) => p.id === variables.playlistId,
        )?.name ?? "playlist";
      showToast(`Added "${track.title}" to ${playlistName}`, "success");
      setShowMenu(false);
    },
    onError: (error) => {
      showToast(`Failed to add to playlist: ${error.message}`, "error");
    },
  });

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Trigger haptic feedback
    if (favoriteData?.isFavorite) {
      hapticLight();
    } else {
      hapticSuccess();
    }

    // Trigger heart animation
    setIsHeartAnimating(true);
    setTimeout(() => setIsHeartAnimating(false), 600);

    if (favoriteData?.isFavorite) {
      removeFavorite.mutate({ trackId: track.id });
    } else {
      addFavorite.mutate({ track });
    }
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticLight();
    onAddToQueue(track);
    showToast(`Added "${track.title}" to queue`, "success");
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticLight();

    const success = await share({
      title: `${track.title} - ${track.artist.name}`,
      text: `Check out "${track.title}" by ${track.artist.name} on Starchild Music!`,
      url: window.location.href,
    });

    if (success) {
      showToast("Track shared successfully!", "success");
    }
  };

  const handleAddToPlaylist = (playlistId: number) => {
    hapticLight();
    addToPlaylist.mutate({ playlistId, track });
  };

  const handlePlay = () => {
    hapticLight();
    onPlay(track);
  };

  const coverImage = getCoverImage(track);

  return (
    <div className="card group relative flex items-center gap-4 !overflow-visible p-4 transition-all duration-200 hover:scale-[1.015] hover:shadow-lg md:gap-5 md:p-5">
      <div className="relative flex-shrink-0">
        <Image
          src={coverImage}
          alt={track.title}
          width={96}
          height={96}
          className="h-20 w-20 rounded-xl shadow-md ring-2 ring-white/5 transition-all group-hover:ring-[var(--color-accent)]/30 md:h-20 md:w-20"
          loading="lazy"
          quality={75}
        />
        <button
          onClick={handlePlay}
          className="touch-active absolute inset-0 flex items-center justify-center rounded-lg bg-black/70 opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 md:opacity-0"
        >
          <svg
            className="h-10 w-10 text-white drop-shadow-lg transition-transform hover:scale-110 md:h-8 md:w-8"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <h3
          className="no-select line-clamp-2 cursor-pointer text-lg leading-tight font-semibold text-[var(--color-text)] transition-colors hover:text-[var(--color-accent-light)] hover:underline md:text-xl"
          onClick={handlePlay}
        >
          {track.title}
        </h3>
        <p className="line-clamp-1 text-base text-[var(--color-subtext)]">
          {track.artist.name}
        </p>
        <p className="line-clamp-1 text-sm text-[var(--color-muted)]">
          {track.album.title}
        </p>
      </div>

      <div className="hidden flex-shrink-0 text-sm font-medium text-[var(--color-subtext)] lg:block">
        {formatDuration(track.duration)}
      </div>

      {showActions && (
        <div className="flex flex-shrink-0 items-center gap-1 md:gap-2">
          <button
            onClick={toggleFavorite}
            className={`touch-target touch-active rounded-full transition-all ${
              favoriteData?.isFavorite
                ? "text-[var(--color-danger)] hover:text-red-400"
                : "text-[var(--color-subtext)] hover:scale-110 hover:text-[var(--color-text)]"
            }`}
            disabled={addFavorite.isPending || removeFavorite.isPending}
          >
            {favoriteData?.isFavorite ? (
              <svg
                className={`h-6 w-6 drop-shadow-lg md:h-5 md:w-5 ${
                  isHeartAnimating ? "animate-heart-pulse" : ""
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className={`h-6 w-6 md:h-5 md:w-5 ${
                  isHeartAnimating ? "animate-heart-pulse" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            )}
          </button>

          <button
            onClick={handleAddToQueue}
            className="touch-target touch-active rounded-full text-[var(--color-subtext)] transition-all hover:scale-110 hover:text-[var(--color-accent-light)]"
            title="Add to queue"
          >
            <svg
              className="h-6 w-6 md:h-5 md:w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>

          {isShareSupported && (
            <button
              onClick={handleShare}
              className="touch-target touch-active rounded-full text-[var(--color-subtext)] transition-all hover:scale-110 hover:text-[var(--color-accent-light)]"
              title="Share track"
            >
              <svg
                className="h-6 w-6 md:h-5 md:w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          )}

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="touch-target touch-active rounded-full text-[var(--color-subtext)] transition-all hover:scale-110 hover:text-white"
            >
              <svg
                className="h-6 w-6 md:h-5 md:w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="card absolute right-0 z-20 mt-2 w-56 border border-[var(--color-border)] py-2 shadow-xl backdrop-blur-sm md:w-48">
                  <div className="px-4 py-3 text-xs font-semibold text-[var(--color-subtext)] uppercase md:py-2">
                    Add to Playlist
                  </div>
                  {playlists && playlists.length > 0 ? (
                    playlists.map((playlist) => (
                      <button
                        key={playlist.id}
                        onClick={() => handleAddToPlaylist(playlist.id)}
                        className="w-full px-4 py-3 text-left text-sm text-[var(--color-text)] transition-all hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-accent-light)] md:py-2"
                        disabled={addToPlaylist.isPending}
                      >
                        {playlist.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-[var(--color-muted)] md:py-2">
                      No playlists yet
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

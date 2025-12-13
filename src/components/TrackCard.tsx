// File: src/components/TrackCard.tsx

"use client";

import type { Track, PlaylistWithTracks } from "@/types";
import { getCoverImage } from "@/utils/images";
import { hapticLight, hapticSuccess } from "@/utils/haptics";
import Image from "next/image";
import { motion } from "framer-motion";
import { springPresets } from "@/utils/spring-animations";
import { Heart, ListPlus, MoreVertical } from "lucide-react";
import { useState } from "react";
import { api } from "@/trpc/react";
import { useToast } from "@/contexts/ToastContext";

export interface TrackCardProps {
  track: Track;
  onPlay: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
  showActions?: boolean;
}

export default function TrackCard({
  track,
  onPlay,
  onAddToQueue,
  showActions = true
}: TrackCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const coverImage = getCoverImage(track);
  const { showToast } = useToast();
  const utils = api.useUtils();

  // Favorite queries and mutations
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

    if (favoriteData?.isFavorite) {
      hapticLight();
      removeFavorite.mutate({ trackId: track.id });
    } else {
      hapticSuccess();
      addFavorite.mutate({ track });
    }
    setIsHeartAnimating(true);
    setTimeout(() => setIsHeartAnimating(false), 600);
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToQueue) {
      hapticLight();
      onAddToQueue(track);
      showToast(`Added "${track.title}" to queue`, "success");
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

  return (
    <motion.div
      onClick={handlePlay}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={springPresets.snappy}
      className="card group relative flex cursor-pointer items-center gap-3 !overflow-visible p-3 md:gap-4 md:p-4"
    >
      <div className="relative flex-shrink-0">
        <Image
          src={coverImage}
          alt={track.title}
          width={64}
          height={64}
          className="h-14 w-14 rounded-lg shadow-sm ring-2 ring-white/5 transition-all group-hover:ring-[var(--color-accent)]/30 md:h-16 md:w-16"
          loading="lazy"
          quality={75}
        />
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <svg
            className="h-8 w-8 text-white drop-shadow-lg md:h-7 md:w-7"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <h3 className="truncate text-base leading-tight font-semibold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-accent-light)] md:text-lg">
          {track.title}
        </h3>
        <p className="truncate text-sm text-[var(--color-subtext)] md:text-base">
          {track.artist.name}
        </p>
      </div>

      {showActions && (
        <div className="flex flex-shrink-0 items-center gap-1 md:gap-2">
          {/* Favorite Button */}
          <button
            onClick={toggleFavorite}
            className={`rounded-full p-2 transition-all ${
              favoriteData?.isFavorite
                ? "text-red-500 hover:text-red-400"
                : "text-[var(--color-subtext)] hover:scale-110 hover:text-[var(--color-text)]"
            }`}
            disabled={addFavorite.isPending || removeFavorite.isPending}
            title={favoriteData?.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`h-5 w-5 ${
                favoriteData?.isFavorite ? "fill-current" : ""
              } ${isHeartAnimating ? "scale-125 transition-transform" : ""}`}
            />
          </button>

          {/* Add to Queue Button */}
          {onAddToQueue && (
            <button
              onClick={handleAddToQueue}
              className="rounded-full p-2 text-[var(--color-subtext)] transition-all hover:scale-110 hover:text-[var(--color-accent-light)]"
              title="Add to queue"
            >
              <ListPlus className="h-5 w-5" />
            </button>
          )}

          {/* Playlist Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="rounded-full p-2 text-[var(--color-subtext)] transition-all hover:scale-110 hover:text-white"
              title="More options"
            >
              <MoreVertical className="h-5 w-5" />
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
                    playlists.map((playlist: PlaylistWithTracks) => (
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
    </motion.div>
  );
}

// File: src/components/SwipeableTrackCard.tsx

"use client";

import { useToast } from "@/contexts/ToastContext";
import { useWebShare } from "@/hooks/useWebShare";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import { hapticLight, hapticMedium, hapticSuccess } from "@/utils/haptics";
import { getCoverImage } from "@/utils/images";
import { springPresets } from "@/utils/spring-animations";
import { formatDuration } from "@/utils/time";
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { Heart, ListPlus, MoreHorizontal, Play, Share2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

export interface SwipeableTrackCardProps {
  track: Track;
  onPlay: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  showActions?: boolean;
  index?: number;
  onArtistClick?: (artistName: string) => void;
  onAlbumClick?: (albumId: number) => void;
}

const SWIPE_THRESHOLD = 80;
const SWIPE_CONFIRM_THRESHOLD = 120;

export default function SwipeableTrackCard({
  track,
  onPlay,
  onAddToQueue,
  showActions = true,
  index = 0,
  onArtistClick,
  onAlbumClick,
}: SwipeableTrackCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const utils = api.useUtils();
  const { showToast } = useToast();
  const { share, isSupported: isShareSupported } = useWebShare();

  const x = useMotionValue(0);

  // Transform values for visual feedback
  const leftActionOpacity = useTransform(
    x,
    [-SWIPE_CONFIRM_THRESHOLD, -SWIPE_THRESHOLD, 0],
    [1, 0.5, 0],
  );
  const leftActionScale = useTransform(
    x,
    [-SWIPE_CONFIRM_THRESHOLD, -SWIPE_THRESHOLD, 0],
    [1.2, 1, 0.8],
  );
  const rightActionOpacity = useTransform(
    x,
    [0, SWIPE_THRESHOLD, SWIPE_CONFIRM_THRESHOLD],
    [0, 0.5, 1],
  );
  const rightActionScale = useTransform(
    x,
    [0, SWIPE_THRESHOLD, SWIPE_CONFIRM_THRESHOLD],
    [0.8, 1, 1.2],
  );
  const cardScale = useTransform(
    x,
    [-SWIPE_CONFIRM_THRESHOLD, 0, SWIPE_CONFIRM_THRESHOLD],
    [0.98, 1, 0.98],
  );

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
          (p: { id: number; name: string }) => p.id === variables.playlistId,
        )?.name ?? "playlist";
      showToast(`Added "${track.title}" to ${playlistName}`, "success");
      setShowMenu(false);
    },
    onError: (error) => {
      showToast(`Failed to add to playlist: ${error.message}`, "error");
    },
  });

  const toggleFavorite = () => {
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

  const handleAddToQueue = () => {
    hapticMedium();
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

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Check for swipe actions
    if (
      offset < -SWIPE_CONFIRM_THRESHOLD ||
      (offset < -SWIPE_THRESHOLD && velocity < -500)
    ) {
      // Swipe left -> Add to queue
      handleAddToQueue();
    } else if (
      offset > SWIPE_CONFIRM_THRESHOLD ||
      (offset > SWIPE_THRESHOLD && velocity > 500)
    ) {
      // Swipe right -> Toggle favorite
      toggleFavorite();
    }
  };

  const coverImage = getCoverImage(track);

  return (
    <motion.div
      ref={constraintsRef}
      className="relative !overflow-visible rounded-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springPresets.smooth, delay: index * 0.03 }}
    >
      {/* Swipe Action Backgrounds */}
      <div className="absolute inset-0 flex overflow-hidden rounded-xl">
        {/* Right action (favorite) - shows when swiping right */}
        <motion.div
          style={{ opacity: rightActionOpacity }}
          className={`flex flex-1 items-center justify-start bg-gradient-to-r px-6 ${
            favoriteData?.isFavorite
              ? "from-[rgba(242,139,130,0.25)] to-transparent"
              : "from-[rgba(244,178,102,0.25)] to-transparent"
          }`}
        >
          <motion.div
            style={{ scale: rightActionScale }}
            className="flex items-center gap-3"
          >
            <Heart
              className={`h-7 w-7 ${
                favoriteData?.isFavorite
                  ? "fill-[var(--color-danger)] text-[var(--color-danger)]"
                  : "text-[var(--color-accent)]"
              }`}
            />
            <span className="text-sm font-medium text-[var(--color-text)]">
              {favoriteData?.isFavorite ? "Unfavorite" : "Favorite"}
            </span>
          </motion.div>
        </motion.div>

        {/* Left action (add to queue) - shows when swiping left */}
        <motion.div
          style={{ opacity: leftActionOpacity }}
          className="flex flex-1 items-center justify-end bg-gradient-to-l from-[rgba(88,198,177,0.25)] to-transparent px-6"
        >
          <motion.div
            style={{ scale: leftActionScale }}
            className="flex items-center gap-3"
          >
            <span className="text-sm font-medium text-[var(--color-text)]">
              Add to Queue
            </span>
            <ListPlus className="h-7 w-7 text-[var(--color-accent-strong)]" />
          </motion.div>
        </motion.div>
      </div>

      {/* Main Card Content */}
      <motion.div
        style={{ x, scale: cardScale }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: "grabbing" }}
        className="relative flex items-center gap-4 rounded-xl bg-[linear-gradient(145deg,rgba(18,27,37,0.98),rgba(11,17,24,0.98))] p-4 transition-shadow md:gap-5"
      >
        {/* Album Art with Play Button */}
        <div className="relative flex-shrink-0">
          <Image
            src={coverImage}
            alt={track.title}
            width={80}
            height={80}
            className="h-16 w-16 rounded-xl shadow-md ring-1 ring-white/10 transition-all md:h-20 md:w-20"
            loading="lazy"
            quality={75}
          />
          <motion.button
            onClick={handlePlay}
            whileTap={{ scale: 0.9 }}
            transition={springPresets.immediate}
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 opacity-0 backdrop-blur-sm transition-opacity active:opacity-100 md:hover:opacity-100"
          >
            <Play className="h-8 w-8 fill-white text-white drop-shadow-lg" />
          </motion.button>
        </div>

        {/* Track Info */}
        <div
          className="min-w-0 flex-1 space-y-1"
          onClick={!onArtistClick && !onAlbumClick ? handlePlay : undefined}
        >
          <h3
            className="line-clamp-2 cursor-pointer text-base leading-tight font-semibold text-[var(--color-text)] transition-colors hover:text-[var(--color-accent-light)] md:text-lg"
            onClick={handlePlay}
          >
            {track.title}
          </h3>
          {onArtistClick ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                hapticLight();
                onArtistClick(track.artist.name);
              }}
              className="line-clamp-1 text-left text-sm text-[var(--color-subtext)] transition-colors hover:text-[var(--color-accent-light)] hover:underline"
            >
              {track.artist.name}
            </button>
          ) : (
            <p className="line-clamp-1 cursor-pointer text-sm text-[var(--color-subtext)]">
              {track.artist.name}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            {track.album ? (
              onAlbumClick ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    hapticLight();
                    onAlbumClick(track.album.id);
                  }}
                  className="line-clamp-1 text-left transition-colors hover:text-[var(--color-accent-light)] hover:underline"
                >
                  {track.album.title}
                </button>
              ) : (
                <span className="line-clamp-1 cursor-pointer">
                  {track.album.title}
                </span>
              )
            ) : (
              <span className="line-clamp-1 text-[var(--color-muted)]">
                Unknown Album
              </span>
            )}
            <span>•</span>
            <span className="tabular-nums">
              {formatDuration(track.duration)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex flex-shrink-0 items-center gap-0.5 md:gap-1">
            {/* Favorite Button */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite();
              }}
              whileTap={{ scale: 0.85 }}
              transition={springPresets.immediate}
              className={`touch-target rounded-full p-2 transition-colors ${
                favoriteData?.isFavorite
                  ? "text-[var(--color-danger)]"
                  : "text-[var(--color-subtext)] hover:text-[var(--color-text)]"
              }`}
              disabled={addFavorite.isPending || removeFavorite.isPending}
            >
              <Heart
                className={`h-5 w-5 md:h-[18px] md:w-[18px] ${
                  favoriteData?.isFavorite ? "fill-current" : ""
                } ${isHeartAnimating ? "animate-heart-pulse" : ""}`}
              />
            </motion.button>

            {/* Add to Queue */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToQueue();
              }}
              whileTap={{ scale: 0.85 }}
              transition={springPresets.immediate}
              className="touch-target rounded-full p-2 text-[var(--color-subtext)] transition-colors hover:text-[var(--color-accent-strong)]"
              title="Add to queue"
            >
              <ListPlus className="h-5 w-5 md:h-[18px] md:w-[18px]" />
            </motion.button>

            {/* Share */}
            {isShareSupported && (
              <motion.button
                onClick={handleShare}
                whileTap={{ scale: 0.85 }}
                transition={springPresets.immediate}
                className="touch-target rounded-full p-2 text-[var(--color-subtext)] transition-colors hover:text-[var(--color-accent)]"
                title="Share track"
              >
                <Share2 className="h-5 w-5 md:h-[18px] md:w-[18px]" />
              </motion.button>
            )}

            {/* More Options */}
            <div className="relative">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                whileTap={{ scale: 0.85 }}
                transition={springPresets.immediate}
                className="touch-target rounded-full p-2 text-[var(--color-subtext)] transition-colors hover:text-[var(--color-text)]"
              >
                <MoreHorizontal className="h-5 w-5 md:h-[18px] md:w-[18px]" />
              </motion.button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={springPresets.snappy}
                    className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-[rgba(244,178,102,0.14)] bg-[rgba(16,23,33,0.98)] py-2 shadow-xl backdrop-blur-xl md:w-48"
                  >
                    <div className="px-4 py-2 text-xs font-semibold tracking-wider text-[var(--color-muted)] uppercase">
                      Add to Playlist
                    </div>
                    {playlists && playlists.length > 0 ? (
                      playlists.map(
                        (playlist: { id: number; name: string }) => (
                          <button
                            key={playlist.id}
                            onClick={() => handleAddToPlaylist(playlist.id)}
                            className="w-full px-4 py-3 text-left text-sm text-[var(--color-text)] transition-colors hover:bg-[rgba(244,178,102,0.1)] md:py-2"
                            disabled={addToPlaylist.isPending}
                          >
                            {playlist.name}
                          </button>
                        ),
                      )
                    ) : (
                      <div className="px-4 py-3 text-sm text-[var(--color-muted)] md:py-2">
                        No playlists yet
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Swipe Hints - visible on first few cards */}
      {index < 2 && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 3, duration: 1 }}
          className="pointer-events-none absolute inset-0 flex items-center justify-between px-4"
        >
          <div className="flex items-center gap-2 rounded-full bg-[rgba(244,178,102,0.2)] px-3 py-1.5 text-xs text-[var(--color-accent)]">
            <span>←</span>
            <Heart className="h-3 w-3" />
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[rgba(88,198,177,0.2)] px-3 py-1.5 text-xs text-[var(--color-accent-strong)]">
            <ListPlus className="h-3 w-3" />
            <span>→</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

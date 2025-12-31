// File: src/app/HomePageClient.tsx

"use client";

import ChangelogModal from "@/components/ChangelogModal";
import MobileSearchBar from "@/components/MobileSearchBar";
import { PullToRefreshWrapper } from "@/components/PullToRefreshWrapper";
import SwipeableTrackCard from "@/components/SwipeableTrackCard";
import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import {
  getAlbumTracks,
  searchTracks,
  searchTracksByArtist,
} from "@/utils/api";
import { hapticLight, hapticSuccess } from "@/utils/haptics";
import {
  springPresets,
  staggerContainer,
  staggerItem,
} from "@/utils/spring-animations";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Github,
  Music2,
  Search,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function HomePageClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isArtistSearch, setIsArtistSearch] = useState(false);
  const [apiOffset, setApiOffset] = useState(0); // Track actual API offset for artist searches
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  const player = useGlobalPlayer();

  useEffect(() => {
    setMounted(true);
  }, []);

  const addSearchQuery = api.music.addSearchQuery.useMutation();
  const { data: recentSearches } = api.music.getRecentSearches.useQuery(
    { limit: 5 },
    { enabled: !!session },
  );

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      setLoading(true);
      setCurrentQuery(searchQuery);
      setIsArtistSearch(false); // Regular search, not artist-specific
      setApiOffset(0); // Reset API offset for regular search
      // Clear previous results immediately to prevent stale results from showing
      setResults([]);
      setTotal(0);

      try {
        const response = await searchTracks(searchQuery, 0);
        setResults(response.data);
        setTotal(response.total);

        if (session) {
          addSearchQuery.mutate({ query: searchQuery });
        }
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
        setTotal(0);
        setApiOffset(0);
      } finally {
        setLoading(false);
      }
    },
    [session, addSearchQuery],
  );

  const handleAlbumClick = useCallback(
    async (albumId: number) => {
      setLoading(true);
      setIsArtistSearch(false); // Album search, not artist-specific
      setApiOffset(0); // Reset API offset for album search
      // Clear previous results immediately to prevent stale results from showing
      setResults([]);
      setTotal(0);

      try {
        const response = await getAlbumTracks(albumId);
        setResults(response.data);
        setTotal(response.total);

        // Update URL with album ID
        const params = new URLSearchParams();
        params.set("album", albumId.toString());
        router.push(`?${params.toString()}`, { scroll: false });

        // Try to get album name from track data, or fetch album info separately
        let albumName: string | undefined;
        if (response.data.length > 0) {
          // Check if first track has album info
          const firstTrack = response.data[0];
          if (firstTrack && "album" in firstTrack && firstTrack.album) {
            albumName = firstTrack.album.title;
          }
        }

        // If album name not found in tracks, fetch album info through our proxy
        if (!albumName) {
          try {
            const albumResponse = await fetch(`/api/album/${albumId}`);
            if (albumResponse.ok) {
              const albumData = (await albumResponse.json()) as {
                title?: string;
              };
              albumName = albumData.title;
            }
          } catch (err) {
            console.warn("Failed to fetch album info:", err);
          }
        }

        // Set query to album name if available
        if (albumName) {
          setQuery(albumName);
          setCurrentQuery(albumName);
          if (session) {
            addSearchQuery.mutate({ query: albumName });
          }
        }
      } catch (error) {
        console.error("Album search failed:", error);
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [session, addSearchQuery, router],
  );

  useEffect(() => {
    try {
      const urlQuery = searchParams.get("q");
      const albumId = searchParams.get("album");

      if (albumId && !isInitialized) {
        // Handle album URL parameter
        const albumIdNum = parseInt(albumId, 10);
        if (!isNaN(albumIdNum)) {
          setIsInitialized(true);
          void handleAlbumClick(albumIdNum);
        } else {
          setIsInitialized(true);
        }
      } else if (urlQuery && !isInitialized) {
        setQuery(urlQuery);
        setIsInitialized(true);
        void performSearch(urlQuery);
      } else if (!isInitialized) {
        setIsInitialized(true);
      }
    } catch (error) {
      console.error("Error initializing from URL:", error);
      setIsInitialized(true);
    }
  }, [searchParams, isInitialized, performSearch, handleAlbumClick]);

  const updateURL = (searchQuery: string) => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("q", searchQuery);
      router.push(`?${params.toString()}`, { scroll: false });
    } else {
      router.push("/", { scroll: false });
    }
  };

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery ?? query;
    if (!q.trim()) return;

    updateURL(q);
    await performSearch(q);
  };

  const handleLoadMore = async () => {
    if (!currentQuery.trim() || loadingMore) return;

    setLoadingMore(true);

    try {
      if (isArtistSearch) {
        // For artist searches, we need to use the API offset (not filtered result count)
        // since filtering happens client-side. Use the tracked API offset.
        const currentApiOffset = apiOffset;
        const response = await searchTracksByArtist(
          currentQuery,
          currentApiOffset,
        );

        // The API typically returns 25 results per page. Since we filter client-side,
        // we don't know exactly how many API results were returned, but we need to
        // increment by the standard page size to avoid overlapping results.
        // If we got filtered results, we know the API returned at least a full page.
        // If we got no filtered results but there's a next page, the API still returned results.
        const API_PAGE_SIZE = 25; // Standard Deezer API page size
        const newApiOffset = currentApiOffset + API_PAGE_SIZE;

        // Append new filtered results
        setResults((prev) => {
          const newResults = [...prev, ...response.data];

          // Update total based on new results - use the actual new length, not stale state
          // Only set total to filtered count when there are no more API pages to check
          // Don't stop pagination just because current page has no matches
          if (!response.next) {
            // No more API pages available, set total to actual filtered count
            setTotal(newResults.length);
          } else {
            // Keep the API total so we know there might be more pages to check
            // Even if this page has no matches, there might be matches on next pages
            setTotal(response.total);
          }

          return newResults;
        });

        // Update API offset for next pagination
        setApiOffset(newApiOffset);
      } else {
        // Regular search - use filtered result count as offset
        const nextOffset = results.length;
        if (nextOffset >= total) {
          setLoadingMore(false);
          return;
        }

        const response = await searchTracks(currentQuery, nextOffset);
        setResults((prev) => [...prev, ...response.data]);
        // Update total if it changed
        if (response.total !== total) {
          setTotal(response.total);
        }
      }
    } catch (error) {
      console.error("Load more failed:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    if (currentQuery) {
      await performSearch(currentQuery);
    }
  };

  const handleArtistClick = useCallback(
    async (artistName: string) => {
      setLoading(true);
      setQuery(artistName);
      setCurrentQuery(artistName);
      setIsArtistSearch(true); // Mark as artist search mode
      setApiOffset(0); // Reset API offset for new artist search
      // Clear previous results immediately to prevent stale results from showing
      setResults([]);
      setTotal(0);

      try {
        const response = await searchTracksByArtist(artistName, 0);
        setResults(response.data);
        setTotal(response.total);

        // Update API offset - first page is always 25 results from the API
        const API_PAGE_SIZE = 25;
        setApiOffset(API_PAGE_SIZE);

        // Update URL
        const params = new URLSearchParams();
        params.set("q", artistName);
        router.push(`?${params.toString()}`, { scroll: false });

        if (session) {
          addSearchQuery.mutate({ query: artistName });
        }
      } catch (error) {
        console.error("Artist search failed:", error);
        setResults([]);
        setTotal(0);
        setApiOffset(0);
      } finally {
        setLoading(false);
      }
    },
    [session, addSearchQuery, router],
  );

  const hasMore = results.length < total;

  // Shuffle & Play - quick start music playback
  const handleShufflePlay = useCallback(async () => {
    hapticSuccess();
    setLoading(true);
    // Clear previous results immediately to prevent stale results from showing
    setResults([]);
    setTotal(0);

    try {
      // Search for a popular artist to get good results
      const popularQueries = ["pop", "rock", "electronic", "jazz", "indie"];
      const randomQuery =
        popularQueries[Math.floor(Math.random() * popularQueries.length)];

      const response = await searchTracks(randomQuery!, 0);

      if (response.data.length > 0) {
        // Shuffle the results
        const shuffled = [...response.data].sort(() => Math.random() - 0.5);

        // Play first track
        player.play(shuffled[0]!);

        // Add next 10 tracks to queue
        if (shuffled.length > 1) {
          player.addToQueue(shuffled.slice(1, 11), false);
        }

        // Update UI
        setResults(response.data);
        setTotal(response.total);
        setCurrentQuery(randomQuery ?? "");
      }
    } catch (error) {
      console.error("Shuffle play failed:", error);
    } finally {
      setLoading(false);
    }
  }, [player]);

  if (!mounted) {
    return null;
  }

  const searchContent = (
    <div className="flex min-h-screen flex-col">
      <main className="container mx-auto w-full flex-1 py-6 md:py-8">
        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springPresets.gentle, delay: 0.1 }}
          className="card mb-6 w-full p-4 shadow-xl md:mb-8 md:p-7"
        >
          {isMobile ? (
            <MobileSearchBar
              value={query}
              onChange={setQuery}
              onSearch={handleSearch}
              onClear={() => {
                setQuery("");
                setResults([]);
                setTotal(0);
              }}
              isLoading={loading}
              recentSearches={recentSearches ?? []}
              onRecentSearchClick={(search) => {
                setQuery(search);
                void handleSearch(search);
              }}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 md:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-xl border border-[rgba(244,178,102,0.15)] bg-[rgba(18,26,38,0.9)] px-4 py-3 transition-all focus-within:border-[rgba(244,178,102,0.4)] focus-within:shadow-[0_0_0_4px_rgba(244,178,102,0.1)]">
                  <Search className="h-5 w-5 flex-shrink-0 text-[var(--color-muted)]" />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-base text-[var(--color-text)] placeholder-[var(--color-muted)] outline-none"
                    placeholder="Search for songs, artists, or albums..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
                  />
                </div>
                <button
                  className="btn-primary touch-target-lg flex items-center justify-center gap-2 px-8"
                  onClick={() => void handleSearch()}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner spinner-sm" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    "Search"
                  )}
                </button>
              </div>

              {session && recentSearches && recentSearches.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-[var(--color-subtext)]">
                    Recent:
                  </span>
                  {recentSearches.map((search: string) => (
                    <button
                      key={search}
                      onClick={() => {
                        hapticLight();
                        void handleSearch(search);
                      }}
                      className="touch-active rounded-full bg-[var(--color-surface-2)] px-3 py-1.5 text-sm text-[var(--color-text)] ring-1 ring-white/5 transition-all hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-accent-light)] hover:ring-[var(--color-accent)]/30"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Results Section */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {results.length > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-4 flex items-center justify-between md:mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-text)] md:text-2xl">
                      Search Results
                    </h2>
                    <p className="mt-0.5 text-xs text-[var(--color-subtext)] md:mt-1 md:text-sm">
                      {results.length.toLocaleString()}
                      {total > results.length
                        ? ` of ${total.toLocaleString()}`
                        : ""}{" "}
                      tracks found
                    </p>
                  </div>
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="grid gap-2 md:gap-3"
                >
                  {results.map((track, index) => (
                    <motion.div key={track.id} variants={staggerItem}>
                      <SwipeableTrackCard
                        track={track}
                        onPlay={player.play}
                        onAddToQueue={player.addToQueue}
                        showActions={!!session}
                        index={index}
                        onArtistClick={handleArtistClick}
                        onAlbumClick={handleAlbumClick}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                {hasMore && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex justify-center md:mt-8"
                  >
                    <button
                      onClick={() => void handleLoadMore()}
                      disabled={loadingMore}
                      className="btn-primary touch-target-lg flex w-full items-center justify-center gap-2 md:w-auto md:px-12"
                    >
                      {loadingMore ? (
                        <>
                          <div className="spinner spinner-sm" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        `Load More (${(total - results.length).toLocaleString()} remaining)`
                      )}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={springPresets.gentle}
                className="card flex flex-col items-center justify-center py-16 text-center md:py-20"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(244,178,102,0.15)] to-[rgba(88,198,177,0.15)] ring-2 ring-[var(--color-accent)]/20 md:h-24 md:w-24"
                >
                  <Music2 className="h-10 w-10 text-[var(--color-accent)] md:h-12 md:w-12" />
                </motion.div>
                <h3 className="mb-2 text-lg font-bold text-[var(--color-text)] md:text-xl">
                  {isMobile
                    ? "Start Your Musical Journey"
                    : "Explore our library. Best enjoyed on a desktop device or horizontally on mobile."}
                </h3>
                <p className="max-w-md px-4 text-sm text-[var(--color-subtext)] md:text-base">
                  {isMobile
                    ? "Tap to start playing music instantly, or search for something specific."
                    : "Search for songs, artists, albums - anything you want to listen to."}
                </p>

                {/* Shuffle & Play Button - Mobile Only */}
                {isMobile && (
                  <motion.button
                    onClick={handleShufflePlay}
                    disabled={loading}
                    whileTap={{ scale: 0.95 }}
                    className="mt-6 flex w-full max-w-xs items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)] px-8 py-4 text-lg font-bold text-white shadow-[var(--color-accent)]/25 shadow-lg transition-all hover:shadow-[var(--color-accent)]/40 hover:shadow-xl disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="spinner spinner-sm border-white" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <Shuffle className="h-6 w-6" />
                        <span>Shuffle & Play</span>
                      </>
                    )}
                  </motion.button>
                )}

                {/* Quick Search Suggestions */}
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {[
                    "Lamb",
                    "Depeche Mode",
                    "The Knife",
                    "Goldfrapp",
                    "GusGus",
                    "Soulwax",
                    "Massive Attack",
                  ].map((suggestion) => (
                    <motion.button
                      key={suggestion}
                      onClick={() => {
                        hapticLight();
                        setQuery(suggestion);
                        void handleSearch(suggestion);
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 rounded-full bg-[rgba(244,178,102,0.1)] px-4 py-2 text-sm text-[var(--color-accent)] transition-colors hover:bg-[rgba(244,178,102,0.2)]"
                    >
                      <Sparkles className="h-3 w-3" />
                      {suggestion}
                    </motion.button>
                  ))}
                </div>

                {/* GitHub & Changelog Buttons */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <motion.a
                    href="https://github.com/soulwax/songbird-player"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 rounded-xl bg-[rgba(255,255,255,0.05)] px-5 py-3 text-sm font-medium text-[var(--color-text)] ring-1 ring-white/10 transition-all hover:bg-[rgba(255,255,255,0.1)] hover:ring-[var(--color-accent)]/30"
                  >
                    <Github className="h-4 w-4" />
                    <span>View on GitHub</span>
                  </motion.a>

                  <motion.button
                    onClick={() => {
                      hapticLight();
                      setIsChangelogOpen(true);
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 rounded-xl bg-[rgba(244,178,102,0.1)] px-5 py-3 text-sm font-medium text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/20 transition-all hover:bg-[rgba(244,178,102,0.2)] hover:ring-[var(--color-accent)]/40"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Changelog</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Changelog Modal */}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />
    </div>
  );

  // Wrap with pull-to-refresh on mobile
  if (isMobile) {
    return (
      <PullToRefreshWrapper onRefresh={handleRefresh} enabled={!!currentQuery}>
        {searchContent}
      </PullToRefreshWrapper>
    );
  }

  return searchContent;
}

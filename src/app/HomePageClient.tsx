// File: src/app/HomePageClient.tsx

"use client";

import ChangelogModal from "@/components/ChangelogModal";
import { PullToRefreshWrapper } from "@/components/PullToRefreshWrapper";
import SwipeableTrackCard from "@/components/SwipeableTrackCard";
import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import {
  getAlbumTracks,
  getTrackById,
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
import { useCallback, useEffect, useRef, useState } from "react";

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
  const [apiOffset, setApiOffset] = useState(0);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const lastUrlQueryRef = useRef<string | null>(null);
  const lastTrackIdRef = useRef<string | null>(null);

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
    async (searchQuery: string, force = false) => {
      if (!searchQuery.trim()) return;

      if (!force && currentQuery === searchQuery) {
        return;
      }

      setLoading(true);
      setCurrentQuery(searchQuery);
      setIsArtistSearch(false);
      setApiOffset(0);

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
    [session, addSearchQuery, currentQuery],
  );

  const handleAlbumClick = useCallback(
    async (albumId: number) => {
      setLoading(true);
      setIsArtistSearch(false);
      setApiOffset(0);

      setResults([]);
      setTotal(0);

      try {
        const response = await getAlbumTracks(albumId);
        setResults(response.data);
        setTotal(response.total);

        const params = new URLSearchParams();
        params.set("album", albumId.toString());
        router.push(`?${params.toString()}`, { scroll: false });

        let albumName: string | undefined;
        if (response.data.length > 0) {

          const firstTrack = response.data[0];
          if (firstTrack && "album" in firstTrack && firstTrack.album) {
            albumName = firstTrack.album.title;
          }
        }

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

  const handleSharedTrack = useCallback(
    async (trackId: number) => {
      try {
        console.log("[Shared Track] Loading track:", trackId);
        const track = await getTrackById(trackId);

        console.log("[Shared Track] Track loaded:", track.title);
        hapticSuccess();

        player.clearQueue();
        player.playTrack(track);

        setResults([track]);
        setTotal(1);
        setCurrentQuery(`Shared: ${track.title}`);
        setQuery(`${track.artist.name} - ${track.title}`);
      } catch (error) {
        console.error("[Shared Track] Failed to load shared track:", error);
        hapticLight();
      }
    },
    [player],
  );

  useEffect(() => {
    const urlQuery = searchParams.get("q");
    const albumId = searchParams.get("album");
    const trackId = searchParams.get("track");

    if (trackId) {
      const trackIdNum = parseInt(trackId, 10);
      if (!isNaN(trackIdNum) && trackId !== lastTrackIdRef.current) {
        lastTrackIdRef.current = trackId;
        setIsInitialized(true);
        lastUrlQueryRef.current = null;
        void handleSharedTrack(trackIdNum);
      }
    } else if (albumId) {
      const albumIdNum = parseInt(albumId, 10);
      if (!isNaN(albumIdNum)) {
        setIsInitialized(true);
        lastUrlQueryRef.current = null;
        lastTrackIdRef.current = null;
        void handleAlbumClick(albumIdNum);
      }
    } else if (urlQuery) {
      if (urlQuery !== lastUrlQueryRef.current) {
        lastUrlQueryRef.current = urlQuery;
        lastTrackIdRef.current = null;
        setQuery(urlQuery);
        setIsInitialized(true);
        void performSearch(urlQuery);
      }
    } else {
      if (!isInitialized) {
        setIsInitialized(true);
      }
      if (lastUrlQueryRef.current !== null || lastTrackIdRef.current !== null) {
        lastUrlQueryRef.current = null;
        lastTrackIdRef.current = null;
        setResults([]);
        setTotal(0);
        setCurrentQuery("");
        if (!loading) {
          setQuery("");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
  };

  const handleLoadMore = async () => {
    if (!currentQuery.trim() || loadingMore) return;

    setLoadingMore(true);

    try {
      if (isArtistSearch) {

        const currentApiOffset = apiOffset;
        const response = await searchTracksByArtist(
          currentQuery,
          currentApiOffset,
        );

        const API_PAGE_SIZE = 25;
        const newApiOffset = currentApiOffset + API_PAGE_SIZE;

        setResults((prev) => {
          const newResults = [...prev, ...response.data];

          if (!response.next) {

            setTotal(newResults.length);
          } else {

            setTotal(response.total);
          }

          return newResults;
        });

        setApiOffset(newApiOffset);
      } else {

        const nextOffset = results.length;
        if (nextOffset >= total) {
          setLoadingMore(false);
          return;
        }

        const response = await searchTracks(currentQuery, nextOffset);
        setResults((prev) => [...prev, ...response.data]);

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
      setIsArtistSearch(true);
      setApiOffset(0);

      setResults([]);
      setTotal(0);

      try {
        const response = await searchTracksByArtist(artistName, 0);
        setResults(response.data);
        setTotal(response.total);

        const API_PAGE_SIZE = 25;
        setApiOffset(API_PAGE_SIZE);

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

  const handleShufflePlay = useCallback(async () => {
    hapticSuccess();
    setLoading(true);

    setResults([]);
    setTotal(0);

    try {

      const popularQueries = ["pop", "rock", "electronic", "jazz", "indie"];
      const randomQuery =
        popularQueries[Math.floor(Math.random() * popularQueries.length)];

      const response = await searchTracks(randomQuery!, 0);

      if (response.data.length > 0) {

        const shuffled = [...response.data].sort(() => Math.random() - 0.5);

        player.play(shuffled[0]!);

        if (shuffled.length > 1) {
          player.addToQueue(shuffled.slice(1, 11), false);
        }

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
        {}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springPresets.gentle, delay: 0.1 }}
            className="card mb-6 w-full p-4 shadow-xl md:mb-8 md:p-7"
          >
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
          </motion.div>
        )}

        {}
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

                {}
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

                {}
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

                {}
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

      {}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />
    </div>
  );

  if (isMobile) {
    return (
      <PullToRefreshWrapper onRefresh={handleRefresh} enabled={!!currentQuery}>
        {searchContent}
      </PullToRefreshWrapper>
    );
  }

  return searchContent;
}

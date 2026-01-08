// File: src/components/MobileHeader.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import MobileSearchBar from "@/components/MobileSearchBar";
import { useMenu } from "@/contexts/MenuContext";
import { hapticMedium } from "@/utils/haptics";
import { springPresets } from "@/utils/spring-animations";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";

export default function MobileHeader() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { isMenuOpen, toggleMenu } = useMenu();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: recentSearches } = api.music.getRecentSearches.useQuery(
    { limit: 5 },
    { enabled: !!session }
  );

  useEffect(() => {
    const urlQuery = searchParams.get("q");
    if (urlQuery) {
      setSearchQuery(urlQuery);
    }
  }, [searchParams]);

  // Debounced search: search every 2 seconds while typing
  useEffect(() => {
    // Clear existing timeout and countdown
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // If query is empty, clear search immediately
    if (!searchQuery.trim()) {
      setCountdown(0);
      router.push("/");
      return;
    }

    // Reset countdown to 2000ms
    setCountdown(2000);

    // Update countdown every 100ms for smooth animation
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        const newValue = Math.max(0, prev - 100);
        if (newValue === 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
        }
        return newValue;
      });
    }, 100);

    // Set new timeout for 2 seconds
    searchTimeoutRef.current = setTimeout(() => {
      setIsSearching(true);
      setCountdown(0);
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      setTimeout(() => setIsSearching(false), 500);
    }, 2000);

    // Cleanup on unmount or query change
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [searchQuery, router]);

  if (!isMobile) return null;

  const handleSearch = (query: string) => {
    // Clear debounce timeout and countdown
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setCountdown(0);

    if (query.trim()) {
      setIsSearching(true);
      router.push(`/?q=${encodeURIComponent(query.trim())}`);
      setTimeout(() => setIsSearching(false), 500);
    } else {
      router.push("/");
    }
  };

  const handleClear = () => {
    // Clear debounce timeout and countdown
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setCountdown(0);
    setSearchQuery("");
    // Navigation is handled by useEffect when searchQuery becomes empty
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={springPresets.gentle}
      className="safe-top fixed left-0 right-0 top-0 z-50
                 border-b border-[rgba(244,178,102,0.12)]
                 bg-[rgba(10,16,24,0.95)]
                 shadow-lg
                 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {}
        <motion.button
          onClick={() => {
            hapticMedium();
            toggleMenu();
          }}
          whileTap={{ scale: 0.9 }}
          className="touch-target flex-shrink-0 rounded-lg p-2
                     text-[var(--color-text)]
                     transition
                     hover:bg-[rgba(244,178,102,0.1)]"
          aria-label="Menu"
        >
          <AnimatePresence mode="wait">
            {isMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={springPresets.snappy}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={springPresets.snappy}
              >
                <Menu className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {}
        <div className="flex-1">
          <MobileSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            onClear={handleClear}
            placeholder="Search music..."
            isLoading={isSearching}
            recentSearches={recentSearches ?? []}
            onRecentSearchClick={(search) => {
              setSearchQuery(search);
              handleSearch(search);
            }}
            showAutoSearchIndicator={true}
            autoSearchCountdown={countdown}
          />
        </div>
      </div>
    </motion.header>
  );
}

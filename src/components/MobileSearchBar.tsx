// File: src/components/MobileSearchBar.tsx

"use client";

import { useIsMobile } from "@/hooks/useMediaQuery";
import {
  hapticError,
  hapticLight,
  hapticMedium,
  hapticSuccess,
} from "@/utils/haptics";
import { springPresets } from "@/utils/spring-animations";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Mic, MicOff, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface MobileSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  onClear?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  autoFocus?: boolean;
  recentSearches?: string[];
  onRecentSearchClick?: (search: string) => void;
  showAutoSearchIndicator?: boolean;
  autoSearchCountdown?: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null;
  onnomatch: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export default function MobileSearchBar({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder = "Search for songs, artists, albums...",
  isLoading = false,
  autoFocus = false,
  recentSearches = [],
  onRecentSearchClick,
  showAutoSearchIndicator = true,
  autoSearchCountdown = 0,
}: MobileSearchBarProps) {
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognitionAPI);
  }, []);

  const initSpeechRecognition = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return null;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      hapticMedium();
      setIsListening(true);
      setInterimTranscript("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i]?.[0]?.transcript ?? "";
        if (event.results[i]?.isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      setInterimTranscript(interimText);

      if (finalText) {
        hapticSuccess();
        onChange(finalText);
        onSearch(finalText);
        setInterimTranscript("");
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      hapticError();
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    return recognition;
  }, [onChange, onSearch]);

  const startListening = () => {
    if (!voiceSupported) return;

    hapticLight();
    const recognition = initSpeechRecognition();
    if (recognition) {
      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      hapticLight();
      onSearch(value);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    hapticLight();
    onChange("");
    onClear?.();
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {

    setTimeout(() => setIsFocused(false), 150);
  };

  const displayValue = isListening ? interimTranscript || value : value;
  const showClear = value.length > 0 && !isLoading;
  const showRecentSearches = isFocused && !value && recentSearches.length > 0;
  const showAutoSearch = showAutoSearchIndicator && value.trim().length > 0 && !isLoading && !isListening;
  // countdownProgress represents remaining time (100% = full time, 0% = time's up) - used for circular indicator
  const countdownProgress = Math.max(0, Math.min(100, (autoSearchCountdown / 2000) * 100));
  // elapsedProgress represents elapsed time (0% = start, 100% = complete) - used for linear progress bar
  const elapsedProgress = Math.max(0, Math.min(100, (1 - autoSearchCountdown / 2000) * 100));

  return (
    <div className="relative w-full">
      {}
      <form onSubmit={handleSubmit} className="relative">
        <motion.div
          animate={{
            scale: isFocused ? 1.02 : 1,
            boxShadow: isFocused
              ? "0 8px 32px rgba(244, 178, 102, 0.15), 0 0 0 2px rgba(244, 178, 102, 0.3)"
              : "0 4px 16px rgba(0, 0, 0, 0.2)",
          }}
          transition={springPresets.snappy}
          className={`relative flex items-center gap-3 rounded-2xl border bg-[rgba(18,26,38,0.95)] px-4 py-3 backdrop-blur-xl transition-colors ${
            isFocused
              ? "border-[rgba(244,178,102,0.4)]"
              : "border-[rgba(244,178,102,0.15)]"
          } ${showAutoSearch ? "pb-6" : ""}`}
        >
          {}
          {!isLoading && !showAutoSearch && (
            <motion.div
              animate={{
                scale: 1,
                opacity: 1,
              }}
              transition={springPresets.snappy}
            >
              <Search
                className={`h-5 w-5 transition-colors ${
                  isFocused
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-muted)]"
                }`}
              />
            </motion.div>
          )}

          {}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute left-4"
              >
                <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent)]" />
              </motion.div>
            ) : showAutoSearch ? (
              <motion.div
                key="countdown"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute left-4"
              >
                <div className="relative h-5 w-5">
                  <svg className="h-5 w-5 -rotate-90 transform" viewBox="0 0 20 20">
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="rgba(244,178,102,0.2)"
                      strokeWidth="2"
                      fill="none"
                    />
                    <motion.circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="var(--color-accent)"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray={2 * Math.PI * 8}
                      strokeLinecap="round"
                      animate={{
                        strokeDashoffset: 2 * Math.PI * 8 * (1 - countdownProgress / 100),
                      }}
                      transition={{ duration: 0.1, ease: "linear" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Search className="h-3 w-3 text-[var(--color-accent)]" />
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {}
          <div className="min-w-0 flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={displayValue}
              onChange={(e) => onChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={isListening ? "Listening..." : placeholder}
              autoFocus={autoFocus}
              className={`w-full bg-transparent text-base text-[var(--color-text)] placeholder-[var(--color-muted)] outline-none ${
                isListening ? "italic" : ""
              }`}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {}
            {showAutoSearch && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute -bottom-5 left-0 right-0"
              >
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-subtext)]">
                  <div className="h-1 flex-1 rounded-full bg-[rgba(244,178,102,0.15)] overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)] rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${elapsedProgress}%` }}
                      transition={{ duration: 0.1, ease: "linear" }}
                    />
                  </div>
                  <span className="whitespace-nowrap font-medium text-[var(--color-accent)]">
                    {autoSearchCountdown > 0 
                      ? `Searching in ${Math.ceil(autoSearchCountdown / 1000)}s`
                      : "Searching now..."}
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {}
          {isMobile && voiceSupported && (
            <motion.button
              type="button"
              onClick={isListening ? stopListening : startListening}
              whileTap={{ scale: 0.9 }}
              transition={springPresets.immediate}
              className={`touch-target flex-shrink-0 rounded-full p-2 transition-colors ${
                isListening
                  ? "bg-[rgba(242,139,130,0.2)] text-[var(--color-danger)]"
                  : "text-[var(--color-subtext)] hover:text-[var(--color-text)]"
              }`}
              aria-label={isListening ? "Stop listening" : "Voice search"}
            >
              {isListening ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <MicOff className="h-5 w-5" />
                </motion.div>
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </motion.button>
          )}

          {}
          <AnimatePresence>
            {showClear && (
              <motion.button
                type="button"
                onClick={handleClear}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileTap={{ scale: 0.9 }}
                transition={springPresets.snappy}
                className="touch-target flex-shrink-0 rounded-full p-2 text-[var(--color-subtext)] transition-colors hover:text-[var(--color-text)]"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -bottom-12 left-1/2 -translate-x-1/2"
            >
              <div className="flex items-center gap-1 rounded-full bg-[rgba(242,139,130,0.15)] px-4 py-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-[var(--color-danger)]"
                    animate={{
                      height: [8, 20, 8],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {}
      <AnimatePresence>
        {showRecentSearches && onRecentSearchClick && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={springPresets.snappy}
            className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl border border-[rgba(244,178,102,0.15)] bg-[rgba(16,23,33,0.98)] shadow-xl backdrop-blur-xl"
          >
            <div className="px-4 py-2">
              <span className="text-xs font-semibold tracking-wider text-[var(--color-muted)] uppercase">
                Recent Searches
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {recentSearches.map((search, index) => (
                <motion.button
                  key={search}
                  onClick={() => {
                    hapticLight();
                    onRecentSearchClick(search);
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[rgba(244,178,102,0.08)]"
                >
                  <Search className="h-4 w-4 text-[var(--color-muted)]" />
                  <span className="flex-1 truncate text-sm text-[var(--color-text)]">
                    {search}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
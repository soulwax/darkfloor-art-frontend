"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Music2, Sparkles, Play } from "lucide-react";
import { useEffect, useState } from "react";

interface WelcomeHeroProps {
  isVisible: boolean;
  onDismiss?: () => void;
}

export function WelcomeHero({ isVisible, onDismiss }: WelcomeHeroProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20, transition: { duration: 0.4 } }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-center px-4 pt-20 md:pt-24"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="pointer-events-auto relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[rgba(244,178,102,0.2)] bg-gradient-to-br from-[rgba(18,26,38,0.95)] via-[rgba(18,26,38,0.98)] to-[rgba(18,26,38,0.95)] shadow-2xl backdrop-blur-xl"
            style={{
              boxShadow: `
                0 0 40px rgba(244,178,102,0.1),
                0 20px 60px -15px rgba(0,0,0,0.5),
                inset 0 1px 0 rgba(255,255,255,0.1)
              `,
            }}
          >
            {/* Animated gradient border */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-40">
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute -inset-[100%] bg-[conic-gradient(from_0deg,transparent,rgba(244,178,102,0.3),transparent_120deg)]"
              />
            </div>

            {/* Content */}
            <div className="relative px-6 py-5 md:px-8 md:py-6">
              <div className="flex items-center gap-4">
                {/* Icon with animated glow */}
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative flex-shrink-0"
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[rgba(244,178,102,0.3)] to-[rgba(88,198,177,0.3)] blur-xl" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(244,178,102,0.15)] to-[rgba(88,198,177,0.15)] ring-2 ring-[var(--color-accent)]/30 md:h-16 md:w-16">
                    <Music2 className="h-7 w-7 text-[var(--color-accent)] md:h-8 md:w-8" />
                  </div>
                </motion.div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex items-center gap-2"
                  >
                    <h2 className="bg-gradient-to-r from-[var(--color-text)] to-[var(--color-accent)] bg-clip-text text-lg font-bold text-transparent md:text-xl">
                      Welcome to Starchild Music
                    </h2>
                    <motion.div
                      animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
                    </motion.div>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mt-1 text-sm text-[var(--color-subtext)] md:text-base"
                  >
                    Search and play from 50 million+ tracks instantly
                  </motion.p>
                </div>

                {/* Close button */}
                {onDismiss && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    onClick={onDismiss}
                    className="group flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] text-[var(--color-muted)] transition-all hover:bg-[rgba(244,178,102,0.15)] hover:text-[var(--color-accent)] active:scale-95"
                    aria-label="Dismiss"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M1 1L13 13M13 1L1 13" />
                    </svg>
                  </motion.button>
                )}
              </div>

              {/* Hint with play icon */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-4 flex items-center gap-2 text-xs text-[var(--color-muted)] md:text-sm"
              >
                <Play className="h-3 w-3" />
                <span>Start playing to unlock the visualizer experience</span>
              </motion.div>
            </div>

            {/* Bottom accent line with animation */}
            <div className="relative h-1 overflow-hidden">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 1,
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-60"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

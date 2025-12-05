// File: src/hooks/useAudioReactiveBackground.ts

"use client";

import { useAudioVisualizer } from "@/hooks/useAudioVisualizer";
import { analyzeAudio } from "@/utils/audioAnalysis";
import { useEffect, useRef } from "react";

/**
 * Hook that analyzes audio and updates CSS variables for reactive background effects
 */
export function useAudioReactiveBackground(
  audioElement: HTMLAudioElement | null,
  isPlaying: boolean,
  enabled = true,
) {
  const visualizer = useAudioVisualizer(audioElement, {
    fftSize: 128, // Reduced from 256 for better performance
    smoothingTimeConstant: 0.9, // Increased smoothing for more subtle changes
  });

  // Memoize stable values to avoid recreating the effect on every render
  const isInitialized = visualizer.isInitialized;
  const getFrequencyData = visualizer.getFrequencyData;
  const audioContext = visualizer.audioContext;
  const getFFTSize = visualizer.getFFTSize;
  const initialize = visualizer.initialize;
  const resumeContext = visualizer.resumeContext;

  const animationFrameRef = useRef<number | null>(null);
  const previousAnalysisRef = useRef<{
    overallVolume: number;
    bass: number;
  } | null>(null);

  useEffect(() => {
    // Only hide backgrounds when explicitly disabled (not when just not playing)
    if (!enabled) {
      document.documentElement.classList.add("visualizer-disabled");
      document.body.classList.add("visualizer-disabled");
    } else {
      document.documentElement.classList.remove("visualizer-disabled");
      document.body.classList.remove("visualizer-disabled");
    }

    // Don't show dark screen when not playing - just reset variables
    if (!enabled || !isPlaying || !isInitialized || !audioElement) {
      // Reset to default when not playing or disabled
      document.documentElement.style.setProperty("--audio-intensity", "0");
      document.documentElement.style.setProperty("--audio-bass", "0");
      document.documentElement.style.setProperty("--audio-energy", "0");
      document.documentElement.style.setProperty("--audio-treble", "0");
      document.documentElement.style.setProperty("--audio-hue", "0");
      document.documentElement.style.setProperty("--audio-strobe", "0");

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const updateBackground = () => {
      const frequencyData = getFrequencyData();
      if (frequencyData.length === 0) {
        animationFrameRef.current = requestAnimationFrame(updateBackground);
        return;
      }

      // Get audio context sample rate and fft size for analysis
      if (!audioContext) {
        animationFrameRef.current = requestAnimationFrame(updateBackground);
        return;
      }

      const sampleRate = audioContext.sampleRate;
      const fftSize = getFFTSize();
      const analysis = analyzeAudio(frequencyData, sampleRate, fftSize);

      // Smooth the values to prevent jitter - increased smoothing for subtlety
      const previous = previousAnalysisRef.current;
      const smoothing = 0.7;

      const overallVolume = previous
        ? previous.overallVolume * smoothing +
          analysis.overallVolume * (1 - smoothing)
        : analysis.overallVolume;

      const bass = previous
        ? previous.bass * smoothing +
          analysis.frequencyBands.bass * (1 - smoothing)
        : analysis.frequencyBands.bass;

      previousAnalysisRef.current = { overallVolume, bass };

      // Calculate intensity (0-1) - reduced multipliers for subtlety
      const intensity = Math.min(1, overallVolume * 0.6); // Reduced from 1.2
      const bassBoost = Math.min(1, bass * 0.7); // Reduced from 1.3
      const energy = Math.min(1, (overallVolume + bass) * 0.5); // Reduced from 1.1
      const trebleBoost = Math.min(1, analysis.frequencyBands.treble * 0.6); // Reduced from 1.2

      // Calculate hue shift based on frequency bands - disco color cycling
      // Bass = red/orange, Mid = yellow/green, Treble = blue/purple/pink
      const bassWeight = analysis.frequencyBands.bass;
      const midWeight = analysis.frequencyBands.mid;
      const trebleWeight = analysis.frequencyBands.treble;

      // Normalize weights
      const total = bassWeight + midWeight + trebleWeight;
      const normalizedBass = total > 0 ? bassWeight / total : 0;
      const normalizedMid = total > 0 ? midWeight / total : 0;
      const normalizedTreble = total > 0 ? trebleWeight / total : 0;

      // Flow field hue range: Wider separation for more distinct colors
      // Bass = red-orange (0-60), Mid = yellow-green-cyan (60-180), Treble = blue-purple-pink (180-360)
      const hue =
        normalizedBass * 60 + normalizedMid * 120 + normalizedTreble * 180;

      // Add time-based color cycling for smooth transitions (use performance.now() for better accuracy)
      // Only update when tab is visible to save resources
      // Increased multiplier for faster, more dramatic color shifts
      const timeHue =
        typeof window !== "undefined" && !document.hidden
          ? (performance.now() / 40) % 360
          : 0;
      const discoHue = (hue + timeHue * 0.5) % 360;

      // Strobe effect based on bass hits - disabled for subtlety and resource saving
      const strobe = 0; // Disabled strobe effect

      // Update CSS variables with disco lightshow values
      document.documentElement.style.setProperty(
        "--audio-intensity",
        intensity.toString(),
      );
      document.documentElement.style.setProperty(
        "--audio-bass",
        bassBoost.toString(),
      );
      document.documentElement.style.setProperty(
        "--audio-energy",
        energy.toString(),
      );
      document.documentElement.style.setProperty(
        "--audio-treble",
        trebleBoost.toString(),
      );
      document.documentElement.style.setProperty(
        "--audio-hue",
        discoHue.toString(),
      );
      document.documentElement.style.setProperty(
        "--audio-strobe",
        strobe.toString(),
      );

      animationFrameRef.current = requestAnimationFrame(updateBackground);
    };

    // Initialize visualizer if needed
    if (!isInitialized && audioElement) {
      initialize();
      // Try to resume context if suspended
      void resumeContext();
    }

    // Start the animation loop only if initialized
    if (isInitialized) {
      animationFrameRef.current = requestAnimationFrame(updateBackground);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [
    enabled,
    isPlaying,
    isInitialized,
    audioElement,
    getFrequencyData,
    audioContext,
    getFFTSize,
    initialize,
    resumeContext,
  ]);
}

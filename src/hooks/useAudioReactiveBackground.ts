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
  enabled = true
) {
  const visualizer = useAudioVisualizer(audioElement, {
    fftSize: 256,
    smoothingTimeConstant: 0.8,
  });

  // Memoize stable values to avoid recreating the effect on every render
  const isInitialized = visualizer.isInitialized;
  const getFrequencyData = visualizer.getFrequencyData;
  const audioContext = visualizer.audioContext;
  const getFFTSize = visualizer.getFFTSize;
  const initialize = visualizer.initialize;
  const resumeContext = visualizer.resumeContext;

  const animationFrameRef = useRef<number | null>(null);
  const previousAnalysisRef = useRef<{ overallVolume: number; bass: number } | null>(null);

  useEffect(() => {
    if (!enabled || !isPlaying || !isInitialized || !audioElement) {
      // Reset to default when not playing or disabled
      document.documentElement.style.setProperty("--audio-intensity", "0");
      document.documentElement.style.setProperty("--audio-bass", "0");
      document.documentElement.style.setProperty("--audio-energy", "0");
      document.documentElement.style.setProperty("--audio-hue", "0");
      
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

      // Smooth the values to prevent jitter
      const previous = previousAnalysisRef.current;
      const smoothing = 0.7;
      
      const overallVolume = previous
        ? previous.overallVolume * smoothing + analysis.overallVolume * (1 - smoothing)
        : analysis.overallVolume;
      
      const bass = previous
        ? previous.bass * smoothing + analysis.frequencyBands.bass * (1 - smoothing)
        : analysis.frequencyBands.bass;

      previousAnalysisRef.current = { overallVolume, bass };

      // Calculate intensity (0-1) - more subtle effects
      const intensity = Math.min(1, overallVolume * 0.8);
      const bassBoost = Math.min(1, bass * 0.9);
      const energy = Math.min(1, (overallVolume + bass) * 0.7);

      // Calculate hue shift based on frequency bands - more subtle
      // Bass = red/orange, Mid = yellow/gold, Treble = purple/blue
      const bassWeight = analysis.frequencyBands.bass;
      const midWeight = analysis.frequencyBands.mid;
      const trebleWeight = analysis.frequencyBands.treble;
      
      // Normalize weights
      const total = bassWeight + midWeight + trebleWeight;
      const normalizedBass = total > 0 ? bassWeight / total : 0;
      const normalizedMid = total > 0 ? midWeight / total : 0;
      const normalizedTreble = total > 0 ? trebleWeight / total : 0;
      
      // Hue range: 0-60 (red-orange-yellow) for bass/mid, 240-300 (purple-pink) for treble
      // More subtle hue shifts
      const hue = normalizedBass * 10 + normalizedMid * 30 + normalizedTreble * 250;

      // Update CSS variables with more subtle values
      document.documentElement.style.setProperty("--audio-intensity", intensity.toString());
      document.documentElement.style.setProperty("--audio-bass", bassBoost.toString());
      document.documentElement.style.setProperty("--audio-energy", energy.toString());
      document.documentElement.style.setProperty("--audio-hue", hue.toString());

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
  }, [enabled, isPlaying, isInitialized, audioElement, getFrequencyData, audioContext, getFFTSize, initialize, resumeContext]);
}


// File: src/components/FlowFieldBackground.tsx

"use client";

import { useEffect, useRef } from "react";
import { FlowFieldRenderer } from "./visualizers/FlowFieldRenderer";

// Global tracking of audio elements that have been connected to MediaElementSourceNode
// Once an audio element is connected, it can NEVER be connected to another source node
// This is a browser limitation - we must track this globally to prevent reconnection attempts
const connectedAudioElements = new WeakMap<
  HTMLAudioElement,
  {
    sourceNode: MediaElementAudioSourceNode;
    audioContext: AudioContext;
    analyser: AnalyserNode;
  }
>();

interface FlowFieldBackgroundProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  onRendererReady?: (renderer: FlowFieldRenderer | null) => void;
}

export function FlowFieldBackground({
  audioElement,
  isPlaying,
  onRendererReady,
}: FlowFieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FlowFieldRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const connectedAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Web Audio API
  useEffect(() => {
    if (!audioElement) {
      // Clean up refs when audio element is removed
      sourceNodeRef.current = null;
      analyserRef.current = null;
      audioContextRef.current = null;
      connectedAudioElementRef.current = null;
      return;
    }

    // Check if this audio element is already connected globally
    const existingConnection = connectedAudioElements.get(audioElement);
    
    if (existingConnection) {
      // Reuse existing connection - audio element can only be connected once
      const { sourceNode, audioContext, analyser } = existingConnection;
      
      // Verify the connection is still valid
      if (audioContext.state !== "closed" && sourceNode && analyser) {
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        sourceNodeRef.current = sourceNode;
        connectedAudioElementRef.current = audioElement;
        
        // Ensure analyser is connected to destination (might have been disconnected)
        try {
          analyser.disconnect();
          analyser.connect(audioContext.destination);
        } catch {
          // Already connected or context closed, ignore
        }
        
        return;
      } else {
        // Connection is invalid, remove from map and create new one
        connectedAudioElements.delete(audioElement);
      }
    }

    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    // Create new connection
    try {
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.75;

      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      // Store in global map - this audio element can NEVER be connected to another source
      connectedAudioElements.set(audioElement, {
        sourceNode: source,
        audioContext,
        analyser,
      });

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceNodeRef.current = source;
      connectedAudioElementRef.current = audioElement;
    } catch (error) {
      console.error("Failed to create MediaElementSourceNode:", error);
      // Reset refs
      audioContextRef.current = null;
      analyserRef.current = null;
      sourceNodeRef.current = null;
      connectedAudioElementRef.current = null;
    }

    return () => {
      // On cleanup, we DON'T disconnect the source node from the audio element
      // because once connected, it can never be reconnected to another source node
      // We only clean up our refs - the connection persists globally
      sourceNodeRef.current = null;
      analyserRef.current = null;
      audioContextRef.current = null;
      // Keep connectedAudioElementRef set so we can detect reuse
      // Don't reset it - we want to reuse the global connection on remount
    };
  }, [audioElement]);

  // Initialize renderer and handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      // Use display size - renderer handles quality scaling internally
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      if (rendererRef.current) {
        rendererRef.current.resize(window.innerWidth, window.innerHeight);
      } else {
        rendererRef.current = new FlowFieldRenderer(canvas);
      }
      onRendererReady?.(rendererRef.current);
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
      onRendererReady?.(null);
      rendererRef.current = null;
    };
  }, [onRendererReady]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !analyserRef.current || !rendererRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const analyser = analyserRef.current;
    const renderer = rendererRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const animate = () => {
      analyser.getByteFrequencyData(dataArray);
      renderer.render(dataArray, dataArray.length);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Resume audio context if suspended
    if (audioContextRef.current?.state === "suspended") {
      void audioContextRef.current.resume();
    }

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
        opacity: 0.6,
        filter: "blur(8px) contrast(1.4) saturate(1.6)",
        mixBlendMode: "screen",
      }}
    />
  );
}

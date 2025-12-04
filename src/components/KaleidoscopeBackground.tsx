"use client";

import { useEffect, useRef } from "react";
import { KaleidoscopeRenderer } from "./visualizers/KaleidoscopeRenderer";

interface KaleidoscopeBackgroundProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
}

export function KaleidoscopeBackground({
  audioElement,
  isPlaying,
}: KaleidoscopeBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<KaleidoscopeRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio API
  useEffect(() => {
    if (!audioElement) return;

    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.75;

    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    return () => {
      source.disconnect();
      analyser.disconnect();
      void audioContext.close();
    };
  }, [audioElement]);

  // Initialize renderer and handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      if (rendererRef.current) {
        rendererRef.current.resize(window.innerWidth, window.innerHeight);
      } else {
        rendererRef.current = new KaleidoscopeRenderer(canvas);
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
      rendererRef.current = null;
    };
  }, []);

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
      }}
    />
  );
}

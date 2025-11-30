// File: src/components/AudioVisualizer.tsx

"use client";

import { useAudioVisualizer } from "@/hooks/useAudioVisualizer";
import { analyzeAudio, type AudioAnalysis } from "@/utils/audioAnalysis";
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Maximize2,
  Minimize2,
  Move,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { BarsRenderer } from "./visualizers/BarsRenderer";
import { SpectrumRenderer } from "./visualizers/SpectrumRenderer";
import { WaveRenderer } from "./visualizers/WaveRenderer";
import { CircularRenderer } from "./visualizers/CircularRenderer";
import { SpectralWavesRenderer } from "./visualizers/SpectralWavesRenderer";
import { RadialSpectrumRenderer } from "./visualizers/RadialSpectrumRenderer";
import { ParticleRenderer } from "./visualizers/ParticleRenderer";
import { FrequencyRingsRenderer } from "./visualizers/FrequencyRingsRenderer";
import { FrequencyBandBarsRenderer } from "./visualizers/FrequencyBandBarsRenderer";
import { FrequencyBandCircularRenderer } from "./visualizers/FrequencyBandCircularRenderer";
import { FrequencyBandLayeredRenderer } from "./visualizers/FrequencyBandLayeredRenderer";
import { FrequencyBandWaterfallRenderer } from "./visualizers/FrequencyBandWaterfallRenderer";
import { FrequencyBandRadialRenderer } from "./visualizers/FrequencyBandRadialRenderer";
import { FrequencyBandParticlesRenderer } from "./visualizers/FrequencyBandParticlesRenderer";
import type { ColorPalette } from "@/utils/colorExtractor";

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  width?: number;
  height?: number;
  barCount?: number;
  barColor?: string;
  barGap?: number;
  type?: VisualizerType;
  onTypeChange?: (type: VisualizerType) => void;
  colorPalette?: ColorPalette | null;
  isDraggable?: boolean;
  blendWithBackground?: boolean;
}

const VISUALIZER_TYPES = [
  "bars",
  "spectrum",
  "oscilloscope",
  "spectral-waves",
  "radial-spectrum",
  "wave",
  "circular",
  "waveform-mirror",
  "particles",
  "frequency-rings",
  "frequency-bands",
  "frequency-circular",
  "frequency-layered",
  "frequency-waterfall",
  "frequency-radial",
  "frequency-particles",
] as const;

type VisualizerType = (typeof VISUALIZER_TYPES)[number];
type VisualizerDimensions = { width: number; height: number };
type VisualizerPosition = { x: number; y: number };

const MIN_WIDTH = 220;
const MIN_HEIGHT = 110;
const VIEWPORT_PADDING = 16;
const PLAYER_STACK_HEIGHT = 190;
const MAX_EXPANDED_WIDTH = 960;
const MAX_EXPANDED_HEIGHT = 520;

const formatVisualizerLabel = (value: VisualizerType) =>
  value
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

export function AudioVisualizer({
  audioElement,
  isPlaying,
  width: initialWidth = 300,
  height: initialHeight = 80,
  barCount = 64,
  barColor = "rgba(99, 102, 241, 0.8)",
  barGap = 2,
  type = "bars",
  onTypeChange,
  colorPalette = null,
  isDraggable = false,
  blendWithBackground = false,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dimensions, setDimensions] = useState<VisualizerDimensions>(() => ({
    width: Math.max(MIN_WIDTH, initialWidth),
    height: Math.max(MIN_HEIGHT, initialHeight),
  }));
  const [position, setPosition] = useState<VisualizerPosition>({
    x: VIEWPORT_PADDING,
    y: VIEWPORT_PADDING,
  });
  const [currentType, setCurrentType] = useState(type);
  const [showTypeLabel, setShowTypeLabel] = useState(false);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const dragStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const typeLabelTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const positionInitializedRef = useRef(false);
  const collapsedDimensionsRef = useRef<VisualizerDimensions>({
    width: Math.max(MIN_WIDTH, initialWidth),
    height: Math.max(MIN_HEIGHT, initialHeight),
  });
  const clampPositionWithDimensions = useCallback(
    (
      nextPosition: VisualizerPosition,
      nextDimensions: VisualizerDimensions = dimensions,
    ): VisualizerPosition => {
      if (typeof window === "undefined") {
        return nextPosition;
      }
      const maxX = Math.max(
        VIEWPORT_PADDING,
        window.innerWidth - nextDimensions.width - VIEWPORT_PADDING,
      );
      const maxY = Math.max(
        VIEWPORT_PADDING,
        window.innerHeight - nextDimensions.height - VIEWPORT_PADDING,
      );
      return {
        x: Math.min(Math.max(VIEWPORT_PADDING, nextPosition.x), maxX),
        y: Math.min(Math.max(VIEWPORT_PADDING, nextPosition.y), maxY),
      };
    },
    [dimensions],
  );

  useEffect(() => {
    if (positionInitializedRef.current) return;
    if (typeof window === "undefined") return;

    const anchoredPosition = clampPositionWithDimensions({
      x: VIEWPORT_PADDING,
      y: Math.max(
        VIEWPORT_PADDING,
        window.innerHeight - (dimensions.height + PLAYER_STACK_HEIGHT),
      ),
    });

    setPosition(anchoredPosition);
    positionInitializedRef.current = true;
  }, [clampPositionWithDimensions, dimensions.height]);

  useEffect(() => {
    setPosition((prev) => {
      const clamped = clampPositionWithDimensions(prev);
      if (clamped.x === prev.x && clamped.y === prev.y) {
        return prev;
      }
      return clamped;
    });
  }, [clampPositionWithDimensions]);

  useEffect(() => {
    if (typeof window === "undefined" || !isDraggable) return;
    const handleWindowResize = () => {
      setPosition((prev) => {
        const clamped = clampPositionWithDimensions(prev);
        if (clamped.x === prev.x && clamped.y === prev.y) {
          return prev;
        }
        return clamped;
      });
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [clampPositionWithDimensions, isDraggable]);

  // Renderer instances
  const barsRendererRef = useRef<BarsRenderer | null>(null);
  const spectrumRendererRef = useRef<SpectrumRenderer | null>(null);
  const waveRendererRef = useRef<WaveRenderer | null>(null);
  const circularRendererRef = useRef<CircularRenderer | null>(null);
  const spectralWavesRendererRef = useRef<SpectralWavesRenderer | null>(null);
  const radialSpectrumRendererRef = useRef<RadialSpectrumRenderer | null>(null);
  const particleRendererRef = useRef<ParticleRenderer | null>(null);
  const frequencyRingsRendererRef = useRef<FrequencyRingsRenderer | null>(null);
  const frequencyBandBarsRendererRef = useRef<FrequencyBandBarsRenderer | null>(null);
  const frequencyBandCircularRendererRef = useRef<FrequencyBandCircularRenderer | null>(null);
  const frequencyBandLayeredRendererRef = useRef<FrequencyBandLayeredRenderer | null>(null);
  const frequencyBandWaterfallRendererRef = useRef<FrequencyBandWaterfallRenderer | null>(null);
  const frequencyBandRadialRendererRef = useRef<FrequencyBandRadialRenderer | null>(null);
  const frequencyBandParticlesRendererRef = useRef<FrequencyBandParticlesRenderer | null>(null);

  const visualizer = useAudioVisualizer(audioElement, {
    fftSize: 2048,
    smoothingTimeConstant: 0.75,
  });

  // Enhanced audio analysis state (using ref for immediate access in render loop)
  const audioAnalysisRef = useRef<AudioAnalysis | null>(null);

  // Initialize renderers
  useEffect(() => {
    barsRendererRef.current = new BarsRenderer(barCount);
    spectrumRendererRef.current = new SpectrumRenderer(barCount, barGap);
    waveRendererRef.current = new WaveRenderer();
    circularRendererRef.current = new CircularRenderer(barCount);
    spectralWavesRendererRef.current = new SpectralWavesRenderer();
    radialSpectrumRendererRef.current = new RadialSpectrumRenderer(barCount);
    particleRendererRef.current = new ParticleRenderer(barCount, barGap, barColor);
    frequencyRingsRendererRef.current = new FrequencyRingsRenderer(8);
    frequencyBandBarsRendererRef.current = new FrequencyBandBarsRenderer();
    frequencyBandCircularRendererRef.current = new FrequencyBandCircularRenderer();
    frequencyBandLayeredRendererRef.current = new FrequencyBandLayeredRenderer();
    frequencyBandWaterfallRendererRef.current = new FrequencyBandWaterfallRenderer();
    frequencyBandRadialRendererRef.current = new FrequencyBandRadialRenderer();
    frequencyBandParticlesRendererRef.current = new FrequencyBandParticlesRenderer();
  }, [barCount, barGap, barColor]);

  // Sync external type changes
  useEffect(() => {
    setCurrentType(type);
  }, [type]);

  // Cleanup type label timeout
  useEffect(() => {
    return () => {
      if (typeLabelTimeoutRef.current) {
        clearTimeout(typeLabelTimeoutRef.current);
      }
    };
  }, []);

  const showTypeFeedback = () => {
    setShowTypeLabel(true);
    if (typeLabelTimeoutRef.current) {
      clearTimeout(typeLabelTimeoutRef.current);
    }
    typeLabelTimeoutRef.current = setTimeout(() => {
      setShowTypeLabel(false);
    }, 1500);
  };

  const applyVisualizerType = (nextType: VisualizerType) => {
    setCurrentType(nextType);
    onTypeChange?.(nextType);
    showTypeFeedback();
  };

  // Handle cycling through visualizer types
  const cycleVisualizerType = (direction: 1 | -1 = 1) => {
    const currentIndex = VISUALIZER_TYPES.indexOf(currentType);
    const nextIndex =
      (currentIndex + direction + VISUALIZER_TYPES.length) % VISUALIZER_TYPES.length;
    const nextType = VISUALIZER_TYPES[nextIndex]!;
    applyVisualizerType(nextType);
  };

  const handleCanvasClick = () => {
    cycleVisualizerType(1);
  };

  // Initialize visualizer
  useEffect(() => {
    if (audioElement && !visualizer.isInitialized) {
      const handleUserInteraction = () => {
        visualizer.initialize();
      };

      document.addEventListener("click", handleUserInteraction, { once: true });

      return () => {
        document.removeEventListener("click", handleUserInteraction);
      };
    }
  }, [audioElement, visualizer]);

  // Handle resize start
  const handleResizeStart = (e: ReactMouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: dimensions.width,
      height: dimensions.height,
    };
  };

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;

      const nextDimensions: VisualizerDimensions = {
        width: Math.max(MIN_WIDTH, resizeStartRef.current.width + deltaX),
        height: Math.max(MIN_HEIGHT, resizeStartRef.current.height + deltaY),
      };

      setDimensions(nextDimensions);
      setPosition((prev) => {
        const clamped = clampPositionWithDimensions(prev, nextDimensions);
        if (clamped.x === prev.x && clamped.y === prev.y) {
          return prev;
        }
        return clamped;
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [clampPositionWithDimensions, isResizing]);

  // Toggle expanded mode
  const toggleExpanded = () => {
    if (typeof window === "undefined") {
      setIsExpanded((prev) => !prev);
      return;
    }

    if (!isExpanded) {
      collapsedDimensionsRef.current = dimensions;

      const expandedSize: VisualizerDimensions = {
        width: Math.max(
          MIN_WIDTH,
          Math.min(MAX_EXPANDED_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2),
        ),
        height: Math.max(
          MIN_HEIGHT,
          Math.min(
            MAX_EXPANDED_HEIGHT,
            window.innerHeight - PLAYER_STACK_HEIGHT - VIEWPORT_PADDING * 2,
          ),
        ),
      };

      setDimensions(expandedSize);
      setPosition((prev) => clampPositionWithDimensions(prev, expandedSize));
      setIsExpanded(true);
    } else {
      const restoredSize = collapsedDimensionsRef.current;
      setDimensions(restoredSize);
      setPosition((prev) => clampPositionWithDimensions(prev, restoredSize));
      setIsExpanded(false);
    }
  };

  // Handle drag start
  const handleDragStart = (e: ReactMouseEvent) => {
    if (!isDraggable) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  // Handle dragging
  useEffect(() => {
    if (!isDragging || !isDraggable) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      setPosition((prev) => {
        const nextPosition = clampPositionWithDimensions({
          x: dragStartRef.current.initialX + deltaX,
          y: dragStartRef.current.initialY + deltaY,
        });

        if (nextPosition.x === prev.x && nextPosition.y === prev.y) {
          return prev;
        }

        return nextPosition;
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [clampPositionWithDimensions, isDragging, isDraggable]);











  // Start/stop visualization based on playing state
  useEffect(() => {
    if (!visualizer.isInitialized || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (isPlaying) {
      void visualizer.resumeContext();

      const renderFrame = (data: Uint8Array) => {
        // Perform enhanced audio analysis
        let currentAnalysis: AudioAnalysis | null = null;
        if (visualizer.audioContext && visualizer.analyser) {
          const sampleRate = visualizer.getSampleRate();
          const fftSize = visualizer.getFFTSize();
          currentAnalysis = analyzeAudio(data, sampleRate, fftSize);
          audioAnalysisRef.current = currentAnalysis;
        } else {
          currentAnalysis = audioAnalysisRef.current;
        }

        switch (currentType) {
          case "bars":
            barsRendererRef.current?.render(ctx, data, canvas, barCount, barGap);
            break;
          case "spectrum":
            spectrumRendererRef.current?.render(ctx, data, canvas);
            break;
          case "oscilloscope":
            waveRendererRef.current?.renderOscilloscope(ctx, visualizer.getTimeDomainData(), canvas);
            break;
          case "wave":
            waveRendererRef.current?.renderWave(ctx, visualizer.getTimeDomainData(), canvas);
            break;
          case "waveform-mirror":
            waveRendererRef.current?.renderWaveformMirror(ctx, visualizer.getTimeDomainData(), canvas);
            break;
          case "circular":
            circularRendererRef.current?.render(ctx, data, canvas, barCount);
            break;
          case "spectral-waves":
            spectralWavesRendererRef.current?.render(ctx, data, canvas, barCount);
            break;
          case "radial-spectrum":
            radialSpectrumRendererRef.current?.render(ctx, data, canvas, barCount);
            break;
          case "particles":
            particleRendererRef.current?.render(ctx, data, canvas);
            break;
          case "frequency-rings":
            frequencyRingsRendererRef.current?.render(ctx, data, canvas);
            break;
          case "frequency-bands":
            frequencyBandBarsRendererRef.current?.render(ctx, data, canvas, currentAnalysis);
            break;
          case "frequency-circular":
            frequencyBandCircularRendererRef.current?.render(ctx, data, canvas, currentAnalysis);
            break;
          case "frequency-layered":
            frequencyBandLayeredRendererRef.current?.render(ctx, data, canvas, currentAnalysis);
            break;
          case "frequency-waterfall":
            frequencyBandWaterfallRendererRef.current?.render(ctx, data, canvas, currentAnalysis);
            break;
          case "frequency-radial":
            frequencyBandRadialRendererRef.current?.render(ctx, data, canvas, currentAnalysis);
            break;
          case "frequency-particles":
            frequencyBandParticlesRendererRef.current?.render(ctx, data, canvas, currentAnalysis);
            break;
          default:
            barsRendererRef.current?.render(ctx, data, canvas, barCount, barGap);
            break;
        }
      };

      visualizer.startVisualization(renderFrame);
    } else {
      visualizer.stopVisualization();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      visualizer.stopVisualization();
    };
  }, [isPlaying, visualizer, currentType, barCount, barGap]);

  if (!visualizer.isInitialized) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-white/10 bg-[rgba(6,10,18,0.9)] px-6 py-4 text-white/70 shadow-[0_18px_40px_rgba(3,6,12,0.55)]"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">
          Click anywhere to enable the visualizer
        </p>
      </div>
    );
  }


  // Container style
  const containerStyle: React.CSSProperties = isDraggable
    ? {
        position: "fixed",
        left: position.x,
        top: position.y,
        width: dimensions.width,
        height: dimensions.height,
        zIndex: 60,
        cursor: isDragging ? "grabbing" : "auto",
      }
    : {
        width: dimensions.width,
        height: dimensions.height,
      };

  const accentBorderColor = colorPalette
    ? `hsla(${colorPalette.hue}, ${Math.min(colorPalette.saturation + 12, 100)}%, ${Math.min(
        colorPalette.lightness + 18,
        88,
      )}%, 0.55)`
    : "rgba(244,178,102,0.35)";

  // Background style with blend mode
  const backgroundStyle =
    blendWithBackground && colorPalette
      ? {
          background: `linear-gradient(135deg, hsla(${colorPalette.hue}, ${colorPalette.saturation}%, ${Math.max(
            colorPalette.lightness - 12,
            10,
          )}%, 0.58), hsla(${colorPalette.hue}, ${Math.min(
            colorPalette.saturation + 18,
            100,
          )}%, ${Math.min(colorPalette.lightness + 22, 92)}%, 0.35))`,
          backdropFilter: "blur(18px)",
          borderColor: accentBorderColor,
          boxShadow: "0 18px 45px rgba(2, 8, 20, 0.65)",
        }
      : {
          background: "linear-gradient(135deg, rgba(6, 10, 18, 0.94), rgba(16, 23, 37, 0.9))",
          backdropFilter: "blur(14px)",
          borderColor: accentBorderColor,
          boxShadow: "0 18px 45px rgba(2, 8, 20, 0.78)",
        };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border backdrop-blur-lg"
      style={{ ...containerStyle, ...backgroundStyle }}
    >
      {/* Drag Handle (only visible when draggable) */}
      {isDraggable && (
        <div
          onMouseDown={handleDragStart}
          className="absolute left-2 top-2 z-20 cursor-grab rounded-md bg-white/10 p-1.5 text-white/70 backdrop-blur active:cursor-grabbing"
          title="Drag to move"
        >
          <Move className="h-4 w-4" />
        </div>
      )}

      {/* Visualizer Type Controls */}
      <div className="pointer-events-auto absolute left-1/2 top-2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[rgba(6,10,18,0.85)] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-subtext)] shadow-[0_12px_30px_rgba(2,4,10,0.65)]">
        <button
          type="button"
          onClick={() => cycleVisualizerType(-1)}
          className="rounded-full bg-white/5 p-1 text-white/70 transition hover:bg-white/15 hover:text-white"
          title="Previous visualizer"
          aria-label="Previous visualizer"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-[0.65rem] text-[var(--color-text)]">
          {formatVisualizerLabel(currentType)}
        </span>
        <button
          type="button"
          onClick={() => cycleVisualizerType(1)}
          className="rounded-full bg-white/5 p-1 text-white/70 transition hover:bg-white/15 hover:text-white"
          title="Next visualizer"
          aria-label="Next visualizer"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleCanvasClick}
        className="h-full w-full cursor-pointer rounded-2xl"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          mixBlendMode: blendWithBackground ? "screen" : "normal",
        }}
        title="Click to cycle visualizer type"
      />

      {/* Type Label Overlay */}
      {showTypeLabel && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg bg-black/80 px-4 py-2 backdrop-blur-sm">
            <p className="text-sm font-medium capitalize text-white">
              {formatVisualizerLabel(currentType)}
            </p>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute right-2 top-2 flex gap-2">
        <button
          onClick={toggleExpanded}
          className="rounded-md bg-white/10 p-1.5 text-white/70 backdrop-blur transition hover:bg-white/20 hover:text-white"
          title={isExpanded ? "Minimize" : "Maximize"}
          aria-label={isExpanded ? "Minimize visualizer" : "Expand visualizer"}
        >
          {isExpanded ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 cursor-nwse-resize rounded-tl-2xl bg-white/10 p-1.5 text-white/80 transition hover:bg-white/20"
        title="Drag to resize"
      >
        <GripVertical className="h-4 w-4 rotate-45" />
      </div>
    </div>
  );
}

// File: src/components/AudioVisualizer.tsx

"use client";

import {
  VISUALIZER_DIMENSIONS,
  VISUALIZER_TYPES,
  type VisualizerLayoutState,
  type VisualizerType,
} from "@/constants/visualizer";
import { useAudioVisualizer } from "@/hooks/useAudioVisualizer";
import type { ColorPalette } from "@/utils/colorExtractor";
import { GripVertical, Maximize2, Minimize2, Move, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { KaleidoscopeRenderer } from "./visualizers/KaleidoscopeRenderer";
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
  onClose?: () => void;
  persistedState?: VisualizerLayoutState;
  onStateChange?: (patch: Partial<VisualizerLayoutState>) => void;
  ensureVisibleSignal?: number;
}

const {
  MIN_WIDTH,
  MIN_HEIGHT,
  VIEWPORT_PADDING,
  PLAYER_STACK_HEIGHT,
  MAX_EXPANDED_WIDTH,
  MAX_EXPANDED_HEIGHT,
} = VISUALIZER_DIMENSIONS;
type VisualizerDimensions = { width: number; height: number };
type VisualizerPosition = { x: number; y: number };

export function AudioVisualizer({
  audioElement,
  isPlaying,
  width = 300,
  height = 80,
  barCount = 64,
  barGap = 2,
  type = "flowfield",
  onTypeChange,
  colorPalette = null,
  isDraggable = false,
  blendWithBackground = false,
  onClose,
  persistedState,
  onStateChange,
  ensureVisibleSignal,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentType, setCurrentType] = useState<VisualizerType>(
    persistedState?.type ?? type,
  );
  const [showTypeLabel, setShowTypeLabel] = useState(false);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const dragStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const typeLabelTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const initialDimensions = {
    width: Math.max(MIN_WIDTH, persistedState?.width ?? width),
    height: Math.max(MIN_HEIGHT, persistedState?.height ?? height),
  };
  const initialCollapsedDimensions = {
    width: Math.max(
      MIN_WIDTH,
      persistedState?.collapsedWidth ?? initialDimensions.width,
    ),
    height: Math.max(
      MIN_HEIGHT,
      persistedState?.collapsedHeight ?? initialDimensions.height,
    ),
  };
  const getInitialPosition = () => {
    const defaultPosition = { x: VIEWPORT_PADDING, y: VIEWPORT_PADDING };
    if (persistedState) {
      return {
        x: persistedState.x ?? defaultPosition.x,
        y: persistedState.y ?? defaultPosition.y,
      };
    }
    if (typeof window === "undefined") {
      return defaultPosition;
    }
    return {
      x: defaultPosition.x,
      y: Math.max(
        VIEWPORT_PADDING,
        window.innerHeight - (initialDimensions.height + PLAYER_STACK_HEIGHT),
      ),
    };
  };

  const [dimensions, setDimensions] = useState(initialDimensions);
  const [position, setPosition] = useState(getInitialPosition);
  const [isVisible, setIsVisible] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const dimensionsRef = useRef(dimensions);
  const positionRef = useRef(position);
  const renderParamsRef = useRef({
    currentType: persistedState?.type ?? type,
    barCount,
    barGap,
  });
  const collapsedDimensionsRef = useRef(initialCollapsedDimensions);
  const onStateChangeRef =
    useRef<AudioVisualizerProps["onStateChange"]>(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);
  const persistLayoutState = useCallback(
    (patch: Partial<VisualizerLayoutState>) => {
      onStateChangeRef.current?.(patch);
    },
    [],
  );
  const clampPositionWithDimensions = useCallback(
    (
      nextPosition: VisualizerPosition,
      nextDimensions: VisualizerDimensions = dimensionsRef.current,
    ): VisualizerPosition => {
      if (typeof window === "undefined") {
        return nextPosition;
      }
      const maxX = Math.max(0, window.innerWidth - nextDimensions.width);
      const maxY = Math.max(0, window.innerHeight - nextDimensions.height);
      return {
        x: Math.max(0, Math.min(maxX, nextPosition.x)),
        y: Math.max(0, Math.min(maxY, nextPosition.y)),
      };
    },
    [],
  );
  const resetToDefaultPosition = useCallback(() => {
    if (typeof window === "undefined") return;
    const defaultDimensions = {
      width: collapsedDimensionsRef.current.width,
      height: collapsedDimensionsRef.current.height,
    };
    const defaultPosition = {
      x: VIEWPORT_PADDING,
      y: Math.max(
        VIEWPORT_PADDING,
        window.innerHeight - (defaultDimensions.height + PLAYER_STACK_HEIGHT),
      ),
    };
    setDimensions(defaultDimensions);
    setPosition(defaultPosition);
    setIsExpanded(false);
    persistLayoutState({
      width: defaultDimensions.width,
      height: defaultDimensions.height,
      collapsedWidth: defaultDimensions.width,
      collapsedHeight: defaultDimensions.height,
      x: defaultPosition.x,
      y: defaultPosition.y,
      isExpanded: false,
    });
  }, [persistLayoutState]);
  const ensureVisible = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const outOfBounds =
      rect.right < VIEWPORT_PADDING ||
      rect.left > window.innerWidth - VIEWPORT_PADDING ||
      rect.bottom < VIEWPORT_PADDING ||
      rect.top > window.innerHeight - VIEWPORT_PADDING;
    if (outOfBounds) {
      resetToDefaultPosition();
    }
  }, [resetToDefaultPosition]);

  useEffect(() => {
    dimensionsRef.current = dimensions;
  }, [dimensions]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    renderParamsRef.current = { currentType, barCount, barGap };
  }, [currentType, barCount, barGap]);

  // Keep visualizer in bounds on window resize
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setPosition((prev) => {
        const clamped = clampPositionWithDimensions(prev);
        if (clamped.x === prev.x && clamped.y === prev.y) {
          return prev;
        }
        return clamped;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampPositionWithDimensions]);

  useEffect(() => {
    if (!persistedState) return;

    setIsExpanded((prev) => persistedState.isExpanded ?? prev);

    setDimensions((prev) => {
      const next = {
        width: Math.max(MIN_WIDTH, persistedState.width ?? prev.width),
        height: Math.max(MIN_HEIGHT, persistedState.height ?? prev.height),
      };
      if (prev.width === next.width && prev.height === next.height) {
        return prev;
      }
      return next;
    });

    setPosition((prev) => {
      const desired = {
        x: persistedState.x ?? prev.x,
        y: persistedState.y ?? prev.y,
      };
      const next = clampPositionWithDimensions(desired, {
        width: Math.max(
          MIN_WIDTH,
          persistedState.width ?? dimensionsRef.current.width,
        ),
        height: Math.max(
          MIN_HEIGHT,
          persistedState.height ?? dimensionsRef.current.height,
        ),
      });
      if (prev.x === next.x && prev.y === next.y) {
        return prev;
      }
      return next;
    });

    collapsedDimensionsRef.current = {
      width: Math.max(
        MIN_WIDTH,
        persistedState.collapsedWidth ?? collapsedDimensionsRef.current.width,
      ),
      height: Math.max(
        MIN_HEIGHT,
        persistedState.collapsedHeight ?? collapsedDimensionsRef.current.height,
      ),
    };
  }, [persistedState, clampPositionWithDimensions]);
  useEffect(() => {
    ensureVisible();
  }, [ensureVisible, ensureVisibleSignal]);

  // Fade in animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Kaleidoscope renderer instance
  const kaleidoscopeRendererRef = useRef<KaleidoscopeRenderer | null>(null);

  const visualizer = useAudioVisualizer(audioElement, {
    fftSize: 2048,
    smoothingTimeConstant: 0.75,
  });


  // Initialize kaleidoscope renderer when canvas is available
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    kaleidoscopeRendererRef.current = new KaleidoscopeRenderer(canvas);

    return () => {
      kaleidoscopeRendererRef.current = null;
    };
  }, []);

  // Update kaleidoscope renderer size when dimensions change
  useEffect(() => {
    const renderer = kaleidoscopeRendererRef.current;
    if (renderer) {
      renderer.resize(dimensions.width, dimensions.height);
    }
  }, [dimensions.width, dimensions.height]);

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

  // Handle cycling through visualizer types
  const cycleVisualizerType = () => {
    const currentIndex = VISUALIZER_TYPES.indexOf(currentType);
    const nextIndex = (currentIndex + 1) % VISUALIZER_TYPES.length;
    const nextType = VISUALIZER_TYPES[nextIndex]!;

    setCurrentType(nextType);
    persistLayoutState({ type: nextType });

    // Notify parent component of type change
    onTypeChange?.(nextType);

    // Show label briefly
    setShowTypeLabel(true);
    if (typeLabelTimeoutRef.current) {
      clearTimeout(typeLabelTimeoutRef.current);
    }
    typeLabelTimeoutRef.current = setTimeout(() => {
      setShowTypeLabel(false);
    }, 1500);
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
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

      const newDimensions = {
        width: Math.max(MIN_WIDTH, resizeStartRef.current.width + deltaX),
        height: Math.max(MIN_HEIGHT, resizeStartRef.current.height + deltaY),
      };
      setDimensions(newDimensions);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      const next = dimensionsRef.current;
      const patch: Partial<VisualizerLayoutState> = {
        width: next.width,
        height: next.height,
      };
      if (!isExpanded) {
        collapsedDimensionsRef.current = { ...next };
        patch.collapsedWidth = next.width;
        patch.collapsedHeight = next.height;
      }
      persistLayoutState(patch);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, isExpanded, persistLayoutState]);

  // Toggle expanded mode
  const toggleExpanded = () => {
    if (typeof window === "undefined") {
      setIsExpanded((prev) => !prev);
      return;
    }

    if (!isExpanded) {
      collapsedDimensionsRef.current = { ...dimensionsRef.current };
      const expandedSize: VisualizerDimensions = {
        width: Math.max(
          MIN_WIDTH,
          Math.min(
            MAX_EXPANDED_WIDTH,
            window.innerWidth - VIEWPORT_PADDING * 2,
          ),
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
      persistLayoutState({
        isExpanded: true,
        width: expandedSize.width,
        height: expandedSize.height,
        collapsedWidth: collapsedDimensionsRef.current.width,
        collapsedHeight: collapsedDimensionsRef.current.height,
      });
    } else {
      const restored = collapsedDimensionsRef.current;
      setDimensions(restored);
      setPosition((prev) => clampPositionWithDimensions(prev, restored));
      setIsExpanded(false);
      persistLayoutState({
        isExpanded: false,
        width: restored.width,
        height: restored.height,
        collapsedWidth: restored.width,
        collapsedHeight: restored.height,
      });
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
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

      const desiredPosition = {
        x: dragStartRef.current.initialX + deltaX,
        y: dragStartRef.current.initialY + deltaY,
      };
      const clamped = clampPositionWithDimensions(desiredPosition);
      setPosition(clamped);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      persistLayoutState({
        x: positionRef.current.x,
        y: positionRef.current.y,
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDragging,
    isDraggable,
    clampPositionWithDimensions,
    persistLayoutState,
  ]);

  // Start/stop visualization based on playing state
  useEffect(() => {
    if (!visualizer.isInitialized || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderFrame = (data: Uint8Array) => {
      // Render kaleidoscope visualization with audio data
      kaleidoscopeRendererRef.current?.render(data, data.length);
    };

    if (isPlaying) {
      void visualizer.resumeContext();
      visualizer.startVisualization(renderFrame);
    } else {
      visualizer.stopVisualization();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      visualizer.stopVisualization();
    };
  }, [isPlaying, visualizer]);

  if (!visualizer.isInitialized) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-gray-700 bg-gray-800/50"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <p className="text-xs text-gray-500">Click to enable visualizer</p>
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
        zIndex: 40,
        cursor: isDragging ? "grabbing" : "auto",
      }
    : {
        width: dimensions.width,
        height: dimensions.height,
      };

  // Background style with blend mode matching page aesthetic
  const backgroundStyle =
    blendWithBackground && colorPalette
      ? {
          background: `linear-gradient(135deg, 
          hsla(${colorPalette.hue}, ${colorPalette.saturation}%, ${colorPalette.lightness}%, 0.25), 
          hsla(${colorPalette.hue}, ${colorPalette.saturation}%, ${Math.max(colorPalette.lightness - 10, 5)}%, 0.2))`,
          backdropFilter: "blur(16px)",
          boxShadow:
            "0 8px 32px rgba(5, 10, 18, 0.5), 0 0 24px rgba(244, 178, 102, 0.08)",
        }
      : {
          background:
            "linear-gradient(135deg, rgba(18, 26, 38, 0.85), rgba(11, 17, 24, 0.85))",
          backdropFilter: "blur(16px)",
          boxShadow:
            "0 8px 32px rgba(5, 10, 18, 0.5), 0 0 24px rgba(244, 178, 102, 0.08)",
        };

  return (
    <div
      ref={containerRef}
      className="group relative rounded-xl border border-[rgba(244,178,102,0.2)] transition-all duration-300 ease-out"
      style={{
        ...containerStyle,
        ...backgroundStyle,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "scale(1)" : "scale(0.95)",
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Drag Handle (only visible when draggable and hovering) */}
      {isDraggable && (
        <div
          onMouseDown={handleDragStart}
          className={`absolute top-2 left-2 z-30 cursor-grab rounded-lg bg-[rgba(244,178,102,0.15)] p-2 text-[var(--color-accent)] transition-all hover:bg-[rgba(244,178,102,0.25)] hover:shadow-[0_0_12px_rgba(244,178,102,0.3)] active:cursor-grabbing ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
          title="Drag to move"
        >
          <Move className="h-3.5 w-3.5" />
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={cycleVisualizerType}
        className="cursor-pointer rounded-xl transition-opacity hover:opacity-95"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          mixBlendMode: blendWithBackground ? "screen" : "screen", // Always use screen for more vibrant visuals
          opacity: 0.4, // Dimmed for subtle visuals
          filter: "blur(8px)",
        }}
        title="Click to cycle visualizer type"
      />

      {/* Type Label Overlay */}
      {showTypeLabel && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-xl border border-[rgba(244,178,102,0.3)] bg-[rgba(12,18,27,0.95)] px-5 py-2.5 shadow-[0_8px_32px_rgba(5,10,18,0.6)] backdrop-blur-md">
            <p className="text-sm font-semibold tracking-wide text-[var(--color-accent)] capitalize">
              {currentType.replace(/-/g, " ")}
            </p>
          </div>
        </div>
      )}

      {/* Controls Overlay (visible on hover) */}
      <div
        className={`absolute top-2 right-2 flex gap-1.5 transition-all ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={toggleExpanded}
          className="rounded-lg bg-[rgba(12,18,27,0.85)] p-2 text-[var(--color-subtext)] transition-all hover:bg-[rgba(12,18,27,0.95)] hover:text-[var(--color-accent)] hover:shadow-[0_0_12px_rgba(244,178,102,0.2)]"
          title={isExpanded ? "Minimize" : "Maximize"}
        >
          {isExpanded ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg bg-[rgba(12,18,27,0.85)] p-2 text-[var(--color-subtext)] transition-all hover:bg-[rgba(244,178,102,0.25)] hover:text-[var(--color-accent)] hover:shadow-[0_0_12px_rgba(244,178,102,0.2)]"
            title="Close visualizer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Resize Handle (visible on hover) */}
      <div
        onMouseDown={handleResizeStart}
        className={`absolute right-0 bottom-0 cursor-nwse-resize rounded-tl-lg bg-[rgba(244,178,102,0.15)] p-1.5 text-[var(--color-accent)] transition-all hover:bg-[rgba(244,178,102,0.25)] hover:shadow-[0_0_12px_rgba(244,178,102,0.3)] ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
        title="Drag to resize"
      >
        <GripVertical className="h-3.5 w-3.5 rotate-45" />
      </div>
    </div>
  );
}

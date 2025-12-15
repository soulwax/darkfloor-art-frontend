// File: src/components/PatternControls.tsx

"use client";

import { Layers, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import type { FlowFieldRenderer } from "./visualizers/FlowFieldRenderer";

interface PatternControlsProps {
  renderer: FlowFieldRenderer | null;
  onClose: () => void;
}

// Helper component for rendering sliders
interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  decimals?: number;
  onChange: (value: number) => void;
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  decimals = 0,
  onChange,
}: SliderControlProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm text-[var(--color-subtext)]">{label}</label>
        <span className="text-xs font-mono text-[var(--color-accent)]">
          {value.toFixed(decimals)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="accent-accent h-2 w-full cursor-pointer appearance-none rounded-full bg-[rgba(255,255,255,0.12)]"
      />
    </div>
  );
}

export default function PatternControls({
  renderer,
  onClose,
}: PatternControlsProps) {
  const [patternState, setPatternState] = useState<{
    currentPattern: string;
    nextPattern: string;
    patternDuration: number;
    transitionSpeed: number;
    transitionProgress: number;
    isTransitioning: boolean;
    fractalZoom: number;
    fractalOffsetX: number;
    fractalOffsetY: number;
    juliaC: { re: number; im: number };
    hueBase: number;
  } | null>(null);
  const [availablePatterns, setAvailablePatterns] = useState<string[]>([]);
  const [rawCurrentPattern, setRawCurrentPattern] = useState<string>("");

  // Pattern-specific parameters
  const [patternParams, setPatternParams] = useState<{
    particleCount: number;
    particleSize: number;
    particleSpeed: number;
    bubbleCount: number;
    bubbleSize: number;
    bubbleSpeed: number;
    starCount: number;
    starSpeed: number;
    rayCount: number;
    waveCount: number;
    waveAmplitude: number;
    ringCount: number;
    lightningCount: number;
    matrixSpeed: number;
    tunnelSpeed: number;
    galaxyArmCount: number;
    auroraIntensity: number;
    mandalaLayers: number;
    tarotCardSize: number;
    tarotCardCount: number;
    sacredSpiralCount: number;
    sacredSpiralTightness: number;
    pentagramSize: number;
    pentagramRotationSpeed: number;
    runeSize: number;
    runeCount: number;
    sigilCount: number;
    sigilSize: number;
    chakraSize: number;
    chakraSpacing: number;
    portalSize: number;
    portalRingCount: number;
    phoenixWingSpan: number;
    crystalGridSize: number;
    crystalCount: number;
    moonPhaseCount: number;
    moonPhaseSize: number;
    flowerOfLifeCircleCount: number;
    flowerOfLifeSize: number;
    metatronNodeCount: number;
    metatronSize: number;
    torusRingCount: number;
    torusThickness: number;
    labyrinthComplexity: number;
    labyrinthPathWidth: number;
    vortexSpiralCount: number;
    vortexRotationSpeed: number;
    dragonEyeSize: number;
    dragonPupilSize: number;
    ancientGlyphCount: number;
    ancientGlyphSize: number;
    platonicSize: number;
    platonicRotationSpeed: number;
    cosmicLotusLayerCount: number;
    cosmicLotusPetalCount: number;
  } | null>(null);

  // Get available patterns on mount
  useEffect(() => {
    if (!renderer) return;

    const patterns = renderer.getAllPatterns();
    setAvailablePatterns(patterns);
  }, [renderer]);

  // Update pattern state periodically
  useEffect(() => {
    if (!renderer) return;

    const updateState = () => {
      const state = renderer.getPatternState();
      setRawCurrentPattern(state.currentPattern);
      setPatternState({
        currentPattern: renderer.getFormattedPatternName(state.currentPattern),
        nextPattern: renderer.getFormattedPatternName(state.nextPattern),
        patternDuration: state.patternDuration,
        transitionSpeed: state.transitionSpeed,
        transitionProgress: state.transitionProgress,
        isTransitioning: state.isTransitioning,
        fractalZoom: state.fractalZoom,
        fractalOffsetX: state.fractalOffsetX,
        fractalOffsetY: state.fractalOffsetY,
        juliaC: state.juliaC,
        hueBase: state.hueBase,
      });

      // Update pattern-specific parameters
      setPatternParams({
        particleCount: renderer.getParticleCount(),
        particleSize: renderer.getParticleSize(),
        particleSpeed: renderer.getParticleSpeed(),
        bubbleCount: renderer.getBubbleCount(),
        bubbleSize: renderer.getBubbleSize(),
        bubbleSpeed: renderer.getBubbleSpeed(),
        starCount: renderer.getStarCount(),
        starSpeed: renderer.getStarSpeed(),
        rayCount: renderer.getRayCount(),
        waveCount: renderer.getWaveCount(),
        waveAmplitude: renderer.getWaveAmplitude(),
        ringCount: renderer.getRingCount(),
        lightningCount: renderer.getLightningCount(),
        matrixSpeed: renderer.getMatrixSpeed(),
        tunnelSpeed: renderer.getTunnelSpeed(),
        galaxyArmCount: renderer.getGalaxyArmCount(),
        auroraIntensity: renderer.getAuroraIntensity(),
        mandalaLayers: renderer.getMandalaLayers(),
        tarotCardSize: renderer.getTarotCardSize(),
        tarotCardCount: renderer.getTarotCardCount(),
        sacredSpiralCount: renderer.getSacredSpiralCount(),
        sacredSpiralTightness: renderer.getSacredSpiralTightness(),
        pentagramSize: renderer.getPentagramSize(),
        pentagramRotationSpeed: renderer.getPentagramRotationSpeed(),
        runeSize: renderer.getRuneSize(),
        runeCount: renderer.getRuneCount(),
        sigilCount: renderer.getSigilCount(),
        sigilSize: renderer.getSigilSize(),
        chakraSize: renderer.getChakraSize(),
        chakraSpacing: renderer.getChakraSpacing(),
        portalSize: renderer.getPortalSize(),
        portalRingCount: renderer.getPortalRingCount(),
        phoenixWingSpan: renderer.getPhoenixWingSpan(),
        crystalGridSize: renderer.getCrystalGridSize(),
        crystalCount: renderer.getCrystalCount(),
        moonPhaseCount: renderer.getMoonPhaseCount(),
        moonPhaseSize: renderer.getMoonPhaseSize(),
        flowerOfLifeCircleCount: renderer.getFlowerOfLifeCircleCount(),
        flowerOfLifeSize: renderer.getFlowerOfLifeSize(),
        metatronNodeCount: renderer.getMetatronNodeCount(),
        metatronSize: renderer.getMetatronSize(),
        torusRingCount: renderer.getTorusRingCount(),
        torusThickness: renderer.getTorusThickness(),
        labyrinthComplexity: renderer.getLabyrinthComplexity(),
        labyrinthPathWidth: renderer.getLabyrinthPathWidth(),
        vortexSpiralCount: renderer.getVortexSpiralCount(),
        vortexRotationSpeed: renderer.getVortexRotationSpeed(),
        dragonEyeSize: renderer.getDragonEyeSize(),
        dragonPupilSize: renderer.getDragonPupilSize(),
        ancientGlyphCount: renderer.getAncientGlyphCount(),
        ancientGlyphSize: renderer.getAncientGlyphSize(),
        platonicSize: renderer.getPlatonicSize(),
        platonicRotationSpeed: renderer.getPlatonicRotationSpeed(),
        cosmicLotusLayerCount: renderer.getCosmicLotusLayerCount(),
        cosmicLotusPetalCount: renderer.getCosmicLotusPetalCount(),
      });
    };

    updateState();
    const interval = setInterval(updateState, 100); // Update 10 times per second

    return () => clearInterval(interval);
  }, [renderer]);

  if (!renderer || !patternState || !patternParams) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed bottom-24 left-1/2 z-50 w-full max-w-md -translate-x-1/2 rounded-lg border border-[rgba(244,178,102,0.18)] bg-[rgba(12,18,27,0.98)] shadow-2xl shadow-[rgba(5,10,18,0.8)] backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(244,178,102,0.12)] px-4 py-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[var(--color-accent)]" />
            <h3 className="font-semibold text-[var(--color-text)]">
              Pattern Controls
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-[var(--color-subtext)] transition hover:bg-[rgba(244,178,102,0.12)] hover:text-[var(--color-text)]"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {/* Pattern Selection */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-[var(--color-text)]">
              Select Pattern
            </label>
            <div className="relative">
              <select
                value={rawCurrentPattern}
                onChange={(e) => {
                  renderer.setPattern(e.target.value as any);
                }}
                className="w-full appearance-none rounded-lg border border-[rgba(244,178,102,0.18)] bg-[rgba(12,18,27,0.95)] px-4 py-2.5 pr-10 text-sm text-[var(--color-text)] transition hover:border-[rgba(244,178,102,0.3)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                {availablePatterns.map((pattern) => (
                  <option key={pattern} value={pattern}>
                    {renderer.getFormattedPatternName(pattern)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-accent)]" />
            </div>
            {patternState.isTransitioning && (
              <div className="mt-2 text-xs text-[var(--color-subtext)]">
                Transitioning to: {patternState.nextPattern} (
                {Math.round(patternState.transitionProgress * 100)}%)
              </div>
            )}
          </div>

          {/* General Controls */}
          <div className="mb-6 space-y-4">
            <h4 className="text-sm font-semibold text-[var(--color-text)]">
              General
            </h4>

            <SliderControl
              label="Pattern Duration"
              value={patternState.patternDuration}
              min={50}
              max={1000}
              step={10}
              decimals={0}
              onChange={(value) => {
                renderer.setPatternDuration(value);
                setPatternState((prev) =>
                  prev ? { ...prev, patternDuration: value } : null,
                );
              }}
            />

            <SliderControl
              label="Transition Speed"
              value={patternState.transitionSpeed}
              min={0.001}
              max={0.1}
              step={0.001}
              decimals={3}
              onChange={(value) => {
                renderer.setTransitionSpeed(value);
                setPatternState((prev) =>
                  prev ? { ...prev, transitionSpeed: value } : null,
                );
              }}
            />

            <SliderControl
              label="Hue Base"
              value={patternState.hueBase}
              min={0}
              max={360}
              step={1}
              unit="°"
              decimals={0}
              onChange={(value) => {
                renderer.setHueBase(value);
                setPatternState((prev) =>
                  prev ? { ...prev, hueBase: value } : null,
                );
              }}
            />
          </div>

          {/* Pattern-Specific Controls */}
          {rawCurrentPattern === "fractal" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Fractal Controls
              </h4>

            {/* Fractal Zoom */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm text-[var(--color-subtext)]">
                  Zoom
                </label>
                <span className="text-xs font-mono text-[var(--color-accent)]">
                  {patternState.fractalZoom.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={patternState.fractalZoom}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  renderer.setFractalZoom(value);
                  setPatternState((prev) =>
                    prev ? { ...prev, fractalZoom: value } : null,
                  );
                }}
                className="accent-accent h-2 w-full cursor-pointer appearance-none rounded-full bg-[rgba(255,255,255,0.12)]"
              />
            </div>

            {/* Fractal Offset X */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm text-[var(--color-subtext)]">
                  Offset X
                </label>
                <span className="text-xs font-mono text-[var(--color-accent)]">
                  {patternState.fractalOffsetX.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.01"
                value={patternState.fractalOffsetX}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  renderer.setFractalOffsetX(value);
                  setPatternState((prev) =>
                    prev ? { ...prev, fractalOffsetX: value } : null,
                  );
                }}
                className="accent-accent h-2 w-full cursor-pointer appearance-none rounded-full bg-[rgba(255,255,255,0.12)]"
              />
            </div>

            {/* Fractal Offset Y */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm text-[var(--color-subtext)]">
                  Offset Y
                </label>
                <span className="text-xs font-mono text-[var(--color-accent)]">
                  {patternState.fractalOffsetY.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.01"
                value={patternState.fractalOffsetY}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  renderer.setFractalOffsetY(value);
                  setPatternState((prev) =>
                    prev ? { ...prev, fractalOffsetY: value } : null,
                  );
                }}
                className="accent-accent h-2 w-full cursor-pointer appearance-none rounded-full bg-[rgba(255,255,255,0.12)]"
              />
            </div>

            {/* Julia C Real */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm text-[var(--color-subtext)]">
                  Julia C (Real)
                </label>
                <span className="text-xs font-mono text-[var(--color-accent)]">
                  {patternState.juliaC.re.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.01"
                value={patternState.juliaC.re}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  renderer.setJuliaC(value, patternState.juliaC.im);
                  setPatternState((prev) =>
                    prev
                      ? {
                          ...prev,
                          juliaC: { ...prev.juliaC, re: value },
                        }
                      : null,
                  );
                }}
                className="accent-accent h-2 w-full cursor-pointer appearance-none rounded-full bg-[rgba(255,255,255,0.12)]"
              />
            </div>

            {/* Julia C Imaginary */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm text-[var(--color-subtext)]">
                  Julia C (Imaginary)
                </label>
                <span className="text-xs font-mono text-[var(--color-accent)]">
                  {patternState.juliaC.im.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.01"
                value={patternState.juliaC.im}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  renderer.setJuliaC(patternState.juliaC.re, value);
                  setPatternState((prev) =>
                    prev
                      ? {
                          ...prev,
                          juliaC: { ...prev.juliaC, im: value },
                        }
                      : null,
                  );
                }}
                className="accent-accent h-2 w-full cursor-pointer appearance-none rounded-full bg-[rgba(255,255,255,0.12)]"
              />
            </div>
            </div>
          )}

          {/* Rays Controls */}
          {rawCurrentPattern === "rays" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Rays Controls
              </h4>
              <SliderControl
                label="Ray Count"
                value={patternParams.rayCount}
                min={6}
                max={72}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setRayCount(value)}
              />
            </div>
          )}

          {/* Waves Controls */}
          {rawCurrentPattern === "waves" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Waves Controls
              </h4>
              <SliderControl
                label="Wave Count"
                value={patternParams.waveCount}
                min={1}
                max={15}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setWaveCount(value)}
              />
              <SliderControl
                label="Wave Amplitude"
                value={patternParams.waveAmplitude}
                min={0.1}
                max={3.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setWaveAmplitude(value)}
              />
            </div>
          )}

          {/* Swarm/Particle Controls */}
          {(rawCurrentPattern === "swarm" || rawCurrentPattern === "fluid") && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Particle Controls
              </h4>
              <SliderControl
                label="Particle Count"
                value={patternParams.particleCount}
                min={50}
                max={2000}
                step={50}
                decimals={0}
                onChange={(value) => renderer.setParticleCount(value)}
              />
              <SliderControl
                label="Particle Size"
                value={patternParams.particleSize}
                min={0.5}
                max={5.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setParticleSize(value)}
              />
              <SliderControl
                label="Particle Speed"
                value={patternParams.particleSpeed}
                min={0.1}
                max={3.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setParticleSpeed(value)}
              />
            </div>
          )}

          {/* Bubbles Controls */}
          {rawCurrentPattern === "bubbles" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Bubble Controls
              </h4>
              <SliderControl
                label="Bubble Count"
                value={patternParams.bubbleCount}
                min={10}
                max={100}
                step={5}
                decimals={0}
                onChange={(value) => renderer.setBubbleCount(value)}
              />
              <SliderControl
                label="Bubble Size"
                value={patternParams.bubbleSize}
                min={0.5}
                max={3.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setBubbleSize(value)}
              />
              <SliderControl
                label="Bubble Speed"
                value={patternParams.bubbleSpeed}
                min={0.1}
                max={3.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setBubbleSpeed(value)}
              />
            </div>
          )}

          {/* Starfield Controls */}
          {rawCurrentPattern === "starfield" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Starfield Controls
              </h4>
              <SliderControl
                label="Star Count"
                value={patternParams.starCount}
                min={50}
                max={500}
                step={10}
                decimals={0}
                onChange={(value) => renderer.setStarCount(value)}
              />
              <SliderControl
                label="Star Speed"
                value={patternParams.starSpeed}
                min={0.1}
                max={3.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setStarSpeed(value)}
              />
            </div>
          )}

          {/* Rings Controls */}
          {rawCurrentPattern === "rings" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Rings Controls
              </h4>
              <SliderControl
                label="Ring Count"
                value={patternParams.ringCount}
                min={3}
                max={30}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setRingCount(value)}
              />
            </div>
          )}

          {/* Tunnel Controls */}
          {rawCurrentPattern === "tunnel" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Tunnel Controls
              </h4>
              <SliderControl
                label="Tunnel Speed"
                value={patternParams.tunnelSpeed}
                min={0.1}
                max={3.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setTunnelSpeed(value)}
              />
            </div>
          )}

          {/* Matrix Controls */}
          {rawCurrentPattern === "matrix" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Matrix Controls
              </h4>
              <SliderControl
                label="Fall Speed"
                value={patternParams.matrixSpeed}
                min={0.1}
                max={3.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setMatrixSpeed(value)}
              />
            </div>
          )}

          {/* Lightning Controls */}
          {rawCurrentPattern === "lightning" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Lightning Controls
              </h4>
              <SliderControl
                label="Lightning Count"
                value={patternParams.lightningCount}
                min={1}
                max={10}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setLightningCount(value)}
              />
            </div>
          )}

          {/* Galaxy Controls */}
          {rawCurrentPattern === "galaxy" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Galaxy Controls
              </h4>
              <SliderControl
                label="Arm Count"
                value={patternParams.galaxyArmCount}
                min={2}
                max={8}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setGalaxyArmCount(value)}
              />
            </div>
          )}

          {/* Aurora Controls */}
          {rawCurrentPattern === "aurora" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Aurora Controls
              </h4>
              <SliderControl
                label="Intensity"
                value={patternParams.auroraIntensity}
                min={0.1}
                max={3.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setAuroraIntensity(value)}
              />
            </div>
          )}

          {/* Mandala Controls */}
          {rawCurrentPattern === "mandala" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Mandala Controls
              </h4>
              <SliderControl
                label="Layer Count"
                value={patternParams.mandalaLayers}
                min={1}
                max={12}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setMandalaLayers(value)}
              />
            </div>
          )}

          {/* Tarot Controls */}
          {rawCurrentPattern === "tarot" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Tarot Controls
              </h4>
              <SliderControl
                label="Card Size"
                value={patternParams.tarotCardSize}
                min={0.5}
                max={3.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setTarotCardSize(value)}
              />
              <SliderControl
                label="Card Count"
                value={patternParams.tarotCardCount}
                min={3}
                max={22}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setTarotCardCount(value)}
              />
            </div>
          )}

          {/* Sacred Spiral Controls */}
          {rawCurrentPattern === "sacredSpiral" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Sacred Spiral Controls
              </h4>
              <SliderControl
                label="Spiral Count"
                value={patternParams.sacredSpiralCount}
                min={1}
                max={8}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setSacredSpiralCount(value)}
              />
              <SliderControl
                label="Spiral Tightness"
                value={patternParams.sacredSpiralTightness}
                min={0.1}
                max={3.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setSacredSpiralTightness(value)}
              />
            </div>
          )}

          {/* Pentagram Controls */}
          {rawCurrentPattern === "pentagram" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Pentagram Controls
              </h4>
              <SliderControl
                label="Size"
                value={patternParams.pentagramSize}
                min={0.5}
                max={2.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setPentagramSize(value)}
              />
              <SliderControl
                label="Rotation Speed"
                value={patternParams.pentagramRotationSpeed}
                min={0.1}
                max={3.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setPentagramRotationSpeed(value)}
              />
            </div>
          )}

          {/* Runes Controls */}
          {rawCurrentPattern === "runes" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Runes Controls
              </h4>
              <SliderControl
                label="Rune Size"
                value={patternParams.runeSize}
                min={0.5}
                max={2.5}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setRuneSize(value)}
              />
              <SliderControl
                label="Rune Count"
                value={patternParams.runeCount}
                min={4}
                max={16}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setRuneCount(value)}
              />
            </div>
          )}

          {/* Sigils Controls */}
          {rawCurrentPattern === "sigils" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Sigils Controls
              </h4>
              <SliderControl
                label="Sigil Count"
                value={patternParams.sigilCount}
                min={3}
                max={12}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setSigilCount(value)}
              />
              <SliderControl
                label="Sigil Size"
                value={patternParams.sigilSize}
                min={0.5}
                max={2.5}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setSigilSize(value)}
              />
            </div>
          )}

          {/* Chakras Controls */}
          {rawCurrentPattern === "chakras" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Chakras Controls
              </h4>
              <SliderControl
                label="Chakra Size"
                value={patternParams.chakraSize}
                min={0.5}
                max={2.5}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setChakraSize(value)}
              />
              <SliderControl
                label="Chakra Spacing"
                value={patternParams.chakraSpacing}
                min={0.5}
                max={2.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setChakraSpacing(value)}
              />
            </div>
          )}

          {/* Portal Controls */}
          {rawCurrentPattern === "portal" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Portal Controls
              </h4>
              <SliderControl
                label="Portal Size"
                value={patternParams.portalSize}
                min={0.5}
                max={2.5}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setPortalSize(value)}
              />
              <SliderControl
                label="Ring Count"
                value={patternParams.portalRingCount}
                min={3}
                max={12}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setPortalRingCount(value)}
              />
            </div>
          )}

          {/* Phoenix Controls */}
          {rawCurrentPattern === "phoenix" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Phoenix Controls
              </h4>
              <SliderControl
                label="Wing Span"
                value={patternParams.phoenixWingSpan}
                min={0.5}
                max={2.5}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setPhoenixWingSpan(value)}
              />
            </div>
          )}

          {/* Crystal Grid Controls */}
          {rawCurrentPattern === "crystalGrid" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Crystal Grid Controls
              </h4>
              <SliderControl
                label="Crystal Size"
                value={patternParams.crystalGridSize}
                min={0.5}
                max={2.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setCrystalGridSize(value)}
              />
              <SliderControl
                label="Crystal Count"
                value={patternParams.crystalCount}
                min={6}
                max={24}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setCrystalCount(value)}
              />
            </div>
          )}

          {/* Moon Phases Controls */}
          {rawCurrentPattern === "moonPhases" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Moon Phases Controls
              </h4>
              <SliderControl
                label="Phase Count"
                value={patternParams.moonPhaseCount}
                min={4}
                max={13}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setMoonPhaseCount(value)}
              />
              <SliderControl
                label="Moon Size"
                value={patternParams.moonPhaseSize}
                min={0.5}
                max={2.5}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setMoonPhaseSize(value)}
              />
            </div>
          )}

          {/* Flower of Life Controls */}
          {rawCurrentPattern === "flowerOfLife" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Flower of Life Controls
              </h4>
              <SliderControl
                label="Circle Count"
                value={patternParams.flowerOfLifeCircleCount}
                min={1}
                max={19}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setFlowerOfLifeCircleCount(value)}
              />
              <SliderControl
                label="Pattern Size"
                value={patternParams.flowerOfLifeSize}
                min={0.5}
                max={2.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setFlowerOfLifeSize(value)}
              />
            </div>
          )}

          {/* Metatron Controls */}
          {rawCurrentPattern === "metatron" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Metatron's Cube Controls
              </h4>
              <SliderControl
                label="Node Count"
                value={patternParams.metatronNodeCount}
                min={7}
                max={19}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setMetatronNodeCount(value)}
              />
              <SliderControl
                label="Cube Size"
                value={patternParams.metatronSize}
                min={0.5}
                max={2.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setMetatronSize(value)}
              />
            </div>
          )}

          {/* Torus Field Controls */}
          {rawCurrentPattern === "torusField" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Torus Field Controls
              </h4>
              <SliderControl
                label="Ring Count"
                value={patternParams.torusRingCount}
                min={6}
                max={24}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setTorusRingCount(value)}
              />
              <SliderControl
                label="Torus Thickness"
                value={patternParams.torusThickness}
                min={0.3}
                max={2.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setTorusThickness(value)}
              />
            </div>
          )}

          {/* Labyrinth Controls */}
          {rawCurrentPattern === "labyrinth" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Labyrinth Controls
              </h4>
              <SliderControl
                label="Complexity"
                value={patternParams.labyrinthComplexity}
                min={0.5}
                max={2.5}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setLabyrinthComplexity(value)}
              />
              <SliderControl
                label="Path Width"
                value={patternParams.labyrinthPathWidth}
                min={0.5}
                max={2.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setLabyrinthPathWidth(value)}
              />
            </div>
          )}

          {/* Vortex Spiral Controls */}
          {rawCurrentPattern === "vortexSpiral" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Vortex Spiral Controls
              </h4>
              <SliderControl
                label="Spiral Count"
                value={patternParams.vortexSpiralCount}
                min={2}
                max={12}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setVortexSpiralCount(value)}
              />
              <SliderControl
                label="Rotation Speed"
                value={patternParams.vortexRotationSpeed}
                min={0.1}
                max={3.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setVortexRotationSpeed(value)}
              />
            </div>
          )}

          {/* Dragon Eye Controls */}
          {rawCurrentPattern === "dragonEye" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Dragon Eye Controls
              </h4>
              <SliderControl
                label="Eye Size"
                value={patternParams.dragonEyeSize}
                min={0.5}
                max={2.5}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setDragonEyeSize(value)}
              />
              <SliderControl
                label="Pupil Size"
                value={patternParams.dragonPupilSize}
                min={0.3}
                max={1.5}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setDragonPupilSize(value)}
              />
            </div>
          )}

          {/* Ancient Glyphs Controls */}
          {rawCurrentPattern === "ancientGlyphs" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Ancient Glyphs Controls
              </h4>
              <SliderControl
                label="Glyph Count"
                value={patternParams.ancientGlyphCount}
                min={8}
                max={32}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setAncientGlyphCount(value)}
              />
              <SliderControl
                label="Glyph Size"
                value={patternParams.ancientGlyphSize}
                min={0.5}
                max={2.5}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setAncientGlyphSize(value)}
              />
            </div>
          )}

          {/* Platonic Solids Controls */}
          {rawCurrentPattern === "platonic" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Platonic Solids Controls
              </h4>
              <SliderControl
                label="Solid Size"
                value={patternParams.platonicSize}
                min={0.5}
                max={2.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setPlatonicSize(value)}
              />
              <SliderControl
                label="Rotation Speed"
                value={patternParams.platonicRotationSpeed}
                min={0.1}
                max={3.0}
                step={0.1}
                decimals={1}
                unit="x"
                onChange={(value) => renderer.setPlatonicRotationSpeed(value)}
              />
            </div>
          )}

          {/* Cosmic Lotus Controls */}
          {rawCurrentPattern === "cosmicLotus" && (
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Cosmic Lotus Controls
              </h4>
              <SliderControl
                label="Layer Count"
                value={patternParams.cosmicLotusLayerCount}
                min={2}
                max={12}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setCosmicLotusLayerCount(value)}
              />
              <SliderControl
                label="Petal Count"
                value={patternParams.cosmicLotusPetalCount}
                min={4}
                max={16}
                step={1}
                decimals={0}
                onChange={(value) => renderer.setCosmicLotusPetalCount(value)}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}


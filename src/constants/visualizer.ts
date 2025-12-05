// File: src/constants/visualizer.ts

export const VISUALIZER_TYPES = [
  "flowfield",
] as const;

export type VisualizerType = (typeof VISUALIZER_TYPES)[number];

export interface VisualizerLayoutState {
  width: number;
  height: number;
  collapsedWidth: number;
  collapsedHeight: number;
  x: number;
  y: number;
  isExpanded: boolean;
  type: VisualizerType;
}

export interface VisualizerSerializedState extends VisualizerLayoutState {
  enabled: boolean;
}

export const DEFAULT_VISUALIZER_LAYOUT_STATE: VisualizerLayoutState = {
  width: 400,
  height: 400,
  collapsedWidth: 400,
  collapsedHeight: 400,
  x: 16,
  y: 16,
  isExpanded: false,
  type: "flowfield",
};

export const DEFAULT_VISUALIZER_STATE: VisualizerSerializedState = {
  ...DEFAULT_VISUALIZER_LAYOUT_STATE,
  enabled: true,
};

export const VISUALIZER_DIMENSIONS = {
  MIN_WIDTH: 220,
  MIN_HEIGHT: 110,
  VIEWPORT_PADDING: 16,
  PLAYER_STACK_HEIGHT: 190,
  MAX_EXPANDED_WIDTH: 960,
  MAX_EXPANDED_HEIGHT: 520,
} as const;

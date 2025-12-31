// File: src/components/EnhancedQueue.tsx

"use client";

import { useToast } from "@/contexts/ToastContext";
import { api } from "@/trpc/react";
import type { QueuedTrack, SmartQueueSettings, SmartQueueState, Track } from "@/types";
import { getCoverImage } from "@/utils/images";
import { formatDuration } from "@/utils/time";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Loader2,
  Play,
  RefreshCw,
  Save,
  Search,
  Settings,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface QueueItemProps {
  track: Track;
  index: number;
  isActive: boolean;
  isSelected: boolean;
  onPlay: () => void;
  onRemove: () => void;
  onToggleSelect: (e: React.MouseEvent) => void;
  sortableId: string;
  isSmartTrack?: boolean;
  canRemove: boolean;
}

function SortableQueueItem({
  track,
  index,
  isActive,
  isSelected,
  onPlay,
  onRemove,
  onToggleSelect,
  sortableId,
  isSmartTrack,
  canRemove,
}: QueueItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Note: Scroll to active track is handled by parent EnhancedQueue component
  // to avoid redundant scroll calls and ensure proper timing

  const coverImage = getCoverImage(track, "small");
  const altText = track.album?.title?.trim()?.length
    ? `${track.album.title} cover art`
    : `${track.title} cover art`;

  const artistName = track.artist?.name?.trim()?.length
    ? track.artist.name
    : "Unknown Artist";
  const albumTitle = track.album?.title?.trim()?.length
    ? track.album.title
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        // Don't trigger selection when clicking on interactive elements
        if ((e.target as HTMLElement).closest('button')) {
          return;
        }
        onToggleSelect(e);
      }}
      tabIndex={0}
      className={`group relative flex items-center gap-3 p-3 transition-colors cursor-pointer ${
        isSelected
          ? "bg-[rgba(88,198,177,0.18)] ring-2 ring-[rgba(88,198,177,0.4)]"
          : isActive
            ? "bg-[rgba(244,178,102,0.16)] ring-1 ring-[rgba(244,178,102,0.3)]"
            : isSmartTrack
              ? "bg-[rgba(88,198,177,0.04)] hover:bg-[rgba(88,198,177,0.08)]"
              : "hover:bg-[rgba(244,178,102,0.08)]"
      }`}
    >
      {/* Left accent bar for smart tracks */}
      {isSmartTrack && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--color-accent-strong)] rounded-r" />
      )}

      {/* Drag Handle */}
      <button
        className="flex-shrink-0 cursor-grab text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)] active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Position */}
      <div className="w-6 flex-shrink-0 text-center text-sm text-[var(--color-muted)]">
        {index + 1}
      </div>

      {/* Album Cover */}
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-[rgba(255,255,255,0.05)]">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={altText}
            fill
            sizes="(max-width: 768px) 48px, 64px"
            className="object-cover"
            quality={75}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--color-muted)]">
            🎵
          </div>
        )}
        {/* Play overlay */}
        <button
          onClick={onPlay}
          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
          title="Play from here"
        >
          <Play className="h-5 w-5 fill-white text-white" />
        </button>
      </div>

      {/* Track Info */}
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium text-[var(--color-text)]">
          {track.title}
        </h4>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-subtext)]">
          <span className="truncate">{artistName}</span>
          {albumTitle && (
            <>
              <span className="text-[var(--color-muted)]">•</span>
              <span className="truncate">{albumTitle}</span>
            </>
          )}
        </div>
      </div>

      {/* Duration */}
      <span className="flex-shrink-0 text-xs text-[var(--color-muted)] tabular-nums">
        {formatDuration(track.duration)}
      </span>

      {/* Remove Button - Only show if track can be removed */}
      {canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering onToggleSelect
            onRemove();
          }}
          className="flex-shrink-0 rounded p-1.5 opacity-0 transition-colors group-hover:opacity-100 hover:bg-[rgba(244,178,102,0.12)]"
          aria-label="Remove from queue"
        >
          <X className="h-4 w-4 text-[var(--color-subtext)] transition-colors hover:text-[var(--color-text)]" />
        </button>
      )}
    </div>
  );
}

interface EnhancedQueueProps {
  queue: Track[];
  queuedTracks: QueuedTrack[];
  smartQueueState: SmartQueueState;
  currentTrack: Track | null;
  onClose: () => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  onPlayFrom: (index: number) => void;
  onSaveAsPlaylist?: () => void;
  onAddSmartTracks?: (count?: number) => Promise<Track[]>;
  onRefreshSmartTracks?: () => Promise<void>;
  onClearSmartTracks?: () => void;
  // COMMENTED OUT - Smart queue features disabled
  // onAddSimilarTracks?: (trackId: number, count?: number) => Promise<void>;
  // onGenerateSmartMix?: (
  //   seedTrackIds: number[],
  //   count?: number,
  // ) => Promise<void>;
}

interface SelectedIndices {
  indices: Set<number>;
  lastSelectedIndex: number | null;
}

export function EnhancedQueue({
  queue,
  queuedTracks,
  smartQueueState,
  currentTrack,
  onClose,
  onRemove,
  onClear,
  onReorder,
  onPlayFrom,
  onSaveAsPlaylist,
  onAddSmartTracks,
  onRefreshSmartTracks,
  onClearSmartTracks,
  // COMMENTED OUT - Smart queue props disabled
  // onAddSimilarTracks,
  // onGenerateSmartMix,
}: EnhancedQueueProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  // COMMENTED OUT - Smart queue UI state disabled
  // const [showSettings, setShowSettings] = useState(false);
  // const [addingSimilar, setAddingSimilar] = useState(false);
  // const [generatingMix, setGeneratingMix] = useState(false);
  // const [showAutoQueueInfo, setShowAutoQueueInfo] = useState(false);
  // const [settingsDraft, setSettingsDraft] = useState<SmartQueueSettings | null>(
  //   null,
  // );

  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const { showToast } = useToast();
  const utils = api.useUtils();
  const queueListRef = useRef<HTMLDivElement>(null);

  // Scroll to active track when it changes (single source of truth for scrolling)
  useEffect(() => {
    if (currentTrack && queueListRef.current) {
      const trackId = currentTrack.id;
      // Use requestAnimationFrame for better timing, ensuring DOM is ready
      // Query inside callback to avoid stale references
      requestAnimationFrame(() => {
        // Re-query to ensure element is still in DOM and matches current track
        const activeItem = queueListRef.current?.querySelector(
          `[data-track-id="${trackId}"]`,
        );
        // Verify element is still connected to DOM
        if (activeItem?.isConnected) {
          activeItem.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      });
    }
  }, [currentTrack, queue]);

  const trackIdMapRef = useRef<{
    map: WeakMap<Track, string>;
    counter: number;
  }>({
    map: new WeakMap<Track, string>(),
    counter: 0,
  });

  const getSortableId = useCallback((track: Track) => {
    const map = trackIdMapRef.current.map;
    const existing = map.get(track);
    if (existing) {
      return existing;
    }

    const newId = `queue-item-${trackIdMapRef.current.counter++}`;
    map.set(track, newId);
    return newId;
  }, []);

  const queueEntries = useMemo(
    () =>
      queuedTracks.map((qt, index) => ({
        track: qt.track,
        index,
        sortableId: qt.queueId,
        isSmartTrack: qt.queueSource === 'smart',
      })),
    [queuedTracks],
  );

  // Split into user and smart sections
  const userTracks = useMemo(
    () => queuedTracks.slice(1).filter(qt => qt.queueSource === 'user'),
    [queuedTracks]
  );

  const smartTracks = useMemo(
    () => queuedTracks.slice(1).filter(qt => qt.queueSource === 'smart'),
    [queuedTracks]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const findIndexBySortableId = useCallback(
    (id: string) =>
      queueEntries.find((entry) => entry.sortableId === id)?.index ?? -1,
    [queueEntries],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex =
        typeof active.id === "string"
          ? findIndexBySortableId(active.id)
          : findIndexBySortableId(String(active.id));
      const newIndex =
        typeof over.id === "string"
          ? findIndexBySortableId(over.id)
          : findIndexBySortableId(String(over.id));

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  // COMMENTED OUT - Smart queue settings and handlers disabled
  // const { data: smartQueueSettings } = api.music.getSmartQueueSettings.useQuery(
  //   undefined,
  //   {
  //     enabled: isAuthenticated,
  //   },
  // );
  // ... (all smart queue functions commented out)
  const filteredQueue = useMemo(() => {
    if (!searchQuery.trim()) {
      return queueEntries;
    }

    const normalizedQuery = searchQuery.toLowerCase();
    return queueEntries.filter(
      ({ track }) =>
        track.title.toLowerCase().includes(normalizedQuery) ||
        track.artist.name.toLowerCase().includes(normalizedQuery),
    );
  }, [queueEntries, searchQuery]);

  // Split filtered queue into sections
  const filteredNowPlaying = filteredQueue.length > 0 ? filteredQueue[0] : null;
  const filteredUserTracks = useMemo(() => {
    return filteredQueue.slice(1).filter(entry => !entry.isSmartTrack);
  }, [filteredQueue]);

  const filteredSmartTracks = useMemo(() => {
    return filteredQueue.slice(1).filter(entry => entry.isSmartTrack);
  }, [filteredQueue]);

  // Selection handlers
  const handleToggleSelect = useCallback((index: number, shiftKey: boolean) => {
    setSelectedIndices((prev) => {
      const newSet = new Set(prev);

      if (shiftKey && lastSelectedIndex !== null) {
        // Range selection with Shift
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        for (let i = start; i <= end; i++) {
          if (i !== 0) { // Don't select currently playing track
            newSet.add(i);
          }
        }
      } else {
        // Single toggle
        if (index !== 0) { // Don't select currently playing track
          if (newSet.has(index)) {
            newSet.delete(index);
          } else {
            newSet.add(index);
          }
        }
      }

      return newSet;
    });

    if (!shiftKey || lastSelectedIndex === null) {
      setLastSelectedIndex(index);
    }
  }, [lastSelectedIndex]);

  const handleRemoveSelected = useCallback(() => {
    if (selectedIndices.size === 0) return;

    // Sort indices in descending order to remove from end to beginning
    // This prevents index shifting issues
    const sortedIndices = Array.from(selectedIndices).sort((a, b) => b - a);

    sortedIndices.forEach(index => {
      onRemove(index);
    });

    setSelectedIndices(new Set());
    setLastSelectedIndex(null);
    showToast(`Removed ${sortedIndices.length} track${sortedIndices.length === 1 ? '' : 's'} from queue`, 'success');
  }, [selectedIndices, onRemove, showToast]);

  const handleClearSelection = useCallback(() => {
    setSelectedIndices(new Set());
    setLastSelectedIndex(null);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!queueListRef.current?.contains(document.activeElement)) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();

        const direction = e.key === 'ArrowDown' ? 1 : -1;
        const currentIndex = lastSelectedIndex ?? 0;
        const newIndex = Math.max(0, Math.min(queue.length - 1, currentIndex + direction));

        handleToggleSelect(newIndex, e.shiftKey);
      } else if (e.key === 'Escape') {
        handleClearSelection();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIndices.size > 0) {
        e.preventDefault();
        handleRemoveSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [queue.length, lastSelectedIndex, selectedIndices, handleToggleSelect, handleClearSelection, handleRemoveSelected]);

  const totalDuration = queue.reduce((acc, track) => acc + track.duration, 0);

  return (
    <div className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-md flex-col border-l border-[rgba(244,178,102,0.14)] bg-[rgba(10,16,24,0.96)] shadow-[0_0_40px_rgba(5,10,18,0.65)] backdrop-blur-lg">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-[rgba(244,178,102,0.12)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[var(--color-text)]">
              Queue ({queue.length})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* COMMENTED OUT - Smart queue buttons disabled */}
            {/* {currentTrack && onAddSimilarTracks && (
              <button
                onClick={handleAddSimilar}
                disabled={addingSimilar}
                className="rounded-full p-2 text-[var(--color-accent-strong)] transition-colors hover:bg-[rgba(244,178,102,0.12)] hover:text-[var(--color-text)] disabled:opacity-50"
                aria-label="Add similar tracks"
                title="Add similar tracks to queue"
              >
                {addingSimilar ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
              </button>
            )} */}
            {/* {queue.length > 0 && onGenerateSmartMix && (
              <button
                onClick={handleGenerateSmartMix}
                disabled={generatingMix}
                className="rounded-full p-2 text-[var(--color-accent)] transition-colors hover:bg-[rgba(244,178,102,0.12)] hover:text-[var(--color-text)] disabled:opacity-50"
                aria-label="Generate smart mix"
                title="Generate smart mix based on queue"
              >
                {generatingMix ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Zap className="h-5 w-5 fill-current" />
                )}
              </button>
            )} */}
            {/* {effectiveSettings && (
              <button
                onClick={handleToggleAutoQueue}
                className={`rounded-full p-2 transition-colors hover:bg-[rgba(244,178,102,0.12)] ${
                  effectiveSettings.autoQueueEnabled
                    ? "text-[var(--color-success)] hover:text-[var(--color-text)]"
                    : "text-[var(--color-subtext)] hover:text-[var(--color-text)]"
                }`}
                aria-label="Toggle auto-queue"
                title={
                  effectiveSettings.autoQueueEnabled
                    ? "Auto-queue enabled"
                    : "Auto-queue disabled"
                }
              >
                <Zap className="h-5 w-5" />
              </button>
            )} */}
            {/* <button
              onClick={() => setShowSettings(!showSettings)}
              className="rounded-full p-2 text-[var(--color-subtext)] transition-colors hover:bg-[rgba(244,178,102,0.12)] hover:text-[var(--color-text)]"
              aria-label="Queue settings"
              title="Queue settings"
            >
              <Settings className="h-5 w-5" />
            </button> */}
            {onSaveAsPlaylist && (queue.length > 0 || currentTrack) && (
              <button
                onClick={onSaveAsPlaylist}
                className="rounded-full p-2 text-[var(--color-subtext)] transition-colors hover:bg-[rgba(244,178,102,0.12)] hover:text-[var(--color-text)]"
                aria-label="Save as playlist"
                title="Save as playlist"
              >
                <Save className="h-5 w-5" />
              </button>
            )}
            {queue.length > 0 && (
              <button
                onClick={onClear}
                className="rounded-full p-2 text-[var(--color-subtext)] transition-colors hover:bg-[rgba(242,139,130,0.12)] hover:text-[var(--color-text)]"
                aria-label="Clear queue"
                title="Clear queue"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-2 text-[var(--color-subtext)] transition-colors hover:bg-[rgba(244,178,102,0.12)] hover:text-[var(--color-text)]"
              aria-label="Close queue"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mass Actions Bar */}
        {selectedIndices.size > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-[rgba(88,198,177,0.25)] bg-[rgba(88,198,177,0.12)] p-3">
            <span className="text-sm font-medium text-[var(--color-text)]">
              {selectedIndices.size} selected
            </span>
            <div className="flex-1" />
            <button
              onClick={handleRemoveSelected}
              className="flex items-center gap-2 rounded-lg bg-[rgba(248,139,130,0.2)] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[rgba(248,139,130,0.3)]"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
            <button
              onClick={handleClearSelection}
              className="rounded-lg bg-[rgba(255,255,255,0.1)] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[rgba(255,255,255,0.15)]"
            >
              Clear
            </button>
          </div>
        )}

        {/* Search Bar */}
        {queue.length > 0 && (
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
              type="text"
              placeholder="Search queue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[rgba(244,178,102,0.18)] bg-[rgba(18,26,38,0.92)] py-2 pr-4 pl-10 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:border-[rgba(244,178,102,0.35)] focus:ring-2 focus:ring-[rgba(244,178,102,0.28)] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--color-subtext)] transition-colors hover:text-[var(--color-text)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* COMMENTED OUT - Auto-Queue Info Panel disabled */}
        {/* {effectiveSettings?.autoQueueEnabled && (
          <div className="rounded-lg border border-[rgba(88,198,177,0.25)] bg-[rgba(88,198,177,0.12)] p-3 shadow-inner shadow-[rgba(88,198,177,0.18)]">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <Zap className="h-5 w-5 text-[var(--color-success)]" />
                <span className="absolute -top-1 -right-1 h-2 w-2 animate-pulse rounded-full bg-[var(--color-success)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--color-text)]">
                  Auto-queue is active
                </p>
                <p className="text-xs text-[var(--color-subtext)]">
                  Will add tracks when queue has ≤{" "}
                  {effectiveSettings.autoQueueThreshold} tracks
                </p>
              </div>
              <button
                onClick={() => setShowAutoQueueInfo(!showAutoQueueInfo)}
                className="text-[var(--color-success)] transition-colors hover:text-[var(--color-text)]"
                title={showAutoQueueInfo ? "Hide details" : "Show details"}
              >
                {showAutoQueueInfo ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
              </button>
            </div>
            {showAutoQueueInfo && (
              <div className="mt-3 space-y-2 border-t border-[rgba(88,198,177,0.3)] pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-subtext)]">
                    Current queue:
                  </span>
                  <span className="font-medium text-[var(--color-text)]">
                    {queue.length} tracks
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-subtext)]">Will add:</span>
                  <span className="font-medium text-[var(--color-text)]">
                    {effectiveSettings.autoQueueCount} tracks
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-subtext)]">
                    Similarity mode:
                  </span>
                  <span className="font-medium text-[var(--color-text)] capitalize">
                    {effectiveSettings.similarityPreference}
                  </span>
                </div>
                {queue.length <= effectiveSettings.autoQueueThreshold &&
                  currentTrack && (
                    <div className="mt-3 border-t border-[rgba(88,198,177,0.3)] pt-3">
                      <p className="mb-2 text-xs text-[var(--color-subtext)]">
                        Ready to trigger:
                      </p>
                      <button
                        onClick={handleAddSimilar}
                        disabled={addingSimilar}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-success)] px-3 py-2 text-xs font-medium text-[#0d141d] transition-colors hover:bg-[#4bb19c] disabled:bg-[#346f60] disabled:text-[#0d141d]/70 disabled:opacity-70"
                      >
                        {addingSimilar ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Manually Trigger Now
                          </>
                        )}
                      </button>
                    </div>
                  )}
              </div>
            )}
          </div>
        )} */}

        {/* COMMENTED OUT - Settings Panel disabled */}
        {/* {showSettings && effectiveSettings && (
          <div className="surface-muted space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">
                Smart Queue Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-[var(--color-subtext)] transition-colors hover:text-[var(--color-text)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Auto-queue Toggle *//*
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-[var(--color-text)]">
                  Auto-queue
                </label>
                <button
                  onClick={handleToggleAutoQueue}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    effectiveSettings.autoQueueEnabled
                      ? "bg-[var(--color-success)]"
                      : "bg-[rgba(255,255,255,0.1)]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      effectiveSettings.autoQueueEnabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-[var(--color-subtext)]">
                Automatically add similar tracks when queue is low
              </p>
            </div>

            {/* Threshold Slider *//*
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-[var(--color-text)]">
                  Trigger threshold
                </label>
                <span className="text-sm text-[var(--color-text)]">
                  {effectiveSettings.autoQueueThreshold} tracks
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={effectiveSettings.autoQueueThreshold}
                onChange={async (e) => {
                  const newValue = parseInt(e.target.value);
                  setSettingsDraft((prev) =>
                    prev ? { ...prev, autoQueueThreshold: newValue } : prev,
                  );
                  try {
                    await updateSettings.mutateAsync({
                      autoQueueThreshold: newValue,
                    });
                  } catch (error) {
                    console.error("Failed to update threshold:", error);
                    setSettingsDraft(smartQueueSettings ?? null);
                  }
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[rgba(255,255,255,0.12)]"
              />
              <p className="text-xs text-[var(--color-subtext)]">
                Add tracks when queue has ≤{" "}
                {effectiveSettings.autoQueueThreshold} tracks
              </p>
            </div>

            {/* Track Count Slider *//*
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-[var(--color-text)]">
                  Tracks to add
                </label>
                <span className="text-sm text-[var(--color-text)]">
                  {effectiveSettings.autoQueueCount}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={effectiveSettings.autoQueueCount}
                onChange={async (e) => {
                  const newValue = parseInt(e.target.value);
                  setSettingsDraft((prev) =>
                    prev ? { ...prev, autoQueueCount: newValue } : prev,
                  );
                  try {
                    await updateSettings.mutateAsync({
                      autoQueueCount: newValue,
                    });
                  } catch (error) {
                    console.error("Failed to update count:", error);
                    setSettingsDraft(smartQueueSettings ?? null);
                  }
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[rgba(255,255,255,0.12)]"
              />
            </div>

            {/* Similarity Preference *//*
            <div className="space-y-2">
              <label className="text-sm text-[var(--color-text)]">
                Similarity Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["strict", "balanced", "diverse"].map((pref) => (
                  <button
                    key={pref}
                    onClick={async () => {
                      const preference = pref as
                        | "strict"
                        | "balanced"
                        | "diverse";
                      setSettingsDraft((prev) =>
                        prev
                          ? { ...prev, similarityPreference: preference }
                          : prev,
                      );
                      try {
                        await updateSettings.mutateAsync({
                          similarityPreference: preference,
                        });
                        const modeLabels = {
                          strict: "Strict (same artists)",
                          balanced: "Balanced (related artists)",
                          diverse: "Diverse (genre variety)",
                        };
                        showToast(modeLabels[preference], "success");
                      } catch (error) {
                        console.error("Failed to update similarity:", error);
                        setSettingsDraft(smartQueueSettings ?? null);
                      }
                    }}
                    className={`rounded-lg px-3 py-2 text-xs transition-colors ${
                      effectiveSettings.similarityPreference === pref
                        ? "bg-[rgba(244,178,102,0.35)] text-[var(--color-text)] shadow-[0_6px_16px_rgba(244,178,102,0.2)]"
                        : "bg-[rgba(18,26,38,0.85)] text-[var(--color-subtext)] hover:bg-[rgba(244,178,102,0.15)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    {pref.charAt(0).toUpperCase() + pref.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--color-subtext)]">
                {effectiveSettings.similarityPreference === "strict"
                  ? "Same artists only - most similar tracks"
                  : effectiveSettings.similarityPreference === "balanced"
                    ? "Related artists - good mix of familiar & new"
                    : "Genre-based variety - maximum exploration"}
              </p>
            </div>
          </div>
        )}
        {showSettings && !effectiveSettings && (
          <div className="surface-muted p-4 text-sm text-[var(--color-subtext)]">
            Loading smart queue settings...
          </div>
        )} */}
      </div>

      {/* Queue List */}
      <div
        ref={queueListRef}
        className="flex-1 overflow-y-auto overscroll-contain scroll-smooth"
        id="queue-list"
      >
        {queue.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-[var(--color-subtext)]">
            <div className="mb-4 text-6xl">🎵</div>
            <p className="mb-2 text-lg font-medium text-[var(--color-text)]">
              Queue is empty
            </p>
            <p className="text-sm">Add tracks to start building your queue</p>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-[var(--color-subtext)]">
            <Search className="mb-4 h-12 w-12" />
            <p className="mb-2 text-lg font-medium text-[var(--color-text)]">
              No results found
            </p>
            <p className="text-sm">Try a different search term</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredQueue.map((entry) => entry.sortableId)}
              strategy={verticalListSortingStrategy}
            >
              <div>
                {/* Now Playing Section */}
                {filteredNowPlaying && (
                  <div className="border-b border-[rgba(255,255,255,0.05)]">
                    <div className="px-3 py-2 text-xs font-semibold text-[var(--color-subtext)] uppercase tracking-wider bg-[rgba(245,241,232,0.02)]">
                      Now Playing
                    </div>
                    <div key={filteredNowPlaying.sortableId} data-track-id={filteredNowPlaying.track.id}>
                      <SortableQueueItem
                        sortableId={filteredNowPlaying.sortableId}
                        track={filteredNowPlaying.track}
                        index={filteredNowPlaying.index}
                        isActive={currentTrack?.id === filteredNowPlaying.track.id}
                        isSelected={selectedIndices.has(filteredNowPlaying.index)}
                        onPlay={() => onPlayFrom(filteredNowPlaying.index)}
                        onRemove={() => onRemove(filteredNowPlaying.index)}
                        onToggleSelect={(e) => handleToggleSelect(filteredNowPlaying.index, e.shiftKey)}
                        isSmartTrack={filteredNowPlaying.isSmartTrack}
                        canRemove={filteredNowPlaying.index !== 0}
                      />
                    </div>
                  </div>
                )}

                {/* User Tracks Section */}
                {filteredUserTracks.length > 0 && (
                  <div className="border-b border-[rgba(255,255,255,0.05)]">
                    <div className="px-3 py-2 text-xs font-semibold text-[var(--color-subtext)] uppercase tracking-wider border-b border-[rgba(245,241,232,0.05)]">
                      Next in queue
                    </div>
                    <div className="divide-y divide-[rgba(255,255,255,0.05)]">
                      {filteredUserTracks.map(({ track, index, sortableId, isSmartTrack }) => (
                        <div key={sortableId} data-track-id={track.id}>
                          <SortableQueueItem
                            sortableId={sortableId}
                            track={track}
                            index={index}
                            isActive={currentTrack?.id === track.id}
                            isSelected={selectedIndices.has(index)}
                            onPlay={() => onPlayFrom(index)}
                            onRemove={() => onRemove(index)}
                            onToggleSelect={(e) => handleToggleSelect(index, e.shiftKey)}
                            isSmartTrack={isSmartTrack}
                            canRemove={index !== 0}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Smart Queue Controls */}
                {smartQueueState.isActive && smartTracks.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 border-y border-[rgba(245,241,232,0.1)]">
                    <button
                      onClick={() => onRefreshSmartTracks?.()}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-[rgba(88,198,177,0.1)] hover:bg-[rgba(88,198,177,0.2)] transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                    <button
                      onClick={() => onClearSmartTracks?.()}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-[rgba(248,139,130,0.1)] hover:bg-[rgba(248,139,130,0.2)] transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Clear smart tracks
                    </button>
                  </div>
                )}

                {/* Smart Tracks Section */}
                {filteredSmartTracks.length > 0 && (
                  <div className="border-b border-[rgba(255,255,255,0.05)]">
                    <div className="px-3 py-2 text-xs font-semibold text-[var(--color-accent-strong)] uppercase tracking-wider border-b border-[rgba(245,241,232,0.05)] flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5" />
                      Next from: Smart Queue
                    </div>
                    <div className="divide-y divide-[rgba(255,255,255,0.05)]">
                      {filteredSmartTracks.map(({ track, index, sortableId, isSmartTrack }) => (
                        <div key={sortableId} data-track-id={track.id}>
                          <SortableQueueItem
                            sortableId={sortableId}
                            track={track}
                            index={index}
                            isActive={currentTrack?.id === track.id}
                            isSelected={selectedIndices.has(index)}
                            onPlay={() => onPlayFrom(index)}
                            onRemove={() => onRemove(index)}
                            onToggleSelect={(e) => handleToggleSelect(index, e.shiftKey)}
                            isSmartTrack={isSmartTrack}
                            canRemove={index !== 0}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Smart Tracks Button */}
                {!smartQueueState.isActive && queuedTracks.length > 0 && onAddSmartTracks && (
                  <button
                    onClick={() => onAddSmartTracks()}
                    className="mx-3 my-2 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[rgba(88,198,177,0.1)] hover:bg-[rgba(88,198,177,0.2)] transition-colors"
                  >
                    <Sparkles className="h-4 w-4 text-[var(--color-accent-strong)]" />
                    <span className="text-sm font-medium">Add smart tracks</span>
                  </button>
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer with total duration */}
      {queue.length > 0 && (
        <div className="border-t border-[rgba(244,178,102,0.12)] p-4 text-sm text-[var(--color-subtext)]">
          <div className="flex items-center justify-between">
            <span>Total duration:</span>
            <span className="font-medium">{formatDuration(totalDuration)}</span>
          </div>
          {searchQuery && filteredQueue.length !== queue.length && (
            <div className="mt-2 text-xs text-[var(--color-muted)]">
              Showing {filteredQueue.length} of {queue.length} tracks
            </div>
          )}
          {!searchQuery && selectedIndices.size === 0 && (
            <div className="mt-2 text-xs text-[var(--color-muted)]">
              Tip: Click to select • Shift+Arrow to multi-select • Del/Backspace to remove
            </div>
          )}
        </div>
      )}
    </div>
  );
}

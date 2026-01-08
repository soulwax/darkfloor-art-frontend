// File: src/app/playlists/[id]/page.tsx

"use client";

import EnhancedTrackCard from "@/components/EnhancedTrackCard";
import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Play, Lock, Unlock, Save, Share2, Trash2 } from "lucide-react";

export default function PlaylistDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const playlistId = parseInt(params.id);
  const player = useGlobalPlayer();
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [localVisibility, setLocalVisibility] = useState<boolean | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  const { data: privatePlaylist, isLoading: isLoadingPrivate } =
    api.music.getPlaylist.useQuery(
      { id: playlistId },
      { enabled: !!session && !isNaN(playlistId), retry: false },
    );

  const { data: publicPlaylist, isLoading: isLoadingPublic } =
    api.music.getPublicPlaylist.useQuery(
      { id: playlistId },
      { enabled: !session && !isNaN(playlistId), retry: false },
    );

  const playlist = privatePlaylist ?? publicPlaylist;
  const isLoading = isLoadingPrivate || isLoadingPublic;

  const isOwner: boolean = !!session && !!privatePlaylist;

  const utils = api.useUtils();
  const updateVisibilityMutation =
    api.music.updatePlaylistVisibility.useMutation();
  const updateMetadataMutation = api.music.updatePlaylistMetadata.useMutation();
  const removeFromPlaylist = api.music.removeFromPlaylist.useMutation({
    onSuccess: async () => {
      try {
        await utils.music.getPlaylist.invalidate({ id: playlistId });
        await utils.music.getPublicPlaylist.invalidate({ id: playlistId });
      } catch (error) {
        console.error("Failed to invalidate playlist cache:", error);
      }
    },
    onError: (error) => {
      console.error("Failed to remove track:", error);
      alert("Failed to remove track from playlist");
    },
  });

  const reorderPlaylistMutation = api.music.reorderPlaylist.useMutation({
    onSuccess: async () => {
      try {
        await utils.music.getPlaylist.invalidate({ id: playlistId });
        await utils.music.getPublicPlaylist.invalidate({ id: playlistId });
      } catch (error) {
        console.error("Failed to invalidate playlist cache:", error);
      }
    },
    onError: (error) => {
      console.error("Failed to reorder playlist:", error);
      alert("Failed to reorder playlist");
    },
  });

  const deletePlaylist = api.music.deletePlaylist.useMutation({
    onSuccess: () => {
      router.push("/playlists");
    },
    onError: (error) => {
      console.error("Failed to delete playlist:", error);
      alert("Failed to delete playlist");
    },
  });

  const handlePlayAll = (): void => {
    if (!playlist?.tracks || playlist.tracks.length === 0) return;

    const sortedTracks = [...playlist.tracks].sort(
      (a, b) => a.position - b.position,
    );
    const [first, ...rest] = sortedTracks;
    if (first) {

      player.clearQueue();
      player.play(first.track);
      if (rest.length > 0) {
        player.addToQueue(rest.map((t) => t.track));
      }
    }
  };

  const handleRemoveTrack = (trackEntryId: number): void => {
    if (confirm("Remove this track from the playlist?")) {
      removeFromPlaylist.mutate({ playlistId, trackEntryId });
    }
  };

  const handleSharePlaylist = async (): Promise<void> => {
    const canShare = localVisibility ?? playlist?.isPublic ?? false;

    if (!canShare) {
      alert("Only public playlists can be shared!");
      return;
    }

    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("Failed to copy link to clipboard");
    }
  };

  useEffect(() => {
    if (playlist) {
      setLocalVisibility(playlist.isPublic);
      setDraftTitle(playlist.name ?? "");
      setDraftDescription(playlist.description ?? "");
    }
  }, [playlist]);

  const handleToggleVisibility = async (): Promise<void> => {
    if (!playlist) return;

    const currentVisibility = localVisibility ?? playlist.isPublic;
    const nextVisibility = !currentVisibility;

    setLocalVisibility(nextVisibility);

    try {
      await updateVisibilityMutation.mutateAsync({
        id: playlist.id,
        isPublic: nextVisibility,
      });
      await Promise.all([
        utils.music.getPlaylist.invalidate({ id: playlistId }),
        utils.music.getPublicPlaylist.invalidate({ id: playlistId }),
        utils.music.getPlaylists.invalidate(),
      ]);
      showToast(
        nextVisibility ? "Playlist is now public" : "Playlist is now private",
        "success",
      );
    } catch (error) {
      console.error("Failed to update playlist visibility:", error);
      setLocalVisibility(playlist.isPublic);
      showToast("Failed to update playlist visibility", "error");
    }
  };

  const handleSaveMetadata = async () => {
    if (!playlist) return;

    const trimmedTitle = draftTitle.trim();
    if (!trimmedTitle) {
      showToast("Playlist name cannot be empty", "error");
      return;
    }

    try {
      await updateMetadataMutation.mutateAsync({
        id: playlist.id,
        name: trimmedTitle !== playlist.name ? trimmedTitle : undefined,
        description:
          draftDescription.trim() !== (playlist.description ?? "")
            ? draftDescription.trim()
            : undefined,
      });

      await Promise.all([
        utils.music.getPlaylist.invalidate({ id: playlistId }),
        utils.music.getPublicPlaylist.invalidate({ id: playlistId }),
        utils.music.getPlaylists.invalidate(),
      ]);

      setIsEditingTitle(false);
      setIsEditingDescription(false);
      showToast("Playlist details updated", "success");
    } catch (error) {
      console.error("Failed to update playlist metadata:", error);
      showToast("Failed to update playlist details", "error");
    }
  };

  const isSavingMetadata = updateMetadataMutation.isPending;

  const handleDragStart = (index: number): void => {
    setDraggedIndex(index);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    _index: number,
  ): void => {
    e.preventDefault();
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    dropIndex: number,
  ): Promise<void> => {
    e.preventDefault();

    if (
      draggedIndex === null ||
      draggedIndex === dropIndex ||
      !playlist?.tracks
    ) {
      setDraggedIndex(null);
      return;
    }

    const sortedTracks = [...playlist.tracks].sort(
      (a, b) => a.position - b.position,
    );
    const draggedTrack = sortedTracks[draggedIndex];

    if (!draggedTrack) {
      setDraggedIndex(null);
      return;
    }

    const newTracks = [...sortedTracks];
    newTracks.splice(draggedIndex, 1);
    newTracks.splice(dropIndex, 0, draggedTrack);

    const trackUpdates = newTracks.map((item, idx) => ({
      trackEntryId: item.id,
      newPosition: idx,
    }));

    try {
      await reorderPlaylistMutation.mutateAsync({ playlistId, trackUpdates });
    } catch (error) {
      console.error("Failed to reorder tracks:", error);

    }

    setDraggedIndex(null);
  };

  const handleDragEnd = (): void => {
    setDraggedIndex(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-accent inline-block h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-[var(--color-subtext)]">Playlist not found</p>
          <Link href="/playlists" className="text-accent hover:underline">
            Back to Playlists
          </Link>
        </div>
      </div>
    );
  }

  const effectiveIsPublic = localVisibility ?? playlist.isPublic ?? false;
  const isDirty =
    draftTitle.trim() !== (playlist.name ?? "") ||
    draftDescription.trim() !== (playlist.description ?? "");

  return (
    <div className="flex min-h-screen flex-col pb-32">
      {}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        {}
        <div className="mb-8">
          <div className="mb-2 flex items-start gap-2">
            <Link
              href="/playlists"
              className="text-[var(--color-subtext)] transition hover:text-[var(--color-text)]"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div className="flex-1">
              {isOwner ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {isEditingTitle ? (
                      <input
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        className="input-text w-full text-3xl font-bold"
                        maxLength={256}
                      />
                    ) : (
                      <h1 className="text-3xl font-bold text-[var(--color-text)]">
                        {playlist.name}
                      </h1>
                    )}
                    <button
                      onClick={() => setIsEditingTitle((prev) => !prev)}
                      className="btn-secondary px-3 py-1 text-sm"
                    >
                      {isEditingTitle ? "Cancel" : "Rename"}
                    </button>
                  </div>
                  <div className="flex items-start gap-3">
                    {isEditingDescription ? (
                      <textarea
                        value={draftDescription}
                        onChange={(e) => setDraftDescription(e.target.value)}
                        className="input-text h-full min-h-[90px] w-full"
                        rows={3}
                        maxLength={1024}
                        placeholder="Add a description..."
                      />
                    ) : playlist.description ? (
                      <p className="text-[var(--color-subtext)]">
                        {playlist.description}
                      </p>
                    ) : (
                      <p className="text-[var(--color-muted)] italic">
                        No description yet.
                      </p>
                    )}
                    <button
                      onClick={() => setIsEditingDescription((prev) => !prev)}
                      className="btn-secondary px-3 py-1 text-sm"
                    >
                      {isEditingDescription ? "Cancel" : "Edit Description"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="mb-2 text-3xl font-bold text-[var(--color-text)]">
                    {playlist.name}
                  </h1>
                  {playlist.description && (
                    <p className="mb-4 text-[var(--color-subtext)]">
                      {playlist.description}
                    </p>
                  )}
                </>
              )}
              <div className="flex items-center gap-4 text-sm text-[var(--color-muted)]">
                <span>{playlist.tracks.length} tracks</span>
                <span
                  className={
                    effectiveIsPublic
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-subtext)]"
                  }
                >
                  {effectiveIsPublic ? "Public" : "Private"}
                </span>
                <span>
                  Created {new Date(playlist.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handlePlayAll}
              className="btn-primary flex h-11 w-11 items-center justify-center rounded-full p-0"
              disabled={!playlist.tracks || playlist.tracks.length === 0}
              title="Play All"
              aria-label="Play All"
            >
              <Play className="h-5 w-5" />
            </button>

            {isOwner && (
              <button
                onClick={handleToggleVisibility}
                className="btn-secondary flex h-11 w-11 items-center justify-center rounded-full p-0"
                disabled={updateVisibilityMutation.isPending}
                title={effectiveIsPublic ? "Make Private" : "Make Public"}
                aria-label={effectiveIsPublic ? "Make Private" : "Make Public"}
              >
                {updateVisibilityMutation.isPending ? (
                  <div className="spinner spinner-sm h-5 w-5" />
                ) : effectiveIsPublic ? (
                  <Unlock className="h-5 w-5" />
                ) : (
                  <Lock className="h-5 w-5" />
                )}
              </button>
            )}

            {isOwner && (
              <button
                onClick={handleSaveMetadata}
                className="btn-primary flex h-11 w-11 items-center justify-center rounded-full p-0 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!isDirty || isSavingMetadata}
                title="Save Changes"
                aria-label="Save Changes"
              >
                {isSavingMetadata ? (
                  <div className="spinner spinner-sm h-5 w-5" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
              </button>
            )}

            {effectiveIsPublic && (
              <button
                onClick={handleSharePlaylist}
                className="btn-secondary flex h-11 w-11 items-center justify-center rounded-full p-0"
                title={copiedLink ? "Copied!" : "Share"}
                aria-label="Share Playlist"
              >
                <Share2 className="h-5 w-5" />
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => {
                  if (confirm("Delete this playlist? This cannot be undone.")) {
                    deletePlaylist.mutate({ id: playlistId });
                  }
                }}
                className="btn-danger flex h-11 w-11 items-center justify-center rounded-full p-0"
                title="Delete Playlist"
                aria-label="Delete Playlist"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {}
        {isOwner && playlist.tracks && playlist.tracks.length > 0 && (
          <div className="mb-4 rounded-lg bg-[rgba(16,22,31,0.65)] px-4 py-2 text-sm text-[var(--color-subtext)]">
            💡 Tip: Drag and drop tracks to reorder them
          </div>
        )}

        {}
        {playlist.tracks && playlist.tracks.length > 0 ? (
          <div className="grid gap-3">
            {[...playlist.tracks]
              .sort((a, b) => a.position - b.position)
              .map((item, index) => (
                <div
                  key={item.id}
                  draggable={isOwner}
                  onDragStart={
                    isOwner ? () => handleDragStart(index) : undefined
                  }
                  onDragOver={
                    isOwner ? (e) => handleDragOver(e, index) : undefined
                  }
                  onDrop={isOwner ? (e) => handleDrop(e, index) : undefined}
                  onDragEnd={isOwner ? handleDragEnd : undefined}
                  className={`relative transition-opacity ${
                    isOwner ? "cursor-move" : ""
                  } ${draggedIndex === index ? "opacity-50" : "opacity-100"}`}
                >
                  <div className="flex items-center gap-3">
                    {}
                    {isOwner ? (
                      <div className="flex flex-col items-center text-[var(--color-muted)]">
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2zm0-4a1 1 0 100-2 1 1 0 000 2zm0-4a1 1 0 100-2 1 1 0 000 2z" />
                        </svg>
                        <span className="text-xs">{index + 1}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center text-[var(--color-muted)]">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                    )}

                    {}
                    <div className="flex-1">
                      <EnhancedTrackCard
                        track={item.track}
                        onPlay={player.play}
                        onAddToQueue={player.addToQueue}
                        showActions={true}
                        excludePlaylistId={playlistId}
                      />
                    </div>

                    {}
                    {isOwner && (
                      <button
                        onClick={() => handleRemoveTrack(item.id)}
                        className="rounded-full bg-[rgba(16,22,31,0.85)] p-2 text-[var(--color-subtext)] transition hover:text-[var(--color-danger)]"
                        title="Remove from playlist"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-[var(--color-muted)]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
            <p className="mb-2 text-[var(--color-subtext)]">
              This playlist is empty
            </p>
            <Link href="/" className="text-accent hover:underline">
              Search for music to add tracks
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

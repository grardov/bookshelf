"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Pencil, Trash2, Loader2, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { TrackRow, TrackListHeader } from "@/components/track-row";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  getPlaylist,
  updatePlaylist,
  deletePlaylist,
  removeTrackFromPlaylist,
  type PlaylistWithTracks,
} from "@/lib/api/playlists";

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;

  const [playlist, setPlaylist] = useState<PlaylistWithTracks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");

  const fetchPlaylist = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPlaylist(playlistId);
      setPlaylist(data);
    } catch (err) {
      console.error("Failed to fetch playlist:", err);
      router.push("/playlists");
    } finally {
      setIsLoading(false);
    }
  }, [playlistId, router]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  const handleEditOpen = () => {
    if (playlist) {
      setEditName(playlist.name);
      setEditDescription(playlist.description || "");
      setEditTags(playlist.tags.join(", "));
    }
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!playlist || !editName.trim()) return;

    setIsSaving(true);
    try {
      const tagsArray = editTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const updated = await updatePlaylist(playlistId, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        tags: tagsArray,
      });

      setPlaylist((prev) =>
        prev
          ? {
              ...prev,
              name: updated.name,
              description: updated.description,
              tags: updated.tags,
            }
          : null
      );
      setEditOpen(false);
    } catch (err) {
      console.error("Failed to update playlist:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePlaylist(playlistId);
      router.push("/playlists");
    } catch (err) {
      console.error("Failed to delete playlist:", err);
      setIsDeleting(false);
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    try {
      await removeTrackFromPlaylist(playlistId, trackId);
      setPlaylist((prev) =>
        prev
          ? {
              ...prev,
              tracks: prev.tracks.filter((t) => t.id !== trackId),
              track_count: prev.track_count - 1,
            }
          : null
      );
    } catch (err) {
      console.error("Failed to remove track:", err);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 py-6">
        <Skeleton className="mb-6 h-5 w-24" />
        <Skeleton className="mb-2 h-10 w-64" />
        <Skeleton className="mb-4 h-4 w-96" />
        <Skeleton className="mt-6 h-24 w-full max-w-md" />
      </main>
    );
  }

  if (!playlist) {
    return null;
  }

  return (
    <main className="flex-1 py-6">
      {/* Breadcrumb */}
      <Link
        href="/playlists"
        className="mb-6 inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Playlists
      </Link>

      {/* Playlist header */}
      <section className="mb-6" aria-labelledby="playlist-title">
        <h1
          id="playlist-title"
          className="font-heading text-3xl font-bold text-white md:text-4xl"
        >
          {playlist.name}
        </h1>
        {playlist.description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#9ca3af]">
            {playlist.description}
          </p>
        )}

        {/* Stats grid */}
        <div className="mt-6 grid w-full max-w-md grid-cols-2 divide-x divide-[#2a2a2a] rounded-lg border border-[#2a2a2a]">
          <div className="px-4 py-3 text-center">
            <p className="text-xs text-[#525252]">Tracks</p>
            <p className="mt-1 text-sm font-medium text-white">
              {playlist.track_count}
            </p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-xs text-[#525252]">Duration</p>
            <p className="mt-1 text-sm font-medium text-white">
              {playlist.total_duration || "--"}
            </p>
          </div>
        </div>

        {/* Tags */}
        {playlist.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {playlist.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="border-[#2a2a2a] bg-[#1a1a1a] text-[#9ca3af]"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3">
          <Button
            className="gap-2 rounded-full"
            disabled={playlist.tracks.length === 0}
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Play all
          </Button>

          {/* Edit Dialog */}
          <Button
            variant="ghost"
            size="icon"
            className="text-[#9ca3af] hover:text-white"
            aria-label="Edit playlist"
            onClick={handleEditOpen}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-[#9ca3af] hover:text-white"
            aria-label="Delete playlist"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </section>

      <Separator className="mb-4 bg-[#2a2a2a]" />

      {/* Track list */}
      <section aria-label="Track list">
        {playlist.tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#141414] py-12">
            <ListMusic className="h-10 w-10 text-[#525252]" aria-hidden="true" />
            <p className="mt-4 text-sm text-[#525252]">
              No tracks in this playlist yet
            </p>
            <p className="mt-1 text-xs text-[#525252]">
              Add tracks from your collection
            </p>
          </div>
        ) : (
          <>
            <TrackListHeader showAlbum={false} showBpm={false} />
            <Separator className="mb-1 hidden bg-[#2a2a2a] md:block" />

            <ul className="space-y-0.5" role="list">
              {playlist.tracks.map((track) => (
                <TrackRow
                  key={track.id}
                  id={track.id}
                  position={track.track_order}
                  title={track.title}
                  artist={track.artist}
                  duration={track.duration || "--:--"}
                  menuItems={[
                    {
                      label: "Remove from playlist",
                      onClick: () => handleRemoveTrack(track.id),
                      destructive: true,
                    },
                    {
                      label: "View release",
                      onClick: () =>
                        router.push(`/collection/${track.release_id}`),
                    },
                  ]}
                />
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="border-[#2a2a2a] bg-[#141414] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit playlist</DialogTitle>
            <DialogDescription className="text-[#9ca3af]">
              Update the details of your playlist.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEditSave();
            }}
            className="space-y-4 py-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-[#9ca3af]">
                Title
              </Label>
              <Input
                id="edit-title"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="border-[#2a2a2a] bg-[#1a1a1a] text-white focus-visible:ring-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-[#9ca3af]">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="border-[#2a2a2a] bg-[#1a1a1a] text-white focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags" className="text-[#9ca3af]">
                Tags (comma-separated)
              </Label>
              <Input
                id="edit-tags"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="house, techno, ambient"
                className="border-[#2a2a2a] bg-[#1a1a1a] text-white focus-visible:ring-primary"
              />
            </div>
          </form>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="ghost" className="text-[#9ca3af]">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleEditSave} disabled={!editName.trim() || isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-[#2a2a2a] bg-[#141414] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Delete playlist</DialogTitle>
            <DialogDescription className="text-[#9ca3af]">
              Are you sure you want to delete &quot;{playlist.name}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="ghost" className="text-[#9ca3af]">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete playlist"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

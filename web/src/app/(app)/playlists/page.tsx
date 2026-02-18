"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Play, MoreHorizontal, ListMusic, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog";
import {
  listPlaylists,
  deletePlaylist,
  type Playlist,
} from "@/lib/api/playlists";

export default function PlaylistsPage() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPlaylists = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await listPlaylists();
      setPlaylists(response.items);
    } catch (err) {
      console.error("Failed to fetch playlists:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const handleCreateSuccess = (newPlaylist: Playlist) => {
    setPlaylists((prev) => [newPlaylist, ...prev]);
  };

  const handleDeleteClick = (playlist: Playlist) => {
    setPlaylistToDelete(playlist);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!playlistToDelete) return;

    setIsDeleting(true);
    try {
      await deletePlaylist(playlistToDelete.id);
      setPlaylists((prev) => prev.filter((p) => p.id !== playlistToDelete.id));
      setDeleteOpen(false);
      setPlaylistToDelete(null);
    } catch (err) {
      console.error("Failed to delete playlist:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <main className="flex-1 py-6">
      <AppHeader title="Playlists" />

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-[#525252]">
          {isLoading ? "Loading..." : `${playlists.length} playlists`}
        </p>
        <Button
          size="sm"
          className="gap-2 rounded-full"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New playlist
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg border border-[#2a2a2a] bg-[#141414] p-4"
            >
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#141414] py-16">
          <ListMusic className="h-12 w-12 text-[#525252]" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-white">
            No playlists yet
          </h2>
          <p className="mt-2 text-center text-sm text-[#525252]">
            Create your first playlist to start organizing your tracks.
          </p>
          <Button
            className="mt-6 gap-2 rounded-full"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create playlist
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="group flex items-center gap-4 rounded-lg border border-[#2a2a2a] bg-[#141414] p-4 transition-colors hover:border-[#404040]"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/playlists/${playlist.id}`}
                  className="text-sm font-medium text-white hover:underline"
                >
                  {playlist.name}
                </Link>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#525252]">
                  <span>{playlist.track_count} tracks</span>
                  <span aria-hidden="true">&middot;</span>
                  <span>{formatDate(playlist.created_at)}</span>
                </div>
              </div>

              {playlist.tags.length > 0 && (
                <div className="hidden gap-1 sm:flex">
                  {playlist.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="border-[#2a2a2a] bg-[#1a1a1a] text-[10px] text-[#9ca3af]"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[#525252] hover:text-white"
                  aria-label={`Play ${playlist.name}`}
                  onClick={() => router.push(`/playlists/${playlist.id}`)}
                >
                  <Play className="h-4 w-4" aria-hidden="true" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[#525252] opacity-0 hover:text-white group-hover:opacity-100"
                      aria-label={`More options for ${playlist.name}`}
                    >
                      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/playlists/${playlist.id}`}>
                        View details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteClick(playlist)}
                    >
                      Delete playlist
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Playlist Dialog */}
      <CreatePlaylistDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreateSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-[#2a2a2a] bg-[#141414] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Delete playlist</DialogTitle>
            <DialogDescription className="text-[#9ca3af]">
              Are you sure you want to delete &quot;{playlistToDelete?.name}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setDeleteOpen(false)}
              className="text-[#9ca3af]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
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

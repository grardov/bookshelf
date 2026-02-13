"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  listPlaylists,
  addTrackToPlaylist,
  createPlaylist,
  type Playlist,
  type AddTrackData,
} from "@/lib/api/playlists";

interface AddToPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: AddTrackData;
}

export function AddToPlaylistDialog({
  open,
  onOpenChange,
  track,
}: AddToPlaylistDialogProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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
    if (open) {
      fetchPlaylists();
      setAddedTo(new Set());
      setShowCreate(false);
      setNewPlaylistName("");
    }
  }, [open, fetchPlaylists]);

  const handleAddToPlaylist = async (playlistId: string) => {
    setIsAdding(playlistId);
    try {
      await addTrackToPlaylist(playlistId, track);
      setAddedTo((prev) => new Set(prev).add(playlistId));
    } catch (err) {
      console.error("Failed to add track:", err);
    } finally {
      setIsAdding(null);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    setIsCreating(true);
    try {
      const newPlaylist = await createPlaylist({ name: newPlaylistName.trim() });
      await addTrackToPlaylist(newPlaylist.id, track);
      setPlaylists((prev) => [newPlaylist, ...prev]);
      setAddedTo((prev) => new Set(prev).add(newPlaylist.id));
      setShowCreate(false);
      setNewPlaylistName("");
    } catch (err) {
      console.error("Failed to create playlist:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#2a2a2a] bg-[#141414] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Add to playlist</DialogTitle>
          <DialogDescription className="text-[#9ca3af]">
            Add &quot;{track.title}&quot; to a playlist
          </DialogDescription>
        </DialogHeader>

        {showCreate ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="playlist-name" className="text-[#9ca3af]">
                Playlist name
              </Label>
              <Input
                id="playlist-name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="My Playlist"
                className="border-[#2a2a2a] bg-[#1a1a1a] text-white"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowCreate(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim() || isCreating}
                className="flex-1"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create & Add"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => setShowCreate(true)}
              className="w-full justify-start gap-2 border-[#2a2a2a] bg-[#1a1a1a]"
            >
              <Plus className="h-4 w-4" />
              Create new playlist
            </Button>

            <ScrollArea className="max-h-64">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[#525252]" />
                </div>
              ) : playlists.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#525252]">
                  No playlists yet
                </p>
              ) : (
                <div className="space-y-1">
                  {playlists.map((playlist) => {
                    const isAddedTo = addedTo.has(playlist.id);
                    const isAddingTo = isAdding === playlist.id;

                    return (
                      <button
                        key={playlist.id}
                        onClick={() => !isAddedTo && handleAddToPlaylist(playlist.id)}
                        disabled={isAddedTo || isAddingTo}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-[#1a1a1a] disabled:opacity-50"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            {playlist.name}
                          </p>
                          <p className="text-xs text-[#525252]">
                            {playlist.track_count || 0} tracks
                          </p>
                        </div>
                        {isAddingTo ? (
                          <Loader2 className="h-4 w-4 animate-spin text-[#525252]" />
                        ) : isAddedTo ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Plus className="h-4 w-4 text-[#525252]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPlaylist, type Playlist } from "@/lib/api/playlists";

interface CreatePlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (playlist: Playlist) => void;
}

export function CreatePlaylistDialog({
  open,
  onOpenChange,
  onCreated,
}: CreatePlaylistDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setDescription("");
    setTags("");
    setError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const playlist = await createPlaylist({
        name: name.trim(),
        description: description.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      });

      onCreated?.(playlist);
      handleOpenChange(false);
    } catch {
      setError("Failed to create playlist. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-[#2a2a2a] bg-[#141414] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Create playlist</DialogTitle>
          <DialogDescription className="text-[#9ca3af]">
            Create a new playlist to organize your tracks.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[#9ca3af]">
              Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Playlist"
              className="border-[#2a2a2a] bg-[#1a1a1a] text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-[#9ca3af]">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className="border-[#2a2a2a] bg-[#1a1a1a] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags" className="text-[#9ca3af]">
              Tags (comma-separated)
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="house, techno, ambient"
              className="border-[#2a2a2a] bg-[#1a1a1a] text-white"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              className="text-[#9ca3af]"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isCreating}>
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create playlist"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

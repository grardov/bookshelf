"use client";

import { useState } from "react";
import { Plus, Disc3, Search } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ReleaseCard } from "@/components/release-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Album {
  id: string;
  title: string;
  artist: string;
  year: string;
  genre: string;
  format: "vinyl" | "cd" | "cassette";
}

const initialAlbums: Album[] = [
  {
    id: "1",
    title: "Random Access Memories",
    artist: "Daft Punk",
    year: "2013",
    genre: "Electronic",
    format: "vinyl",
  },
  {
    id: "2",
    title: "Kind of Blue",
    artist: "Miles Davis",
    year: "1959",
    genre: "Jazz",
    format: "vinyl",
  },
  {
    id: "3",
    title: "Discovery",
    artist: "Daft Punk",
    year: "2001",
    genre: "Electronic",
    format: "vinyl",
  },
];

export default function CollectionPage() {
  const [albums, setAlbums] = useState<Album[]>(initialAlbums);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAlbum, setNewAlbum] = useState<Omit<Album, "id">>({
    title: "",
    artist: "",
    year: "",
    genre: "",
    format: "vinyl",
  });

  const filteredAlbums = albums.filter(
    (album) =>
      album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      album.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      album.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddAlbum = () => {
    if (!newAlbum.title || !newAlbum.artist) return;

    const album: Album = {
      id: Date.now().toString(),
      ...newAlbum,
    };

    setAlbums([album, ...albums]);
    setNewAlbum({
      title: "",
      artist: "",
      year: "",
      genre: "",
      format: "vinyl",
    });
    setIsAddDialogOpen(false);
  };

  const handleDeleteAlbum = (id: string) => {
    setAlbums(albums.filter((album) => album.id !== id));
  };

  return (
    <main className="flex-1 py-6">
      <AppHeader title="Collection" />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#525252]">
          {albums.length} {albums.length === 1 ? "album" : "albums"}
        </p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]"
              aria-hidden="true"
            />
            <Input
              type="text"
              placeholder="Search albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-48 border-[#2a2a2a] bg-[#141414] pl-9 text-sm text-white placeholder:text-[#525252] focus-visible:ring-primary"
              aria-label="Search albums"
            />
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 rounded-full">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add album
              </Button>
            </DialogTrigger>
            <DialogContent className="border-[#2a2a2a] bg-[#0a0a0a]">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Album</DialogTitle>
                <DialogDescription className="text-[#525252]">
                  Add a new album to your collection.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-[#9ca3af]">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    value={newAlbum.title}
                    onChange={(e) =>
                      setNewAlbum({ ...newAlbum, title: e.target.value })
                    }
                    placeholder="Album title"
                    className="border-[#2a2a2a] bg-[#141414] text-white placeholder:text-[#525252]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="artist" className="text-[#9ca3af]">
                    Artist *
                  </Label>
                  <Input
                    id="artist"
                    value={newAlbum.artist}
                    onChange={(e) =>
                      setNewAlbum({ ...newAlbum, artist: e.target.value })
                    }
                    placeholder="Artist name"
                    className="border-[#2a2a2a] bg-[#141414] text-white placeholder:text-[#525252]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="year" className="text-[#9ca3af]">
                      Year
                    </Label>
                    <Input
                      id="year"
                      value={newAlbum.year}
                      onChange={(e) =>
                        setNewAlbum({ ...newAlbum, year: e.target.value })
                      }
                      placeholder="2024"
                      className="border-[#2a2a2a] bg-[#141414] text-white placeholder:text-[#525252]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="genre" className="text-[#9ca3af]">
                      Genre
                    </Label>
                    <Input
                      id="genre"
                      value={newAlbum.genre}
                      onChange={(e) =>
                        setNewAlbum({ ...newAlbum, genre: e.target.value })
                      }
                      placeholder="Electronic"
                      className="border-[#2a2a2a] bg-[#141414] text-white placeholder:text-[#525252]"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[#9ca3af]">Format</Label>
                  <div className="flex gap-2">
                    {(["vinyl", "cd", "cassette"] as const).map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => setNewAlbum({ ...newAlbum, format })}
                        className={`rounded-full border px-4 py-1.5 text-sm capitalize transition-colors ${
                          newAlbum.format === format
                            ? "border-primary bg-primary text-white"
                            : "border-[#2a2a2a] text-[#9ca3af] hover:border-[#404040]"
                        }`}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="text-[#9ca3af] hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddAlbum}
                  disabled={!newAlbum.title || !newAlbum.artist}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  Add Album
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Empty state */}
      {albums.length === 0 && (
        <section className="flex flex-1 flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#141414]">
            <Disc3 className="h-8 w-8 text-[#525252]" aria-hidden="true" />
          </div>
          <h2 className="mb-2 font-heading text-lg font-semibold text-white">
            Your collection is empty
          </h2>
          <p className="mb-6 max-w-sm text-sm text-[#525252]">
            Start building your vinyl collection by adding your first album.
          </p>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="gap-2 bg-primary text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Your First Album
          </Button>
        </section>
      )}

      {/* No search results */}
      {albums.length > 0 && filteredAlbums.length === 0 && (
        <section className="flex flex-1 flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#141414]">
            <Search className="h-8 w-8 text-[#525252]" aria-hidden="true" />
          </div>
          <h2 className="mb-2 font-heading text-lg font-semibold text-white">
            No albums found
          </h2>
          <p className="max-w-sm text-sm text-[#525252]">
            No albums match &ldquo;{searchQuery}&rdquo;. Try a different search
            term.
          </p>
        </section>
      )}

      {/* Album grid */}
      {filteredAlbums.length > 0 && (
        <section
          className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          aria-label="Album collection"
        >
          {filteredAlbums.map((album) => (
            <ReleaseCard
              key={album.id}
              {...album}
              onDelete={handleDeleteAlbum}
            />
          ))}
        </section>
      )}
    </main>
  );
}

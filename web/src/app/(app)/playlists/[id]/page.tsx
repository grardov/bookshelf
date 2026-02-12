"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pencil,
  Trash2,
  Clock,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const playlist = {
  id: "1",
  title: "Late Night Deep House",
  description:
    "Smooth deep house tracks perfect for winding down after midnight. Selected from your collection with a focus on warm pads and rolling basslines.",
  trackCount: 18,
  duration: "1h 24m",
  genre: "Deep House",
  createdAt: "2 hours ago",
  source: "ai" as const,
};

const tracks = [
  {
    id: "1",
    position: 1,
    title: "Deep Inside",
    artist: "Kerri Chandler",
    album: "Spaces and Places",
    cover: "/covers/placeholder.svg",
    duration: "6:42",
    bpm: 122,
  },
  {
    id: "2",
    position: 2,
    title: "Can You Feel It",
    artist: "Larry Heard",
    album: "Amnesia",
    cover: "/covers/placeholder.svg",
    duration: "7:15",
    bpm: 120,
  },
  {
    id: "3",
    position: 3,
    title: "Strings of Life",
    artist: "Derrick May",
    album: "Innovator",
    cover: "/covers/placeholder.svg",
    duration: "5:38",
    bpm: 128,
  },
  {
    id: "4",
    position: 4,
    title: "Move Your Body",
    artist: "Marshall Jefferson",
    album: "House Music Anthem",
    cover: "/covers/placeholder.svg",
    duration: "8:02",
    bpm: 121,
  },
  {
    id: "5",
    position: 5,
    title: "French Kiss",
    artist: "Lil Louis",
    album: "From the Mind of Lil Louis",
    cover: "/covers/placeholder.svg",
    duration: "9:45",
    bpm: 118,
  },
  {
    id: "6",
    position: 6,
    title: "Missing You",
    artist: "Ron Trent",
    album: "Prescription",
    cover: "/covers/placeholder.svg",
    duration: "6:30",
    bpm: 123,
  },
  {
    id: "7",
    position: 7,
    title: "Star Dancing",
    artist: "Moodymann",
    album: "Silentintroduction",
    cover: "/covers/placeholder.svg",
    duration: "5:12",
    bpm: 119,
  },
  {
    id: "8",
    position: 8,
    title: "Sandstorms",
    artist: "Theo Parrish",
    album: "First Floor",
    cover: "/covers/placeholder.svg",
    duration: "4:55",
    bpm: 126,
  },
];

export default function PlaylistDetailPage() {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
          {playlist.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#9ca3af]">
          {playlist.description}
        </p>

        {/* Stats grid */}
        <div className="mt-6 grid w-full max-w-md grid-cols-3 divide-x divide-[#2a2a2a] rounded-lg border border-[#2a2a2a]">
          <div className="px-4 py-3 text-center">
            <p className="text-xs text-[#525252]">Genre</p>
            <p className="mt-1 text-sm font-medium text-white">
              {playlist.genre}
            </p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-xs text-[#525252]">Tracks</p>
            <p className="mt-1 text-sm font-medium text-white">
              {playlist.trackCount}
            </p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-xs text-[#525252]">Duration</p>
            <p className="mt-1 text-sm font-medium text-white">
              {playlist.duration}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3">
          <Button className="gap-2 rounded-full">
            <Play className="h-4 w-4" aria-hidden="true" />
            Play all
          </Button>

          {/* Edit Dialog */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#9ca3af] hover:text-white"
                aria-label="Edit playlist"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DialogTrigger>
            <DialogContent className="border-[#2a2a2a] bg-[#141414] sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Edit playlist</DialogTitle>
                <DialogDescription className="text-[#9ca3af]">
                  Update the details of your playlist.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title" className="text-[#9ca3af]">
                    Title
                  </Label>
                  <Input
                    id="edit-title"
                    defaultValue={playlist.title}
                    className="border-[#2a2a2a] bg-[#1a1a1a] text-white focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description" className="text-[#9ca3af]">
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    defaultValue={playlist.description}
                    rows={3}
                    className="border-[#2a2a2a] bg-[#1a1a1a] text-white focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-genre" className="text-[#9ca3af]">
                    Genre
                  </Label>
                  <Input
                    id="edit-genre"
                    defaultValue={playlist.genre}
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
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Dialog */}
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#9ca3af] hover:text-white"
                aria-label="Delete playlist"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DialogTrigger>
            <DialogContent className="border-[#2a2a2a] bg-[#141414] sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Delete playlist</DialogTitle>
                <DialogDescription className="text-[#9ca3af]">
                  Are you sure you want to delete &quot;{playlist.title}&quot;?
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button variant="ghost" className="text-[#9ca3af]">
                    Cancel
                  </Button>
                </DialogClose>
                <Button variant="destructive">Delete playlist</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Badge
            variant="secondary"
            className="ml-auto border-[#2a2a2a] bg-[#1a1a1a] text-[#9ca3af]"
          >
            {playlist.source === "ai" ? "AI generated" : "Manual"}
          </Badge>
        </div>
      </section>

      <Separator className="mb-4 bg-[#2a2a2a]" />

      {/* Track list */}
      <section aria-label="Track list">
        {/* Table header (desktop) */}
        <div
          className="hidden items-center gap-4 px-3 py-2 text-xs font-medium uppercase tracking-wide text-[#525252] md:flex"
          aria-hidden="true"
        >
          <span className="w-8 text-center">#</span>
          <span className="w-10" />
          <span className="flex-1">Title</span>
          <span className="w-40">Album</span>
          <span className="w-14 text-center">BPM</span>
          <span className="w-14 text-right">
            <Clock className="ml-auto h-3 w-3" />
          </span>
          <span className="w-10" />
        </div>
        <Separator className="mb-1 hidden bg-[#2a2a2a] md:block" />

        <ul className="space-y-0.5" role="list">
          {tracks.map((track) => (
            <li
              key={track.id}
              className="group flex items-center gap-4 rounded-md px-3 py-2.5 transition-colors hover:bg-[#141414]"
            >
              <span className="w-8 text-center text-sm text-[#525252]">
                <span className="group-hover:hidden">
                  {String(track.position).padStart(2, "0")}
                </span>
                <Play
                  className="mx-auto hidden h-4 w-4 text-primary group-hover:block"
                  aria-hidden="true"
                />
              </span>

              {/* Cover */}
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-[#1a1a1a]">
                <div
                  className="flex h-full w-full items-center justify-center text-[#525252]"
                  aria-label={`Cover for ${track.album}`}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {track.title}
                </p>
                <p className="truncate text-xs text-[#525252]">
                  {track.artist}
                </p>
              </div>

              <span className="hidden w-40 truncate text-sm text-[#525252] md:block">
                {track.album}
              </span>

              <span className="hidden w-14 text-center text-sm text-[#525252] md:block">
                {track.bpm}
              </span>

              <span className="w-14 text-right text-sm text-[#525252]">
                {track.duration}
              </span>

              <div className="w-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#525252] opacity-0 hover:text-white group-hover:opacity-100"
                      aria-label={`More options for ${track.title}`}
                    >
                      <MoreHorizontal
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Remove from playlist</DropdownMenuItem>
                    <DropdownMenuItem>View on Discogs</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

import Link from "next/link";
import { Plus, Play, Clock, MoreHorizontal } from "lucide-react";
import { createMetadata } from "@/lib/metadata";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const metadata = createMetadata({
  title: "Playlists",
  description: "Browse and manage your playlists",
  path: "/playlists",
});

const playlists = [
  {
    id: "1",
    title: "Late Night Deep House",
    trackCount: 18,
    duration: "1h 24m",
    createdAt: "2 hours ago",
    source: "ai" as const,
  },
  {
    id: "2",
    title: "Sunday Morning Jazz",
    trackCount: 12,
    duration: "52m",
    createdAt: "Yesterday",
    source: "manual" as const,
  },
  {
    id: "3",
    title: "Vinyl Classics Mix",
    trackCount: 24,
    duration: "2h 10m",
    createdAt: "3 days ago",
    source: "ai" as const,
  },
  {
    id: "4",
    title: "Pre-Party Warmup",
    trackCount: 15,
    duration: "1h 05m",
    createdAt: "1 week ago",
    source: "manual" as const,
  },
  {
    id: "5",
    title: "Ambient Electronica",
    trackCount: 20,
    duration: "1h 45m",
    createdAt: "2 weeks ago",
    source: "ai" as const,
  },
];

export default function PlaylistsPage() {
  return (
    <main className="flex-1 py-6">
      <AppHeader title="Playlists" />

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-[#525252]">{playlists.length} playlists</p>
        <Button size="sm" className="gap-2 rounded-full">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New playlist
        </Button>
      </div>

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
                {playlist.title}
              </Link>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#525252]">
                <span>{playlist.trackCount} tracks</span>
                <span aria-hidden="true">&middot;</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {playlist.duration}
                </span>
                <span aria-hidden="true">&middot;</span>
                <span>{playlist.createdAt}</span>
              </div>
            </div>

            <Badge
              variant="secondary"
              className="hidden border-[#2a2a2a] bg-[#1a1a1a] text-[10px] text-[#9ca3af] sm:inline-flex"
            >
              {playlist.source === "ai" ? "AI generated" : "Manual"}
            </Badge>

            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-[#525252] hover:text-white"
                aria-label={`Play ${playlist.title}`}
              >
                <Play className="h-4 w-4" aria-hidden="true" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-[#525252] opacity-0 hover:text-white group-hover:opacity-100"
                    aria-label={`More options for ${playlist.title}`}
                  >
                    <MoreHorizontal
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/playlists/${playlist.id}`}>
                      View details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Edit playlist</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    Delete playlist
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

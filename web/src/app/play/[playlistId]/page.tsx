"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getPlaylist, type PlaylistWithTracks } from "@/lib/api/playlists";
import { PlayView } from "@/components/play-view";

export default function PlayPage() {
  const params = useParams<{ playlistId: string }>();
  const [playlist, setPlaylist] = useState<PlaylistWithTracks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPlaylist() {
      try {
        setIsLoading(true);
        const data = await getPlaylist(params.playlistId);
        if (cancelled) return;
        setPlaylist(data);
      } catch {
        if (cancelled) return;
        setError("Failed to load playlist");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchPlaylist();

    return () => {
      cancelled = true;
    };
  }, [params.playlistId]);

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-[#525252]" />
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-[#0a0a0a]">
        <p className="text-[#9ca3af]">{error || "Playlist not found"}</p>
        <button
          onClick={() => window.close()}
          className="text-sm text-primary underline underline-offset-4"
        >
          Close
        </button>
      </div>
    );
  }

  if (playlist.tracks.length === 0) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-[#0a0a0a]">
        <p className="text-[#9ca3af]">This playlist has no tracks</p>
        <button
          onClick={() => window.close()}
          className="text-sm text-primary underline underline-offset-4"
        >
          Close
        </button>
      </div>
    );
  }

  return <PlayView playlist={playlist} />;
}

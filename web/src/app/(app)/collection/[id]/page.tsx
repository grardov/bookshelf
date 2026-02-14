"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Disc3, ListMusic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrackRow, TrackListHeader } from "@/components/track-row";
import { AddToPlaylistDialog } from "@/components/add-to-playlist-dialog";
import { getRelease, type Release } from "@/lib/api/collection";
import {
  getReleaseTracks,
  type DiscogsTrack,
} from "@/lib/api/playlists";

export default function ReleaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const releaseId = params.id as string;

  const [release, setRelease] = useState<Release | null>(null);
  const [tracks, setTracks] = useState<DiscogsTrack[]>([]);
  const [isLoadingRelease, setIsLoadingRelease] = useState(true);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [tracksError, setTracksError] = useState<string | null>(null);

  // Add to playlist dialog state
  const [selectedTrack, setSelectedTrack] = useState<DiscogsTrack | null>(null);
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false);

  // Fetch release metadata
  useEffect(() => {
    async function fetchRelease() {
      try {
        const data = await getRelease(releaseId);
        setRelease(data);
      } catch (err) {
        console.error("Failed to fetch release:", err);
        router.push("/collection");
      } finally {
        setIsLoadingRelease(false);
      }
    }
    fetchRelease();
  }, [releaseId, router]);

  // Fetch tracks from Discogs
  const fetchTracks = useCallback(async () => {
    if (!release) return;

    setIsLoadingTracks(true);
    setTracksError(null);

    try {
      const data = await getReleaseTracks(releaseId);
      setTracks(data.tracks);
    } catch (err) {
      console.error("Failed to fetch tracks:", err);
      setTracksError("Unable to load tracks. Please try again.");
    } finally {
      setIsLoadingTracks(false);
    }
  }, [releaseId, release]);

  useEffect(() => {
    if (release) {
      fetchTracks();
    }
  }, [release, fetchTracks]);

  const handleAddToPlaylist = (track: DiscogsTrack) => {
    setSelectedTrack(track);
    setAddToPlaylistOpen(true);
  };

  if (isLoadingRelease) {
    return (
      <main className="flex-1 py-6">
        <Skeleton className="mb-6 h-5 w-24" />
        <div className="flex flex-col gap-6 md:flex-row">
          <Skeleton className="h-64 w-64 rounded-lg" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      </main>
    );
  }

  if (!release) {
    return null;
  }

  return (
    <main className="flex-1 py-6">
      {/* Breadcrumb */}
      <Link
        href="/collection"
        className="mb-6 inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Collection
      </Link>

      {/* Release header */}
      <section className="mb-8 flex flex-col gap-6 md:flex-row">
        {/* Cover art */}
        <div className="h-64 w-64 shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a]">
          {release.cover_image_url ? (
            <Image
              src={release.cover_image_url}
              alt={`${release.title} by ${release.artist_name}`}
              width={256}
              height={256}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Disc3 className="h-16 w-16 text-[#2a2a2a]" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="font-heading text-3xl font-bold text-white">
            {release.title}
          </h1>
          <p className="mt-2 text-lg text-[#9ca3af]">{release.artist_name}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {release.year && (
              <Badge
                variant="secondary"
                className="border-[#2a2a2a] bg-[#1a1a1a]"
              >
                {release.year}
              </Badge>
            )}
            {release.format && (
              <Badge
                variant="secondary"
                className="border-[#2a2a2a] bg-[#1a1a1a]"
              >
                {release.format}
              </Badge>
            )}
            {release.genres.map((genre) => (
              <Badge key={genre} variant="outline" className="border-[#2a2a2a]">
                {genre}
              </Badge>
            ))}
          </div>

          {release.labels.length > 0 && (
            <p className="mt-4 text-sm text-[#525252]">
              {release.labels.join(", ")}
              {release.catalog_number && ` - ${release.catalog_number}`}
            </p>
          )}
        </div>
      </section>

      {/* Tracks section */}
      <section aria-labelledby="tracks-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="tracks-heading" className="text-lg font-semibold text-white">
            Tracks
          </h2>
          {tracksError && (
            <Button variant="ghost" size="sm" onClick={fetchTracks}>
              Retry
            </Button>
          )}
        </div>

        {isLoadingTracks ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#525252]" />
            <span className="ml-2 text-sm text-[#525252]">
              Loading tracks from Discogs...
            </span>
          </div>
        ) : tracksError ? (
          <div className="rounded-lg border border-[#2a2a2a] bg-[#141414] p-6 text-center">
            <p className="text-sm text-[#525252]">{tracksError}</p>
          </div>
        ) : tracks.length === 0 ? (
          <div className="rounded-lg border border-[#2a2a2a] bg-[#141414] p-6 text-center">
            <ListMusic className="mx-auto h-8 w-8 text-[#525252]" />
            <p className="mt-2 text-sm text-[#525252]">
              No track information available
            </p>
          </div>
        ) : (
          <>
            <TrackListHeader showAlbum={false} showBpm={false} />
            <ul className="space-y-0.5" role="list">
              {tracks.map((track, index) => (
                <TrackRow
                  key={`${track.position}-${index}`}
                  id={`${track.position}-${index}`}
                  position={index + 1}
                  title={track.title}
                  artist={track.artists.join(", ") || release.artist_name}
                  duration={track.duration || "--:--"}
                  coverUrl={release.cover_image_url || undefined}
                  menuItems={[
                    {
                      label: "Add to playlist",
                      onClick: () => handleAddToPlaylist(track),
                    },
                  ]}
                />
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Add to Playlist Dialog */}
      {selectedTrack && release && (
        <AddToPlaylistDialog
          open={addToPlaylistOpen}
          onOpenChange={setAddToPlaylistOpen}
          track={{
            release_id: release.id,
            discogs_release_id: release.discogs_release_id,
            position: selectedTrack.position,
            title: selectedTrack.title,
            artist: selectedTrack.artists.join(", ") || release.artist_name,
            duration: selectedTrack.duration || undefined,
            cover_image_url: release.cover_image_url || undefined,
          }}
        />
      )}
    </main>
  );
}

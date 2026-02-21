"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Disc3,
  ListMusic,
  Loader2,
  Plus,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TrackRow, TrackListHeader } from "@/components/track-row";
import { AddToPlaylistDialog } from "@/components/add-to-playlist-dialog";
import {
  getDiscogsRelease,
  addToCollection,
  removeFromCollection,
  type DiscogsReleaseDetail,
  type DiscogsReleaseTrack,
} from "@/lib/api/discogs";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";

const MAX_NOTE_PARAGRAPHS = 3;

export default function ReleaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const discogsId = Number(params.discogsId);
  const { addView } = useRecentlyViewed();

  const [release, setRelease] = useState<DiscogsReleaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);

  // Add to playlist dialog state
  const [selectedTrack, setSelectedTrack] =
    useState<DiscogsReleaseTrack | null>(null);
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false);

  // Notes dialog state
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);

  // Fetch release from Discogs via backend (cached)
  useEffect(() => {
    async function fetchRelease() {
      try {
        const data = await getDiscogsRelease(discogsId);
        setRelease(data);
        addView({
          discogs_release_id: data.discogs_release_id,
          title: data.title,
          artist_name: data.artist_name,
          cover_image_url: data.cover_image_url,
          year: data.year,
          format: data.format_string,
        });
      } catch (err) {
        console.error("Failed to fetch release:", err);
        setError("Failed to load release details.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchRelease();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discogsId]);

  const handleAddToCollection = useCallback(async () => {
    setIsCollecting(true);
    try {
      const result = await addToCollection(discogsId);
      setRelease((prev) =>
        prev
          ? {
              ...prev,
              in_collection: true,
              collection_release_id: result.release_id,
              discogs_instance_id: result.discogs_instance_id,
            }
          : prev,
      );
    } catch (err) {
      console.error("Failed to add to collection:", err);
    } finally {
      setIsCollecting(false);
    }
  }, [discogsId]);

  const handleRemoveFromCollection = useCallback(async () => {
    setIsCollecting(true);
    try {
      await removeFromCollection(discogsId);
      setRelease((prev) =>
        prev
          ? {
              ...prev,
              in_collection: false,
              collection_release_id: null,
              discogs_instance_id: null,
            }
          : prev,
      );
    } catch (err) {
      console.error("Failed to remove from collection:", err);
    } finally {
      setIsCollecting(false);
    }
  }, [discogsId]);

  const handleAddToPlaylist = (track: DiscogsReleaseTrack) => {
    setSelectedTrack(track);
    setAddToPlaylistOpen(true);
  };

  // Split notes into paragraphs
  const displayNotes = release?.notes;
  const notesParagraphs = useMemo(() => {
    if (!displayNotes) return [];
    return displayNotes.split(/\n\s*\n/).filter((p) => p.trim());
  }, [displayNotes]);
  const isNotesTruncated = notesParagraphs.length > MAX_NOTE_PARAGRAPHS;
  const truncatedParagraphs = isNotesTruncated
    ? notesParagraphs.slice(0, MAX_NOTE_PARAGRAPHS)
    : notesParagraphs;

  if (isLoading) {
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

  if (error || !release) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center py-24">
        <p className="mb-4 text-sm text-[#525252]">
          {error || "Release not found"}
        </p>
        <Button variant="outline" onClick={() => router.push("/create")}>
          Go back
        </Button>
      </main>
    );
  }

  return (
    <main className="flex-1 py-6">
      {/* Breadcrumb */}
      <Link
        href="/create"
        className="mb-6 inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Home
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

          {notesParagraphs.length > 0 && (
            <div className="mt-3">
              {truncatedParagraphs.map((paragraph, i) => (
                <p
                  key={i}
                  className="mt-1 text-sm leading-relaxed text-[#9ca3af] first:mt-0"
                >
                  {paragraph.trim()}
                </p>
              ))}
              {isNotesTruncated && (
                <button
                  type="button"
                  onClick={() => setNotesDialogOpen(true)}
                  className="mt-1 text-sm text-primary hover:underline"
                >
                  Read more
                </button>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {release.year && (
              <Badge
                variant="secondary"
                className="border-[#2a2a2a] bg-[#1a1a1a]"
              >
                {release.year}
              </Badge>
            )}
            {release.formats
              ? release.formats.map((fmt, i) => {
                  const desc = fmt.descriptions?.length
                    ? ` (${fmt.descriptions.join(", ")})`
                    : "";
                  const qty =
                    fmt.qty && parseInt(fmt.qty) > 1 ? `${fmt.qty}x` : "";
                  return (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="border-[#2a2a2a] bg-[#1a1a1a]"
                    >
                      {qty}
                      {fmt.name}
                      {desc}
                    </Badge>
                  );
                })
              : release.format_string && (
                  <Badge
                    variant="secondary"
                    className="border-[#2a2a2a] bg-[#1a1a1a]"
                  >
                    {release.format_string}
                  </Badge>
                )}
            {release.country && (
              <Badge
                variant="secondary"
                className="border-[#2a2a2a] bg-[#1a1a1a]"
              >
                {release.country}
              </Badge>
            )}
            {release.genres.map((genre) => (
              <Badge key={genre} variant="outline" className="border-[#2a2a2a]">
                {genre}
              </Badge>
            ))}
            {release.styles.map((style) => (
              <Badge
                key={style}
                variant="outline"
                className="border-[#2a2a2a] text-[#9ca3af]"
              >
                {style}
              </Badge>
            ))}
          </div>

          {release.labels && (
            <p className="mt-4 text-sm text-[#525252]">
              {release.labels.map((lbl, i) => (
                <span key={i}>
                  {i > 0 && ", "}
                  {lbl.name}
                  {lbl.catno && lbl.catno !== "none" && ` [${lbl.catno}]`}
                </span>
              ))}
            </p>
          )}

          {/* Collection add/remove button */}
          <div className="mt-6">
            {release.in_collection ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveFromCollection}
                disabled={isCollecting}
                className="gap-2 border-[#2a2a2a] text-[#9ca3af] hover:border-red-500/50 hover:text-red-400"
              >
                {isCollecting ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Minus className="h-4 w-4" aria-hidden="true" />
                )}
                Remove from collection
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleAddToCollection}
                disabled={isCollecting}
                className="gap-2"
              >
                {isCollecting ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Plus className="h-4 w-4" aria-hidden="true" />
                )}
                Add to collection
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Tracks section */}
      <section aria-labelledby="tracks-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="tracks-heading" className="text-lg font-semibold text-white">
            Tracks
          </h2>
        </div>

        {release.tracks.length === 0 ? (
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
              {release.tracks.map((track, index) => (
                <TrackRow
                  key={`${track.position}-${index}`}
                  id={`${track.position}-${index}`}
                  position={index + 1}
                  title={track.title}
                  artist={track.artists.join(", ") || release.artist_name}
                  duration={track.duration || "--:--"}
                  coverUrl={release.cover_image_url || undefined}
                  menuItems={
                    release.in_collection && release.collection_release_id
                      ? [
                          {
                            label: "Add to playlist",
                            onClick: () => handleAddToPlaylist(track),
                          },
                        ]
                      : []
                  }
                />
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Notes Dialog */}
      {displayNotes && (
        <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
          <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Notes</DialogTitle>
              <DialogDescription>{release.title}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {notesParagraphs.map((paragraph, i) => (
                <p key={i} className="text-sm leading-relaxed text-[#9ca3af]">
                  {paragraph.trim()}
                </p>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add to Playlist Dialog */}
      {selectedTrack &&
        release.in_collection &&
        release.collection_release_id && (
          <AddToPlaylistDialog
            open={addToPlaylistOpen}
            onOpenChange={setAddToPlaylistOpen}
            track={{
              release_id: release.collection_release_id,
              discogs_release_id: release.discogs_release_id,
              position: selectedTrack.position,
              title: selectedTrack.title,
              artist: selectedTrack.artists.join(", ") || release.artist_name,
              duration: selectedTrack.duration || undefined,
              cover_image_url: release.cover_image_url || undefined,
              release_title: release.title,
            }}
          />
        )}
    </main>
  );
}

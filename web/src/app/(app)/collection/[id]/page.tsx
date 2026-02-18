"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Disc3, ListMusic, Loader2 } from "lucide-react";
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
import { getRelease, type Release } from "@/lib/api/collection";
import {
  getReleaseTracks,
  type DiscogsTrack,
  type DiscogsLabel,
  type DiscogsFormat,
} from "@/lib/api/playlists";

const MAX_NOTE_PARAGRAPHS = 3;

interface EnrichedMetadata {
  notes: string | null;
  country: string | null;
  genres: string[];
  styles: string[];
  labels: DiscogsLabel[] | null;
  formats: DiscogsFormat[] | null;
}

export default function ReleaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const releaseId = params.id as string;

  const [release, setRelease] = useState<Release | null>(null);
  const [tracks, setTracks] = useState<DiscogsTrack[]>([]);
  const [enrichedMetadata, setEnrichedMetadata] =
    useState<EnrichedMetadata | null>(null);
  const [isLoadingRelease, setIsLoadingRelease] = useState(true);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [tracksError, setTracksError] = useState<string | null>(null);

  // Add to playlist dialog state
  const [selectedTrack, setSelectedTrack] = useState<DiscogsTrack | null>(null);
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false);

  // Notes dialog state
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);

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
      setEnrichedMetadata({
        notes: data.notes,
        country: data.country,
        genres: data.genres,
        styles: data.styles,
        labels: data.labels,
        formats: data.formats,
      });
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

  // Split notes into paragraphs (must be above early returns to respect Rules of Hooks)
  const displayNotes = enrichedMetadata?.notes;
  const notesParagraphs = useMemo(() => {
    if (!displayNotes) return [];
    return displayNotes.split(/\n\s*\n/).filter((p) => p.trim());
  }, [displayNotes]);
  const isNotesTruncated = notesParagraphs.length > MAX_NOTE_PARAGRAPHS;
  const truncatedParagraphs = isNotesTruncated
    ? notesParagraphs.slice(0, MAX_NOTE_PARAGRAPHS)
    : notesParagraphs;

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

  // Prefer enriched data from tracks response, fall back to DB data
  const displayGenres = enrichedMetadata?.genres?.length
    ? enrichedMetadata.genres
    : release.genres;
  const displayStyles = enrichedMetadata?.styles?.length
    ? enrichedMetadata.styles
    : release.styles;
  const displayCountry = enrichedMetadata?.country || release.country;
  const displayFormats = enrichedMetadata?.formats;
  const displayLabels = enrichedMetadata?.labels;

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
            {displayFormats
              ? displayFormats.map((fmt, i) => {
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
              : release.format && (
                  <Badge
                    variant="secondary"
                    className="border-[#2a2a2a] bg-[#1a1a1a]"
                  >
                    {release.format}
                  </Badge>
                )}
            {displayCountry && (
              <Badge
                variant="secondary"
                className="border-[#2a2a2a] bg-[#1a1a1a]"
              >
                {displayCountry}
              </Badge>
            )}
            {displayGenres.map((genre) => (
              <Badge key={genre} variant="outline" className="border-[#2a2a2a]">
                {genre}
              </Badge>
            ))}
            {displayStyles.map((style) => (
              <Badge
                key={style}
                variant="outline"
                className="border-[#2a2a2a] text-[#9ca3af]"
              >
                {style}
              </Badge>
            ))}
          </div>

          {displayLabels ? (
            <p className="mt-4 text-sm text-[#525252]">
              {displayLabels.map((lbl, i) => (
                <span key={i}>
                  {i > 0 && ", "}
                  {lbl.name}
                  {lbl.catno && lbl.catno !== "none" && ` [${lbl.catno}]`}
                </span>
              ))}
            </p>
          ) : (
            release.labels.length > 0 && (
              <p className="mt-4 text-sm text-[#525252]">
                {release.labels.join(", ")}
                {release.catalog_number && ` - ${release.catalog_number}`}
              </p>
            )
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

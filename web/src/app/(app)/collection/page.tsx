"use client";

import { useState, useEffect, useCallback } from "react";
import { Disc3, Search } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ReleaseCard } from "@/components/release-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { listReleases, type Release } from "@/lib/api/collection";

export default function CollectionPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchReleases = useCallback(async (search?: string, pageNum = 1) => {
    setIsLoading(true);
    try {
      const response = await listReleases({
        page: pageNum,
        pageSize: 50,
        sortBy: "artist_name",
        sortOrder: "asc",
        search: search || undefined,
      });

      if (pageNum === 1) {
        setReleases(response.items);
      } else {
        setReleases((prev) => [...prev, ...response.items]);
      }
      setTotal(response.total);
      setHasMore(response.has_more);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to fetch releases:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchReleases(searchQuery, 1);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchReleases]);

  const handleLoadMore = () => {
    fetchReleases(searchQuery, page + 1);
  };

  // Loading skeleton
  if (isLoading && releases.length === 0) {
    return (
      <main className="flex-1 py-6">
        <AppHeader title="Collection" />
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 py-6">
      <AppHeader title="Collection" />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#525252]">
          {total} {total === 1 ? "release" : "releases"}
        </p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]"
              aria-hidden="true"
            />
            <Input
              type="text"
              placeholder="Search releases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-48 border-[#2a2a2a] bg-[#141414] pl-9 text-sm text-white placeholder:text-[#525252] focus-visible:ring-primary"
              aria-label="Search releases"
            />
          </div>
        </div>
      </div>

      {/* Empty state */}
      {releases.length === 0 && !isLoading && (
        <section className="flex flex-1 flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#141414]">
            <Disc3 className="h-8 w-8 text-[#525252]" aria-hidden="true" />
          </div>
          <h2 className="mb-2 font-heading text-lg font-semibold text-white">
            No releases yet
          </h2>
          <p className="mb-6 max-w-sm text-sm text-[#525252]">
            Add releases to your collection manually or sync from Discogs in
            Settings.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <a href="/settings">Go to Settings</a>
            </Button>
          </div>
        </section>
      )}

      {/* Release grid */}
      {releases.length > 0 && (
        <>
          <section
            className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            aria-label="Release collection"
          >
            {releases.map((release) => (
              <ReleaseCard
                key={release.id}
                discogsReleaseId={release.discogs_release_id}
                title={release.title}
                artist={release.artist_name}
                year={release.year}
                genre={release.genres[0]}
                format={release.format || undefined}
                coverUrl={release.cover_image_url}
              />
            ))}
          </section>

          {/* Load more button */}
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

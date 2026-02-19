"use client";

import { useState, useCallback, useEffect, startTransition } from "react";

const STORAGE_KEY = "bookshelf:recently-viewed";
const MAX_ITEMS = 10;

export interface RecentlyViewedRelease {
  discogs_release_id: number;
  title: string;
  artist_name: string;
  cover_image_url: string | null;
  year: number | null;
  format: string | null;
  timestamp: number;
}

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedRelease[]>(
    [],
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) startTransition(() => setRecentlyViewed(JSON.parse(stored)));
    } catch {
      // Ignore parse errors
    }
  }, []);

  const addView = useCallback(
    (release: Omit<RecentlyViewedRelease, "timestamp">) => {
      setRecentlyViewed((prev) => {
        const filtered = prev.filter(
          (item) => item.discogs_release_id !== release.discogs_release_id,
        );
        const updated = [
          { ...release, timestamp: Date.now() },
          ...filtered,
        ].slice(0, MAX_ITEMS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    [],
  );

  return { recentlyViewed, addView };
}

"use client";

import { useState, useCallback, useEffect, startTransition } from "react";

const STORAGE_KEY = "bookshelf:search-history";
const MAX_ITEMS = 10;

export interface SearchHistoryItem {
  id: number;
  title: string;
  year: number | null;
  cover_image: string | null;
  format: string | null;
  label: string | null;
  timestamp: number;
}

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) startTransition(() => setHistory(JSON.parse(stored)));
    } catch {
      // Ignore parse errors
    }
  }, []);

  const addSearch = useCallback(
    (release: Omit<SearchHistoryItem, "timestamp">) => {
      setHistory((prev) => {
        const filtered = prev.filter((item) => item.id !== release.id);
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

  const removeSearch = useCallback((id: number) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, addSearch, removeSearch, clearHistory };
}

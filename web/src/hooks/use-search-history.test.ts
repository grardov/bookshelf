import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSearchHistory } from "./use-search-history";

const STORAGE_KEY = "bookshelf:search-history";

const mockRelease = {
  id: 123,
  title: "Random Access Memories",
  year: 2013,
  cover_image: "https://example.com/cover.jpg",
  format: "2xLP",
  label: "Columbia",
};

const mockRelease2 = {
  id: 456,
  title: "Discovery",
  year: 2001,
  cover_image: "https://example.com/cover2.jpg",
  format: "CD",
  label: "Virgin",
};

describe("useSearchHistory", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("starts with empty history", () => {
    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual([]);
  });

  it("loads history from localStorage on mount", () => {
    const stored = [{ ...mockRelease, timestamp: 1000 }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual(stored);
  });

  it("adds a release to history", () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addSearch(mockRelease);
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].id).toBe(123);
    expect(result.current.history[0].title).toBe("Random Access Memories");
    expect(result.current.history[0].timestamp).toBeGreaterThan(0);
  });

  it("deduplicates by id (moves to front)", () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addSearch(mockRelease);
      result.current.addSearch(mockRelease2);
      result.current.addSearch(mockRelease); // re-add first
    });

    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0].id).toBe(123);
    expect(result.current.history[1].id).toBe(456);
  });

  it("limits to 10 items", () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      for (let i = 0; i < 12; i++) {
        result.current.addSearch({
          ...mockRelease,
          id: i,
          title: `Release ${i}`,
        });
      }
    });

    expect(result.current.history).toHaveLength(10);
    expect(result.current.history[0].id).toBe(11); // most recent
  });

  it("removes a release by id", () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addSearch(mockRelease);
      result.current.addSearch(mockRelease2);
    });

    act(() => {
      result.current.removeSearch(123);
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].id).toBe(456);
  });

  it("clears all history", () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addSearch(mockRelease);
      result.current.addSearch(mockRelease2);
    });

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("persists to localStorage on add", () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addSearch(mockRelease);
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(123);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  syncCollection,
  listReleases,
  getRelease,
  type Release,
  type SyncSummary,
  type PaginatedReleases,
} from "./collection";

// Mock the API client
vi.mock("./client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "./client";

const mockApiRequest = vi.mocked(apiRequest);

describe("Collection API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("syncCollection", () => {
    it("calls apiRequest with POST method", async () => {
      const mockSummary: SyncSummary = {
        added: 10,
        updated: 5,
        removed: 2,
        total: 100,
      };
      mockApiRequest.mockResolvedValueOnce(mockSummary);

      const result = await syncCollection();

      expect(mockApiRequest).toHaveBeenCalledWith("/api/collection/sync", {
        method: "POST",
      });
      expect(result).toEqual(mockSummary);
    });

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Discogs not connected"));

      await expect(syncCollection()).rejects.toThrow("Discogs not connected");
    });
  });

  describe("listReleases", () => {
    const mockRelease: Release = {
      id: "release-123",
      user_id: "user-456",
      discogs_release_id: 12345,
      discogs_instance_id: 67890,
      title: "Test Album",
      artist_name: "Test Artist",
      year: 2020,
      cover_image_url: "https://example.com/cover.jpg",
      format: "LP",
      genres: ["Electronic"],
      styles: ["House"],
      labels: ["Test Label"],
      catalog_number: "TL001",
      country: "US",
      added_to_discogs_at: "2020-01-01T00:00:00Z",
      synced_at: "2024-01-01T00:00:00Z",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: null,
    };

    const mockPaginatedResponse: PaginatedReleases = {
      items: [mockRelease],
      total: 1,
      page: 1,
      page_size: 50,
      has_more: false,
    };

    it("calls apiRequest with no query params by default", async () => {
      mockApiRequest.mockResolvedValueOnce(mockPaginatedResponse);

      const result = await listReleases();

      expect(mockApiRequest).toHaveBeenCalledWith("/api/collection");
      expect(result).toEqual(mockPaginatedResponse);
    });

    it("adds page param when provided", async () => {
      mockApiRequest.mockResolvedValueOnce(mockPaginatedResponse);

      await listReleases({ page: 2 });

      expect(mockApiRequest).toHaveBeenCalledWith("/api/collection?page=2");
    });

    it("adds page_size param when provided", async () => {
      mockApiRequest.mockResolvedValueOnce(mockPaginatedResponse);

      await listReleases({ pageSize: 25 });

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/collection?page_size=25",
      );
    });

    it("adds sort_by param when provided", async () => {
      mockApiRequest.mockResolvedValueOnce(mockPaginatedResponse);

      await listReleases({ sortBy: "title" });

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/collection?sort_by=title",
      );
    });

    it("adds sort_order param when provided", async () => {
      mockApiRequest.mockResolvedValueOnce(mockPaginatedResponse);

      await listReleases({ sortOrder: "desc" });

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/collection?sort_order=desc",
      );
    });

    it("adds search param when provided", async () => {
      mockApiRequest.mockResolvedValueOnce(mockPaginatedResponse);

      await listReleases({ search: "daft punk" });

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/collection?search=daft+punk",
      );
    });

    it("combines multiple params", async () => {
      mockApiRequest.mockResolvedValueOnce(mockPaginatedResponse);

      await listReleases({
        page: 2,
        pageSize: 25,
        sortBy: "artist_name",
        sortOrder: "asc",
        search: "electronic",
      });

      const calledUrl = mockApiRequest.mock.calls[0][0] as string;
      expect(calledUrl).toContain("page=2");
      expect(calledUrl).toContain("page_size=25");
      expect(calledUrl).toContain("sort_by=artist_name");
      expect(calledUrl).toContain("sort_order=asc");
      expect(calledUrl).toContain("search=electronic");
    });

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Unauthorized"));

      await expect(listReleases()).rejects.toThrow("Unauthorized");
    });
  });

  describe("getRelease", () => {
    const mockRelease: Release = {
      id: "release-123",
      user_id: "user-456",
      discogs_release_id: 12345,
      discogs_instance_id: 67890,
      title: "Test Album",
      artist_name: "Test Artist",
      year: 2020,
      cover_image_url: "https://example.com/cover.jpg",
      format: "LP",
      genres: ["Electronic"],
      styles: ["House"],
      labels: ["Test Label"],
      catalog_number: "TL001",
      country: "US",
      added_to_discogs_at: "2020-01-01T00:00:00Z",
      synced_at: "2024-01-01T00:00:00Z",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: null,
    };

    it("calls apiRequest with release ID in path", async () => {
      mockApiRequest.mockResolvedValueOnce(mockRelease);

      const result = await getRelease("release-123");

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/collection/release-123",
      );
      expect(result).toEqual(mockRelease);
    });

    it("handles UUID format release IDs", async () => {
      mockApiRequest.mockResolvedValueOnce(mockRelease);

      await getRelease("550e8400-e29b-41d4-a716-446655440000");

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/collection/550e8400-e29b-41d4-a716-446655440000",
      );
    });

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Release not found"));

      await expect(getRelease("nonexistent")).rejects.toThrow(
        "Release not found",
      );
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listPlaylists,
  getPlaylist,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
  getReleaseTracks,
  type Playlist,
  type PlaylistWithTracks,
  type PlaylistTrack,
  type PaginatedPlaylists,
  type ReleaseTracksResponse,
} from "./playlists";

// Mock the API client
vi.mock("./client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "./client";

const mockApiRequest = vi.mocked(apiRequest);

const mockPlaylist: Playlist = {
  id: "playlist-123",
  user_id: "user-456",
  name: "My Playlist",
  description: "A test playlist",
  tags: ["electronic", "house"],
  track_count: 5,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: null,
};

const mockTrack: PlaylistTrack = {
  id: "track-789",
  playlist_id: "playlist-123",
  release_id: "release-456",
  discogs_release_id: 12345,
  position: "A1",
  title: "Test Track",
  artist: "Test Artist",
  duration: "5:30",
  track_order: 1,
  cover_image_url: "https://example.com/cover.jpg",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: null,
};

const mockPlaylistWithTracks: PlaylistWithTracks = {
  ...mockPlaylist,
  tracks: [mockTrack],
  total_duration: "5m",
};

describe("Playlists API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listPlaylists", () => {
    const mockPaginatedResponse: PaginatedPlaylists = {
      items: [mockPlaylist],
      total: 1,
      page: 1,
      page_size: 50,
      has_more: false,
    };

    it("calls apiRequest with default pagination params", async () => {
      mockApiRequest.mockResolvedValueOnce(mockPaginatedResponse);

      const result = await listPlaylists();

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/playlists?page=1&page_size=50"
      );
      expect(result).toEqual(mockPaginatedResponse);
    });

    it("calls apiRequest with custom pagination params", async () => {
      mockApiRequest.mockResolvedValueOnce(mockPaginatedResponse);

      await listPlaylists(2, 25);

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/playlists?page=2&page_size=25"
      );
    });

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Unauthorized"));

      await expect(listPlaylists()).rejects.toThrow("Unauthorized");
    });
  });

  describe("getPlaylist", () => {
    it("calls apiRequest with playlist ID in path", async () => {
      mockApiRequest.mockResolvedValueOnce(mockPlaylistWithTracks);

      const result = await getPlaylist("playlist-123");

      expect(mockApiRequest).toHaveBeenCalledWith("/api/playlists/playlist-123");
      expect(result).toEqual(mockPlaylistWithTracks);
    });

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Not found"));

      await expect(getPlaylist("nonexistent")).rejects.toThrow("Not found");
    });
  });

  describe("createPlaylist", () => {
    it("calls apiRequest with POST method and body", async () => {
      mockApiRequest.mockResolvedValueOnce(mockPlaylist);

      const data = {
        name: "My Playlist",
        description: "A test playlist",
        tags: ["electronic", "house"],
      };
      const result = await createPlaylist(data);

      expect(mockApiRequest).toHaveBeenCalledWith("/api/playlists", {
        method: "POST",
        body: JSON.stringify(data),
      });
      expect(result).toEqual(mockPlaylist);
    });

    it("works with minimal data", async () => {
      mockApiRequest.mockResolvedValueOnce(mockPlaylist);

      const data = { name: "My Playlist" };
      await createPlaylist(data);

      expect(mockApiRequest).toHaveBeenCalledWith("/api/playlists", {
        method: "POST",
        body: JSON.stringify(data),
      });
    });

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Validation failed"));

      await expect(createPlaylist({ name: "" })).rejects.toThrow(
        "Validation failed"
      );
    });
  });

  describe("updatePlaylist", () => {
    it("calls apiRequest with PATCH method and body", async () => {
      mockApiRequest.mockResolvedValueOnce(mockPlaylist);

      const data = { name: "Updated Name" };
      const result = await updatePlaylist("playlist-123", data);

      expect(mockApiRequest).toHaveBeenCalledWith("/api/playlists/playlist-123", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      expect(result).toEqual(mockPlaylist);
    });

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Not found"));

      await expect(updatePlaylist("nonexistent", { name: "Test" })).rejects.toThrow(
        "Not found"
      );
    });
  });

  describe("deletePlaylist", () => {
    it("calls apiRequest with DELETE method", async () => {
      mockApiRequest.mockResolvedValueOnce(undefined);

      await deletePlaylist("playlist-123");

      expect(mockApiRequest).toHaveBeenCalledWith("/api/playlists/playlist-123", {
        method: "DELETE",
      });
    });

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Not found"));

      await expect(deletePlaylist("nonexistent")).rejects.toThrow("Not found");
    });
  });

  describe("addTrackToPlaylist", () => {
    it("calls apiRequest with POST method and track data", async () => {
      mockApiRequest.mockResolvedValueOnce(mockTrack);

      const data = {
        release_id: "release-456",
        discogs_release_id: 12345,
        position: "A1",
        title: "Test Track",
        artist: "Test Artist",
        duration: "5:30",
      };
      const result = await addTrackToPlaylist("playlist-123", data);

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/playlists/playlist-123/tracks",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      expect(result).toEqual(mockTrack);
    });

    it("includes cover_image_url when provided", async () => {
      mockApiRequest.mockResolvedValueOnce(mockTrack);

      const data = {
        release_id: "release-456",
        discogs_release_id: 12345,
        position: "A1",
        title: "Test Track",
        artist: "Test Artist",
        duration: "5:30",
        cover_image_url: "https://example.com/cover.jpg",
      };
      await addTrackToPlaylist("playlist-123", data);

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/playlists/playlist-123/tracks",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
    });

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Playlist not found"));

      await expect(
        addTrackToPlaylist("nonexistent", {
          release_id: "r-1",
          discogs_release_id: 123,
          position: "A1",
          title: "Track",
          artist: "Artist",
        })
      ).rejects.toThrow("Playlist not found");
    });
  });

  describe("removeTrackFromPlaylist", () => {
    it("calls apiRequest with DELETE method", async () => {
      mockApiRequest.mockResolvedValueOnce(undefined);

      await removeTrackFromPlaylist("playlist-123", "track-789");

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/playlists/playlist-123/tracks/track-789",
        {
          method: "DELETE",
        }
      );
    });

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Track not found"));

      await expect(
        removeTrackFromPlaylist("playlist-123", "nonexistent")
      ).rejects.toThrow("Track not found");
    });
  });

  describe("reorderPlaylistTracks", () => {
    it("calls apiRequest with PATCH method and track IDs", async () => {
      const reorderedTracks = [mockTrack];
      mockApiRequest.mockResolvedValueOnce(reorderedTracks);

      const trackIds = ["track-2", "track-1", "track-3"];
      const result = await reorderPlaylistTracks("playlist-123", trackIds);

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/playlists/playlist-123/tracks/reorder",
        {
          method: "PATCH",
          body: JSON.stringify({ track_ids: trackIds }),
        }
      );
      expect(result).toEqual(reorderedTracks);
    });

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Playlist not found"));

      await expect(
        reorderPlaylistTracks("nonexistent", ["track-1"])
      ).rejects.toThrow("Playlist not found");
    });
  });

  describe("getReleaseTracks", () => {
    const mockReleaseTracksResponse: ReleaseTracksResponse = {
      release_id: "release-456",
      discogs_release_id: 12345,
      title: "Test Album",
      artist_name: "Test Artist",
      tracks: [
        {
          position: "A1",
          title: "Track 1",
          duration: "4:30",
          artists: ["Test Artist"],
        },
        {
          position: "A2",
          title: "Track 2",
          duration: "5:15",
          artists: ["Test Artist"],
        },
      ],
    };

    it("calls apiRequest with release ID in path", async () => {
      mockApiRequest.mockResolvedValueOnce(mockReleaseTracksResponse);

      const result = await getReleaseTracks("release-456");

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/collection/release-456/tracks"
      );
      expect(result).toEqual(mockReleaseTracksResponse);
    });

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Release not found"));

      await expect(getReleaseTracks("nonexistent")).rejects.toThrow(
        "Release not found"
      );
    });

    it("handles Discogs not connected error", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Discogs not connected"));

      await expect(getReleaseTracks("release-456")).rejects.toThrow(
        "Discogs not connected"
      );
    });
  });
});

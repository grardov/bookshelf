import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddToPlaylistDialog } from "./add-to-playlist-dialog";

// Mock the playlists API
vi.mock("@/lib/api/playlists", () => ({
  listPlaylists: vi.fn(),
  addTrackToPlaylist: vi.fn(),
  createPlaylist: vi.fn(),
}));

import {
  listPlaylists,
  addTrackToPlaylist,
  createPlaylist,
} from "@/lib/api/playlists";

const mockListPlaylists = vi.mocked(listPlaylists);
const mockAddTrack = vi.mocked(addTrackToPlaylist);
const mockCreatePlaylist = vi.mocked(createPlaylist);

const mockTrack = {
  release_id: "release-123",
  discogs_release_id: 12345,
  position: "A1",
  title: "Test Track",
  artist: "Test Artist",
  duration: "5:30",
};

const mockPlaylists = [
  {
    id: "p1",
    user_id: "user-1",
    name: "Playlist One",
    description: null,
    tags: [],
    track_count: 3,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: null,
  },
  {
    id: "p2",
    user_id: "user-1",
    name: "Playlist Two",
    description: null,
    tags: [],
    track_count: 0,
    created_at: "2024-01-02T00:00:00Z",
    updated_at: null,
  },
];

describe("AddToPlaylistDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    track: mockTrack,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockListPlaylists.mockResolvedValue({
      items: mockPlaylists,
      total: 2,
      page: 1,
      page_size: 50,
      has_more: false,
    });
  });

  it("renders dialog with track title", async () => {
    render(<AddToPlaylistDialog {...defaultProps} />);

    expect(screen.getByText("Add to playlist")).toBeInTheDocument();
    expect(
      screen.getByText(/Add "Test Track" to a playlist/)
    ).toBeInTheDocument();
  });

  it("fetches and displays playlists when opened", async () => {
    render(<AddToPlaylistDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Playlist One")).toBeInTheDocument();
      expect(screen.getByText("Playlist Two")).toBeInTheDocument();
    });
  });

  it("shows empty state when no playlists exist", async () => {
    mockListPlaylists.mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      page_size: 50,
      has_more: false,
    });

    render(<AddToPlaylistDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("No playlists yet")).toBeInTheDocument();
    });
  });

  it("adds track to playlist when clicked", async () => {
    const user = userEvent.setup();
    mockAddTrack.mockResolvedValueOnce({
      id: "track-1",
      playlist_id: "p1",
      release_id: "release-123",
      discogs_release_id: 12345,
      position: "A1",
      title: "Test Track",
      artist: "Test Artist",
      duration: "5:30",
      track_order: 1,
      cover_image_url: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: null,
    });

    render(<AddToPlaylistDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Playlist One")).toBeInTheDocument();
    });

    const playlistButton = screen.getByText("Playlist One").closest("button")!;
    await user.click(playlistButton);

    await waitFor(() => {
      expect(mockAddTrack).toHaveBeenCalledWith("p1", mockTrack);
    });
  });

  it("shows create new playlist form", async () => {
    const user = userEvent.setup();

    render(<AddToPlaylistDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Create new playlist")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Create new playlist"));

    expect(screen.getByLabelText("Playlist name")).toBeInTheDocument();
    expect(screen.getByText("Create & Add")).toBeInTheDocument();
  });

  it("creates playlist and adds track", async () => {
    const user = userEvent.setup();

    const newPlaylist = {
      id: "new-p",
      user_id: "user-1",
      name: "New Playlist",
      description: null,
      tags: [],
      track_count: 0,
      created_at: "2024-01-03T00:00:00Z",
      updated_at: null,
    };
    mockCreatePlaylist.mockResolvedValueOnce(newPlaylist);
    mockAddTrack.mockResolvedValueOnce({
      id: "track-1",
      playlist_id: "new-p",
      release_id: "release-123",
      discogs_release_id: 12345,
      position: "A1",
      title: "Test Track",
      artist: "Test Artist",
      duration: "5:30",
      track_order: 1,
      cover_image_url: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: null,
    });

    render(<AddToPlaylistDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Create new playlist")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Create new playlist"));
    await user.type(screen.getByLabelText("Playlist name"), "New Playlist");
    await user.click(screen.getByText("Create & Add"));

    await waitFor(() => {
      expect(mockCreatePlaylist).toHaveBeenCalledWith({
        name: "New Playlist",
      });
      expect(mockAddTrack).toHaveBeenCalledWith("new-p", mockTrack);
    });
  });

  it("shows cancel button in create form that returns to list", async () => {
    const user = userEvent.setup();

    render(<AddToPlaylistDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Create new playlist")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Create new playlist"));
    expect(screen.getByLabelText("Playlist name")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.getByText("Create new playlist")).toBeInTheDocument();
    });
  });
});

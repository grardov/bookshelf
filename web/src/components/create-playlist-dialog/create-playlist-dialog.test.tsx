import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreatePlaylistDialog } from "./create-playlist-dialog";

// Mock the playlists API
vi.mock("@/lib/api/playlists", () => ({
  createPlaylist: vi.fn(),
}));

import { createPlaylist } from "@/lib/api/playlists";

const mockCreatePlaylist = vi.mocked(createPlaylist);

const mockPlaylist = {
  id: "playlist-123",
  user_id: "user-456",
  name: "My Playlist",
  description: "A description",
  tags: ["house", "techno"],
  track_count: 0,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: null,
};

describe("CreatePlaylistDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onCreated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dialog with form fields when open", () => {
    render(<CreatePlaylistDialog {...defaultProps} />);

    expect(
      screen.getByRole("heading", { name: /create playlist/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    render(<CreatePlaylistDialog {...defaultProps} open={false} />);

    expect(screen.queryByText("Create playlist")).not.toBeInTheDocument();
  });

  it("submit button is disabled when name is empty", () => {
    render(<CreatePlaylistDialog {...defaultProps} />);

    const submitButton = screen.getByRole("button", {
      name: /create playlist/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("creates playlist on form submission", async () => {
    const user = userEvent.setup();
    mockCreatePlaylist.mockResolvedValueOnce(mockPlaylist);

    render(<CreatePlaylistDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/name/i), "My Playlist");
    await user.type(screen.getByLabelText(/description/i), "A description");
    await user.type(screen.getByLabelText(/tags/i), "house, techno");

    const submitButton = screen.getByRole("button", {
      name: /create playlist/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreatePlaylist).toHaveBeenCalledWith({
        name: "My Playlist",
        description: "A description",
        tags: ["house", "techno"],
      });
    });

    expect(defaultProps.onCreated).toHaveBeenCalledWith(mockPlaylist);
  });

  it("creates playlist with only name", async () => {
    const user = userEvent.setup();
    mockCreatePlaylist.mockResolvedValueOnce(mockPlaylist);

    render(<CreatePlaylistDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/name/i), "Minimal");

    const submitButton = screen.getByRole("button", {
      name: /create playlist/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreatePlaylist).toHaveBeenCalledWith({
        name: "Minimal",
        description: undefined,
        tags: undefined,
      });
    });
  });

  it("shows error message on API failure", async () => {
    const user = userEvent.setup();
    mockCreatePlaylist.mockRejectedValueOnce(new Error("Server error"));

    render(<CreatePlaylistDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/name/i), "Test");

    const submitButton = screen.getByRole("button", {
      name: /create playlist/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to create playlist. Please try again."),
      ).toBeInTheDocument();
    });
  });

  it("calls onOpenChange when cancel is clicked", async () => {
    const user = userEvent.setup();

    render(<CreatePlaylistDialog {...defaultProps} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });
});

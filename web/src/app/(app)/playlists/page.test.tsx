import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlaylistsPage from "./page";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock the playlists API
vi.mock("@/lib/api/playlists", () => ({
  listPlaylists: vi.fn(),
  deletePlaylist: vi.fn(),
}));

// Mock components not under test
vi.mock("@/components/app-header", () => ({
  AppHeader: ({ title }: { title: string }) => (
    <div data-testid="app-header">{title}</div>
  ),
}));

vi.mock("@/components/create-playlist-dialog", () => ({
  CreatePlaylistDialog: ({
    open,
    onOpenChange,
    onCreated,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: (playlist: unknown) => void;
  }) =>
    open ? (
      <div data-testid="create-playlist-dialog">
        <button onClick={() => onOpenChange(false)}>Close</button>
        <button
          onClick={() =>
            onCreated({
              id: "new-playlist",
              user_id: "user-1",
              name: "New Playlist",
              description: null,
              tags: [],
              track_count: 0,
              created_at: new Date().toISOString(),
              updated_at: null,
            })
          }
        >
          Confirm Create
        </button>
      </div>
    ) : null,
}));

import { listPlaylists, deletePlaylist } from "@/lib/api/playlists";
import type { PaginatedPlaylists, Playlist } from "@/lib/api/playlists";

const mockListPlaylists = vi.mocked(listPlaylists);
const mockDeletePlaylist = vi.mocked(deletePlaylist);

function createPlaylist(overrides: Partial<Playlist> = {}): Playlist {
  return {
    id: "playlist-1",
    user_id: "user-1",
    name: "Test Playlist",
    description: "A test playlist",
    tags: [],
    track_count: 5,
    created_at: new Date().toISOString(),
    updated_at: null,
    ...overrides,
  };
}

function createPaginatedResponse(
  items: Playlist[]
): PaginatedPlaylists {
  return {
    items,
    total: items.length,
    page: 1,
    page_size: 50,
    has_more: false,
  };
}

describe("PlaylistsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockListPlaylists.mockReturnValue(new Promise(() => {}));

    render(<PlaylistsPage />);

    expect(screen.getByTestId("app-header")).toHaveTextContent("Playlists");
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders playlists after fetch completes", async () => {
    const playlists = [
      createPlaylist({
        id: "p-1",
        name: "House Vibes",
        track_count: 12,
      }),
      createPlaylist({
        id: "p-2",
        name: "Chill Sessions",
        track_count: 8,
      }),
    ];
    mockListPlaylists.mockResolvedValue(createPaginatedResponse(playlists));

    render(<PlaylistsPage />);

    await waitFor(() => {
      expect(screen.getByText("House Vibes")).toBeInTheDocument();
    });

    expect(screen.getByText("Chill Sessions")).toBeInTheDocument();
    expect(screen.getByText("12 tracks")).toBeInTheDocument();
    expect(screen.getByText("8 tracks")).toBeInTheDocument();
    expect(screen.getByText("2 playlists")).toBeInTheDocument();
  });

  it("shows empty state when no playlists exist", async () => {
    mockListPlaylists.mockResolvedValue(createPaginatedResponse([]));

    render(<PlaylistsPage />);

    await waitFor(() => {
      expect(screen.getByText("No playlists yet")).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Create your first playlist to start organizing your tracks."
      )
    ).toBeInTheDocument();
  });

  it("opens create playlist dialog when 'New playlist' button is clicked", async () => {
    const user = userEvent.setup();
    mockListPlaylists.mockResolvedValue(createPaginatedResponse([]));

    render(<PlaylistsPage />);

    await waitFor(() => {
      expect(screen.getByText("No playlists yet")).toBeInTheDocument();
    });

    // Click the "New playlist" button in the header area
    const newPlaylistButton = screen.getByRole("button", {
      name: /new playlist/i,
    });
    await user.click(newPlaylistButton);

    expect(screen.getByTestId("create-playlist-dialog")).toBeInTheDocument();
  });

  it("opens create playlist dialog from empty state 'Create playlist' button", async () => {
    const user = userEvent.setup();
    mockListPlaylists.mockResolvedValue(createPaginatedResponse([]));

    render(<PlaylistsPage />);

    await waitFor(() => {
      expect(screen.getByText("No playlists yet")).toBeInTheDocument();
    });

    const createButton = screen.getByRole("button", {
      name: /create playlist/i,
    });
    await user.click(createButton);

    expect(screen.getByTestId("create-playlist-dialog")).toBeInTheDocument();
  });

  it("renders playlist links pointing to detail pages", async () => {
    const playlists = [
      createPlaylist({ id: "p-abc", name: "My Playlist" }),
    ];
    mockListPlaylists.mockResolvedValue(createPaginatedResponse(playlists));

    render(<PlaylistsPage />);

    await waitFor(() => {
      expect(screen.getByText("My Playlist")).toBeInTheDocument();
    });

    const link = screen.getByRole("link", { name: "My Playlist" });
    expect(link).toHaveAttribute("href", "/playlists/p-abc");
  });

  it("shows tags as badges on playlists that have them", async () => {
    const playlists = [
      createPlaylist({
        id: "p-1",
        name: "Tagged Playlist",
        tags: ["house", "techno"],
      }),
    ];
    mockListPlaylists.mockResolvedValue(createPaginatedResponse(playlists));

    render(<PlaylistsPage />);

    await waitFor(() => {
      expect(screen.getByText("Tagged Playlist")).toBeInTheDocument();
    });

    expect(screen.getByText("house")).toBeInTheDocument();
    expect(screen.getByText("techno")).toBeInTheDocument();
  });

  it("shows delete confirmation dialog when delete option is clicked", async () => {
    const user = userEvent.setup();
    const playlists = [
      createPlaylist({ id: "p-1", name: "Playlist to Delete" }),
    ];
    mockListPlaylists.mockResolvedValue(createPaginatedResponse(playlists));

    render(<PlaylistsPage />);

    await waitFor(() => {
      expect(screen.getByText("Playlist to Delete")).toBeInTheDocument();
    });

    // Open the dropdown menu via the more options button
    const moreButton = await screen.findByRole("button", {
      name: /more options for playlist to delete/i,
    });
    await user.click(moreButton);

    // Click "Delete playlist" from the dropdown menu item
    const deleteMenuItem = await screen.findByRole("menuitem", {
      name: /delete playlist/i,
    });
    await user.click(deleteMenuItem);

    // Confirm dialog appears with the playlist name
    await waitFor(() => {
      expect(
        screen.getByText(/are you sure you want to delete/i)
      ).toBeInTheDocument();
    });
  });

  it("deletes playlist when confirmed in the dialog", async () => {
    const user = userEvent.setup();
    const playlists = [
      createPlaylist({ id: "p-1", name: "Doomed Playlist" }),
    ];
    mockListPlaylists.mockResolvedValue(createPaginatedResponse(playlists));
    mockDeletePlaylist.mockResolvedValue(undefined);

    render(<PlaylistsPage />);

    await waitFor(() => {
      expect(screen.getByText("Doomed Playlist")).toBeInTheDocument();
    });

    // Open dropdown and click delete
    const moreButton = screen.getByRole("button", {
      name: /more options for doomed playlist/i,
    });
    await user.click(moreButton);
    const deleteItem = await screen.findByText("Delete playlist");
    await user.click(deleteItem);

    // Confirm deletion in the dialog
    const confirmDialog = await screen.findByText(
      /are you sure you want to delete/i
    );
    expect(confirmDialog).toBeInTheDocument();

    // Find the destructive "Delete playlist" button in the dialog footer
    const dialogButtons = screen.getAllByRole("button", {
      name: /delete playlist/i,
    });
    // The last one is the confirmation button in the dialog
    const confirmButton = dialogButtons[dialogButtons.length - 1];
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeletePlaylist).toHaveBeenCalledWith("p-1");
    });

    // Playlist should be removed from the list
    await waitFor(() => {
      expect(screen.queryByText("Doomed Playlist")).not.toBeInTheDocument();
    });
  });

  it("navigates to playlist detail when play button is clicked", async () => {
    const user = userEvent.setup();
    const playlists = [
      createPlaylist({ id: "p-1", name: "Play Me" }),
    ];
    mockListPlaylists.mockResolvedValue(createPaginatedResponse(playlists));

    render(<PlaylistsPage />);

    await waitFor(() => {
      expect(screen.getByText("Play Me")).toBeInTheDocument();
    });

    const playButton = screen.getByRole("button", {
      name: /play play me/i,
    });
    await user.click(playButton);

    expect(mockPush).toHaveBeenCalledWith("/playlists/p-1");
  });
});

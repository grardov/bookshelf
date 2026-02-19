import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import CreatePage from "./page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock the playlists API
vi.mock("@/lib/api/playlists", () => ({
  listPlaylists: vi.fn(),
}));

// Mock the discogs API
vi.mock("@/lib/api/discogs", () => ({
  searchDiscogs: vi.fn(),
}));

// Mock hooks
const mockSearchHistory = {
  history: [] as {
    id: number;
    title: string;
    year: number | null;
    cover_image: string | null;
    format: string | null;
    label: string | null;
    timestamp: number;
  }[],
  addSearch: vi.fn(),
  removeSearch: vi.fn(),
  clearHistory: vi.fn(),
};
vi.mock("@/hooks/use-search-history", () => ({
  useSearchHistory: () => mockSearchHistory,
}));

// Mock auth context
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    profile: {
      discogs_connected_at: "2026-01-01T00:00:00Z",
    },
  }),
}));

import { listPlaylists } from "@/lib/api/playlists";

const mockListPlaylists = vi.mocked(listPlaylists);

// Mock PlaylistCard as a simple div rendering its props
vi.mock("@/components/playlist-card", () => ({
  PlaylistCard: ({
    title,
    trackCount,
  }: {
    title: string;
    trackCount: number;
  }) => (
    <div data-testid="playlist-card">
      <span>{title}</span>
      <span>{trackCount} tracks</span>
    </div>
  ),
}));

// Mock SearchResultRow
vi.mock("@/components/search-result-row", () => ({
  SearchResultRow: ({ title }: { title: string }) => (
    <div data-testid="search-result-row">
      <span>{title}</span>
    </div>
  ),
}));

// Mock CreatePlaylistDialog
vi.mock("@/components/create-playlist-dialog", () => ({
  CreatePlaylistDialog: ({
    open,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? <div data-testid="create-playlist-dialog">Dialog open</div> : null,
}));

const mockPlaylists = [
  {
    id: "pl-1",
    user_id: "user-1",
    name: "Late Night Mix",
    description: null,
    tags: ["house"],
    track_count: 12,
    created_at: "2026-02-17T00:00:00Z",
    updated_at: null,
  },
  {
    id: "pl-2",
    user_id: "user-1",
    name: "Morning Jazz",
    description: "Chill jazz tunes",
    tags: ["jazz"],
    track_count: 8,
    created_at: "2026-02-16T00:00:00Z",
    updated_at: null,
  },
];

describe("CreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchHistory.history = [];
    mockListPlaylists.mockResolvedValue({
      items: mockPlaylists,
      total: 2,
      page: 1,
      page_size: 5,
      has_more: false,
    });
  });

  it("renders the search heading", async () => {
    render(<CreatePage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Find your release",
      );
    });
  });

  it("renders the search input as a combobox", () => {
    render(<CreatePage />);

    const input = screen.getByRole("combobox", { name: /search discogs/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute(
      "placeholder",
      "Search artists, albums, labels...",
    );
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  describe("recent playlists", () => {
    it("fetches recent playlists on mount", async () => {
      render(<CreatePage />);

      await waitFor(() => {
        expect(mockListPlaylists).toHaveBeenCalledWith(1, 5);
      });
    });

    it("renders recent playlists section heading", async () => {
      render(<CreatePage />);

      await waitFor(() => {
        expect(screen.getByText("Recent playlists")).toBeInTheDocument();
      });
    });

    it("shows playlist cards after fetch", async () => {
      render(<CreatePage />);

      await waitFor(() => {
        const cards = screen.getAllByTestId("playlist-card");
        expect(cards).toHaveLength(2);
      });

      expect(screen.getByText("Late Night Mix")).toBeInTheDocument();
      expect(screen.getByText("Morning Jazz")).toBeInTheDocument();
    });

    it("shows 'View all' link when playlists exist", async () => {
      render(<CreatePage />);

      await waitFor(() => {
        expect(screen.getByText("View all")).toBeInTheDocument();
      });
    });

    it("shows loading skeletons while fetching playlists", () => {
      // Keep the promise pending to hold loading state
      mockListPlaylists.mockReturnValue(new Promise(() => {}));

      render(<CreatePage />);

      // The component renders skeleton divs while loading
      expect(screen.queryByTestId("playlist-card")).not.toBeInTheDocument();
    });

    it("shows empty state when no playlists exist", async () => {
      mockListPlaylists.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        page_size: 5,
        has_more: false,
      });

      render(<CreatePage />);

      await waitFor(() => {
        expect(screen.getByText("No playlists yet")).toBeInTheDocument();
      });
    });

    it("shows 'Create playlist' button in empty state", async () => {
      mockListPlaylists.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        page_size: 5,
        has_more: false,
      });

      render(<CreatePage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /create playlist/i }),
        ).toBeInTheDocument();
      });
    });

    it("does not show 'View all' link when no playlists exist", async () => {
      mockListPlaylists.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        page_size: 5,
        has_more: false,
      });

      render(<CreatePage />);

      await waitFor(() => {
        expect(screen.getByText("No playlists yet")).toBeInTheDocument();
      });

      expect(screen.queryByText("View all")).not.toBeInTheDocument();
    });
  });

  describe("recent searches", () => {
    const historyItems = [
      {
        id: 123,
        title: "Random Access Memories",
        year: 2013,
        cover_image: "https://example.com/cover.jpg",
        format: "2xLP",
        label: "Columbia",
        timestamp: Date.now(),
      },
      {
        id: 456,
        title: "Discovery",
        year: 2001,
        cover_image: null,
        format: "CD",
        label: "Virgin",
        timestamp: Date.now() - 1000,
      },
    ];

    it("shows recent searches section when history exists", async () => {
      mockSearchHistory.history = historyItems;

      render(<CreatePage />);

      await waitFor(() => {
        expect(screen.getByText("Recent searches")).toBeInTheDocument();
      });
    });

    it("renders release cards with title and metadata", async () => {
      mockSearchHistory.history = historyItems;

      render(<CreatePage />);

      await waitFor(() => {
        expect(screen.getByText("Random Access Memories")).toBeInTheDocument();
        expect(screen.getByText("Discovery")).toBeInTheDocument();
      });

      expect(screen.getByText("2xLP · 2013")).toBeInTheDocument();
      expect(screen.getByText("CD · 2001")).toBeInTheDocument();
    });

    it("links release cards to release detail page", async () => {
      mockSearchHistory.history = historyItems;

      render(<CreatePage />);

      await waitFor(() => {
        const links = screen.getAllByRole("link", {
          name: /random access memories|discovery/i,
        });
        expect(links[0]).toHaveAttribute("href", "/release/123");
      });
    });

    it("does not show recent searches when history is empty", () => {
      mockSearchHistory.history = [];

      render(<CreatePage />);

      expect(screen.queryByText("Recent searches")).not.toBeInTheDocument();
    });

    it("shows clear button", async () => {
      mockSearchHistory.history = historyItems;

      render(<CreatePage />);

      await waitFor(() => {
        expect(screen.getByText("Clear")).toBeInTheDocument();
      });
    });
  });
});

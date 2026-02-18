import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CollectionPage from "./page";

// Mock the collection API
vi.mock("@/lib/api/collection", () => ({
  listReleases: vi.fn(),
}));

// Mock components that are not under test
vi.mock("@/components/app-header", () => ({
  AppHeader: ({ title }: { title: string }) => (
    <div data-testid="app-header">{title}</div>
  ),
}));

vi.mock("@/components/release-card", () => ({
  ReleaseCard: ({
    id,
    title,
    artist,
  }: {
    id: string;
    title: string;
    artist: string;
  }) => (
    <div data-testid={`release-card-${id}`}>
      <span>{title}</span>
      <span>{artist}</span>
    </div>
  ),
}));

import { listReleases } from "@/lib/api/collection";
import type { PaginatedReleases, Release } from "@/lib/api/collection";

const mockListReleases = vi.mocked(listReleases);

function createRelease(overrides: Partial<Release> = {}): Release {
  return {
    id: "release-1",
    user_id: "user-1",
    discogs_release_id: 12345,
    discogs_instance_id: 67890,
    title: "Test Album",
    artist_name: "Test Artist",
    year: 2023,
    cover_image_url: "https://example.com/cover.jpg",
    format: "Vinyl",
    genres: ["Electronic"],
    styles: ["House"],
    labels: ["Test Label"],
    catalog_number: "TL-001",
    country: "US",
    discogs_metadata: null,
    added_to_discogs_at: "2023-01-01T00:00:00Z",
    synced_at: "2024-01-01T00:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: null,
    ...overrides,
  };
}

function createPaginatedResponse(
  items: Release[],
  overrides: Partial<PaginatedReleases> = {},
): PaginatedReleases {
  return {
    items,
    total: items.length,
    page: 1,
    page_size: 50,
    has_more: false,
    ...overrides,
  };
}

describe("CollectionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading skeleton initially", () => {
    // Never resolve so loading state persists
    mockListReleases.mockReturnValue(new Promise(() => {}));

    render(<CollectionPage />);

    expect(screen.getByTestId("app-header")).toHaveTextContent("Collection");
    // Loading skeleton has no release cards or text content like "releases"
    expect(screen.queryByText(/releases/i)).not.toBeInTheDocument();
    expect(screen.queryByText("No releases yet")).not.toBeInTheDocument();
  });

  it("renders releases after fetch completes", async () => {
    const releases = [
      createRelease({ id: "r-1", title: "Album One", artist_name: "Artist A" }),
      createRelease({ id: "r-2", title: "Album Two", artist_name: "Artist B" }),
    ];
    mockListReleases.mockResolvedValue(createPaginatedResponse(releases));

    render(<CollectionPage />);

    await waitFor(() => {
      expect(screen.getByText("Album One")).toBeInTheDocument();
    });

    expect(screen.getByText("Album Two")).toBeInTheDocument();
    expect(screen.getByText("Artist A")).toBeInTheDocument();
    expect(screen.getByText("Artist B")).toBeInTheDocument();
    expect(screen.getByText("2 releases")).toBeInTheDocument();
  });

  it("shows singular 'release' when there is exactly one", async () => {
    const releases = [createRelease({ id: "r-1" })];
    mockListReleases.mockResolvedValue(
      createPaginatedResponse(releases, { total: 1 }),
    );

    render(<CollectionPage />);

    await waitFor(() => {
      expect(screen.getByText("1 release")).toBeInTheDocument();
    });
  });

  it("shows empty state when no releases exist", async () => {
    mockListReleases.mockResolvedValue(createPaginatedResponse([]));

    render(<CollectionPage />);

    await waitFor(() => {
      expect(screen.getByText("No releases yet")).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Add releases to your collection manually or sync from Discogs in Settings.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /go to settings/i }),
    ).toHaveAttribute("href", "/settings");
  });

  it("search input triggers filtered fetch with debounce", async () => {
    const user = userEvent.setup();
    const releases = [createRelease({ id: "r-1", title: "House Music" })];
    mockListReleases.mockResolvedValue(createPaginatedResponse(releases));

    render(<CollectionPage />);

    await waitFor(() => {
      expect(screen.getByText("House Music")).toBeInTheDocument();
    });

    // Clear mock to track only the search call
    mockListReleases.mockClear();
    mockListReleases.mockResolvedValue(createPaginatedResponse([]));

    const searchInput = screen.getByRole("textbox", {
      name: /search releases/i,
    });
    await user.type(searchInput, "techno");

    // Wait for debounced call (300ms)
    await waitFor(() => {
      expect(mockListReleases).toHaveBeenCalledWith(
        expect.objectContaining({ search: "techno", page: 1 }),
      );
    });
  });

  it("shows 'Load More' button when there are more results", async () => {
    const releases = [createRelease({ id: "r-1", title: "Album One" })];
    mockListReleases.mockResolvedValue(
      createPaginatedResponse(releases, { has_more: true, total: 100 }),
    );

    render(<CollectionPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /load more/i }),
      ).toBeInTheDocument();
    });
  });

  it("does not show 'Load More' button when there are no more results", async () => {
    const releases = [createRelease({ id: "r-1" })];
    mockListReleases.mockResolvedValue(
      createPaginatedResponse(releases, { has_more: false }),
    );

    render(<CollectionPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Album")).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: /load more/i }),
    ).not.toBeInTheDocument();
  });

  it("loads next page when 'Load More' is clicked", async () => {
    const user = userEvent.setup();
    const firstPage = [createRelease({ id: "r-1", title: "Album One" })];
    mockListReleases.mockResolvedValue(
      createPaginatedResponse(firstPage, { has_more: true, total: 2 }),
    );

    render(<CollectionPage />);

    await waitFor(() => {
      expect(screen.getByText("Album One")).toBeInTheDocument();
    });

    const secondPage = [createRelease({ id: "r-2", title: "Album Two" })];
    mockListReleases.mockResolvedValue(
      createPaginatedResponse(secondPage, {
        page: 2,
        has_more: false,
        total: 2,
      }),
    );

    const loadMoreButton = screen.getByRole("button", { name: /load more/i });
    await user.click(loadMoreButton);

    await waitFor(() => {
      expect(mockListReleases).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      );
    });
  });

  it("renders the release collection grid with proper aria-label", async () => {
    const releases = [createRelease({ id: "r-1" })];
    mockListReleases.mockResolvedValue(createPaginatedResponse(releases));

    render(<CollectionPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: /release collection/i }),
      ).toBeInTheDocument();
    });
  });
});

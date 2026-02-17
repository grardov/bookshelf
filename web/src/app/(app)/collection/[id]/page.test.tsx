import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ReleaseDetailPage from "./page";

// Mock collection API
vi.mock("@/lib/api/collection", () => ({
  getRelease: vi.fn(),
}));

// Mock playlists API (getReleaseTracks lives here)
vi.mock("@/lib/api/playlists", () => ({
  getReleaseTracks: vi.fn(),
}));

import { getRelease } from "@/lib/api/collection";
import { getReleaseTracks } from "@/lib/api/playlists";

const mockGetRelease = vi.mocked(getRelease);
const mockGetReleaseTracks = vi.mocked(getReleaseTracks);

// Mock next/navigation
const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "release-123" }),
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock TrackRow and TrackListHeader
vi.mock("@/components/track-row", () => ({
  TrackRow: ({
    title,
    artist,
    position,
  }: {
    title: string;
    artist: string;
    position: number;
  }) => (
    <li data-testid="track-row">
      <span>{position}</span>
      <span>{title}</span>
      <span>{artist}</span>
    </li>
  ),
  TrackListHeader: () => <div data-testid="track-list-header">Header</div>,
}));

// Mock AddToPlaylistDialog
vi.mock("@/components/add-to-playlist-dialog", () => ({
  AddToPlaylistDialog: () => (
    <div data-testid="add-to-playlist-dialog">Add to playlist dialog</div>
  ),
}));

const mockRelease = {
  id: "release-123",
  user_id: "user-456",
  discogs_release_id: 99999,
  discogs_instance_id: 88888,
  title: "Blue Train",
  artist_name: "John Coltrane",
  year: 1958,
  cover_image_url: "https://example.com/cover.jpg",
  format: "Vinyl",
  genres: ["Jazz"],
  styles: ["Hard Bop"],
  labels: ["Blue Note"],
  catalog_number: "BLP 1577",
  country: "US",
  discogs_metadata: null,
  added_to_discogs_at: "2024-01-01T00:00:00Z",
  synced_at: "2024-02-01T00:00:00Z",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: null,
};

const mockTracksResponse = {
  release_id: "release-123",
  discogs_release_id: 99999,
  title: "Blue Train",
  artist_name: "John Coltrane",
  tracks: [
    {
      position: "A1",
      title: "Blue Train",
      duration: "10:40",
      artists: ["John Coltrane"],
    },
    {
      position: "A2",
      title: "Moment's Notice",
      duration: "9:12",
      artists: ["John Coltrane"],
    },
    {
      position: "B1",
      title: "Locomotion",
      duration: "7:14",
      artists: [],
    },
  ],
  notes: "Recorded in 1957 at Van Gelder Studio.",
  country: "US",
  genres: ["Jazz"],
  styles: ["Hard Bop", "Post Bop"],
  labels: [
    { name: "Blue Note", catno: "BLP 1577", entity_type_name: "Label" },
  ],
  formats: [{ name: "Vinyl", qty: "1", descriptions: ["LP", "Album"] }],
};

describe("ReleaseDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRelease.mockResolvedValue(mockRelease);
    mockGetReleaseTracks.mockResolvedValue(mockTracksResponse);
  });

  it("shows loading skeleton initially", () => {
    // Keep the release fetch pending
    mockGetRelease.mockReturnValue(new Promise(() => {}));

    render(<ReleaseDetailPage />);

    // Skeleton elements should be present (they don't have text content,
    // but we can check that the main release title is NOT rendered yet)
    expect(screen.queryByText("Blue Train")).not.toBeInTheDocument();
    expect(screen.queryByText("John Coltrane")).not.toBeInTheDocument();
  });

  it("renders release title and artist after fetch", async () => {
    render(<ReleaseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Blue Train")).toBeInTheDocument();
    });

    expect(screen.getByText("John Coltrane")).toBeInTheDocument();
  });

  it("renders cover art with correct alt text", async () => {
    render(<ReleaseDetailPage />);

    await waitFor(() => {
      const img = screen.getByAltText("Blue Train by John Coltrane");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://example.com/cover.jpg");
    });
  });

  it("renders year badge", async () => {
    render(<ReleaseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("1958")).toBeInTheDocument();
    });
  });

  it("renders genre and style badges", async () => {
    render(<ReleaseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Jazz")).toBeInTheDocument();
    });

    // After tracks load, enriched styles should appear
    await waitFor(() => {
      expect(screen.getByText("Hard Bop")).toBeInTheDocument();
      expect(screen.getByText("Post Bop")).toBeInTheDocument();
    });
  });

  it("renders country badge", async () => {
    render(<ReleaseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("US")).toBeInTheDocument();
    });
  });

  it("renders breadcrumb link back to collection", async () => {
    render(<ReleaseDetailPage />);

    await waitFor(() => {
      const collectionLink = screen.getByText("Collection");
      expect(collectionLink.closest("a")).toHaveAttribute(
        "href",
        "/collection"
      );
    });
  });

  it("renders 'Tracks' heading", async () => {
    render(<ReleaseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Tracks")).toBeInTheDocument();
    });
  });

  it("shows tracks after tracks fetch completes", async () => {
    render(<ReleaseDetailPage />);

    await waitFor(() => {
      const trackRows = screen.getAllByTestId("track-row");
      expect(trackRows).toHaveLength(3);
    });

    // "Blue Train" appears as both the release heading and a track title
    expect(screen.getAllByText("Blue Train")).toHaveLength(2);
    expect(screen.getByText("Moment's Notice")).toBeInTheDocument();
    expect(screen.getByText("Locomotion")).toBeInTheDocument();
  });

  it("shows track list header when tracks are loaded", async () => {
    render(<ReleaseDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId("track-list-header")).toBeInTheDocument();
    });
  });

  it("calls getRelease with the correct ID from params", async () => {
    render(<ReleaseDetailPage />);

    await waitFor(() => {
      expect(mockGetRelease).toHaveBeenCalledWith("release-123");
    });
  });

  it("calls getReleaseTracks with the correct ID after release loads", async () => {
    render(<ReleaseDetailPage />);

    await waitFor(() => {
      expect(mockGetReleaseTracks).toHaveBeenCalledWith("release-123");
    });
  });

  it("shows loading state while tracks are fetching", async () => {
    // Resolve release immediately, but keep tracks pending
    mockGetReleaseTracks.mockReturnValue(new Promise(() => {}));

    render(<ReleaseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Blue Train")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByText("Loading tracks from Discogs...")
      ).toBeInTheDocument();
    });
  });

  it("shows error state when tracks fail to load", async () => {
    mockGetReleaseTracks.mockRejectedValue(new Error("Network error"));

    render(<ReleaseDetailPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Unable to load tracks. Please try again.")
      ).toBeInTheDocument();
    });
  });

  it("shows retry button when tracks fail to load", async () => {
    mockGetReleaseTracks.mockRejectedValue(new Error("Network error"));

    render(<ReleaseDetailPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /retry/i })
      ).toBeInTheDocument();
    });
  });

  it("redirects to /collection when release fetch fails", async () => {
    mockGetRelease.mockRejectedValue(new Error("Not found"));

    render(<ReleaseDetailPage />);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/collection");
    });
  });

  it("renders label information from enriched metadata", async () => {
    render(<ReleaseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Blue Note/)).toBeInTheDocument();
      expect(screen.getByText(/BLP 1577/)).toBeInTheDocument();
    });
  });

  it("renders format badge from enriched metadata", async () => {
    render(<ReleaseDetailPage />);

    await waitFor(() => {
      // Format renders as "{name} ({descriptions})" e.g. "Vinyl (LP, Album)"
      expect(
        screen.getByText("Vinyl (LP, Album)")
      ).toBeInTheDocument();
    });
  });

  it("renders release notes from enriched metadata", async () => {
    render(<ReleaseDetailPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Recorded in 1957 at Van Gelder Studio.")
      ).toBeInTheDocument();
    });
  });

  describe("when release has no cover image", () => {
    it("renders fallback icon instead of image", async () => {
      mockGetRelease.mockResolvedValue({
        ...mockRelease,
        cover_image_url: null,
      });

      render(<ReleaseDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Blue Train")).toBeInTheDocument();
      });

      // No img element should be rendered for the cover
      expect(
        screen.queryByAltText("Blue Train by John Coltrane")
      ).not.toBeInTheDocument();
    });
  });

  describe("when release has no year", () => {
    it("does not render year badge", async () => {
      mockGetRelease.mockResolvedValue({
        ...mockRelease,
        year: null,
      });

      render(<ReleaseDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Blue Train")).toBeInTheDocument();
      });

      expect(screen.queryByText("1958")).not.toBeInTheDocument();
    });
  });

  describe("when tracks list is empty", () => {
    it("shows 'No track information available' message", async () => {
      mockGetReleaseTracks.mockResolvedValue({
        ...mockTracksResponse,
        tracks: [],
      });

      render(<ReleaseDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByText("No track information available")
        ).toBeInTheDocument();
      });
    });
  });
});

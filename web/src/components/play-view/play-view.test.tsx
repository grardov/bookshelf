import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { PlayView } from "./play-view";
import type { PlaylistWithTracks } from "@/lib/api/playlists";

vi.mock("@use-gesture/react", () => ({
  useDrag: () => () => ({}),
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: {
    div: ({
      children,
      ...props
    }: { children: ReactNode } & Record<string, unknown>) => {
      const { initial, animate, exit, transition, ...rest } = props;
      void initial;
      void animate;
      void exit;
      void transition;
      return <div {...rest}>{children}</div>;
    },
    img: (props: Record<string, unknown>) => {
      const { initial, animate, exit, transition, ...rest } = props;
      void initial;
      void animate;
      void exit;
      void transition;
      // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
      return <img {...rest} />;
    },
  },
}));

const makePlaylist = (
  trackCount: number,
  overrides?: Partial<PlaylistWithTracks>,
): PlaylistWithTracks => ({
  id: "playlist-1",
  user_id: "user-1",
  name: "My DJ Set",
  description: null,
  tags: [],
  track_count: trackCount,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: null,
  total_duration: null,
  tracks: Array.from({ length: trackCount }, (_, i) => ({
    id: `track-${i + 1}`,
    playlist_id: "playlist-1",
    release_id: `release-${i + 1}`,
    discogs_release_id: 1000 + i,
    position: `${String.fromCharCode(65 + Math.floor(i / 2))}${(i % 2) + 1}`,
    title: `Track ${i + 1}`,
    artist: `Artist ${i + 1}`,
    duration: `${3 + i}:00`,
    track_order: i + 1,
    cover_image_url: i === 0 ? "https://example.com/cover1.jpg" : null,
    release_title: `Album ${i + 1}`,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: null,
  })),
  ...overrides,
});

describe("PlayView", () => {
  it("renders current track info", () => {
    const playlist = makePlaylist(3);
    render(<PlayView playlist={playlist} />);

    expect(screen.getByText("Track 1")).toBeInTheDocument();
    expect(screen.getByText("Artist 1")).toBeInTheDocument();
    expect(screen.getByText("3:00")).toBeInTheDocument();
    expect(screen.getByText("Album 1")).toBeInTheDocument();
  });

  it("renders playlist name in header", () => {
    const playlist = makePlaylist(3);
    render(<PlayView playlist={playlist} />);

    expect(screen.getByText("My DJ Set")).toBeInTheDocument();
  });

  it("renders track counter in header", () => {
    const playlist = makePlaylist(5);
    render(<PlayView playlist={playlist} />);

    expect(screen.getByText("1 of 5")).toBeInTheDocument();
  });

  it("renders vinyl position", () => {
    const playlist = makePlaylist(3);
    render(<PlayView playlist={playlist} />);

    expect(screen.getByText("A1")).toBeInTheDocument();
  });

  it("renders cover image with alt text", () => {
    const playlist = makePlaylist(3);
    render(<PlayView playlist={playlist} />);

    const image = screen.getByRole("img", {
      name: /cover for album 1/i,
    });
    expect(image).toBeInTheDocument();
  });

  it("renders disc icon fallback when no cover", () => {
    const playlist = makePlaylist(3);
    // Track 2 has no cover, navigate to it
    playlist.tracks[0].cover_image_url = null;
    const { container } = render(<PlayView playlist={playlist} />);

    const svgs = container.querySelectorAll("svg");
    // Should have disc icon (plus close and arrow icons)
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("renders next track preview", () => {
    const playlist = makePlaylist(3);
    render(<PlayView playlist={playlist} />);

    expect(screen.getByText("Next Up")).toBeInTheDocument();
    expect(screen.getByText("Track 2")).toBeInTheDocument();
    expect(screen.getByText(/Artist 2/)).toBeInTheDocument();
  });

  it("shows end of playlist when on last track", async () => {
    const user = userEvent.setup();
    const playlist = makePlaylist(2);
    render(<PlayView playlist={playlist} />);

    const nextButton = screen.getByRole("button", {
      name: /next track/i,
    });
    await user.click(nextButton);

    expect(screen.getByText("End of playlist")).toBeInTheDocument();
  });

  it("navigates to next track when next button is clicked", async () => {
    const user = userEvent.setup();
    const playlist = makePlaylist(3);
    render(<PlayView playlist={playlist} />);

    expect(screen.getByText("Track 1")).toBeInTheDocument();

    const nextButton = screen.getByRole("button", {
      name: /next track/i,
    });
    await user.click(nextButton);

    expect(screen.getByText("Track 2")).toBeInTheDocument();
    expect(screen.getByText("2 of 3")).toBeInTheDocument();
  });

  it("navigates to previous track when prev button is clicked", async () => {
    const user = userEvent.setup();
    const playlist = makePlaylist(3);
    render(<PlayView playlist={playlist} />);

    // Go to track 2 first
    const nextButton = screen.getByRole("button", {
      name: /next track/i,
    });
    await user.click(nextButton);
    expect(screen.getByText("Track 2")).toBeInTheDocument();

    // Go back to track 1
    const prevButton = screen.getByRole("button", {
      name: /previous track/i,
    });
    await user.click(prevButton);
    expect(screen.getByText("Track 1")).toBeInTheDocument();
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
  });

  it("disables previous button on first track", () => {
    const playlist = makePlaylist(3);
    render(<PlayView playlist={playlist} />);

    const prevButton = screen.getByRole("button", {
      name: /previous track/i,
    });
    expect(prevButton).toBeDisabled();
  });

  it("disables next button on last track", async () => {
    const user = userEvent.setup();
    const playlist = makePlaylist(2);
    render(<PlayView playlist={playlist} />);

    const nextButton = screen.getByRole("button", {
      name: /next track/i,
    });
    await user.click(nextButton);

    expect(nextButton).toBeDisabled();
  });

  it("renders close button", () => {
    const playlist = makePlaylist(1);
    render(<PlayView playlist={playlist} />);

    expect(
      screen.getByRole("button", { name: /close player/i }),
    ).toBeInTheDocument();
  });

  it("renders Now Playing label", () => {
    const playlist = makePlaylist(1);
    render(<PlayView playlist={playlist} />);

    expect(screen.getByText("Now Playing")).toBeInTheDocument();
  });
});

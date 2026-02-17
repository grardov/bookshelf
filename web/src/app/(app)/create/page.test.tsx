import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreatePage from "./page";

// Mock the playlists API
vi.mock("@/lib/api/playlists", () => ({
  listPlaylists: vi.fn(),
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

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...filterMotionProps(props)}>{children}</div>
    ),
    h1: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <h1 {...filterMotionProps(props)}>{children}</h1>
    ),
    form: ({
      children,
      ...props
    }: React.PropsWithChildren<React.FormHTMLAttributes<HTMLFormElement>>) => (
      <form {...filterMotionProps(props)}>{children}</form>
    ),
  },
  AnimatePresence: ({
    children,
  }: React.PropsWithChildren<Record<string, unknown>>) => <>{children}</>,
}));

// Filter out framer-motion specific props to avoid React warnings
function filterMotionProps(
  props: Record<string, unknown>
): Record<string, unknown> {
  const {
    initial,
    animate,
    exit,
    transition,
    whileHover,
    whileTap,
    variants,
    layout,
    style,
    ...rest
  } = props;
  // Keep style since it's a valid HTML attribute
  return { ...rest, style: style as React.CSSProperties | undefined };
}

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
    mockListPlaylists.mockResolvedValue({
      items: mockPlaylists,
      total: 2,
      page: 1,
      page_size: 5,
      has_more: false,
    });
  });

  it("renders the AI mode heading by default", async () => {
    render(<CreatePage />);

    await waitFor(() => {
      expect(
        screen.getByText((_content, element) => {
          return element?.textContent === "What do you wantto listen to?";
        })
      ).toBeInTheDocument();
    });
  });

  it("renders AI and Manual mode toggle buttons", () => {
    render(<CreatePage />);

    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(screen.getByText("Manual")).toBeInTheDocument();
  });

  it("renders suggestion chips in AI mode", async () => {
    render(<CreatePage />);

    await waitFor(() => {
      expect(screen.getByText("Deep house session")).toBeInTheDocument();
      expect(screen.getByText("Sunday morning vinyl")).toBeInTheDocument();
      expect(screen.getByText("Party warm-up set")).toBeInTheDocument();
      expect(screen.getByText("Crate digging gems")).toBeInTheDocument();
      expect(screen.getByText("Late night radio")).toBeInTheDocument();
    });
  });

  it("renders the prompt input with AI placeholder in AI mode", () => {
    render(<CreatePage />);

    const input = screen.getByLabelText(/playlist prompt/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute(
      "placeholder",
      "e.g., Late night drive through the city..."
    );
  });

  it("renders the 'Create' button", () => {
    render(<CreatePage />);

    expect(
      screen.getByRole("button", { name: /create/i })
    ).toBeInTheDocument();
  });

  it("switches to manual mode when Manual button is clicked", async () => {
    const user = userEvent.setup();
    render(<CreatePage />);

    const manualButton = screen.getByText("Manual");
    await user.click(manualButton);

    await waitFor(() => {
      expect(
        screen.getByText((_content, element) => {
          return element?.textContent === "Create yourplaylist";
        })
      ).toBeInTheDocument();
    });
  });

  it("shows playlist name input with manual placeholder in manual mode", async () => {
    const user = userEvent.setup();
    render(<CreatePage />);

    const manualButton = screen.getByText("Manual");
    await user.click(manualButton);

    const input = screen.getByLabelText(/playlist name/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "My awesome playlist...");
  });

  it("disables suggestion chips in manual mode", async () => {
    const user = userEvent.setup();
    render(<CreatePage />);

    const manualButton = screen.getByText("Manual");
    await user.click(manualButton);

    const chipButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent === "Deep house session");
    expect(chipButtons[0]).toBeDisabled();
  });

  it("switches back to AI mode when AI button is clicked", async () => {
    const user = userEvent.setup();
    render(<CreatePage />);

    // Switch to manual first
    await user.click(screen.getByText("Manual"));
    // Switch back to AI
    await user.click(screen.getByText("AI"));

    await waitFor(() => {
      expect(
        screen.getByText((_content, element) => {
          return element?.textContent === "What do you wantto listen to?";
        })
      ).toBeInTheDocument();
    });
  });

  it("fills the prompt when a suggestion chip is clicked", async () => {
    const user = userEvent.setup();
    render(<CreatePage />);

    const chip = screen.getByText("Deep house session");
    await user.click(chip);

    const input = screen.getByLabelText(/playlist prompt/i);
    expect(input).toHaveValue("Deep house session for late night vibes");
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
          screen.getByRole("button", { name: /create playlist/i })
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

  it("renders 'Start with an idea' text", () => {
    render(<CreatePage />);

    expect(screen.getByText("Start with an idea")).toBeInTheDocument();
  });
});

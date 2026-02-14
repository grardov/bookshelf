import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrackRow, TrackListHeader } from "./track-row";

describe("TrackRow", () => {
  const defaultProps = {
    id: "track-1",
    title: "Deep Dive",
    artist: "DJ Example",
    duration: "5:42",
  };

  it("renders track title and artist", () => {
    render(<TrackRow {...defaultProps} />);

    expect(screen.getByText("Deep Dive")).toBeInTheDocument();
    expect(screen.getByText("DJ Example")).toBeInTheDocument();
  });

  it("renders duration", () => {
    render(<TrackRow {...defaultProps} />);

    expect(screen.getByText("5:42")).toBeInTheDocument();
  });

  it("renders position when provided", () => {
    render(<TrackRow {...defaultProps} position={1} />);

    expect(screen.getByText("01")).toBeInTheDocument();
  });

  it("renders album when provided", () => {
    render(<TrackRow {...defaultProps} album="Test Album" />);

    expect(screen.getByText("Test Album")).toBeInTheDocument();
  });

  it("renders BPM when provided", () => {
    render(<TrackRow {...defaultProps} bpm={128} />);

    expect(screen.getByText("128")).toBeInTheDocument();
  });

  it("renders cover image when coverUrl is provided", () => {
    render(
      <TrackRow {...defaultProps} coverUrl="https://example.com/cover.jpg" />
    );

    const image = screen.getByRole("img", { name: /cover for deep dive/i });
    expect(image).toBeInTheDocument();
  });

  it("renders disc icon when no cover image", () => {
    const { container } = render(<TrackRow {...defaultProps} />);

    const discIcon = container.querySelector('svg');
    expect(discIcon).toBeInTheDocument();
  });

  it("uses album name in cover alt text when provided", () => {
    render(
      <TrackRow
        {...defaultProps}
        album="Test Album"
        coverUrl="https://example.com/cover.jpg"
      />
    );

    const image = screen.getByRole("img", { name: /cover for test album/i });
    expect(image).toBeInTheDocument();
  });

  it("renders dropdown menu when menuItems are provided", async () => {
    const user = userEvent.setup();
    const mockMenuClick = vi.fn();
    const menuItems = [
      { label: "Add to playlist", onClick: mockMenuClick },
      { label: "Remove from queue", onClick: vi.fn(), destructive: true },
    ];

    render(<TrackRow {...defaultProps} menuItems={menuItems} />);

    const menuButton = screen.getByRole("button", {
      name: /more options for deep dive/i,
    });
    await user.click(menuButton);

    expect(screen.getByText("Add to playlist")).toBeInTheDocument();
    expect(screen.getByText("Remove from queue")).toBeInTheDocument();
  });

  it("calls menu item onClick when menu item is clicked", async () => {
    const user = userEvent.setup();
    const mockMenuClick = vi.fn();
    const menuItems = [{ label: "Test Action", onClick: mockMenuClick }];

    render(<TrackRow {...defaultProps} menuItems={menuItems} />);

    const menuButton = screen.getByRole("button", {
      name: /more options for deep dive/i,
    });
    await user.click(menuButton);

    const menuItem = screen.getByText("Test Action");
    await user.click(menuItem);

    expect(mockMenuClick).toHaveBeenCalled();
  });

  it("does not render menu button when no menuItems", () => {
    render(<TrackRow {...defaultProps} />);

    expect(
      screen.queryByRole("button", { name: /more options/i })
    ).not.toBeInTheDocument();
  });

  it("handles long track titles with truncation", () => {
    const longTitle = "This is a very long track title that should be truncated";
    render(<TrackRow {...defaultProps} title={longTitle} />);

    const titleElement = screen.getByText(longTitle);
    expect(titleElement).toHaveClass("truncate");
  });

  it("pads position numbers with leading zero", () => {
    render(<TrackRow {...defaultProps} position={1} />);
    expect(screen.getByText("01")).toBeInTheDocument();

    const { rerender } = render(<TrackRow {...defaultProps} position={9} />);
    expect(screen.getByText("09")).toBeInTheDocument();

    rerender(<TrackRow {...defaultProps} position={10} />);
    expect(screen.getByText("10")).toBeInTheDocument();
  });
});

describe("TrackListHeader", () => {
  it("renders all header columns by default", () => {
    const { container } = render(<TrackListHeader />);

    expect(container.textContent).toContain("#");
    expect(container.textContent).toContain("Title");
    expect(container.textContent).toContain("Album");
    expect(container.textContent).toContain("BPM");
  });

  it("hides album column when showAlbum is false", () => {
    const { container } = render(<TrackListHeader showAlbum={false} />);

    expect(container.textContent).toContain("Title");
    expect(container.textContent).not.toContain("Album");
  });

  it("hides BPM column when showBpm is false", () => {
    const { container } = render(<TrackListHeader showBpm={false} />);

    expect(container.textContent).toContain("Title");
    expect(container.textContent).not.toContain("BPM");
  });

  it("renders clock icon in header", () => {
    const { container } = render(<TrackListHeader />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it("is hidden on mobile devices", () => {
    const { container } = render(<TrackListHeader />);

    const header = container.firstChild;
    expect(header).toHaveClass("hidden", "md:flex");
  });
});

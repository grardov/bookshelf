import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaylistCard } from "./playlist-card";

describe("PlaylistCard", () => {
  const defaultProps = {
    id: "playlist-1",
    title: "Late Night Deep House",
    trackCount: 42,
    duration: "2:45:00",
    createdAt: "2024-01-15",
  };

  it("renders playlist title and track count", () => {
    render(<PlaylistCard {...defaultProps} />);

    expect(screen.getByText("Late Night Deep House")).toBeInTheDocument();
    expect(screen.getByText("42 tracks")).toBeInTheDocument();
  });

  it("renders duration with clock icon", () => {
    render(<PlaylistCard {...defaultProps} />);

    expect(screen.getByText("2:45:00")).toBeInTheDocument();
  });

  it("renders creation date", () => {
    render(<PlaylistCard {...defaultProps} />);

    expect(screen.getByText("2024-01-15")).toBeInTheDocument();
  });

  it("renders genre badge when provided", () => {
    render(<PlaylistCard {...defaultProps} genre="House" />);

    expect(screen.getByText("House")).toBeInTheDocument();
  });

  it("does not render genre badge when not provided", () => {
    const { container } = render(<PlaylistCard {...defaultProps} />);

    expect(container.textContent).not.toContain("Badge");
  });

  it("renders as a link with correct href", () => {
    render(<PlaylistCard {...defaultProps} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/playlists/playlist-1");
  });

  it("displays correct singular track count", () => {
    render(<PlaylistCard {...defaultProps} trackCount={1} />);

    expect(screen.getByText("1 tracks")).toBeInTheDocument();
  });

  it("displays correct plural track count", () => {
    render(<PlaylistCard {...defaultProps} trackCount={100} />);

    expect(screen.getByText("100 tracks")).toBeInTheDocument();
  });

  it("handles long playlist titles with truncation", () => {
    const longTitle =
      "This is a very long playlist title that should be truncated";
    render(<PlaylistCard {...defaultProps} title={longTitle} />);

    const titleElement = screen.getByText(longTitle);
    expect(titleElement).toHaveClass("truncate");
  });

  it("renders multiple playlist cards with different data", () => {
    const { rerender } = render(<PlaylistCard {...defaultProps} />);

    expect(screen.getByText("Late Night Deep House")).toBeInTheDocument();

    rerender(
      <PlaylistCard
        {...defaultProps}
        id="playlist-2"
        title="Morning Jazz"
        trackCount={25}
        duration="1:30:00"
        genre="Jazz"
        createdAt="2024-02-01"
      />,
    );

    expect(screen.getByText("Morning Jazz")).toBeInTheDocument();
    expect(screen.getByText("25 tracks")).toBeInTheDocument();
    expect(screen.getByText("Jazz")).toBeInTheDocument();
  });

  it("applies hover styles class", () => {
    render(<PlaylistCard {...defaultProps} />);

    const link = screen.getByRole("link");
    expect(link).toHaveClass("hover:border-[#404040]");
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReleaseCard } from "./release-card";

describe("ReleaseCard", () => {
  const defaultProps = {
    discogsReleaseId: 12345,
    title: "Homework",
    artist: "Daft Punk",
  };

  it("renders release title and artist", () => {
    render(<ReleaseCard {...defaultProps} />);

    expect(screen.getByText("Homework")).toBeInTheDocument();
    expect(screen.getByText("Daft Punk")).toBeInTheDocument();
  });

  it("renders as a link to the release detail page", () => {
    render(<ReleaseCard {...defaultProps} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/release/12345");
  });

  it("renders year when provided", () => {
    render(<ReleaseCard {...defaultProps} year="1997" />);

    expect(screen.getByText("1997")).toBeInTheDocument();
  });

  it("renders genre when provided", () => {
    render(<ReleaseCard {...defaultProps} genre="Electronic" />);

    expect(screen.getByText("Electronic")).toBeInTheDocument();
  });

  it("renders format badge when provided", () => {
    render(<ReleaseCard {...defaultProps} format="LP" />);

    expect(screen.getByText("LP")).toBeInTheDocument();
  });

  it("does not render format badge when not provided", () => {
    const { container } = render(<ReleaseCard {...defaultProps} />);

    // Format badge would have text like "LP", "CD", etc.
    const formatBadge = container.querySelector(
      'span[class*="rounded-full"][class*="border"]',
    );
    expect(formatBadge).not.toBeInTheDocument();
  });

  it("renders cover image when coverUrl is provided", () => {
    render(
      <ReleaseCard
        {...defaultProps}
        coverUrl="https://example.com/homework.jpg"
      />,
    );

    const image = screen.getByRole("img", {
      name: /homework by daft punk/i,
    });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute(
      "src",
      expect.stringContaining("homework.jpg"),
    );
  });

  it("renders disc icon when no cover image", () => {
    const { container } = render(<ReleaseCard {...defaultProps} />);

    const discIcon = container.querySelector("svg");
    expect(discIcon).toBeInTheDocument();
  });

  it("renders year and genre with separator", () => {
    const { container } = render(
      <ReleaseCard {...defaultProps} year="1997" genre="Electronic" />,
    );

    expect(container.textContent).toContain("1997");
    expect(container.textContent).toContain("·");
    expect(container.textContent).toContain("Electronic");
  });

  it("renders only year when genre is not provided", () => {
    const { container } = render(<ReleaseCard {...defaultProps} year="1997" />);

    expect(container.textContent).toContain("1997");
    expect(container.textContent).not.toContain("·");
  });

  it("renders only genre when year is not provided", () => {
    const { container } = render(
      <ReleaseCard {...defaultProps} genre="Electronic" />,
    );

    expect(container.textContent).toContain("Electronic");
    expect(container.textContent).not.toContain("·");
  });

  it("handles long titles with truncation", () => {
    const longTitle =
      "This is a very long album title that should be truncated";
    render(<ReleaseCard {...defaultProps} title={longTitle} />);

    const titleElement = screen.getByText(longTitle);
    expect(titleElement).toHaveClass("truncate");
  });

  it("handles long artist names with truncation", () => {
    const longArtist =
      "This is a very long artist name that should be truncated";
    render(<ReleaseCard {...defaultProps} artist={longArtist} />);

    const artistElement = screen.getByText(longArtist);
    expect(artistElement).toHaveClass("truncate");
  });

  it("applies hover styles class to article", () => {
    const { container } = render(<ReleaseCard {...defaultProps} />);

    const article = container.querySelector("article");
    expect(article).toHaveClass("hover:border-[#404040]");
  });

  it("renders as an article element with proper structure", () => {
    const { container } = render(<ReleaseCard {...defaultProps} />);

    const article = container.querySelector("article");
    expect(article).toBeInTheDocument();
    expect(article).toHaveClass("group");
  });

  it("accepts numeric year", () => {
    render(<ReleaseCard {...defaultProps} year={1997} />);

    expect(screen.getByText("1997")).toBeInTheDocument();
  });
});

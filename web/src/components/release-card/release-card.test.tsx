import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReleaseCard } from "./release-card";

describe("ReleaseCard", () => {
  const defaultProps = {
    id: "release-1",
    title: "Homework",
    artist: "Daft Punk",
  };

  it("renders release title and artist", () => {
    render(<ReleaseCard {...defaultProps} />);

    expect(screen.getByText("Homework")).toBeInTheDocument();
    expect(screen.getByText("Daft Punk")).toBeInTheDocument();
  });

  it("renders year when provided", () => {
    render(<ReleaseCard {...defaultProps} year="1997" />);

    expect(screen.getByText("1997")).toBeInTheDocument();
  });

  it("renders genre when provided", () => {
    render(<ReleaseCard {...defaultProps} genre="Electronic" />);

    expect(screen.getByText("Electronic")).toBeInTheDocument();
  });

  it("renders format badge with default vinyl", () => {
    render(<ReleaseCard {...defaultProps} />);

    expect(screen.getByText("vinyl")).toBeInTheDocument();
  });

  it("renders format badge with CD", () => {
    render(<ReleaseCard {...defaultProps} format="cd" />);

    expect(screen.getByText("cd")).toBeInTheDocument();
  });

  it("renders format badge with cassette", () => {
    render(<ReleaseCard {...defaultProps} format="cassette" />);

    expect(screen.getByText("cassette")).toBeInTheDocument();
  });

  it("renders cover image when coverUrl is provided", () => {
    render(
      <ReleaseCard
        {...defaultProps}
        coverUrl="https://example.com/homework.jpg"
      />
    );

    const image = screen.getByRole("img", {
      name: /homework by daft punk/i,
    });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute(
      "src",
      expect.stringContaining("homework.jpg")
    );
  });

  it("renders disc icon when no cover image", () => {
    const { container } = render(<ReleaseCard {...defaultProps} />);

    const discIcon = container.querySelector('svg');
    expect(discIcon).toBeInTheDocument();
  });

  it("renders delete button when onDelete is provided", () => {
    const mockDelete = vi.fn();

    render(<ReleaseCard {...defaultProps} onDelete={mockDelete} />);

    const deleteButton = screen.getByRole("button", {
      name: /delete homework/i,
    });
    expect(deleteButton).toBeInTheDocument();
  });

  it("does not render delete button when onDelete is not provided", () => {
    render(<ReleaseCard {...defaultProps} />);

    expect(
      screen.queryByRole("button", { name: /delete/i })
    ).not.toBeInTheDocument();
  });

  it("calls onDelete with release id when delete button is clicked", async () => {
    const user = userEvent.setup();
    const mockDelete = vi.fn();

    render(<ReleaseCard {...defaultProps} onDelete={mockDelete} />);

    const deleteButton = screen.getByRole("button", {
      name: /delete homework/i,
    });
    await user.click(deleteButton);

    expect(mockDelete).toHaveBeenCalledWith("release-1");
  });

  it("renders year and genre with separator", () => {
    render(
      <ReleaseCard {...defaultProps} year="1997" genre="Electronic" />
    );

    const { container } = render(
      <ReleaseCard {...defaultProps} year="1997" genre="Electronic" />
    );

    expect(container.textContent).toContain("1997");
    expect(container.textContent).toContain("·");
    expect(container.textContent).toContain("Electronic");
  });

  it("renders only year when genre is not provided", () => {
    const { container } = render(
      <ReleaseCard {...defaultProps} year="1997" />
    );

    expect(container.textContent).toContain("1997");
    expect(container.textContent).not.toContain("·");
  });

  it("renders only genre when year is not provided", () => {
    const { container } = render(
      <ReleaseCard {...defaultProps} genre="Electronic" />
    );

    expect(container.textContent).toContain("Electronic");
    expect(container.textContent).not.toContain("·");
  });

  it("handles long titles with truncation", () => {
    const longTitle = "This is a very long album title that should be truncated";
    render(<ReleaseCard {...defaultProps} title={longTitle} />);

    const titleElement = screen.getByText(longTitle);
    expect(titleElement).toHaveClass("truncate");
  });

  it("handles long artist names with truncation", () => {
    const longArtist = "This is a very long artist name that should be truncated";
    render(<ReleaseCard {...defaultProps} artist={longArtist} />);

    const artistElement = screen.getByText(longArtist);
    expect(artistElement).toHaveClass("truncate");
  });

  it("applies hover styles class", () => {
    const { container } = render(<ReleaseCard {...defaultProps} />);

    const article = container.firstChild;
    expect(article).toHaveClass("hover:border-[#404040]");
  });

  it("renders as an article element with proper structure", () => {
    const { container } = render(<ReleaseCard {...defaultProps} />);

    const article = container.querySelector("article");
    expect(article).toBeInTheDocument();
    expect(article).toHaveClass("group");
  });
});

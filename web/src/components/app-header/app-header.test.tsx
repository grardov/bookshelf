import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppHeader } from "./app-header";

describe("AppHeader", () => {
  it("renders the provided title", () => {
    render(<AppHeader title="Create Playlist" />);

    expect(screen.getByText("Create Playlist")).toBeInTheDocument();
  });

  it("renders as a header element", () => {
    const { container } = render(<AppHeader title="Test Title" />);

    expect(container.querySelector("header")).toBeInTheDocument();
  });

  it("renders heading with correct level", () => {
    render(<AppHeader title="My Title" />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("My Title");
  });

  it("applies correct styling classes", () => {
    render(<AppHeader title="Styled Title" />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveClass(
      "font-heading",
      "text-2xl",
      "font-bold",
      "text-white",
    );
  });

  it("handles long titles", () => {
    const longTitle =
      "This is a very long title that should still render correctly";
    render(<AppHeader title={longTitle} />);

    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it("handles empty title", () => {
    render(<AppHeader title="" />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("");
  });

  it("handles special characters in title", () => {
    const specialTitle = "Title & <Symbols> \"Quotes\" 'Test'";
    render(<AppHeader title={specialTitle} />);

    expect(screen.getByText(specialTitle)).toBeInTheDocument();
  });
});

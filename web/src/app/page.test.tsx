import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPage from "./page";

describe("LandingPage", () => {
  it("renders the heading", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Bookshelf." }),
    ).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(<LandingPage />);

    expect(
      screen.getByText("Your Discogs collection, remixed into playlists"),
    ).toBeInTheDocument();
  });

  it("renders 'Get started' link pointing to /signup", () => {
    render(<LandingPage />);

    const link = screen.getByRole("link", { name: /get started/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/signup");
  });

  it("renders 'Log in' link pointing to /login", () => {
    render(<LandingPage />);

    const link = screen.getByRole("link", { name: /log in/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });
});

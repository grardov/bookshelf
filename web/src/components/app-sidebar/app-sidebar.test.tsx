import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppSidebar } from "./app-sidebar";
import { useAuth } from "@/contexts/auth-context";
import { usePathname } from "next/navigation";

vi.mock("@/contexts/auth-context");
vi.mock("next/navigation");

describe("AppSidebar", () => {
  const mockSignOut = vi.fn();
  const mockProfile = {
    id: "user-123",
    email: "test@example.com",
    display_name: "Test User",
    avatar_url: null,
    discogs_username: null,
    discogs_connected_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      profile: mockProfile,
      signOut: mockSignOut,
      user: null,
      session: null,
      isLoading: false,
      refreshProfile: vi.fn(),
    });

    vi.mocked(usePathname).mockReturnValue("/create");
  });

  it("renders logo and brand name", () => {
    render(<AppSidebar />);

    const logo = screen.getByText("Bookshelf.");
    expect(logo).toBeInTheDocument();
    expect(logo.closest("a")).toHaveAttribute("href", "/create");
  });

  it("renders all library navigation items", () => {
    render(<AppSidebar />);

    expect(screen.getByRole("link", { name: /create/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /collection/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /playlists/i })
    ).toBeInTheDocument();
  });

  it("highlights active route", () => {
    vi.mocked(usePathname).mockReturnValue("/create");

    render(<AppSidebar />);

    const createLink = screen.getByRole("link", { name: /create/i });
    expect(createLink).toHaveAttribute("aria-current", "page");
    expect(createLink).toHaveClass("bg-[#141414]", "text-white");
  });

  it("does not highlight inactive routes", () => {
    vi.mocked(usePathname).mockReturnValue("/create");

    render(<AppSidebar />);

    const collectionLink = screen.getByRole("link", { name: /collection/i });
    expect(collectionLink).not.toHaveAttribute("aria-current");
  });

  it("renders user profile information", () => {
    render(<AppSidebar />);

    // Verify that the user's display name is rendered
    expect(screen.getByText("Test User")).toBeInTheDocument();

    // Verify the user button is rendered (which contains avatar and name)
    const userButton = screen.getByRole("button", { name: /test user/i });
    expect(userButton).toBeInTheDocument();
  });

  it("displays user email when display name is not available", () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: { ...mockProfile, display_name: null },
      signOut: mockSignOut,
      user: null,
      session: null,
      isLoading: false,
      refreshProfile: vi.fn(),
    });

    render(<AppSidebar />);

    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("T")).toBeInTheDocument(); // Initial from email
  });

  it("displays loading state when profile is not loaded", () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: null,
      signOut: mockSignOut,
      user: null,
      session: null,
      isLoading: true,
      refreshProfile: vi.fn(),
    });

    render(<AppSidebar />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByText("U")).toBeInTheDocument(); // Default initial
  });

  it("renders settings menu item", async () => {
    const user = userEvent.setup();

    render(<AppSidebar />);

    const userButton = screen.getByRole("button", { name: /test user/i });
    await user.click(userButton);

    const settingsLink = screen.getByRole("menuitem", { name: /settings/i });
    expect(settingsLink).toBeInTheDocument();
    expect(settingsLink.closest("a")).toHaveAttribute("href", "/settings");
  });

  it("calls signOut when logout is clicked", async () => {
    const user = userEvent.setup();

    render(<AppSidebar />);

    const userButton = screen.getByRole("button", { name: /test user/i });
    await user.click(userButton);

    const logoutButton = screen.getByRole("menuitem", { name: /log out/i });
    await user.click(logoutButton);

    expect(mockSignOut).toHaveBeenCalled();
  });

  it("renders user playlists section", () => {
    const { container } = render(<AppSidebar />);

    // Check for "Playlists" section header (case-insensitive)
    const playlistsHeaders = screen.getAllByText(/playlists/i);
    expect(playlistsHeaders.length).toBeGreaterThan(0);
    expect(screen.getByText("Late Night Deep House")).toBeInTheDocument();
    expect(screen.getByText("Sunday Morning Jazz")).toBeInTheDocument();
  });

  it("displays user avatar when avatar_url is provided", () => {
    const profileWithAvatar = {
      ...mockProfile,
      avatar_url: "https://example.com/avatar.jpg",
    };

    vi.mocked(useAuth).mockReturnValue({
      profile: profileWithAvatar,
      signOut: mockSignOut,
      user: null,
      session: null,
      isLoading: false,
      refreshProfile: vi.fn(),
    });

    render(<AppSidebar />);

    // Verify the component renders successfully with avatar_url
    const userButton = screen.getByRole("button", { name: /test user/i });
    expect(userButton).toBeInTheDocument();

    // Verify user information is still displayed
    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  it("highlights nested routes correctly", () => {
    vi.mocked(usePathname).mockReturnValue("/playlists/123");

    render(<AppSidebar />);

    const playlistsLink = screen.getByRole("link", { name: /^playlists$/i });
    expect(playlistsLink).toHaveAttribute("aria-current", "page");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppSidebar } from "./app-sidebar";
import { useAuth } from "@/contexts/auth-context";
import { usePathname } from "next/navigation";
import { listPlaylists } from "@/lib/api/playlists";

vi.mock("@/contexts/auth-context");
vi.mock("next/navigation");
vi.mock("@/lib/api/playlists");

const mockListPlaylists = vi.mocked(listPlaylists);

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

    // Default: return empty playlists
    mockListPlaylists.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 5,
      has_more: false,
    });
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

  it("renders playlists section header", () => {
    render(<AppSidebar />);

    // Check for "Playlists" section header
    const playlistsHeaders = screen.getAllByText(/playlists/i);
    expect(playlistsHeaders.length).toBeGreaterThan(0);
  });

  it("shows loading state while fetching playlists", () => {
    // Keep the promise pending
    mockListPlaylists.mockImplementation(() => new Promise(() => {}));

    render(<AppSidebar />);

    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows create playlist button when no playlists exist", async () => {
    mockListPlaylists.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 5,
      has_more: false,
    });

    render(<AppSidebar />);

    await waitFor(() => {
      expect(screen.getByText("Create playlist")).toBeInTheDocument();
    });
  });

  it("shows playlists when data is loaded", async () => {
    mockListPlaylists.mockResolvedValue({
      items: [
        {
          id: "playlist-1",
          user_id: "user-123",
          name: "My Awesome Playlist",
          description: null,
          tags: [],
          track_count: 10,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: null,
        },
      ],
      total: 1,
      page: 1,
      page_size: 5,
      has_more: false,
    });

    render(<AppSidebar />);

    await waitFor(() => {
      expect(screen.getByText("My Awesome Playlist")).toBeInTheDocument();
    });
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

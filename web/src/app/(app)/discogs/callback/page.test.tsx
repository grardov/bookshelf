import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DiscogsCallbackPage from "./page";

// Mock next/navigation with stable object references to prevent
// the useEffect from re-firing due to changed dependency references
const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

// Mock auth context with stable function reference
const mockRefreshProfile = vi.fn();

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    refreshProfile: mockRefreshProfile,
  }),
}));

// Mock Discogs API
vi.mock("@/lib/api/discogs", () => ({
  completeDiscogsAuth: vi.fn(),
}));

import { completeDiscogsAuth } from "@/lib/api/discogs";

const mockCompleteDiscogsAuth = vi.mocked(completeDiscogsAuth);

describe("DiscogsCallbackPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("oauth_verifier");
    sessionStorage.clear();
  });

  it("shows loading spinner while processing", () => {
    mockSearchParams.set("oauth_verifier", "test-verifier");
    sessionStorage.setItem("discogs_oauth_state", "test-state");
    mockCompleteDiscogsAuth.mockReturnValue(new Promise(() => {}));

    render(<DiscogsCallbackPage />);

    expect(
      screen.getByText("Connecting your Discogs account...")
    ).toBeInTheDocument();
  });

  it("shows error when oauth_verifier is missing from search params", async () => {
    // No oauth_verifier set in search params

    render(<DiscogsCallbackPage />);

    await waitFor(() => {
      expect(screen.getByText("Connection Failed")).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Authorization was denied or failed. Please try again."
      )
    ).toBeInTheDocument();
  });

  it("shows error when state is missing from sessionStorage", async () => {
    mockSearchParams.set("oauth_verifier", "test-verifier");
    // No state in sessionStorage

    render(<DiscogsCallbackPage />);

    await waitFor(() => {
      expect(screen.getByText("Connection Failed")).toBeInTheDocument();
    });

    expect(
      screen.getByText("OAuth session expired. Please try again.")
    ).toBeInTheDocument();
  });

  it("redirects to settings on successful auth completion", async () => {
    mockSearchParams.set("oauth_verifier", "test-verifier");
    sessionStorage.setItem("discogs_oauth_state", "encrypted-state");

    mockCompleteDiscogsAuth.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      display_name: "Test User",
      avatar_url: null,
      discogs_username: "dj_test",
      discogs_connected_at: "2024-01-01T00:00:00Z",
    } as Awaited<ReturnType<typeof completeDiscogsAuth>>);
    mockRefreshProfile.mockResolvedValue(undefined);

    render(<DiscogsCallbackPage />);

    await waitFor(() => {
      expect(mockCompleteDiscogsAuth).toHaveBeenCalledWith(
        "test-verifier",
        "encrypted-state"
      );
    });

    await waitFor(() => {
      expect(mockRefreshProfile).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/settings?discogs=connected");
    });
  });

  it("shows error message on API failure", async () => {
    mockSearchParams.set("oauth_verifier", "test-verifier");
    sessionStorage.setItem("discogs_oauth_state", "encrypted-state");

    mockCompleteDiscogsAuth.mockRejectedValue(
      new Error("Invalid OAuth verifier")
    );

    render(<DiscogsCallbackPage />);

    await waitFor(() => {
      expect(screen.getByText("Connection Failed")).toBeInTheDocument();
    });

    expect(screen.getByText("Invalid OAuth verifier")).toBeInTheDocument();
  });

  it("shows generic error message for non-Error rejections", async () => {
    mockSearchParams.set("oauth_verifier", "test-verifier");
    sessionStorage.setItem("discogs_oauth_state", "encrypted-state");

    mockCompleteDiscogsAuth.mockRejectedValue("Unknown failure");

    render(<DiscogsCallbackPage />);

    await waitFor(() => {
      expect(screen.getByText("Connection Failed")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Failed to connect Discogs account")
    ).toBeInTheDocument();
  });

  it("renders 'Back to Settings' button on error that navigates to settings", async () => {
    const user = userEvent.setup();
    // Trigger error by missing oauth_verifier

    render(<DiscogsCallbackPage />);

    await waitFor(() => {
      expect(screen.getByText("Connection Failed")).toBeInTheDocument();
    });

    const backButton = screen.getByRole("button", {
      name: /back to settings/i,
    });
    await user.click(backButton);

    expect(mockPush).toHaveBeenCalledWith("/settings");
  });

  it("calls completeDiscogsAuth with verifier and state", async () => {
    mockSearchParams.set("oauth_verifier", "my-verifier");
    sessionStorage.setItem("discogs_oauth_state", "my-state");

    mockCompleteDiscogsAuth.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      display_name: "Test User",
      avatar_url: null,
      discogs_username: "dj_test",
      discogs_connected_at: "2024-01-01T00:00:00Z",
    } as Awaited<ReturnType<typeof completeDiscogsAuth>>);
    mockRefreshProfile.mockResolvedValue(undefined);

    render(<DiscogsCallbackPage />);

    await waitFor(() => {
      expect(mockCompleteDiscogsAuth).toHaveBeenCalledWith(
        "my-verifier",
        "my-state"
      );
    });
  });
});

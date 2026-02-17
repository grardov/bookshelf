import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "./page";

// Mock auth context
const mockRefreshProfile = vi.fn();
vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));
import { useAuth } from "@/contexts/auth-context";
const mockUseAuth = vi.mocked(useAuth);

// Mock API modules
vi.mock("@/lib/api/users", () => ({
  updateDisplayName: vi.fn(),
}));
vi.mock("@/lib/api/discogs", () => ({
  initiateDiscogsAuth: vi.fn(),
  disconnectDiscogs: vi.fn(),
}));

import { updateDisplayName } from "@/lib/api/users";
import { initiateDiscogsAuth, disconnectDiscogs } from "@/lib/api/discogs";

const mockUpdateDisplayName = vi.mocked(updateDisplayName);
const mockInitiateDiscogsAuth = vi.mocked(initiateDiscogsAuth);
const mockDisconnectDiscogs = vi.mocked(disconnectDiscogs);

// Mock next/navigation
const mockRouterReplace = vi.fn();
const mockSearchParamsGet = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockRouterReplace,
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
}));

// Mock components that are not under test
vi.mock("@/components/app-header", () => ({
  AppHeader: ({ title }: { title: string }) => (
    <div data-testid="app-header">{title}</div>
  ),
}));

vi.mock("@/components/sync-button", () => ({
  SyncButton: () => <button data-testid="sync-button">Sync Collection</button>,
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...props} />
  ),
}));

const baseProfile = {
  id: "user-123",
  email: "test@example.com",
  display_name: "DJ Test",
  avatar_url: null,
  discogs_username: null,
  discogs_connected_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: null,
};

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsGet.mockReturnValue(null);
    mockUseAuth.mockReturnValue({
      profile: baseProfile,
      refreshProfile: mockRefreshProfile,
      user: null,
      session: null,
      isLoading: false,
      signOut: vi.fn(),
    });
  });

  it("renders the settings header", () => {
    render(<SettingsPage />);

    expect(screen.getByTestId("app-header")).toHaveTextContent("Settings");
  });

  it("renders all settings sections", () => {
    render(<SettingsPage />);

    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Email address")).toBeInTheDocument();
    expect(screen.getByText("Password")).toBeInTheDocument();
    expect(screen.getByText("Discogs connection")).toBeInTheDocument();
    expect(screen.getByText("Danger zone")).toBeInTheDocument();
  });

  it("shows the display name from profile in the input", () => {
    render(<SettingsPage />);

    const displayNameInput = screen.getByLabelText(/display name/i);
    expect(displayNameInput).toHaveValue("DJ Test");
  });

  it("shows the email from profile as disabled", () => {
    render(<SettingsPage />);

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveValue("test@example.com");
    expect(emailInput).toBeDisabled();
  });

  it("shows Discogs as 'Not connected' when no discogs_username", () => {
    render(<SettingsPage />);

    expect(screen.getByText("Not connected")).toBeInTheDocument();
    expect(screen.getByText("Disconnected")).toBeInTheDocument();
  });

  it("shows 'Connect Discogs' button when not connected", () => {
    render(<SettingsPage />);

    expect(
      screen.getByRole("button", { name: /connect discogs/i })
    ).toBeInTheDocument();
  });

  it("does not show sync or disconnect buttons when not connected", () => {
    render(<SettingsPage />);

    expect(screen.queryByTestId("sync-button")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /disconnect/i })
    ).not.toBeInTheDocument();
  });

  describe("when Discogs is connected", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        profile: {
          ...baseProfile,
          discogs_username: "vinyl_collector",
          discogs_connected_at: "2024-01-01T00:00:00Z",
        },
        refreshProfile: mockRefreshProfile,
        user: null,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
      });
    });

    it("shows Discogs as 'Connected' with username", () => {
      render(<SettingsPage />);

      expect(
        screen.getByText("Connected as vinyl_collector")
      ).toBeInTheDocument();
      expect(screen.getByText("Connected")).toBeInTheDocument();
    });

    it("shows sync button when connected", () => {
      render(<SettingsPage />);

      expect(screen.getByTestId("sync-button")).toBeInTheDocument();
    });

    it("shows 'Disconnect' button when connected", () => {
      render(<SettingsPage />);

      expect(
        screen.getByRole("button", { name: /disconnect$/i })
      ).toBeInTheDocument();
    });

    it("does not show 'Connect Discogs' button when connected", () => {
      render(<SettingsPage />);

      expect(
        screen.queryByRole("button", { name: /connect discogs/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("profile update", () => {
    it("calls updateDisplayName on form submission", async () => {
      const user = userEvent.setup();
      mockUpdateDisplayName.mockResolvedValueOnce({
        ...baseProfile,
        display_name: "New Name",
      });
      mockRefreshProfile.mockResolvedValueOnce(undefined);

      render(<SettingsPage />);

      const input = screen.getByLabelText(/display name/i);
      await user.clear(input);
      await user.type(input, "New Name");

      const saveButton = screen.getByRole("button", { name: /save profile/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateDisplayName).toHaveBeenCalledWith("New Name");
      });
    });

    it("shows success message after profile update", async () => {
      const user = userEvent.setup();
      mockUpdateDisplayName.mockResolvedValueOnce({
        ...baseProfile,
        display_name: "New Name",
      });
      mockRefreshProfile.mockResolvedValueOnce(undefined);

      render(<SettingsPage />);

      const input = screen.getByLabelText(/display name/i);
      await user.clear(input);
      await user.type(input, "New Name");

      const saveButton = screen.getByRole("button", { name: /save profile/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("Profile updated successfully!")
        ).toBeInTheDocument();
      });
    });

    it("shows error message when profile update fails", async () => {
      const user = userEvent.setup();
      mockUpdateDisplayName.mockRejectedValueOnce(
        new Error("Update failed")
      );

      render(<SettingsPage />);

      const input = screen.getByLabelText(/display name/i);
      await user.clear(input);
      await user.type(input, "New Name");

      const saveButton = screen.getByRole("button", { name: /save profile/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Update failed")).toBeInTheDocument();
      });
    });

    it("disables save button when display name is empty", async () => {
      const user = userEvent.setup();

      render(<SettingsPage />);

      const input = screen.getByLabelText(/display name/i);
      await user.clear(input);

      const saveButton = screen.getByRole("button", { name: /save profile/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe("Discogs connect flow", () => {
    it("calls initiateDiscogsAuth when 'Connect Discogs' is clicked", async () => {
      const user = userEvent.setup();
      mockInitiateDiscogsAuth.mockResolvedValueOnce({
        authorization_url: "https://discogs.com/oauth/authorize",
        state: "encrypted-state",
      });

      render(<SettingsPage />);

      const connectButton = screen.getByRole("button", {
        name: /connect discogs/i,
      });
      await user.click(connectButton);

      await waitFor(() => {
        expect(mockInitiateDiscogsAuth).toHaveBeenCalled();
      });
    });

    it("shows error when Discogs connect fails", async () => {
      const user = userEvent.setup();
      mockInitiateDiscogsAuth.mockRejectedValueOnce(
        new Error("OAuth failed")
      );

      render(<SettingsPage />);

      const connectButton = screen.getByRole("button", {
        name: /connect discogs/i,
      });
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText("OAuth failed")).toBeInTheDocument();
      });
    });
  });

  describe("Discogs disconnect flow", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        profile: {
          ...baseProfile,
          discogs_username: "vinyl_collector",
          discogs_connected_at: "2024-01-01T00:00:00Z",
        },
        refreshProfile: mockRefreshProfile,
        user: null,
        session: null,
        isLoading: false,
        signOut: vi.fn(),
      });
    });

    it("calls disconnectDiscogs after confirmation", async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => true);
      mockDisconnectDiscogs.mockResolvedValueOnce({
        ...baseProfile,
        discogs_username: null,
        discogs_connected_at: null,
      });
      mockRefreshProfile.mockResolvedValueOnce(undefined);

      render(<SettingsPage />);

      const disconnectButton = screen.getByRole("button", {
        name: /disconnect$/i,
      });
      await user.click(disconnectButton);

      await waitFor(() => {
        expect(mockDisconnectDiscogs).toHaveBeenCalled();
        expect(mockRefreshProfile).toHaveBeenCalled();
      });
    });

    it("does not disconnect when confirmation is cancelled", async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => false);

      render(<SettingsPage />);

      const disconnectButton = screen.getByRole("button", {
        name: /disconnect$/i,
      });
      await user.click(disconnectButton);

      expect(mockDisconnectDiscogs).not.toHaveBeenCalled();
    });
  });

  describe("Discogs callback success", () => {
    it("shows success message when discogs=connected param is present", () => {
      mockSearchParamsGet.mockImplementation((key: string) =>
        key === "discogs" ? "connected" : null
      );

      render(<SettingsPage />);

      expect(
        screen.getByText("Discogs account connected successfully!")
      ).toBeInTheDocument();
    });

    it("clears the discogs query param on success", () => {
      mockSearchParamsGet.mockImplementation((key: string) =>
        key === "discogs" ? "connected" : null
      );

      render(<SettingsPage />);

      expect(mockRouterReplace).toHaveBeenCalledWith("/settings", {
        scroll: false,
      });
    });
  });

  it("renders password fields", () => {
    render(<SettingsPage />);

    expect(screen.getByLabelText("Current password")).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm new password")).toBeInTheDocument();
  });

  it("renders 'Delete account' button in danger zone", () => {
    render(<SettingsPage />);

    expect(
      screen.getByRole("button", { name: /delete account/i })
    ).toBeInTheDocument();
  });

  it("renders 'Update password' button", () => {
    render(<SettingsPage />);

    expect(
      screen.getByRole("button", { name: /update password/i })
    ).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SyncButton } from "./sync-button";

// Mock the collection API
vi.mock("@/lib/api/collection", () => ({
  syncCollection: vi.fn(),
}));

import { syncCollection } from "@/lib/api/collection";

const mockSyncCollection = vi.mocked(syncCollection);

describe("SyncButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default label", () => {
    render(<SyncButton />);

    expect(
      screen.getByRole("button", { name: /sync collection/i })
    ).toBeInTheDocument();
  });

  it("renders without label when showLabel is false", () => {
    render(<SyncButton showLabel={false} />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveTextContent("Sync Collection");
  });

  it("renders with outline variant by default", () => {
    render(<SyncButton />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-slot", "button");
  });

  it("shows syncing state when clicked", async () => {
    const user = userEvent.setup();
    mockSyncCollection.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<SyncButton />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(screen.getByText("Syncing...")).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it("calls onSyncComplete with summary on success", async () => {
    const user = userEvent.setup();
    const mockOnComplete = vi.fn();
    const mockSummary = { added: 5, updated: 2, removed: 1, total: 10 };

    mockSyncCollection.mockResolvedValueOnce(mockSummary);

    render(<SyncButton onSyncComplete={mockOnComplete} />);

    const button = screen.getByRole("button");
    await user.click(button);

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(mockSummary);
    });
  });

  it("calls onSyncError with message on failure", async () => {
    const user = userEvent.setup();
    const mockOnError = vi.fn();

    mockSyncCollection.mockRejectedValueOnce(new Error("Network error"));

    render(<SyncButton onSyncError={mockOnError} />);

    const button = screen.getByRole("button");
    await user.click(button);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith("Network error");
    });
  });

  it("handles non-Error rejection with default message", async () => {
    const user = userEvent.setup();
    const mockOnError = vi.fn();

    mockSyncCollection.mockRejectedValueOnce("Unknown error");

    render(<SyncButton onSyncError={mockOnError} />);

    const button = screen.getByRole("button");
    await user.click(button);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith("Failed to sync collection");
    });
  });

  it("re-enables button after sync completes", async () => {
    const user = userEvent.setup();
    const mockSummary = { added: 1, updated: 0, removed: 0, total: 1 };

    mockSyncCollection.mockResolvedValueOnce(mockSummary);

    render(<SyncButton />);

    const button = screen.getByRole("button");
    await user.click(button);

    await waitFor(() => {
      expect(button).not.toBeDisabled();
      expect(screen.getByText("Sync Collection")).toBeInTheDocument();
    });
  });

  it("re-enables button after sync fails", async () => {
    const user = userEvent.setup();

    mockSyncCollection.mockRejectedValueOnce(new Error("Failed"));

    render(<SyncButton />);

    const button = screen.getByRole("button");
    await user.click(button);

    await waitFor(() => {
      expect(button).not.toBeDisabled();
      expect(screen.getByText("Sync Collection")).toBeInTheDocument();
    });
  });

  it("renders refresh icon", () => {
    const { container } = render(<SyncButton />);

    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("applies animate-spin class to icon while syncing", async () => {
    const user = userEvent.setup();
    mockSyncCollection.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { container } = render(<SyncButton />);

    const button = screen.getByRole("button");
    await user.click(button);

    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("animate-spin");
  });

  it("accepts different variant props", () => {
    const { rerender } = render(<SyncButton variant="default" />);
    expect(screen.getByRole("button")).toBeInTheDocument();

    rerender(<SyncButton variant="ghost" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("accepts different size props", () => {
    const { rerender } = render(<SyncButton size="lg" />);
    expect(screen.getByRole("button")).toBeInTheDocument();

    rerender(<SyncButton size="sm" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentUser, updateDisplayName, type User } from "./users";

// Mock the API client
vi.mock("./client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "./client";

const mockApiRequest = vi.mocked(apiRequest);

const mockUser: User = {
  id: "user-123",
  email: "test@example.com",
  display_name: "Test User",
  avatar_url: null,
  discogs_username: null,
  discogs_connected_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: null,
};

describe("Users API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCurrentUser", () => {
    it("calls apiRequest with correct endpoint", async () => {
      mockApiRequest.mockResolvedValueOnce(mockUser);

      const result = await getCurrentUser();

      expect(mockApiRequest).toHaveBeenCalledWith("/api/users/me");
      expect(result).toEqual(mockUser);
    });

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Not authenticated"));

      await expect(getCurrentUser()).rejects.toThrow("Not authenticated");
    });
  });

  describe("updateDisplayName", () => {
    it("calls apiRequest with PATCH method and body", async () => {
      const updatedUser = { ...mockUser, display_name: "New Name" };
      mockApiRequest.mockResolvedValueOnce(updatedUser);

      const result = await updateDisplayName("New Name");

      expect(mockApiRequest).toHaveBeenCalledWith("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({ display_name: "New Name" }),
      });
      expect(result.display_name).toBe("New Name");
    });

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Validation failed"));

      await expect(updateDisplayName("")).rejects.toThrow("Validation failed");
    });
  });
});

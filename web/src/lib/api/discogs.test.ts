import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  initiateDiscogsAuth,
  completeDiscogsAuth,
  disconnectDiscogs,
  type DiscogsAuthorizeResponse,
} from "./discogs";

// Mock the API client
vi.mock("./client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "./client";

const mockApiRequest = vi.mocked(apiRequest);

const mockUser = {
  id: "user-123",
  email: "test@example.com",
  display_name: "Test User",
  avatar_url: null,
  discogs_username: "testdiscogs",
  discogs_connected_at: "2024-01-01T00:00:00Z",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: null,
};

describe("Discogs API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initiateDiscogsAuth", () => {
    it("calls apiRequest with POST and callback_url param", async () => {
      const mockResponse: DiscogsAuthorizeResponse = {
        authorization_url: "https://discogs.com/oauth/authorize?token=xxx",
        state: "encrypted_state",
      };
      mockApiRequest.mockResolvedValueOnce(mockResponse);

      const result = await initiateDiscogsAuth(
        "http://localhost:3000/discogs/callback",
      );

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/discogs/authorize?callback_url=http%3A%2F%2Flocalhost%3A3000%2Fdiscogs%2Fcallback",
        { method: "POST" },
      );
      expect(result.authorization_url).toBe(
        "https://discogs.com/oauth/authorize?token=xxx",
      );
      expect(result.state).toBe("encrypted_state");
    });

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Discogs not configured"));

      await expect(
        initiateDiscogsAuth("http://localhost:3000/callback"),
      ).rejects.toThrow("Discogs not configured");
    });
  });

  describe("completeDiscogsAuth", () => {
    it("calls apiRequest with POST method and body", async () => {
      mockApiRequest.mockResolvedValueOnce(mockUser);

      const result = await completeDiscogsAuth(
        "verifier123",
        "encrypted_state",
      );

      expect(mockApiRequest).toHaveBeenCalledWith("/api/discogs/callback", {
        method: "POST",
        body: JSON.stringify({
          oauth_verifier: "verifier123",
          state: "encrypted_state",
        }),
      });
      expect(result.discogs_username).toBe("testdiscogs");
    });

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Invalid state"));

      await expect(
        completeDiscogsAuth("verifier", "bad_state"),
      ).rejects.toThrow("Invalid state");
    });
  });

  describe("disconnectDiscogs", () => {
    it("calls apiRequest with DELETE method", async () => {
      const disconnectedUser = {
        ...mockUser,
        discogs_username: null,
        discogs_connected_at: null,
      };
      mockApiRequest.mockResolvedValueOnce(disconnectedUser);

      const result = await disconnectDiscogs();

      expect(mockApiRequest).toHaveBeenCalledWith("/api/discogs/disconnect", {
        method: "DELETE",
      });
      expect(result.discogs_username).toBeNull();
    });

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValueOnce(new Error("Not authenticated"));

      await expect(disconnectDiscogs()).rejects.toThrow("Not authenticated");
    });
  });
});

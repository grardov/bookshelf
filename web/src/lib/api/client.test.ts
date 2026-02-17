import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiRequest } from "./client";

const mockGetSession = vi.fn();
const mockRefreshSession = vi.fn();

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      refreshSession: mockRefreshSession,
    },
  }),
}));

describe("apiRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "test-token" } },
    });
    mockRefreshSession.mockResolvedValue({
      data: { session: { access_token: "refreshed-token" } },
    });
  });

  it("returns parsed JSON for successful responses", async () => {
    const mockData = { id: "123", name: "Test" };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockData),
    } as Response);

    const result = await apiRequest("/api/test");

    expect(result).toEqual(mockData);
  });

  it("returns undefined for 204 No Content responses", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => Promise.reject(new Error("No content")),
    } as Response);

    const result = await apiRequest("/api/test", { method: "DELETE" });

    expect(result).toBeUndefined();
  });

  it("throws error for failed responses", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ detail: "Not found" }),
    } as Response);

    await expect(apiRequest("/api/test")).rejects.toThrow("Not found");
  });

  it("throws default error when error response has no detail", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    } as Response);

    await expect(apiRequest("/api/test")).rejects.toThrow("Request failed");
  });

  it("throws default error when error response is not valid JSON", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("Invalid JSON")),
    } as Response);

    await expect(apiRequest("/api/test")).rejects.toThrow("Request failed");
  });

  it("includes authorization header with session token", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    } as Response);

    await apiRequest("/api/test");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("retries with refreshed token on 401 response", async () => {
    const mockData = { id: "123" };
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ detail: "Token expired" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      } as Response);

    const result = await apiRequest("/api/test");

    expect(result).toEqual(mockData);
    expect(mockRefreshSession).toHaveBeenCalledOnce();
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer refreshed-token",
        }),
      }),
    );
  });

  it("throws session expired error when refresh fails", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ detail: "Token expired" }),
    } as Response);
    mockRefreshSession.mockResolvedValueOnce({
      data: { session: null },
    });

    await expect(apiRequest("/api/test")).rejects.toThrow(
      "Session expired. Please log in again.",
    );
  });

  it("throws not authenticated when no session exists", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
    });

    await expect(apiRequest("/api/test")).rejects.toThrow("Not authenticated");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

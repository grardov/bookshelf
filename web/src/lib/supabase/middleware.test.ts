import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "./middleware";
import { createServerClient } from "@supabase/ssr";

vi.mock("@supabase/ssr");

describe("updateSession", () => {
  const originalEnv = process.env;
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    aud: "authenticated",
    created_at: "2024-01-01",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON: "test-anon-key",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("creates Supabase client with request cookies", async () => {
    const request = new NextRequest(new URL("http://localhost:3000/test"));
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    };
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any);

    await updateSession(request);

    expect(createServerClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "test-anon-key",
      expect.objectContaining({
        cookies: expect.any(Object),
      }),
    );
  });

  it("returns user when authenticated", async () => {
    const request = new NextRequest(new URL("http://localhost:3000/test"));
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    };
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any);

    const result = await updateSession(request);

    expect(result.user).toEqual(mockUser);
  });

  it("returns null user when not authenticated", async () => {
    const request = new NextRequest(new URL("http://localhost:3000/test"));
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    };
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any);

    const result = await updateSession(request);

    expect(result.user).toBeNull();
  });

  it("returns NextResponse", async () => {
    const request = new NextRequest(new URL("http://localhost:3000/test"));
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    };
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any);

    const result = await updateSession(request);

    expect(result.supabaseResponse).toBeInstanceOf(NextResponse);
  });

  it("handles cookie setting in middleware context", async () => {
    const request = new NextRequest(new URL("http://localhost:3000/test"));
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    };
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any);

    await updateSession(request);

    const cookiesConfig = vi.mocked(createServerClient).mock.calls[0][2];
    const mockCookies = [{ name: "sb-token", value: "token123", options: {} }];

    // Should be able to call setAll
    expect(() => cookiesConfig?.cookies?.setAll(mockCookies)).not.toThrow();
  });
});

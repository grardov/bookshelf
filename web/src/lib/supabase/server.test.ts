import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createClient } from "./server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

vi.mock("@supabase/ssr");
vi.mock("next/headers");

describe("createClient (server)", () => {
  const originalEnv = process.env;
  const mockCookieStore = {
    getAll: vi.fn(),
    set: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("creates server client with environment variables", async () => {
    await createClient();

    expect(createServerClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "test-anon-key",
      expect.objectContaining({
        cookies: expect.any(Object),
      })
    );
  });

  it("configures cookies.getAll to use cookie store", async () => {
    const mockCookies = [
      { name: "sb-access-token", value: "token123" },
      { name: "sb-refresh-token", value: "refresh123" },
    ];
    mockCookieStore.getAll.mockReturnValue(mockCookies);

    await createClient();

    const cookiesConfig = vi.mocked(createServerClient).mock.calls[0][2];
    const getAllResult = cookiesConfig?.cookies?.getAll();

    expect(getAllResult).toEqual(mockCookies);
  });

  it("handles setAll errors gracefully from Server Components", async () => {
    mockCookieStore.set.mockImplementation(() => {
      throw new Error("Cannot set cookies in Server Component");
    });

    await createClient();

    const cookiesConfig = vi.mocked(createServerClient).mock.calls[0][2];
    const cookiesToSet = [
      { name: "test", value: "value", options: {} },
    ];

    // Should not throw
    expect(() => cookiesConfig?.cookies?.setAll(cookiesToSet)).not.toThrow();
  });

  it("returns the client instance", async () => {
    const mockClient = { auth: {}, from: vi.fn() };
    vi.mocked(createServerClient).mockReturnValue(mockClient as any);

    const client = await createClient();

    expect(client).toBe(mockClient);
  });
});

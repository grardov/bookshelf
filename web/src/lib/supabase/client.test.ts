import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createClient } from "./client";
import { createBrowserClient } from "@supabase/ssr";

vi.mock("@supabase/ssr");

describe("createClient", () => {
  const originalEnv = process.env;

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

  it("creates browser client with environment variables", () => {
    createClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "test-anon-key",
    );
  });

  it("returns the client instance", () => {
    const mockClient = { auth: {} };
    vi.mocked(createBrowserClient).mockReturnValue(mockClient as any);

    const client = createClient();

    expect(client).toBe(mockClient);
  });
});

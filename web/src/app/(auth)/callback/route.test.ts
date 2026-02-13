import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server");

describe("GET /callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exchanges code for session and redirects to next parameter", async () => {
    const mockSupabase = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      },
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const request = new Request(
      "http://localhost:3000/callback?code=auth-code-123&next=/playlists"
    );

    const response = await GET(request);

    expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(
      "auth-code-123"
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/playlists"
    );
  });

  it("redirects to root when no next parameter provided", async () => {
    const mockSupabase = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      },
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const request = new Request(
      "http://localhost:3000/callback?code=auth-code-123"
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("redirects to login with error when code exchange fails", async () => {
    const mockSupabase = {
      auth: {
        exchangeCodeForSession: vi
          .fn()
          .mockResolvedValue({ error: { message: "Invalid code" } }),
      },
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const request = new Request(
      "http://localhost:3000/callback?code=invalid-code"
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
    expect(response.headers.get("location")).toContain("error=Could");
    expect(response.headers.get("location")).toContain("authenticate");
  });

  it("redirects to login when no code provided", async () => {
    const request = new Request("http://localhost:3000/callback");

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
    expect(response.headers.get("location")).toContain("error=Could");
    expect(response.headers.get("location")).toContain("authenticate");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { middleware } from "./middleware";
import { updateSession } from "@/lib/supabase/middleware";

vi.mock("@/lib/supabase/middleware");

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("protected routes", () => {
    it("redirects to login when accessing /create without auth", async () => {
      vi.mocked(updateSession).mockResolvedValue({
        supabaseResponse: NextResponse.next(),
        user: null,
      });

      const request = new NextRequest(new URL("http://localhost:3000/create"));
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
      expect(response.headers.get("location")).toContain(
        "redirectTo=%2Fcreate",
      );
    });

    it("redirects to login when accessing /collection without auth", async () => {
      vi.mocked(updateSession).mockResolvedValue({
        supabaseResponse: NextResponse.next(),
        user: null,
      });

      const request = new NextRequest(
        new URL("http://localhost:3000/collection"),
      );
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
      expect(response.headers.get("location")).toContain(
        "redirectTo=%2Fcollection",
      );
    });

    it("redirects to login when accessing nested protected route", async () => {
      vi.mocked(updateSession).mockResolvedValue({
        supabaseResponse: NextResponse.next(),
        user: null,
      });

      const request = new NextRequest(
        new URL("http://localhost:3000/playlists/123"),
      );
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
      expect(response.headers.get("location")).toContain(
        "redirectTo=%2Fplaylists%2F123",
      );
    });

    it("allows access to protected route with auth", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const mockResponse = NextResponse.next();

      vi.mocked(updateSession).mockResolvedValue({
        supabaseResponse: mockResponse,
        user: mockUser as any,
      });

      const request = new NextRequest(new URL("http://localhost:3000/create"));
      const response = await middleware(request);

      expect(response).toBe(mockResponse);
    });
  });

  describe("auth routes", () => {
    it("redirects authenticated users away from login page", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      vi.mocked(updateSession).mockResolvedValue({
        supabaseResponse: NextResponse.next(),
        user: mockUser as any,
      });

      const request = new NextRequest(new URL("http://localhost:3000/login"));
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/create");
    });

    it("redirects authenticated users away from signup page", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      vi.mocked(updateSession).mockResolvedValue({
        supabaseResponse: NextResponse.next(),
        user: mockUser as any,
      });

      const request = new NextRequest(new URL("http://localhost:3000/signup"));
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/create");
    });

    it("allows unauthenticated users to access login page", async () => {
      const mockResponse = NextResponse.next();

      vi.mocked(updateSession).mockResolvedValue({
        supabaseResponse: mockResponse,
        user: null,
      });

      const request = new NextRequest(new URL("http://localhost:3000/login"));
      const response = await middleware(request);

      expect(response).toBe(mockResponse);
    });
  });

  describe("public routes", () => {
    it("redirects authenticated users from landing page to /create", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      vi.mocked(updateSession).mockResolvedValue({
        supabaseResponse: NextResponse.next(),
        user: mockUser as any,
      });

      const request = new NextRequest(new URL("http://localhost:3000/"));
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/create");
    });

    it("allows unauthenticated users to access landing page", async () => {
      const mockResponse = NextResponse.next();

      vi.mocked(updateSession).mockResolvedValue({
        supabaseResponse: mockResponse,
        user: null,
      });

      const request = new NextRequest(new URL("http://localhost:3000/"));
      const response = await middleware(request);

      expect(response).toBe(mockResponse);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./auth-context";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

vi.mock("@/lib/supabase/client");

describe("AuthContext", () => {
  const mockUser: User = {
    id: "user-123",
    email: "test@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2024-01-01T00:00:00Z",
  } as User;

  const mockSession: Session = {
    access_token: "token",
    refresh_token: "refresh",
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: "bearer",
    user: mockUser,
  };

  const mockProfile = {
    id: "user-123",
    email: "test@example.com",
    display_name: "Test User",
    avatar_url: null,
    discogs_username: null,
    discogs_connected_at: null,
  };

  const mockSupabase = {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as any);
  });

  describe("useAuth hook", () => {
    it("throws error when used outside AuthProvider", () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow("useAuth must be used within an AuthProvider");
    });
  });

  describe("AuthProvider", () => {
    it("initializes with loading state", () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.profile).toBeNull();
    });

    it("loads authenticated user and profile", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.profile).toEqual(mockProfile);
    });

    it("handles unauthenticated state", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.profile).toBeNull();
    });

    it("handles sign out", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      });
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await result.current.signOut();

      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
        expect(result.current.user).toBeNull();
        expect(result.current.profile).toBeNull();
        expect(result.current.session).toBeNull();
      });
    });

    it("refreshes profile when requested", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };
      mockSupabase.from.mockReturnValue(mockFrom);
      mockFrom.single
        .mockResolvedValueOnce({ data: mockProfile, error: null })
        .mockResolvedValueOnce({
          data: { ...mockProfile, display_name: "Updated Name" },
          error: null,
        });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.profile?.display_name).toBe("Test User");
      });

      await result.current.refreshProfile();

      await waitFor(() => {
        expect(result.current.profile?.display_name).toBe("Updated Name");
      });
    });

    it("listens for auth state changes", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      let authCallback: any;
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        } as any;
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate auth state change
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      });

      await authCallback("SIGNED_IN", mockSession);

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.session).toEqual(mockSession);
      });
    });

    it("clears profile on sign out event", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      });

      let authCallback: any;
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        } as any;
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Simulate sign out
      await authCallback("SIGNED_OUT", null);

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.profile).toBeNull();
        expect(result.current.session).toBeNull();
      });
    });
  });
});

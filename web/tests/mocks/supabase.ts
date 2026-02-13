import { vi } from "vitest";

export const createMockSupabaseClient = () => ({
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    exchangeCodeForSession: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
});

export const mockUser = {
  id: "user-123",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00Z",
};

export const mockSession = {
  access_token: "mock-token",
  refresh_token: "mock-refresh",
  expires_in: 3600,
  token_type: "bearer",
  user: mockUser,
};

export const mockProfile = {
  id: "user-123",
  email: "test@example.com",
  display_name: "Test User",
  avatar_url: null,
  discogs_username: null,
  discogs_connected_at: null,
};

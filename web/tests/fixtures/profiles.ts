export const testProfile = {
  id: "user-123",
  email: "test@example.com",
  display_name: "Test User",
  avatar_url: null,
  discogs_username: null,
  discogs_access_token: null,
  discogs_connected_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const testProfiles = [
  testProfile,
  {
    id: "user-456",
    email: "another@example.com",
    display_name: "Another User",
    avatar_url: "https://example.com/avatar.jpg",
    discogs_username: "discogs_user",
    discogs_access_token: "token-123",
    discogs_connected_at: "2024-01-01T00:00:00Z",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  },
];

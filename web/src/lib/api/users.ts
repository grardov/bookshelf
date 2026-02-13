import { apiRequest } from "./client";

/**
 * User profile data structure.
 */
export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  discogs_username: string | null;
  discogs_connected_at: string | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * Get the current authenticated user's profile.
 *
 * @returns Promise resolving to user profile data
 * @throws Error if request fails or user not authenticated
 */
export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>("/api/users/me");
}

/**
 * Update the current user's display name.
 *
 * @param displayName - New display name (1-100 characters)
 * @returns Promise resolving to updated user profile
 * @throws Error if request fails or validation fails
 */
export async function updateDisplayName(displayName: string): Promise<User> {
  return apiRequest<User>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify({ display_name: displayName }),
  });
}

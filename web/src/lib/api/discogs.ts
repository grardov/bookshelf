import { apiRequest } from "./client";
import type { User } from "./users";

/**
 * Response from the Discogs authorize endpoint.
 */
export interface DiscogsAuthorizeResponse {
  authorization_url: string;
  state: string;
}

/**
 * Initiate Discogs OAuth authorization flow.
 *
 * @param callbackUrl - Frontend URL to redirect to after authorization
 * @returns Promise resolving to authorization URL and encrypted state
 * @throws Error if request fails or user not authenticated
 */
export async function initiateDiscogsAuth(
  callbackUrl: string,
): Promise<DiscogsAuthorizeResponse> {
  const params = new URLSearchParams({ callback_url: callbackUrl });
  return apiRequest<DiscogsAuthorizeResponse>(
    `/api/discogs/authorize?${params.toString()}`,
    { method: "POST" },
  );
}

/**
 * Complete Discogs OAuth authorization flow.
 *
 * @param oauthVerifier - OAuth verifier from Discogs callback
 * @param state - Encrypted state from authorization step
 * @returns Promise resolving to updated user profile with Discogs connection info
 * @throws Error if request fails, state is invalid, or user not authenticated
 */
export async function completeDiscogsAuth(
  oauthVerifier: string,
  state: string,
): Promise<User> {
  return apiRequest<User>("/api/discogs/callback", {
    method: "POST",
    body: JSON.stringify({
      oauth_verifier: oauthVerifier,
      state: state,
    }),
  });
}

/**
 * Disconnect Discogs account.
 *
 * @returns Promise resolving to updated user profile with Discogs fields cleared
 * @throws Error if request fails or user not authenticated
 */
export async function disconnectDiscogs(): Promise<User> {
  return apiRequest<User>("/api/discogs/disconnect", {
    method: "DELETE",
  });
}

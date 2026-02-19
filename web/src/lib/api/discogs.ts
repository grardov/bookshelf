import { apiRequest } from "./client";
import type { User } from "./users";

// =============================================
// OAuth Types & Functions
// =============================================

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

// =============================================
// Search Types & Functions
// =============================================

export interface DiscogsSearchResult {
  id: number;
  title: string;
  year: number | null;
  cover_image: string | null;
  format: string | null;
  label: string | null;
  country: string | null;
  type: string;
}

export interface DiscogsSearchPagination {
  page: number;
  pages: number;
  per_page: number;
  items: number;
}

export interface DiscogsSearchResponse {
  results: DiscogsSearchResult[];
  pagination: DiscogsSearchPagination;
}

/**
 * Search Discogs for releases.
 *
 * @param query - Search query string
 * @param page - Page number (default 1)
 * @param perPage - Results per page (default 10)
 * @returns Search results with pagination
 */
export async function searchDiscogs(
  query: string,
  page = 1,
  perPage = 10,
): Promise<DiscogsSearchResponse> {
  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    per_page: perPage.toString(),
  });
  return apiRequest<DiscogsSearchResponse>(`/api/discogs/search?${params}`);
}

// =============================================
// Release Detail Types & Functions
// =============================================

export interface DiscogsReleaseTrack {
  position: string;
  title: string;
  duration: string | null;
  artists: string[];
}

export interface DiscogsReleaseLabel {
  name: string;
  catno: string;
  entity_type_name: string;
}

export interface DiscogsReleaseFormat {
  name: string;
  qty: string;
  descriptions: string[];
}

export interface DiscogsReleaseDetail {
  discogs_release_id: number;
  title: string;
  artist_name: string;
  year: number | null;
  cover_image_url: string | null;
  country: string | null;
  genres: string[];
  styles: string[];
  notes: string | null;
  tracks: DiscogsReleaseTrack[];
  labels: DiscogsReleaseLabel[] | null;
  formats: DiscogsReleaseFormat[] | null;
  format_string: string | null;
  in_collection: boolean;
  collection_release_id: string | null;
  discogs_instance_id: number | null;
}

/**
 * Fetch release detail from Discogs API (cached on backend).
 *
 * @param discogsReleaseId - Discogs release ID
 * @returns Full release detail with collection membership info
 */
export async function getDiscogsRelease(
  discogsReleaseId: number,
): Promise<DiscogsReleaseDetail> {
  return apiRequest<DiscogsReleaseDetail>(
    `/api/discogs/releases/${discogsReleaseId}`,
  );
}

// =============================================
// Collection Add/Remove Types & Functions
// =============================================

export interface CollectionAddResponse {
  release_id: string;
  discogs_release_id: number;
  discogs_instance_id: number;
  message: string;
}

export interface CollectionRemoveResponse {
  discogs_release_id: number;
  message: string;
}

/**
 * Add a release to user's Discogs collection and local DB.
 *
 * @param discogsReleaseId - Discogs release ID to add
 * @returns Confirmation with local and Discogs IDs
 */
export async function addToCollection(
  discogsReleaseId: number,
): Promise<CollectionAddResponse> {
  return apiRequest<CollectionAddResponse>(
    `/api/discogs/releases/${discogsReleaseId}/collect`,
    { method: "POST" },
  );
}

/**
 * Remove a release from user's Discogs collection and local DB.
 *
 * @param discogsReleaseId - Discogs release ID to remove
 * @returns Confirmation with Discogs release ID
 */
export async function removeFromCollection(
  discogsReleaseId: number,
): Promise<CollectionRemoveResponse> {
  return apiRequest<CollectionRemoveResponse>(
    `/api/discogs/releases/${discogsReleaseId}/collect`,
    { method: "DELETE" },
  );
}

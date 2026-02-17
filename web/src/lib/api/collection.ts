import { apiRequest } from "./client";

/**
 * Release data structure matching backend model.
 */
export interface Release {
  id: string;
  user_id: string;
  discogs_release_id: number;
  discogs_instance_id: number;
  title: string;
  artist_name: string;
  year: number | null;
  cover_image_url: string | null;
  format: string | null;
  genres: string[];
  styles: string[];
  labels: string[];
  catalog_number: string | null;
  country: string | null;
  discogs_metadata: Record<string, unknown> | null;
  added_to_discogs_at: string | null;
  synced_at: string;
  created_at: string;
  updated_at: string | null;
}

/**
 * Summary of a collection sync operation.
 */
export interface SyncSummary {
  added: number;
  updated: number;
  removed: number;
  total: number;
}

/**
 * Paginated releases response.
 */
export interface PaginatedReleases {
  items: Release[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

/**
 * Options for listing releases.
 */
export interface ListReleasesOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

/**
 * Sync user's Discogs collection.
 *
 * @returns Promise resolving to sync summary
 * @throws Error if sync fails or Discogs not connected
 */
export async function syncCollection(): Promise<SyncSummary> {
  return apiRequest<SyncSummary>("/api/collection/sync", {
    method: "POST",
  });
}

/**
 * List user's releases with pagination.
 *
 * @param options - Pagination and filter options
 * @returns Promise resolving to paginated releases
 */
export async function listReleases(
  options: ListReleasesOptions = {}
): Promise<PaginatedReleases> {
  const params = new URLSearchParams();

  if (options.page) params.set("page", options.page.toString());
  if (options.pageSize) params.set("page_size", options.pageSize.toString());
  if (options.sortBy) params.set("sort_by", options.sortBy);
  if (options.sortOrder) params.set("sort_order", options.sortOrder);
  if (options.search) params.set("search", options.search);

  const queryString = params.toString();
  const endpoint = queryString
    ? `/api/collection?${queryString}`
    : "/api/collection";

  return apiRequest<PaginatedReleases>(endpoint);
}

/**
 * Get a single release by ID.
 *
 * @param releaseId - Release UUID
 * @returns Promise resolving to release data
 */
export async function getRelease(releaseId: string): Promise<Release> {
  return apiRequest<Release>(`/api/collection/${releaseId}`);
}

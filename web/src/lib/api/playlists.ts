import { apiRequest } from "./client";

/**
 * Playlist model.
 */
export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  tags: string[];
  track_count: number;
  created_at: string;
  updated_at: string | null;
}

/**
 * Track in a playlist (snapshot data).
 */
export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  release_id: string;
  discogs_release_id: number;
  position: string;
  title: string;
  artist: string;
  duration: string | null;
  track_order: number;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * Playlist with tracks included.
 */
export interface PlaylistWithTracks extends Playlist {
  tracks: PlaylistTrack[];
  total_duration: string | null;
}

/**
 * Paginated playlists response.
 */
export interface PaginatedPlaylists {
  items: Playlist[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

/**
 * Track from Discogs API.
 */
export interface DiscogsTrack {
  position: string;
  title: string;
  duration: string | null;
  artists: string[];
}

/**
 * Label details from Discogs release.
 */
export interface DiscogsLabel {
  name: string;
  catno: string;
  entity_type_name: string;
}

/**
 * Format details from Discogs release.
 */
export interface DiscogsFormat {
  name: string;
  qty: string;
  descriptions: string[];
}

/**
 * Response for release tracks from Discogs.
 */
export interface ReleaseTracksResponse {
  release_id: string;
  discogs_release_id: number;
  title: string;
  artist_name: string;
  tracks: DiscogsTrack[];
  notes: string | null;
  country: string | null;
  genres: string[];
  styles: string[];
  labels: DiscogsLabel[] | null;
  formats: DiscogsFormat[] | null;
}

/**
 * Data for creating a playlist.
 */
export interface CreatePlaylistData {
  name: string;
  description?: string;
  tags?: string[];
}

/**
 * Data for updating a playlist.
 */
export interface UpdatePlaylistData {
  name?: string;
  description?: string;
  tags?: string[];
}

/**
 * Data for adding a track to playlist.
 */
export interface AddTrackData {
  release_id: string;
  discogs_release_id: number;
  position: string;
  title: string;
  artist: string;
  duration?: string;
  cover_image_url?: string;
}

/**
 * List user's playlists with pagination.
 *
 * @param page - Page number (default 1)
 * @param pageSize - Items per page (default 50)
 * @returns Paginated playlists
 */
export async function listPlaylists(
  page = 1,
  pageSize = 50,
): Promise<PaginatedPlaylists> {
  const params = new URLSearchParams();
  params.set("page", page.toString());
  params.set("page_size", pageSize.toString());
  return apiRequest<PaginatedPlaylists>(`/api/playlists?${params}`);
}

/**
 * Get a single playlist with tracks.
 *
 * @param playlistId - Playlist UUID
 * @returns Playlist with tracks
 */
export async function getPlaylist(
  playlistId: string,
): Promise<PlaylistWithTracks> {
  return apiRequest<PlaylistWithTracks>(`/api/playlists/${playlistId}`);
}

/**
 * Create a new playlist.
 *
 * @param data - Playlist data
 * @returns Created playlist
 */
export async function createPlaylist(
  data: CreatePlaylistData,
): Promise<Playlist> {
  return apiRequest<Playlist>("/api/playlists", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update a playlist.
 *
 * @param playlistId - Playlist UUID
 * @param data - Update data
 * @returns Updated playlist
 */
export async function updatePlaylist(
  playlistId: string,
  data: UpdatePlaylistData,
): Promise<Playlist> {
  return apiRequest<Playlist>(`/api/playlists/${playlistId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a playlist.
 *
 * @param playlistId - Playlist UUID
 */
export async function deletePlaylist(playlistId: string): Promise<void> {
  await apiRequest(`/api/playlists/${playlistId}`, {
    method: "DELETE",
  });
}

/**
 * Add a track to a playlist.
 *
 * @param playlistId - Playlist UUID
 * @param data - Track data
 * @returns Created track
 */
export async function addTrackToPlaylist(
  playlistId: string,
  data: AddTrackData,
): Promise<PlaylistTrack> {
  return apiRequest<PlaylistTrack>(`/api/playlists/${playlistId}/tracks`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Remove a track from a playlist.
 *
 * @param playlistId - Playlist UUID
 * @param trackId - Track UUID
 */
export async function removeTrackFromPlaylist(
  playlistId: string,
  trackId: string,
): Promise<void> {
  await apiRequest(`/api/playlists/${playlistId}/tracks/${trackId}`, {
    method: "DELETE",
  });
}

/**
 * Reorder tracks in a playlist.
 *
 * @param playlistId - Playlist UUID
 * @param trackIds - Track IDs in new order
 * @returns Updated tracks list
 */
export async function reorderPlaylistTracks(
  playlistId: string,
  trackIds: string[],
): Promise<PlaylistTrack[]> {
  return apiRequest<PlaylistTrack[]>(
    `/api/playlists/${playlistId}/tracks/reorder`,
    {
      method: "PATCH",
      body: JSON.stringify({ track_ids: trackIds }),
    },
  );
}

/**
 * Fetch tracks for a release from Discogs API.
 *
 * @param releaseId - Release UUID
 * @returns Release tracks from Discogs
 */
export async function getReleaseTracks(
  releaseId: string,
): Promise<ReleaseTracksResponse> {
  return apiRequest<ReleaseTracksResponse>(
    `/api/collection/${releaseId}/tracks`,
  );
}

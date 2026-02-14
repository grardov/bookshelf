from datetime import datetime

from pydantic import BaseModel, Field


class User(BaseModel):
    """User profile model."""

    id: str
    email: str
    display_name: str | None = None
    avatar_url: str | None = None
    discogs_username: str | None = None
    discogs_connected_at: str | None = None
    created_at: datetime
    updated_at: datetime | None = None


class UpdateProfile(BaseModel):
    """Update user profile request model."""

    display_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="User's display name (1-100 characters)",
    )


class DiscogsAuthorizeResponse(BaseModel):
    """Response from /api/discogs/authorize endpoint."""

    authorization_url: str = Field(
        ...,
        description="Discogs OAuth authorization URL to redirect user to",
    )
    state: str = Field(
        ...,
        description="Encrypted state containing request token secret",
    )


class DiscogsCallbackRequest(BaseModel):
    """Request body for /api/discogs/callback endpoint."""

    oauth_verifier: str = Field(
        ...,
        min_length=1,
        description="OAuth verifier from Discogs callback",
    )
    state: str = Field(
        ...,
        min_length=1,
        description="Encrypted state from authorization step",
    )


class Release(BaseModel):
    """Release model representing a record in user's collection."""

    id: str
    user_id: str
    discogs_release_id: int
    discogs_instance_id: int
    title: str
    artist_name: str
    year: int | None = None
    cover_image_url: str | None = None
    format: str | None = None
    genres: list[str] = Field(default_factory=list)
    styles: list[str] = Field(default_factory=list)
    labels: list[str] = Field(default_factory=list)
    catalog_number: str | None = None
    country: str | None = None
    added_to_discogs_at: datetime | None = None
    synced_at: datetime
    created_at: datetime
    updated_at: datetime | None = None


class SyncSummary(BaseModel):
    """Summary of a collection sync operation."""

    added: int = Field(..., description="Number of new releases added")
    updated: int = Field(..., description="Number of existing releases updated")
    removed: int = Field(..., description="Number of releases removed")
    total: int = Field(..., description="Total releases in collection after sync")


class PaginatedReleases(BaseModel):
    """Paginated list of releases."""

    items: list[Release]
    total: int
    page: int
    page_size: int
    has_more: bool


# =============================================
# Playlist Models
# =============================================


class CreatePlaylist(BaseModel):
    """Create playlist request model."""

    name: str = Field(..., min_length=1, max_length=200, description="Playlist name")
    description: str | None = Field(
        None, max_length=1000, description="Playlist description"
    )
    tags: list[str] = Field(default_factory=list, description="Tags/categories")


class UpdatePlaylist(BaseModel):
    """Update playlist request model."""

    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=1000)
    tags: list[str] | None = None


class Playlist(BaseModel):
    """Playlist model."""

    id: str
    user_id: str
    name: str
    description: str | None = None
    tags: list[str] = Field(default_factory=list)
    track_count: int = 0
    created_at: datetime
    updated_at: datetime | None = None


class PlaylistTrack(BaseModel):
    """Track in a playlist (snapshot data)."""

    id: str
    playlist_id: str
    release_id: str
    discogs_release_id: int
    position: str
    title: str
    artist: str
    duration: str | None = None
    track_order: int
    cover_image_url: str | None = None
    created_at: datetime
    updated_at: datetime | None = None


class PlaylistWithTracks(Playlist):
    """Playlist with tracks included."""

    tracks: list[PlaylistTrack] = Field(default_factory=list)
    total_duration: str | None = None


class AddTrackRequest(BaseModel):
    """Request to add a track to playlist."""

    release_id: str = Field(..., description="Release UUID from collection")
    discogs_release_id: int = Field(..., description="Discogs release ID")
    position: str = Field(..., description="Track position (e.g., 'A1')")
    title: str = Field(..., min_length=1)
    artist: str = Field(..., min_length=1)
    duration: str | None = Field(None, description="Duration string e.g., '6:42'")
    cover_image_url: str | None = Field(None, description="Release cover image URL")


class ReorderTracksRequest(BaseModel):
    """Request to reorder tracks in playlist."""

    track_ids: list[str] = Field(..., description="Track IDs in new order")


class PaginatedPlaylists(BaseModel):
    """Paginated list of playlists."""

    items: list[Playlist]
    total: int
    page: int
    page_size: int
    has_more: bool


# =============================================
# Discogs Track Models (for on-demand fetching)
# =============================================


class DiscogsTrack(BaseModel):
    """Track from Discogs API."""

    position: str
    title: str
    duration: str | None = None
    artists: list[str] = Field(default_factory=list)


class ReleaseTracksResponse(BaseModel):
    """Response for release tracks from Discogs."""

    release_id: str
    discogs_release_id: int
    title: str
    artist_name: str
    tracks: list[DiscogsTrack]

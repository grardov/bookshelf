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

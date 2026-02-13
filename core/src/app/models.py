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

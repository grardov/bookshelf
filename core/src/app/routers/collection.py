"""Collection API endpoints."""

import logging
from typing import Any, cast

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.config import Config
from app.dependencies import get_current_user_id
from app.models import PaginatedReleases, Release, ReleaseTracksResponse, SyncSummary
from app.services.collection import CollectionSyncError, get_collection_service
from app.supabase import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter()

# Type alias for Supabase row data
Row = dict[str, Any]


def _require_discogs_connected(user_id: str) -> Row:
    """Get user's Discogs credentials or raise error if not connected.

    Args:
        user_id: User ID to check

    Returns:
        User data with Discogs credentials

    Raises:
        HTTPException: If user not found or Discogs not connected
    """
    supabase = get_supabase()

    response = (
        supabase.table("users")
        .select("discogs_access_token, discogs_access_token_secret, discogs_username")
        .eq("id", user_id)
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user = cast(Row, response.data)
    has_token = user.get("discogs_access_token", None)
    has_secret = user.get("discogs_access_token_secret", None)
    if not has_token or not has_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Discogs account not connected. Please connect first.",
        )

    return user


@router.post("/sync", response_model=SyncSummary)
def sync_collection(
    user_id: str = Depends(get_current_user_id),  # noqa: B008
):
    """Sync user's Discogs collection to database.

    Fetches the entire collection from Discogs and reconciles with local database:
    - Adds new releases
    - Updates existing releases
    - Removes releases no longer in Discogs collection

    Returns summary of sync operation.

    Args:
        user_id: Authenticated user ID from JWT

    Returns:
        Sync summary with added, updated, removed, and total counts
    """
    if not Config.is_discogs_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Discogs integration is not configured",
        )

    user = _require_discogs_connected(user_id)
    service = get_collection_service()

    try:
        # Fetch from Discogs
        releases = service.fetch_discogs_collection(
            user["discogs_access_token"],
            user["discogs_access_token_secret"],
        )

        # Sync to database
        summary = service.sync_to_database(user_id, releases)

        return SyncSummary(**summary)

    except CollectionSyncError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        ) from e
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync collection: {e!s}",
        ) from e


@router.get("", response_model=PaginatedReleases)
def list_releases(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("artist_name", description="Sort field"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$", description="Sort order"),
    search: str | None = Query(None, description="Search in title and artist"),
    user_id: str = Depends(get_current_user_id),  # noqa: B008
):
    """List user's releases with pagination and sorting.

    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page (max 100)
        sort_by: Field to sort by
        sort_order: Sort direction (asc or desc)
        search: Optional search query for title/artist
        user_id: Authenticated user ID from JWT

    Returns:
        Paginated list of releases
    """
    supabase = get_supabase()

    # Calculate offset
    offset = (page - 1) * page_size

    # Build query (exclude discogs_metadata to keep list responses lean)
    release_list_columns = (
        "id, user_id, discogs_release_id, discogs_instance_id, "
        "title, artist_name, year, cover_image_url, format, "
        "genres, styles, labels, catalog_number, country, "
        "added_to_discogs_at, synced_at, created_at, updated_at"
    )
    query = (
        supabase.table("releases")
        .select(release_list_columns, count="exact")  # type: ignore[arg-type]
        .eq("user_id", user_id)
    )

    # Add search filter
    if search:
        query = query.or_(f"title.ilike.%{search}%,artist_name.ilike.%{search}%")

    # Add sorting
    query = query.order(sort_by, desc=(sort_order == "desc"))

    # Add pagination
    query = query.range(offset, offset + page_size - 1)

    try:
        response = query.execute()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch releases: {e!s}",
        ) from e

    total = response.count or 0
    items = cast(list[Row], response.data or [])

    return PaginatedReleases(
        items=items,  # type: ignore[arg-type]  # Pydantic coerces dicts to Release
        total=total,
        page=page,
        page_size=page_size,
        has_more=(offset + len(items)) < total,
    )


@router.get("/{release_id}", response_model=Release)
def get_release(
    release_id: str,
    user_id: str = Depends(get_current_user_id),  # noqa: B008
):
    """Get a single release by ID.

    Args:
        release_id: Release UUID
        user_id: Authenticated user ID from JWT

    Returns:
        Release data
    """
    supabase = get_supabase()

    try:
        response = (
            supabase.table("releases")
            .select("*")
            .eq("id", release_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
    except Exception as e:
        # single() raises an exception when no rows found
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release not found",
        ) from e

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release not found",
        )

    return cast(Row, response.data)


@router.get("/{release_id}/tracks", response_model=ReleaseTracksResponse)
def get_release_tracks(
    release_id: str,
    user_id: str = Depends(get_current_user_id),  # noqa: B008
):
    """Fetch tracks for a release from Discogs API.

    Tracks are fetched on-demand and not stored. Returns flat list
    with position codes (A1, B1, C1, D1) for multi-disc releases.

    Args:
        release_id: Release UUID
        user_id: Authenticated user ID from JWT

    Returns:
        Release track listing from Discogs
    """
    if not Config.is_discogs_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Discogs integration is not configured",
        )

    supabase = get_supabase()

    # Get release from database
    try:
        response = (
            supabase.table("releases")
            .select("*")
            .eq("id", release_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release not found",
        ) from e

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release not found",
        )

    release = cast(Row, response.data)

    # Get user's Discogs credentials
    user = _require_discogs_connected(user_id)

    # Fetch tracks from Discogs
    try:
        service = get_collection_service()
        client = service._create_authenticated_client(
            user["discogs_access_token"],
            user["discogs_access_token_secret"],
        )

        discogs_release = client.release(release["discogs_release_id"])

        tracks = []
        for track in discogs_release.tracklist:  # type: ignore[union-attr]
            # Get track-level artist name(s) if available
            if hasattr(track, "artists") and track.artists:
                artists = [a.name for a in track.artists]
            else:
                artists = [release["artist_name"]]

            tracks.append(
                {
                    "position": track.position,
                    "title": track.title,
                    "duration": track.duration if track.duration else None,
                    "artists": artists,
                }
            )

        # Extract full release data for metadata enrichment
        full_release_data = getattr(discogs_release, "data", None)

        # Persist enriched metadata to DB (fire-and-forget)
        if full_release_data and isinstance(full_release_data, dict):
            update_data: dict[str, Any] = {
                "discogs_metadata": full_release_data,
            }
            country = full_release_data.get("country")
            if country:
                update_data["country"] = country

            try:
                supabase.table("releases").update(update_data).eq(
                    "id", release["id"]
                ).eq("user_id", user_id).execute()
            except Exception:
                logger.warning(
                    "Failed to update discogs_metadata for release %s",
                    release["id"],
                )

        # Extract enriched metadata for response
        notes = None
        enriched_labels = None
        enriched_formats = None
        enriched_genres: list[str] = []
        enriched_styles: list[str] = []
        enriched_country = None

        if full_release_data and isinstance(full_release_data, dict):
            notes = full_release_data.get("notes")
            enriched_country = full_release_data.get("country")
            enriched_genres = full_release_data.get("genres", [])
            enriched_styles = full_release_data.get("styles", [])

            raw_labels = full_release_data.get("labels", [])
            if raw_labels:
                enriched_labels = [
                    {
                        "name": lbl.get("name", ""),
                        "catno": lbl.get("catno", ""),
                        "entity_type_name": lbl.get("entity_type_name", ""),
                    }
                    for lbl in raw_labels
                ]

            raw_formats = full_release_data.get("formats", [])
            if raw_formats:
                enriched_formats = [
                    {
                        "name": fmt.get("name", ""),
                        "qty": fmt.get("qty", "1"),
                        "descriptions": fmt.get("descriptions", []),
                    }
                    for fmt in raw_formats
                ]

        return ReleaseTracksResponse(
            release_id=release["id"],
            discogs_release_id=release["discogs_release_id"],
            title=release["title"],
            artist_name=release["artist_name"],
            tracks=tracks,
            notes=notes,
            country=enriched_country,
            genres=enriched_genres,
            styles=enriched_styles,
            labels=enriched_labels,
            formats=enriched_formats,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch tracks from Discogs: {e!s}",
        ) from e

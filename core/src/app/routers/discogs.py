"""Discogs OAuth 1.0a, search, and collection management endpoints."""

import logging
from datetime import UTC, datetime
from typing import Any, cast

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import (
    Row,
    get_current_user_id,
    require_discogs_configured,
    require_discogs_connected,
)
from app.models import (
    CollectionAddResponse,
    CollectionRemoveResponse,
    DiscogsAuthorizeResponse,
    DiscogsCallbackRequest,
    DiscogsReleaseDetail,
    DiscogsSearchResponse,
    User,
)
from app.services.collection import get_collection_service
from app.services.discogs import DiscogsOAuthError, get_discogs_service
from app.services.discogs_search import get_discogs_search_service
from app.supabase import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter()


# =============================================
# OAuth Endpoints
# =============================================


@router.post("/authorize", response_model=DiscogsAuthorizeResponse)
def discogs_authorize(
    callback_url: str = Query(
        ...,
        description="Frontend callback URL to redirect after Discogs authorization",
    ),
    user_id: str = Depends(get_current_user_id),  # noqa: B008
):
    """Initiate Discogs OAuth 1.0a authorization flow.

    Returns an authorization URL and encrypted state. The frontend should:
    1. Store the state parameter in sessionStorage
    2. Redirect the user to the authorization_url
    3. After user authorizes, Discogs redirects to callback_url with oauth_verifier
    4. Frontend calls /api/discogs/callback with oauth_verifier and state

    Args:
        callback_url: Frontend URL that Discogs will redirect to
        user_id: Authenticated user ID from JWT

    Returns:
        Authorization URL and encrypted state
    """
    require_discogs_configured()

    try:
        service = get_discogs_service()
        authorization_url, state = service.get_authorize_url(callback_url)

        return DiscogsAuthorizeResponse(
            authorization_url=authorization_url,
            state=state,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate Discogs authorization: {e!s}",
        ) from e


@router.post("/callback", response_model=User)
def discogs_callback(
    request: DiscogsCallbackRequest,
    user_id: str = Depends(get_current_user_id),  # noqa: B008
):
    """Complete Discogs OAuth 1.0a authorization flow.

    Exchanges the OAuth verifier for access tokens and stores them
    in the database along with the Discogs username.

    Args:
        request: OAuth verifier and encrypted state from authorization
        user_id: Authenticated user ID from JWT

    Returns:
        Updated user profile with Discogs connection info
    """
    require_discogs_configured()

    service = get_discogs_service()
    supabase = get_supabase()

    try:
        # Exchange verifier for access tokens
        access_token, access_token_secret = service.exchange_tokens(
            request.oauth_verifier,
            request.state,
        )

        # Get Discogs username
        discogs_username = service.get_user_identity(
            access_token,
            access_token_secret,
        )

        # Store tokens and username in database
        response = (
            supabase.table("users")
            .update(
                {
                    "discogs_username": discogs_username,
                    "discogs_access_token": access_token,
                    "discogs_access_token_secret": access_token_secret,
                    "discogs_connected_at": datetime.now(UTC).isoformat(),
                }
            )
            .eq("id", user_id)
            .execute()
        )

        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        return response.data[0]

    except DiscogsOAuthError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete Discogs authorization: {e!s}",
        ) from e


@router.delete("/disconnect", response_model=User)
def discogs_disconnect(
    user_id: str = Depends(get_current_user_id),  # noqa: B008
):
    """Disconnect Discogs account.

    Removes stored OAuth tokens and Discogs username from the database.

    Args:
        user_id: Authenticated user ID from JWT

    Returns:
        Updated user profile with Discogs fields cleared
    """
    supabase = get_supabase()

    try:
        response = (
            supabase.table("users")
            .update(
                {
                    "discogs_username": None,
                    "discogs_access_token": None,
                    "discogs_access_token_secret": None,
                    "discogs_connected_at": None,
                }
            )
            .eq("id", user_id)
            .execute()
        )

        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to disconnect Discogs: {e!s}",
        ) from e


# =============================================
# Search & Release Detail Endpoints
# =============================================


@router.get("/search", response_model=DiscogsSearchResponse)
def search_discogs(
    q: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=50, description="Results per page"),
    user_id: str = Depends(get_current_user_id),  # noqa: B008
):
    """Search Discogs for releases.

    Args:
        q: Search query string
        page: Page number (1-indexed)
        per_page: Results per page (max 50)
        user_id: Authenticated user ID from JWT

    Returns:
        Search results with pagination
    """
    require_discogs_configured()
    user = require_discogs_connected(user_id)

    try:
        service = get_discogs_search_service()
        return service.search_releases(
            user["discogs_access_token"],
            user["discogs_access_token_secret"],
            q,
            page,
            per_page,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to search Discogs: {e!s}",
        ) from e


@router.get("/releases/{discogs_release_id}", response_model=DiscogsReleaseDetail)
def get_discogs_release(
    discogs_release_id: int,
    user_id: str = Depends(get_current_user_id),  # noqa: B008
):
    """Fetch release detail from Discogs API (cached).

    Also checks whether the release is in the user's local collection
    and sets in_collection, collection_release_id, and discogs_instance_id.

    Args:
        discogs_release_id: Discogs release ID
        user_id: Authenticated user ID from JWT

    Returns:
        Full release detail with collection membership info
    """
    require_discogs_configured()
    user = require_discogs_connected(user_id)

    try:
        service = get_discogs_search_service()
        detail = service.get_release_detail(
            user["discogs_access_token"],
            user["discogs_access_token_secret"],
            discogs_release_id,
        )

        # Check if user has this in their local collection
        supabase = get_supabase()
        response = (
            supabase.table("releases")
            .select("id, discogs_instance_id")
            .eq("user_id", user_id)
            .eq("discogs_release_id", discogs_release_id)
            .execute()
        )

        rows = cast(list[Row], response.data or [])
        if rows:
            detail["in_collection"] = True
            detail["collection_release_id"] = rows[0]["id"]
            detail["discogs_instance_id"] = rows[0]["discogs_instance_id"]

        return detail

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch release from Discogs: {e!s}",
        ) from e


# =============================================
# Collection Add/Remove Endpoints
# =============================================


@router.post(
    "/releases/{discogs_release_id}/collect",
    response_model=CollectionAddResponse,
)
def add_to_collection(
    discogs_release_id: int,
    user_id: str = Depends(get_current_user_id),  # noqa: B008
):
    """Add release to user's Discogs collection AND local DB.

    Args:
        discogs_release_id: Discogs release ID
        user_id: Authenticated user ID from JWT

    Returns:
        Local release ID, Discogs release ID, and instance ID
    """
    require_discogs_configured()
    user = require_discogs_connected(user_id)

    try:
        # Add to Discogs collection (folder 0 = "All")
        collection_service = get_collection_service()
        client = collection_service._create_authenticated_client(
            user["discogs_access_token"],
            user["discogs_access_token_secret"],
        )
        me = client.identity()
        discogs_release = client.release(discogs_release_id)
        instance = me.collection_folders[0].add_release(discogs_release)
        if instance is None:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Discogs did not return an instance for the added release",
            )

        # Fetch full release detail for local storage
        search_service = get_discogs_search_service()
        detail = search_service.get_release_detail(
            user["discogs_access_token"],
            user["discogs_access_token_secret"],
            discogs_release_id,
        )

        # Build labels list (just names for the releases table)
        label_names = [
            lbl["name"] for lbl in (detail.get("labels") or []) if lbl.get("name")
        ]
        catalog_number = None
        if detail.get("labels"):
            catno = detail["labels"][0].get("catno")
            catalog_number = catno if catno and catno != "none" else None

        # Upsert to local releases table
        supabase = get_supabase()
        release_data: dict[str, Any] = {
            "user_id": user_id,
            "discogs_release_id": discogs_release_id,
            "discogs_instance_id": instance.id,
            "title": detail["title"],
            "artist_name": detail["artist_name"],
            "year": detail.get("year"),
            "cover_image_url": detail.get("cover_image_url"),
            "format": detail.get("format_string"),
            "genres": detail.get("genres", []),
            "styles": detail.get("styles", []),
            "labels": label_names,
            "catalog_number": catalog_number,
            "country": detail.get("country"),
            "synced_at": datetime.now(UTC).isoformat(),
        }

        result = (
            supabase.table("releases")
            .upsert(
                release_data,
                on_conflict="user_id,discogs_instance_id",
            )
            .execute()
        )

        rows = cast(list[Row], result.data or [])
        local_release = rows[0]

        return CollectionAddResponse(
            release_id=local_release["id"],
            discogs_release_id=discogs_release_id,
            discogs_instance_id=instance.id,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to add release to collection: {e!s}",
        ) from e


@router.delete(
    "/releases/{discogs_release_id}/collect",
    response_model=CollectionRemoveResponse,
)
def remove_from_collection(
    discogs_release_id: int,
    user_id: str = Depends(get_current_user_id),  # noqa: B008
):
    """Remove release from user's Discogs collection AND local DB.

    Args:
        discogs_release_id: Discogs release ID
        user_id: Authenticated user ID from JWT

    Returns:
        Confirmation with Discogs release ID
    """
    require_discogs_configured()
    user = require_discogs_connected(user_id)

    supabase = get_supabase()

    # Get local release to find instance_id
    try:
        response = (
            supabase.table("releases")
            .select("id, discogs_instance_id")
            .eq("user_id", user_id)
            .eq("discogs_release_id", discogs_release_id)
            .single()
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release not in collection",
        ) from e

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release not in collection",
        )

    release = cast(Row, response.data)
    instance_id = release["discogs_instance_id"]
    local_id = release["id"]

    try:
        # Remove from Discogs collection
        collection_service = get_collection_service()
        client = collection_service._create_authenticated_client(
            user["discogs_access_token"],
            user["discogs_access_token_secret"],
        )
        me = client.identity()
        me.collection_folders[0].remove_release(instance_id)

        # Delete from local DB
        supabase.table("releases").delete().eq("id", local_id).execute()

        return CollectionRemoveResponse(discogs_release_id=discogs_release_id)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to remove release from collection: {e!s}",
        ) from e

"""Discogs OAuth 1.0a endpoints."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.config import Config
from app.dependencies import get_current_user_id
from app.models import DiscogsAuthorizeResponse, DiscogsCallbackRequest, User
from app.services.discogs import DiscogsOAuthError, get_discogs_service
from app.supabase import get_supabase

router = APIRouter()


def _require_discogs_configured() -> None:
    """Raise HTTPException if Discogs is not configured."""
    if not Config.is_discogs_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Discogs integration is not configured",
        )


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
    _require_discogs_configured()

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
    _require_discogs_configured()

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

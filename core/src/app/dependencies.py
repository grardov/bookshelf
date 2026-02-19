from typing import Any, cast

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Config
from app.supabase import get_supabase

security = HTTPBearer()

# Type alias for Supabase row data
Row = dict[str, Any]


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),  # noqa: B008
) -> str:
    """Extract and validate user ID from JWT token.

    Args:
        credentials: HTTP Bearer token from Authorization header

    Returns:
        User ID extracted from validated JWT token

    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    supabase = get_supabase()

    try:
        # Validate JWT and get user
        response = supabase.auth.get_user(token)

        if not response or not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return response.user.id

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Catch any other errors (invalid token format, etc.)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


def require_discogs_configured() -> None:
    """Raise HTTPException if Discogs is not configured."""
    if not Config.is_discogs_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Discogs integration is not configured",
        )


def require_discogs_connected(user_id: str) -> Row:
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

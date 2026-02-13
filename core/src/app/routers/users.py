from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user_id
from app.models import UpdateProfile, User
from app.supabase import get_supabase

router = APIRouter()


@router.get("/me", response_model=User)
async def get_current_user(user_id: str = Depends(get_current_user_id)):
    """Get current user profile.

    Args:
        user_id: User ID extracted from JWT token

    Returns:
        User profile data

    Raises:
        HTTPException: If user not found
    """
    supabase = get_supabase()

    try:
        response = (
            supabase.table("users").select("*").eq("id", user_id).single().execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        return response.data

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user profile: {str(e)}",
        ) from e


@router.patch("/me", response_model=User)
async def update_current_user(
    update: UpdateProfile,
    user_id: str = Depends(get_current_user_id),
):
    """Update current user's display name.

    Args:
        update: Profile update data (display_name)
        user_id: User ID extracted from JWT token

    Returns:
        Updated user profile data

    Raises:
        HTTPException: If update fails or user not found
    """
    supabase = get_supabase()

    try:
        response = (
            supabase.table("users")
            .update({"display_name": update.display_name})
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
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user profile: {str(e)}",
        ) from e

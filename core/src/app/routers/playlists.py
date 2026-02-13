"""Playlists API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import get_current_user_id
from app.models import (
    AddTrackRequest,
    CreatePlaylist,
    PaginatedPlaylists,
    Playlist,
    PlaylistTrack,
    PlaylistWithTracks,
    ReorderTracksRequest,
    UpdatePlaylist,
)
from app.services.playlists import get_playlist_service

router = APIRouter()


@router.post("", response_model=Playlist, status_code=status.HTTP_201_CREATED)
def create_playlist(
    data: CreatePlaylist,
    user_id: str = Depends(get_current_user_id),  # noqa: B008
):
    """Create a new playlist.

    Args:
        data: Playlist data
        user_id: Authenticated user ID from JWT

    Returns:
        Created playlist
    """
    service = get_playlist_service()

    try:
        playlist = service.create_playlist(user_id, data.model_dump())
        return playlist
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create playlist: {e!s}",
        ) from e


@router.get("", response_model=PaginatedPlaylists)
def list_playlists(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    user_id: str = Depends(get_current_user_id),  # noqa: B008
):
    """List user's playlists with pagination.

    Args:
        page: Page number (1-indexed)
        page_size: Items per page
        user_id: Authenticated user ID from JWT

    Returns:
        Paginated playlists
    """
    service = get_playlist_service()

    playlists, total = service.list_playlists(user_id, page, page_size)

    offset = (page - 1) * page_size
    has_more = (offset + len(playlists)) < total

    return PaginatedPlaylists(
        items=playlists,
        total=total,
        page=page,
        page_size=page_size,
        has_more=has_more,
    )


@router.get("/{playlist_id}", response_model=PlaylistWithTracks)
def get_playlist(
    playlist_id: str,
    user_id: str = Depends(get_current_user_id),  # noqa: B008
):
    """Get playlist with all tracks.

    Args:
        playlist_id: Playlist UUID
        user_id: Authenticated user ID from JWT

    Returns:
        Playlist with tracks
    """
    service = get_playlist_service()

    playlist = service.get_playlist_with_tracks(playlist_id, user_id)

    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist not found",
        )

    return playlist


@router.patch("/{playlist_id}", response_model=Playlist)
def update_playlist(
    playlist_id: str,
    data: UpdatePlaylist,
    user_id: str = Depends(get_current_user_id),  # noqa: B008
):
    """Update playlist details.

    Args:
        playlist_id: Playlist UUID
        data: Update data
        user_id: Authenticated user ID from JWT

    Returns:
        Updated playlist
    """
    service = get_playlist_service()

    playlist = service.update_playlist(playlist_id, user_id, data.model_dump())

    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist not found",
        )

    return playlist


@router.delete("/{playlist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_playlist(
    playlist_id: str,
    user_id: str = Depends(get_current_user_id),  # noqa: B008
):
    """Delete playlist.

    Args:
        playlist_id: Playlist UUID
        user_id: Authenticated user ID from JWT
    """
    service = get_playlist_service()

    deleted = service.delete_playlist(playlist_id, user_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist not found",
        )


@router.post(
    "/{playlist_id}/tracks",
    response_model=PlaylistTrack,
    status_code=status.HTTP_201_CREATED,
)
def add_track_to_playlist(
    playlist_id: str,
    data: AddTrackRequest,
    user_id: str = Depends(get_current_user_id),  # noqa: B008
):
    """Add a track to playlist.

    Args:
        playlist_id: Playlist UUID
        data: Track data
        user_id: Authenticated user ID from JWT

    Returns:
        Created track
    """
    service = get_playlist_service()

    try:
        track = service.add_track(playlist_id, user_id, data.model_dump())
        return track
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add track: {e!s}",
        ) from e


@router.delete(
    "/{playlist_id}/tracks/{track_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_track_from_playlist(
    playlist_id: str,
    track_id: str,
    user_id: str = Depends(get_current_user_id),  # noqa: B008
):
    """Remove track from playlist.

    Args:
        playlist_id: Playlist UUID
        track_id: Track UUID
        user_id: Authenticated user ID from JWT
    """
    service = get_playlist_service()

    try:
        removed = service.remove_track(playlist_id, track_id, user_id)

        if not removed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Track not found",
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.patch("/{playlist_id}/tracks/reorder", response_model=list[PlaylistTrack])
def reorder_playlist_tracks(
    playlist_id: str,
    data: ReorderTracksRequest,
    user_id: str = Depends(get_current_user_id),  # noqa: B008
):
    """Reorder tracks in playlist.

    Args:
        playlist_id: Playlist UUID
        data: Track IDs in new order
        user_id: Authenticated user ID from JWT

    Returns:
        Updated tracks list
    """
    service = get_playlist_service()

    try:
        tracks = service.reorder_tracks(playlist_id, user_id, data.track_ids)
        return tracks
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

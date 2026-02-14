"""Playlist service for CRUD operations."""

import logging

from app.supabase import get_supabase

logger = logging.getLogger(__name__)


class PlaylistService:
    """Service for playlist operations."""

    def create_playlist(self, user_id: str, data: dict) -> dict:
        """Create a new playlist.

        Args:
            user_id: User ID
            data: Playlist data (name, description, tags)

        Returns:
            Created playlist dict
        """
        supabase = get_supabase()

        playlist_data = {
            "user_id": user_id,
            "name": data["name"],
            "description": data.get("description"),
            "tags": data.get("tags", []),
        }

        response = supabase.table("playlists").insert(playlist_data).execute()
        playlist = response.data[0]
        playlist["track_count"] = 0
        return playlist

    def get_playlist(self, playlist_id: str, user_id: str) -> dict | None:
        """Get playlist by ID (with ownership check).

        Args:
            playlist_id: Playlist UUID
            user_id: User ID for ownership check

        Returns:
            Playlist dict or None if not found
        """
        supabase = get_supabase()

        try:
            response = (
                supabase.table("playlists")
                .select("*")
                .eq("id", playlist_id)
                .eq("user_id", user_id)
                .single()
                .execute()
            )
            return response.data
        except Exception:
            return None

    def get_playlist_with_tracks(self, playlist_id: str, user_id: str) -> dict | None:
        """Get playlist with all tracks.

        Args:
            playlist_id: Playlist UUID
            user_id: User ID for ownership check

        Returns:
            Playlist dict with tracks or None if not found
        """
        playlist = self.get_playlist(playlist_id, user_id)
        if not playlist:
            return None

        supabase = get_supabase()

        # Fetch tracks ordered by track_order
        tracks_response = (
            supabase.table("playlist_tracks")
            .select("*")
            .eq("playlist_id", playlist_id)
            .order("track_order", desc=False)
            .execute()
        )

        tracks = tracks_response.data or []

        # Calculate total duration
        total_seconds = 0
        for track in tracks:
            if track.get("duration"):
                parts = track["duration"].split(":")
                if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
                    total_seconds += int(parts[0]) * 60 + int(parts[1])

        total_duration = None
        if total_seconds > 0:
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            total_duration = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"

        playlist["tracks"] = tracks
        playlist["track_count"] = len(tracks)
        playlist["total_duration"] = total_duration

        return playlist

    def list_playlists(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[dict], int]:
        """List user's playlists with pagination.

        Args:
            user_id: User ID
            page: Page number (1-indexed)
            page_size: Items per page

        Returns:
            Tuple of (playlists list, total count)
        """
        supabase = get_supabase()

        offset = (page - 1) * page_size

        # Get playlists
        response = (
            supabase.table("playlists")
            .select("*", count="exact")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .range(offset, offset + page_size - 1)
            .execute()
        )

        playlists = response.data or []
        total = response.count or 0

        # Add track counts to each playlist
        for playlist in playlists:
            count_response = (
                supabase.table("playlist_tracks")
                .select("id", count="exact")
                .eq("playlist_id", playlist["id"])
                .execute()
            )
            playlist["track_count"] = count_response.count or 0

        return playlists, total

    def update_playlist(
        self,
        playlist_id: str,
        user_id: str,
        data: dict,
    ) -> dict | None:
        """Update playlist.

        Args:
            playlist_id: Playlist UUID
            user_id: User ID for ownership check
            data: Update data

        Returns:
            Updated playlist dict or None if not found
        """
        supabase = get_supabase()

        # Filter out None values
        update_data = {k: v for k, v in data.items() if v is not None}

        if not update_data:
            return self.get_playlist(playlist_id, user_id)

        response = (
            supabase.table("playlists")
            .update(update_data)
            .eq("id", playlist_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not response.data:
            return None

        playlist = response.data[0]
        # Add track count
        count_response = (
            supabase.table("playlist_tracks")
            .select("id", count="exact")
            .eq("playlist_id", playlist_id)
            .execute()
        )
        playlist["track_count"] = count_response.count or 0

        return playlist

    def delete_playlist(self, playlist_id: str, user_id: str) -> bool:
        """Delete playlist (cascade deletes tracks).

        Args:
            playlist_id: Playlist UUID
            user_id: User ID for ownership check

        Returns:
            True if deleted, False if not found
        """
        supabase = get_supabase()

        response = (
            supabase.table("playlists")
            .delete()
            .eq("id", playlist_id)
            .eq("user_id", user_id)
            .execute()
        )

        return len(response.data) > 0

    def add_track(self, playlist_id: str, user_id: str, track_data: dict) -> dict:
        """Add track to playlist.

        Args:
            playlist_id: Playlist UUID
            user_id: User ID for ownership check
            track_data: Track data

        Returns:
            Created track dict

        Raises:
            ValueError: If playlist not found
        """
        # Verify ownership
        playlist = self.get_playlist(playlist_id, user_id)
        if not playlist:
            raise ValueError("Playlist not found")

        supabase = get_supabase()

        # Get next track_order
        order_response = (
            supabase.table("playlist_tracks")
            .select("track_order")
            .eq("playlist_id", playlist_id)
            .order("track_order", desc=True)
            .limit(1)
            .execute()
        )

        next_order = 1
        if order_response.data:
            next_order = order_response.data[0]["track_order"] + 1

        insert_data = {
            "playlist_id": playlist_id,
            "release_id": track_data["release_id"],
            "discogs_release_id": track_data["discogs_release_id"],
            "position": track_data["position"],
            "title": track_data["title"],
            "artist": track_data["artist"],
            "duration": track_data.get("duration"),
            "cover_image_url": track_data.get("cover_image_url"),
            "track_order": next_order,
        }

        response = supabase.table("playlist_tracks").insert(insert_data).execute()
        return response.data[0]

    def remove_track(self, playlist_id: str, track_id: str, user_id: str) -> bool:
        """Remove track from playlist.

        Args:
            playlist_id: Playlist UUID
            track_id: Track UUID
            user_id: User ID for ownership check

        Returns:
            True if removed, False if not found

        Raises:
            ValueError: If playlist not found
        """
        # Verify ownership
        playlist = self.get_playlist(playlist_id, user_id)
        if not playlist:
            raise ValueError("Playlist not found")

        supabase = get_supabase()

        response = (
            supabase.table("playlist_tracks")
            .delete()
            .eq("id", track_id)
            .eq("playlist_id", playlist_id)
            .execute()
        )

        return response.data is not None

    def reorder_tracks(
        self,
        playlist_id: str,
        user_id: str,
        track_ids: list[str],
    ) -> list[dict]:
        """Reorder tracks in playlist.

        Args:
            playlist_id: Playlist UUID
            user_id: User ID for ownership check
            track_ids: Track IDs in new order

        Returns:
            Updated tracks list

        Raises:
            ValueError: If playlist not found
        """
        # Verify ownership
        playlist = self.get_playlist(playlist_id, user_id)
        if not playlist:
            raise ValueError("Playlist not found")

        supabase = get_supabase()

        # Update track_order for each track
        for index, track_id in enumerate(track_ids):
            supabase.table("playlist_tracks").update({"track_order": index + 1}).eq(
                "id", track_id
            ).eq("playlist_id", playlist_id).execute()

        # Return updated tracks
        response = (
            supabase.table("playlist_tracks")
            .select("*")
            .eq("playlist_id", playlist_id)
            .order("track_order", desc=False)
            .execute()
        )

        return response.data or []


# Singleton instance
_playlist_service: PlaylistService | None = None


def get_playlist_service() -> PlaylistService:
    """Get or create PlaylistService singleton."""
    global _playlist_service
    if _playlist_service is None:
        _playlist_service = PlaylistService()
    return _playlist_service

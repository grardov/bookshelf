"""Collection sync service for Discogs integration."""

import logging
from datetime import UTC, datetime
from typing import Any, cast

import discogs_client

from app.config import Config
from app.supabase import get_supabase

logger = logging.getLogger(__name__)


class CollectionSyncError(Exception):
    """Custom exception for collection sync errors."""

    pass


class CollectionService:
    """Service for syncing Discogs collection."""

    def __init__(self) -> None:
        self.user_agent = Config.DISCOGS_USER_AGENT
        self.consumer_key = Config.DISCOGS_CONSUMER_KEY
        self.consumer_secret = Config.DISCOGS_CONSUMER_SECRET

    def _create_authenticated_client(
        self,
        access_token: str,
        access_token_secret: str,
    ) -> discogs_client.Client:
        """Create an authenticated Discogs client."""
        client = discogs_client.Client(
            self.user_agent,
            consumer_key=self.consumer_key,
            consumer_secret=self.consumer_secret,
            token=access_token,
            secret=access_token_secret,
        )
        return client

    def _extract_release_data(self, item: Any) -> dict | None:
        """Extract relevant fields from a Discogs collection item.

        Tries to use basic_information from item.data (already in collection response)
        to avoid extra API calls. Falls back to item.release if needed.

        Args:
            item: A Discogs collection item

        Returns:
            Dictionary with release data, or None if extraction fails
        """
        # Try to get basic_information from raw data (avoids extra API calls)
        info = None
        if hasattr(item, "data") and isinstance(item.data, dict):
            info = item.data.get("basic_information")

        if info:
            # Use basic_information - no extra API calls needed
            return self._extract_from_basic_info(item, info)

        # Fallback: try to use item.release (may trigger API call)
        try:
            release = item.release
            return self._extract_from_release(item, release)
        except Exception as e:
            logger.warning(
                "Failed to fetch release details for instance %s: %s",
                getattr(item, "id", "unknown"),
                e,
            )
            return None

    def _extract_from_basic_info(self, item: Any, info: dict) -> dict:
        """Extract release data from basic_information dict."""
        # Get primary artist name(s)
        artists = info.get("artists", [])
        artist_names = [a.get("name", "") for a in artists if a.get("name")]
        artist_name = ", ".join(artist_names) if artist_names else "Unknown Artist"

        # Get cover image (use cover_image, fallback to thumb)
        cover_url = info.get("cover_image") or info.get("thumb")

        # Get format string (e.g., "2xLP, Album")
        format_str = self._extract_format_string(info.get("formats", []))

        # Get genres and styles
        genres = info.get("genres", []) or []
        styles = info.get("styles", []) or []

        # Get label names and catalog number
        labels_data = info.get("labels", [])
        labels = [label.get("name", "") for label in labels_data if label.get("name")]
        catalog_number = None
        if labels_data:
            catno = labels_data[0].get("catno")
            catalog_number = catno if catno else None

        # Get year (ensure it's valid)
        year = info.get("year")
        if not year or year <= 0:
            year = None

        # Get date added to collection
        added_at = None
        if hasattr(item, "date_added") and item.date_added:
            added_at = item.date_added.isoformat()

        return {
            "discogs_release_id": info.get("id"),
            "discogs_instance_id": item.id,
            "title": info.get("title", "Unknown Title"),
            "artist_name": artist_name,
            "year": year,
            "cover_image_url": cover_url,
            "format": format_str,
            "genres": genres,
            "styles": styles,
            "labels": labels,
            "catalog_number": catalog_number,
            "country": None,  # Not available in basic_information
            "discogs_metadata": info,
            "added_to_discogs_at": added_at,
            "synced_at": datetime.now(UTC).isoformat(),
        }

    def _extract_from_release(self, item: Any, release: Any) -> dict:
        """Extract release data from a Release object (fallback method)."""
        # Get primary artist name(s)
        artists = []
        if hasattr(release, "artists") and release.artists:
            artists = [a.name for a in release.artists]
        artist_name = ", ".join(artists) if artists else "Unknown Artist"

        # Get cover image
        cover_url = None
        if hasattr(release, "images") and release.images:
            primary = next(
                (img for img in release.images if img.get("type") == "primary"),
                None,
            )
            cover_url = primary["uri"] if primary else release.images[0].get("uri")

        # Get format string
        format_str = None
        if hasattr(release, "formats") and release.formats:
            format_str = self._extract_format_string(release.formats)

        # Get genres and styles
        has_genres = hasattr(release, "genres") and release.genres
        has_styles = hasattr(release, "styles") and release.styles
        genres = list(release.genres) if has_genres else []
        styles = list(release.styles) if has_styles else []

        # Get label names
        labels = []
        catalog_number = None
        if hasattr(release, "labels") and release.labels:
            labels = [label.name for label in release.labels]
            catno = release.labels[0].catno if release.labels else None
            catalog_number = catno if catno else None

        # Get country and year
        country = release.country if hasattr(release, "country") else None
        year = None
        if hasattr(release, "year") and release.year and release.year > 0:
            year = release.year

        # Get date added to collection
        added_at = None
        if hasattr(item, "date_added") and item.date_added:
            added_at = item.date_added.isoformat()

        return {
            "discogs_release_id": release.id,
            "discogs_instance_id": item.id,
            "title": release.title,
            "artist_name": artist_name,
            "year": year,
            "cover_image_url": cover_url,
            "format": format_str,
            "genres": genres,
            "styles": styles,
            "labels": labels,
            "catalog_number": catalog_number,
            "country": country,
            "discogs_metadata": getattr(release, "data", None),
            "added_to_discogs_at": added_at,
            "synced_at": datetime.now(UTC).isoformat(),
        }

    def _extract_format_string(self, formats: list) -> str | None:
        """Extract format string from formats list."""
        if not formats:
            return None

        format_parts = []
        for fmt in formats:
            if isinstance(fmt, dict):
                qty = fmt.get("qty", "1")
                name = fmt.get("name", "")
            else:
                # Handle object-style format (from Release object)
                qty = getattr(fmt, "qty", "1") if hasattr(fmt, "qty") else "1"
                name = getattr(fmt, "name", "") if hasattr(fmt, "name") else ""

            if qty and int(qty) > 1:
                format_parts.append(f"{qty}x{name}")
            else:
                format_parts.append(name)

        return ", ".join(format_parts) if format_parts else None

    def fetch_discogs_collection(
        self,
        access_token: str,
        access_token_secret: str,
    ) -> list[dict]:
        """Fetch all releases from user's Discogs collection.

        Args:
            access_token: OAuth access token
            access_token_secret: OAuth access token secret

        Returns:
            List of release data dictionaries

        Raises:
            CollectionSyncError: If fetching fails
        """
        try:
            client = self._create_authenticated_client(
                access_token, access_token_secret
            )
            identity = client.identity()

            # Get all releases from "All" folder (folder 0)
            collection = identity.collection_folders[0].releases

            releases = []
            skipped = 0
            for item in collection:
                try:
                    release_data = self._extract_release_data(item)
                    if release_data:
                        releases.append(release_data)
                    else:
                        skipped += 1
                except Exception as e:
                    # Log but continue - don't fail entire sync for one bad release
                    logger.warning(
                        "Failed to extract release %s: %s",
                        getattr(item, "id", "unknown"),
                        e,
                    )
                    skipped += 1
                    continue

            if skipped > 0:
                logger.info("Skipped %d releases due to extraction errors", skipped)

            return releases

        except Exception as e:
            raise CollectionSyncError(f"Failed to fetch Discogs collection: {e}") from e

    def sync_to_database(
        self,
        user_id: str,
        releases: list[dict],
    ) -> dict:
        """Sync releases to database with upsert and cleanup.

        Args:
            user_id: User ID to sync releases for
            releases: List of release data from Discogs

        Returns:
            Summary dict with added, updated, removed, total counts
        """
        supabase = get_supabase()
        now = datetime.now(UTC).isoformat()

        # Get current release instance IDs for this user
        existing_response = (
            supabase.table("releases")
            .select("id, discogs_instance_id")
            .eq("user_id", user_id)
            .execute()
        )
        rows = cast(list[dict[str, Any]], existing_response.data or [])
        existing_map = {r["discogs_instance_id"]: r["id"] for r in rows}
        existing_instance_ids = set(existing_map.keys())

        # Track new instance IDs from Discogs
        new_instance_ids = {r["discogs_instance_id"] for r in releases}

        # Determine what to remove
        to_remove = existing_instance_ids - new_instance_ids

        added = 0
        updated = 0

        # Upsert releases in batches
        batch_size = 50
        for i in range(0, len(releases), batch_size):
            batch = releases[i : i + batch_size]

            for release_data in batch:
                release_data["user_id"] = user_id
                release_data["updated_at"] = now

                instance_id = release_data["discogs_instance_id"]
                is_new = instance_id not in existing_instance_ids

                # Upsert using discogs_instance_id + user_id as conflict key
                supabase.table("releases").upsert(
                    release_data,
                    on_conflict="user_id,discogs_instance_id",
                ).execute()

                if is_new:
                    added += 1
                else:
                    updated += 1

        # Remove releases no longer in Discogs collection
        removed = 0
        if to_remove:
            ids_to_delete = [existing_map[iid] for iid in to_remove]
            for release_id in ids_to_delete:
                supabase.table("releases").delete().eq("id", release_id).execute()
                removed += 1

        return {
            "added": added,
            "updated": updated,
            "removed": removed,
            "total": len(releases),
        }


# Singleton instance
_collection_service: CollectionService | None = None


def get_collection_service() -> CollectionService:
    """Get or create CollectionService singleton."""
    global _collection_service
    if _collection_service is None:
        _collection_service = CollectionService()
    return _collection_service

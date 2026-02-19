"""Discogs search and release detail service with caching."""

import logging
from typing import Any

import discogs_client
from cachetools import TTLCache

from app.config import Config

logger = logging.getLogger(__name__)


class DiscogsSearchService:
    """Service for searching Discogs and fetching release details with caching."""

    def __init__(self) -> None:
        self.user_agent = Config.DISCOGS_USER_AGENT
        self.consumer_key = Config.DISCOGS_CONSUMER_KEY
        self.consumer_secret = Config.DISCOGS_CONSUMER_SECRET
        # Search results cached for 1 hour
        self._search_cache: TTLCache = TTLCache(maxsize=500, ttl=3600)
        # Release details cached for 24 hours
        self._release_cache: TTLCache = TTLCache(maxsize=1000, ttl=86400)

    def _create_authenticated_client(
        self,
        access_token: str,
        access_token_secret: str,
    ) -> discogs_client.Client:
        """Create an authenticated Discogs client."""
        return discogs_client.Client(
            self.user_agent,
            consumer_key=self.consumer_key,
            consumer_secret=self.consumer_secret,
            token=access_token,
            secret=access_token_secret,
        )

    def search_releases(
        self,
        access_token: str,
        access_token_secret: str,
        query: str,
        page: int = 1,
        per_page: int = 10,
    ) -> dict[str, Any]:
        """Search Discogs for releases.

        Args:
            access_token: OAuth access token
            access_token_secret: OAuth access token secret
            query: Search query string
            page: Page number (1-indexed)
            per_page: Results per page

        Returns:
            Dict with 'results' list and 'pagination' info
        """
        cache_key = f"search:{query}:{page}:{per_page}"
        if cache_key in self._search_cache:
            return self._search_cache[cache_key]

        client = self._create_authenticated_client(access_token, access_token_secret)
        search_obj = client.search(query, type="release", per_page=per_page)

        # IMPORTANT: Do NOT iterate the search_obj directly — that pages through
        # ALL results and hangs. Use .page(n) to fetch a single page.
        page_items = search_obj.page(page)

        items = []
        for result in page_items:
            # Extract format description
            fmt = None
            if hasattr(result, "formats") and result.formats:
                descriptions = result.formats[0].get("descriptions", [])
                fmt = ", ".join(descriptions) if descriptions else None

            # Extract label name
            label = None
            if hasattr(result, "labels") and result.labels:
                label = result.labels[0].name

            item = {
                "id": result.id,
                "title": getattr(result, "title", ""),
                "year": getattr(result, "year", None),
                "cover_image": getattr(result, "cover_image", None)
                or getattr(result, "thumb", None),
                "format": fmt,
                "label": label,
                "country": getattr(result, "country", None),
                "type": "release",
            }
            items.append(item)

        response = {
            "results": items,
            "pagination": {
                "page": page,
                "pages": search_obj.pages,
                "per_page": per_page,
                "items": search_obj.count,
            },
        }

        self._search_cache[cache_key] = response
        return response

    def get_release_detail(
        self,
        access_token: str,
        access_token_secret: str,
        discogs_release_id: int,
    ) -> dict[str, Any]:
        """Fetch full release details from Discogs by ID.

        Args:
            access_token: OAuth access token
            access_token_secret: OAuth access token secret
            discogs_release_id: Discogs release ID

        Returns:
            Normalized dict with all metadata and tracklist.
            Cached for 24 hours.
        """
        cache_key = f"release:{discogs_release_id}"
        if cache_key in self._release_cache:
            return self._release_cache[cache_key]

        client = self._create_authenticated_client(access_token, access_token_secret)
        release = client.release(discogs_release_id)

        # Extract artists
        # NOTE: getattr returns Any, avoiding pyright errors with discogs_client's
        # SimpleField/ListField stubs that lack __iter__/__getitem__ definitions.
        artists = []
        raw_artists = getattr(release, "artists", None)
        if raw_artists:
            artists = [a.name for a in raw_artists]
        artist_name = ", ".join(artists) if artists else "Unknown Artist"

        # Extract cover image
        cover_url = None
        raw_images = getattr(release, "images", None)
        if raw_images:
            primary = next(
                (img for img in raw_images if img.get("type") == "primary"),
                None,
            )
            cover_url = primary["uri"] if primary else raw_images[0].get("uri")

        # Extract tracks
        tracks = []
        for track in getattr(release, "tracklist", []):
            track_artists = artists
            if hasattr(track, "artists") and track.artists:
                track_artists = [a.name for a in track.artists]
            tracks.append(
                {
                    "position": track.position,
                    "title": track.title,
                    "duration": track.duration if track.duration else None,
                    "artists": track_artists,
                }
            )

        # Extract full data dict
        full_data = getattr(release, "data", {}) or {}

        # Extract labels
        raw_labels = full_data.get("labels", [])
        labels = (
            [
                {
                    "name": lbl.get("name", ""),
                    "catno": lbl.get("catno", ""),
                    "entity_type_name": lbl.get("entity_type_name", ""),
                }
                for lbl in raw_labels
            ]
            if raw_labels
            else None
        )

        # Extract formats
        raw_formats = full_data.get("formats", [])
        formats = (
            [
                {
                    "name": fmt.get("name", ""),
                    "qty": fmt.get("qty", "1"),
                    "descriptions": fmt.get("descriptions", []),
                }
                for fmt in raw_formats
            ]
            if raw_formats
            else None
        )

        # Extract year
        year = None
        raw_year = getattr(release, "year", None)
        if raw_year and raw_year > 0:
            year = raw_year

        raw_genres = getattr(release, "genres", None)
        raw_styles = getattr(release, "styles", None)

        result = {
            "discogs_release_id": release.id,
            "title": release.title,
            "artist_name": artist_name,
            "year": year,
            "cover_image_url": cover_url,
            "country": getattr(release, "country", None),
            "genres": list(raw_genres) if raw_genres else [],
            "styles": list(raw_styles) if raw_styles else [],
            "notes": full_data.get("notes"),
            "tracks": tracks,
            "labels": labels,
            "formats": formats,
            "format_string": self._extract_format_string(raw_formats),
        }

        self._release_cache[cache_key] = result
        return result

    def _extract_format_string(self, formats: list) -> str | None:
        """Extract format string from formats list."""
        if not formats:
            return None

        parts = []
        for fmt in formats:
            qty = fmt.get("qty", "1") if isinstance(fmt, dict) else "1"
            name = fmt.get("name", "") if isinstance(fmt, dict) else ""
            if qty and int(qty) > 1:
                parts.append(f"{qty}x{name}")
            else:
                parts.append(name)

        return ", ".join(parts) if parts else None


# Singleton instance
_discogs_search_service: DiscogsSearchService | None = None


def get_discogs_search_service() -> DiscogsSearchService:
    """Get or create DiscogsSearchService singleton."""
    global _discogs_search_service
    if _discogs_search_service is None:
        _discogs_search_service = DiscogsSearchService()
    return _discogs_search_service

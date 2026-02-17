"""Tests for CollectionService business logic."""

from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest

from app.services.collection import CollectionService, CollectionSyncError


@pytest.fixture
def mock_config():
    """Patch Config for CollectionService."""
    with (
        patch("app.services.collection.Config") as mock_cfg,
        patch("app.config.Config") as mock_cfg2,
    ):
        mock_cfg.DISCOGS_CONSUMER_KEY = "test-key"
        mock_cfg.DISCOGS_CONSUMER_SECRET = "test-secret"
        mock_cfg.DISCOGS_USER_AGENT = "TestAgent/1.0"
        mock_cfg2.DISCOGS_CONSUMER_KEY = "test-key"
        mock_cfg2.DISCOGS_CONSUMER_SECRET = "test-secret"
        mock_cfg2.DISCOGS_USER_AGENT = "TestAgent/1.0"
        yield mock_cfg


@pytest.fixture
def service(mock_config):
    """Create a CollectionService instance with mocked config."""
    return CollectionService()


class TestExtractFormatString:
    """Tests for CollectionService._extract_format_string."""

    def test_empty_formats(self, service):
        """Test with empty formats list."""
        assert service._extract_format_string([]) is None

    def test_single_format_dict(self, service):
        """Test with single format as dict."""
        result = service._extract_format_string([{"qty": "1", "name": "Vinyl"}])
        assert result == "Vinyl"

    def test_multiple_quantity(self, service):
        """Test format with qty > 1."""
        result = service._extract_format_string([{"qty": "2", "name": "LP"}])
        assert result == "2xLP"

    def test_multiple_formats(self, service):
        """Test with multiple format entries."""
        result = service._extract_format_string([
            {"qty": "2", "name": "LP"},
            {"qty": "1", "name": "CD"},
        ])
        assert result == "2xLP, CD"

    def test_format_object_style(self, service):
        """Test with object-style format (from Release object)."""
        fmt = MagicMock()
        fmt.qty = "1"
        fmt.name = "Vinyl"
        result = service._extract_format_string([fmt])
        assert result == "Vinyl"


class TestExtractFromBasicInfo:
    """Tests for CollectionService._extract_from_basic_info."""

    def test_extracts_all_fields(self, service):
        """Test extraction from complete basic_information."""
        item = MagicMock()
        item.id = 456
        item.date_added = datetime(2024, 1, 15, tzinfo=UTC)

        info = {
            "id": 123,
            "title": "Test Album",
            "artists": [{"name": "Artist One"}, {"name": "Artist Two"}],
            "cover_image": "https://example.com/cover.jpg",
            "formats": [{"qty": "1", "name": "LP"}],
            "genres": ["Electronic"],
            "styles": ["House"],
            "labels": [{"name": "Test Label", "catno": "TL001"}],
            "year": 2020,
        }

        result = service._extract_from_basic_info(item, info)

        assert result["discogs_release_id"] == 123
        assert result["discogs_instance_id"] == 456
        assert result["title"] == "Test Album"
        assert result["artist_name"] == "Artist One, Artist Two"
        assert result["cover_image_url"] == "https://example.com/cover.jpg"
        assert result["format"] == "LP"
        assert result["genres"] == ["Electronic"]
        assert result["styles"] == ["House"]
        assert result["labels"] == ["Test Label"]
        assert result["catalog_number"] == "TL001"
        assert result["year"] == 2020
        assert result["country"] is None  # Not in basic_information

    def test_handles_missing_artists(self, service):
        """Test extraction with no artists."""
        item = MagicMock()
        item.id = 456
        item.date_added = None

        info = {"id": 123, "title": "Test", "artists": [], "year": 2020}

        result = service._extract_from_basic_info(item, info)
        assert result["artist_name"] == "Unknown Artist"

    def test_handles_invalid_year(self, service):
        """Test extraction with year = 0."""
        item = MagicMock()
        item.id = 456
        item.date_added = None

        info = {"id": 123, "title": "Test", "year": 0}

        result = service._extract_from_basic_info(item, info)
        assert result["year"] is None

    def test_uses_thumb_as_fallback(self, service):
        """Test that thumb is used when cover_image is missing."""
        item = MagicMock()
        item.id = 456
        item.date_added = None

        info = {"id": 123, "title": "Test", "thumb": "https://example.com/thumb.jpg"}

        result = service._extract_from_basic_info(item, info)
        assert result["cover_image_url"] == "https://example.com/thumb.jpg"


class TestExtractReleaseData:
    """Tests for CollectionService._extract_release_data."""

    def test_uses_basic_info_when_available(self, service):
        """Test that basic_information is preferred over release object."""
        item = MagicMock()
        item.id = 456
        item.date_added = None
        item.data = {
            "basic_information": {
                "id": 123,
                "title": "Test Album",
                "artists": [{"name": "Test Artist"}],
                "year": 2020,
            }
        }

        result = service._extract_release_data(item)

        assert result is not None
        assert result["title"] == "Test Album"
        assert result["artist_name"] == "Test Artist"

    def test_falls_back_to_release_object(self, service):
        """Test fallback to item.release when no basic_information."""
        item = MagicMock(spec=["id", "release", "date_added"])
        item.id = 456
        item.date_added = None

        mock_release = MagicMock()
        mock_release.id = 123
        mock_release.title = "Fallback Album"
        artist_mock = MagicMock()
        artist_mock.name = "Fallback Artist"
        mock_release.artists = [artist_mock]
        mock_release.year = 2021
        mock_release.images = None
        mock_release.formats = None
        mock_release.genres = None
        mock_release.styles = None
        mock_release.labels = None
        mock_release.country = None
        mock_release.data = None
        item.release = mock_release

        result = service._extract_release_data(item)

        assert result is not None
        assert result["title"] == "Fallback Album"

    def test_returns_none_on_release_fetch_failure(self, service):
        """Test returns None when release fetch fails."""
        item = MagicMock(spec=["id", "release", "date_added"])
        item.id = 456
        item.date_added = None
        type(item).release = property(lambda self: (_ for _ in ()).throw(Exception("API error")))

        result = service._extract_release_data(item)
        assert result is None


class TestFetchDiscogsCollection:
    """Tests for CollectionService.fetch_discogs_collection."""

    @patch("app.services.collection.discogs_client.Client")
    def test_fetch_collection_success(self, mock_client_cls, service):
        """Test successful collection fetch."""
        # Create mock items
        mock_item = MagicMock()
        mock_item.id = 456
        mock_item.date_added = None
        mock_item.data = {
            "basic_information": {
                "id": 123,
                "title": "Test Album",
                "artists": [{"name": "Test Artist"}],
                "year": 2020,
            }
        }

        mock_identity = MagicMock()
        mock_identity.collection_folders = [MagicMock()]
        mock_identity.collection_folders[0].releases = [mock_item]

        mock_client = MagicMock()
        mock_client.identity.return_value = mock_identity
        mock_client_cls.return_value = mock_client

        releases = service.fetch_discogs_collection("access", "secret")

        assert len(releases) == 1
        assert releases[0]["title"] == "Test Album"

    @patch("app.services.collection.discogs_client.Client")
    def test_fetch_collection_skips_bad_items(self, mock_client_cls, service):
        """Test that bad items are skipped without failing entire sync."""
        good_item = MagicMock()
        good_item.id = 1
        good_item.date_added = None
        good_item.data = {
            "basic_information": {
                "id": 100,
                "title": "Good Album",
                "artists": [{"name": "Good Artist"}],
                "year": 2020,
            }
        }

        bad_item = MagicMock(spec=["id", "release", "date_added"])
        bad_item.id = 2
        bad_item.date_added = None
        type(bad_item).release = property(lambda self: (_ for _ in ()).throw(Exception("fail")))

        mock_identity = MagicMock()
        mock_identity.collection_folders = [MagicMock()]
        mock_identity.collection_folders[0].releases = [good_item, bad_item]

        mock_client = MagicMock()
        mock_client.identity.return_value = mock_identity
        mock_client_cls.return_value = mock_client

        releases = service.fetch_discogs_collection("access", "secret")

        assert len(releases) == 1
        assert releases[0]["title"] == "Good Album"

    @patch("app.services.collection.discogs_client.Client")
    def test_fetch_collection_api_failure(self, mock_client_cls, service):
        """Test collection fetch raises CollectionSyncError on API failure."""
        mock_client = MagicMock()
        mock_client.identity.side_effect = Exception("Network error")
        mock_client_cls.return_value = mock_client

        with pytest.raises(CollectionSyncError, match="Failed to fetch"):
            service.fetch_discogs_collection("access", "secret")


class TestSyncToDatabase:
    """Tests for CollectionService.sync_to_database."""

    @patch("app.services.collection.get_supabase")
    def test_sync_adds_new_releases(self, mock_get_supabase, service):
        """Test syncing new releases to database."""
        mock_supabase = MagicMock()

        # Existing releases query returns empty
        mock_existing = MagicMock()
        mock_existing.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = (
            mock_existing
        )

        # Upsert succeeds
        mock_supabase.table.return_value.upsert.return_value.execute.return_value = MagicMock()

        mock_get_supabase.return_value = mock_supabase

        releases = [
            {
                "discogs_instance_id": 456,
                "title": "New Album",
                "synced_at": datetime.now(UTC).isoformat(),
            }
        ]

        result = service.sync_to_database("user-123", releases)

        assert result["added"] == 1
        assert result["updated"] == 0
        assert result["removed"] == 0
        assert result["total"] == 1

    @patch("app.services.collection.get_supabase")
    def test_sync_updates_existing_releases(self, mock_get_supabase, service):
        """Test syncing updates existing releases."""
        mock_supabase = MagicMock()

        # Existing releases query returns one match
        mock_existing = MagicMock()
        mock_existing.data = [{"id": "existing-uuid", "discogs_instance_id": 456}]
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = (
            mock_existing
        )

        mock_supabase.table.return_value.upsert.return_value.execute.return_value = MagicMock()

        mock_get_supabase.return_value = mock_supabase

        releases = [
            {
                "discogs_instance_id": 456,
                "title": "Updated Album",
                "synced_at": datetime.now(UTC).isoformat(),
            }
        ]

        result = service.sync_to_database("user-123", releases)

        assert result["added"] == 0
        assert result["updated"] == 1
        assert result["removed"] == 0

    @patch("app.services.collection.get_supabase")
    def test_sync_removes_deleted_releases(self, mock_get_supabase, service):
        """Test that releases no longer in Discogs are removed."""
        mock_supabase = MagicMock()

        # Existing releases includes one that's not in new data
        mock_existing = MagicMock()
        mock_existing.data = [
            {"id": "keep-uuid", "discogs_instance_id": 100},
            {"id": "remove-uuid", "discogs_instance_id": 200},
        ]
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = (
            mock_existing
        )

        mock_supabase.table.return_value.upsert.return_value.execute.return_value = MagicMock()
        mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = (
            MagicMock()
        )

        mock_get_supabase.return_value = mock_supabase

        releases = [
            {
                "discogs_instance_id": 100,
                "title": "Kept Album",
                "synced_at": datetime.now(UTC).isoformat(),
            }
        ]

        result = service.sync_to_database("user-123", releases)

        assert result["removed"] == 1
        assert result["updated"] == 1
        assert result["total"] == 1

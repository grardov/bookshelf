"""Tests for Collection API endpoints."""

from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest


@pytest.fixture
def mock_user_with_discogs():
    """Mock user profile data with Discogs connection."""
    return {
        "id": "user-123",
        "email": "test@example.com",
        "discogs_username": "testdiscogsuser",
        "discogs_access_token": "access_token",
        "discogs_access_token_secret": "access_secret",
    }


@pytest.fixture
def mock_user_without_discogs():
    """Mock user profile data without Discogs connection."""
    return {
        "id": "user-123",
        "email": "test@example.com",
        "discogs_username": None,
        "discogs_access_token": None,
        "discogs_access_token_secret": None,
    }


@pytest.fixture
def mock_auth_response():
    """Mock Supabase auth.get_user response."""
    user_mock = MagicMock()
    user_mock.id = "user-123"
    user_mock.email = "test@example.com"

    response_mock = MagicMock()
    response_mock.user = user_mock

    return response_mock


@pytest.fixture
def auth_headers():
    """Valid authentication headers with Bearer token."""
    return {"Authorization": "Bearer valid-jwt-token"}


@pytest.fixture
def mock_releases():
    """Mock release data from Discogs."""
    return [
        {
            "discogs_release_id": 123,
            "discogs_instance_id": 456,
            "title": "Test Album",
            "artist_name": "Test Artist",
            "year": 2020,
            "cover_image_url": "https://i.discogs.com/cover.jpg",
            "format": "LP",
            "genres": ["Electronic"],
            "styles": ["House"],
            "labels": ["Test Label"],
            "catalog_number": "TL001",
            "country": "US",
            "discogs_metadata": {"id": 123, "title": "Test Album"},
            "added_to_discogs_at": datetime.now().isoformat(),
            "synced_at": datetime.now().isoformat(),
        }
    ]


@pytest.fixture
def mock_db_release():
    """Mock release from database."""
    return {
        "id": "release-uuid-123",
        "user_id": "user-123",
        "discogs_release_id": 123,
        "discogs_instance_id": 456,
        "title": "Test Album",
        "artist_name": "Test Artist",
        "year": 2020,
        "cover_image_url": "https://i.discogs.com/cover.jpg",
        "format": "LP",
        "genres": ["Electronic"],
        "styles": ["House"],
        "labels": ["Test Label"],
        "catalog_number": "TL001",
        "country": "US",
        "discogs_metadata": {"id": 123, "title": "Test Album"},
        "added_to_discogs_at": datetime.now().isoformat(),
        "synced_at": datetime.now().isoformat(),
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }


class TestCollectionSync:
    """Tests for POST /api/collection/sync endpoint."""

    @patch("app.dependencies.Config")
    @patch("app.routers.collection.get_collection_service")
    @patch("app.dependencies.get_supabase")
    def test_sync_success(
        self,
        mock_dep_supabase,
        mock_get_service,
        mock_config,
        client,
        auth_headers,
        mock_auth_response,
        mock_user_with_discogs,
        mock_releases,
    ):
        """Test POST /api/collection/sync with valid authentication."""
        # Mock Discogs configuration
        mock_config.is_discogs_configured.return_value = True

        # Mock auth validation + user fetch for Discogs credentials
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_user_response = MagicMock()
        mock_user_response.data = mock_user_with_discogs
        mock_dep_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = (
            mock_user_response
        )
        mock_dep_supabase.return_value = mock_dep_client

        # Mock collection service
        mock_service = MagicMock()
        mock_service.fetch_discogs_collection.return_value = mock_releases
        mock_service.sync_to_database.return_value = {
            "added": 1,
            "updated": 0,
            "removed": 0,
            "total": 1,
        }
        mock_get_service.return_value = mock_service

        response = client.post(
            "/api/collection/sync",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["added"] == 1
        assert data["updated"] == 0
        assert data["removed"] == 0
        assert data["total"] == 1

    def test_sync_unauthorized(self, client):
        """Test POST /api/collection/sync without authentication."""
        response = client.post("/api/collection/sync")

        assert response.status_code == 401

    @patch("app.dependencies.Config")
    @patch("app.dependencies.get_supabase")
    def test_sync_discogs_not_connected(
        self,
        mock_dep_supabase,
        mock_config,
        client,
        auth_headers,
        mock_auth_response,
        mock_user_without_discogs,
    ):
        """Test POST /api/collection/sync when Discogs is not connected."""
        # Mock Discogs configuration
        mock_config.is_discogs_configured.return_value = True

        # Mock auth validation + user fetch - no Discogs tokens
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_user_response = MagicMock()
        mock_user_response.data = mock_user_without_discogs
        mock_dep_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = (
            mock_user_response
        )
        mock_dep_supabase.return_value = mock_dep_client

        response = client.post(
            "/api/collection/sync",
            headers=auth_headers,
        )

        assert response.status_code == 400
        assert "not connected" in response.json()["detail"].lower()

    @patch("app.dependencies.Config")
    @patch("app.dependencies.get_supabase")
    def test_sync_discogs_not_configured(
        self,
        mock_dep_supabase,
        mock_config,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test POST /api/collection/sync when Discogs is not configured."""
        # Mock Discogs not configured
        mock_config.is_discogs_configured.return_value = False

        # Mock auth validation
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        response = client.post(
            "/api/collection/sync",
            headers=auth_headers,
        )

        assert response.status_code == 503
        assert "not configured" in response.json()["detail"].lower()


class TestListReleases:
    """Tests for GET /api/collection endpoint."""

    @patch("app.routers.collection.get_supabase")
    @patch("app.dependencies.get_supabase")
    def test_list_releases_success(
        self,
        mock_dep_supabase,
        mock_router_supabase,
        client,
        auth_headers,
        mock_auth_response,
        mock_db_release,
    ):
        """Test GET /api/collection returns paginated releases."""
        # Mock auth validation
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock releases query
        mock_router_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = [mock_db_release]
        mock_response.count = 1

        # Chain the query builder methods
        query_mock = MagicMock()
        query_mock.eq.return_value = query_mock
        query_mock.or_.return_value = query_mock
        query_mock.order.return_value = query_mock
        query_mock.range.return_value = query_mock
        query_mock.execute.return_value = mock_response
        mock_router_client.table.return_value.select.return_value = query_mock
        mock_router_supabase.return_value = mock_router_client

        response = client.get(
            "/api/collection",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["page"] == 1
        assert data["page_size"] == 50
        assert data["has_more"] is False
        assert len(data["items"]) == 1
        assert data["items"][0]["title"] == "Test Album"

    def test_list_releases_unauthorized(self, client):
        """Test GET /api/collection without authentication."""
        response = client.get("/api/collection")

        assert response.status_code == 401

    @patch("app.routers.collection.get_supabase")
    @patch("app.dependencies.get_supabase")
    def test_list_releases_with_search(
        self,
        mock_dep_supabase,
        mock_router_supabase,
        client,
        auth_headers,
        mock_auth_response,
        mock_db_release,
    ):
        """Test GET /api/collection with search filter."""
        # Mock auth validation
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock releases query
        mock_router_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = [mock_db_release]
        mock_response.count = 1

        query_mock = MagicMock()
        query_mock.eq.return_value = query_mock
        query_mock.or_.return_value = query_mock
        query_mock.order.return_value = query_mock
        query_mock.range.return_value = query_mock
        query_mock.execute.return_value = mock_response
        mock_router_client.table.return_value.select.return_value = query_mock
        mock_router_supabase.return_value = mock_router_client

        response = client.get(
            "/api/collection?search=Test",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1

    @patch("app.routers.collection.get_supabase")
    @patch("app.dependencies.get_supabase")
    def test_list_releases_empty(
        self,
        mock_dep_supabase,
        mock_router_supabase,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test GET /api/collection returns empty list."""
        # Mock auth validation
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock empty releases query
        mock_router_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = []
        mock_response.count = 0

        query_mock = MagicMock()
        query_mock.eq.return_value = query_mock
        query_mock.or_.return_value = query_mock
        query_mock.order.return_value = query_mock
        query_mock.range.return_value = query_mock
        query_mock.execute.return_value = mock_response
        mock_router_client.table.return_value.select.return_value = query_mock
        mock_router_supabase.return_value = mock_router_client

        response = client.get(
            "/api/collection",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert len(data["items"]) == 0
        assert data["has_more"] is False


class TestGetRelease:
    """Tests for GET /api/collection/{id} endpoint."""

    @patch("app.routers.collection.get_supabase")
    @patch("app.dependencies.get_supabase")
    def test_get_release_success(
        self,
        mock_dep_supabase,
        mock_router_supabase,
        client,
        auth_headers,
        mock_auth_response,
        mock_db_release,
    ):
        """Test GET /api/collection/{id} returns release."""
        # Mock auth validation
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock release query
        mock_router_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = mock_db_release
        mock_router_client.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = (
            mock_response
        )
        mock_router_supabase.return_value = mock_router_client

        response = client.get(
            "/api/collection/release-uuid-123",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Album"
        assert data["artist_name"] == "Test Artist"

    def test_get_release_unauthorized(self, client):
        """Test GET /api/collection/{id} without authentication."""
        response = client.get("/api/collection/release-uuid-123")

        assert response.status_code == 401

    @patch("app.routers.collection.get_supabase")
    @patch("app.dependencies.get_supabase")
    def test_get_release_not_found(
        self,
        mock_dep_supabase,
        mock_router_supabase,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test GET /api/collection/{id} with non-existent release."""
        # Mock auth validation
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock release query - raises exception for single() with no result
        mock_router_client = MagicMock()
        mock_router_client.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.side_effect = (
            Exception("No rows found")
        )
        mock_router_supabase.return_value = mock_router_client

        response = client.get(
            "/api/collection/nonexistent-uuid",
            headers=auth_headers,
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


class TestGetReleaseTracks:
    """Tests for GET /api/collection/{id}/tracks endpoint."""

    @patch("app.dependencies.Config")
    @patch("app.routers.collection.get_supabase")
    @patch("app.routers.collection.get_collection_service")
    @patch("app.dependencies.get_supabase")
    def test_get_tracks_returns_enriched_metadata(
        self,
        mock_dep_supabase,
        mock_get_service,
        mock_router_supabase,
        mock_config,
        client,
        auth_headers,
        mock_auth_response,
        mock_user_with_discogs,
        mock_db_release,
    ):
        """Test GET /api/collection/{id}/tracks returns enriched metadata."""
        mock_config.is_discogs_configured.return_value = True

        # Mock auth validation + user fetch for Discogs credentials (both in dependencies)
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_user_response = MagicMock()
        mock_user_response.data = mock_user_with_discogs
        mock_dep_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = (
            mock_user_response
        )
        mock_dep_supabase.return_value = mock_dep_client

        # Mock Supabase - release query (still in router)
        mock_router_client = MagicMock()

        mock_release_response = MagicMock()
        mock_release_response.data = mock_db_release

        # Chain for select().eq().eq().single().execute()
        select_chain = MagicMock()
        select_chain.eq.return_value.eq.return_value.single.return_value.execute.return_value = (
            mock_release_response
        )
        mock_router_client.table.return_value.select.return_value = select_chain
        # Mock update chain for metadata persistence
        mock_router_client.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = (
            MagicMock()
        )
        mock_router_supabase.return_value = mock_router_client

        # Mock Discogs client and release
        mock_discogs_release = MagicMock()
        mock_track = MagicMock()
        mock_track.position = "A1"
        mock_track.title = "Test Track"
        mock_track.duration = "3:45"
        mock_track.artists = None
        mock_discogs_release.tracklist = [mock_track]
        mock_discogs_release.data = {
            "id": 123,
            "title": "Test Album",
            "notes": "A great album",
            "country": "US",
            "genres": ["Electronic"],
            "styles": ["House", "Deep House"],
            "labels": [
                {"name": "Test Label", "catno": "TL001", "entity_type_name": "Label"}
            ],
            "formats": [
                {"name": "Vinyl", "qty": "1", "descriptions": ["LP", "Album"]}
            ],
        }

        mock_service = MagicMock()
        mock_service._create_authenticated_client.return_value.release.return_value = (
            mock_discogs_release
        )
        mock_get_service.return_value = mock_service

        response = client.get(
            "/api/collection/release-uuid-123/tracks",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["notes"] == "A great album"
        assert data["country"] == "US"
        assert data["genres"] == ["Electronic"]
        assert data["styles"] == ["House", "Deep House"]
        assert data["labels"] == [
            {"name": "Test Label", "catno": "TL001", "entity_type_name": "Label"}
        ]
        assert data["formats"] == [
            {"name": "Vinyl", "qty": "1", "descriptions": ["LP", "Album"]}
        ]
        assert len(data["tracks"]) == 1
        assert data["tracks"][0]["title"] == "Test Track"

    @patch("app.dependencies.Config")
    @patch("app.routers.collection.get_supabase")
    @patch("app.routers.collection.get_collection_service")
    @patch("app.dependencies.get_supabase")
    def test_get_tracks_handles_missing_metadata(
        self,
        mock_dep_supabase,
        mock_get_service,
        mock_router_supabase,
        mock_config,
        client,
        auth_headers,
        mock_auth_response,
        mock_user_with_discogs,
        mock_db_release,
    ):
        """Test tracks endpoint handles missing release data gracefully."""
        mock_config.is_discogs_configured.return_value = True

        # Mock auth validation + user fetch for Discogs credentials (both in dependencies)
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_user_response = MagicMock()
        mock_user_response.data = mock_user_with_discogs
        mock_dep_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = (
            mock_user_response
        )
        mock_dep_supabase.return_value = mock_dep_client

        # Mock Supabase - release query (still in router)
        mock_router_client = MagicMock()
        mock_release_response = MagicMock()
        mock_release_response.data = mock_db_release

        select_chain = MagicMock()
        select_chain.eq.return_value.eq.return_value.single.return_value.execute.return_value = (
            mock_release_response
        )
        mock_router_client.table.return_value.select.return_value = select_chain
        mock_router_supabase.return_value = mock_router_client

        # Mock Discogs release with no .data attribute
        mock_discogs_release = MagicMock(spec=[])
        mock_discogs_release.tracklist = []
        # No .data attribute since spec=[] excludes it

        mock_service = MagicMock()
        mock_service._create_authenticated_client.return_value.release.return_value = (
            mock_discogs_release
        )
        mock_get_service.return_value = mock_service

        response = client.get(
            "/api/collection/release-uuid-123/tracks",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["notes"] is None
        assert data["country"] is None
        assert data["genres"] == []
        assert data["styles"] == []
        assert data["labels"] is None
        assert data["formats"] is None

    def test_get_tracks_unauthorized(self, client):
        """Test GET /api/collection/{id}/tracks without authentication."""
        response = client.get("/api/collection/release-uuid-123/tracks")

        assert response.status_code == 401

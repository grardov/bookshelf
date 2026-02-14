"""Tests for Playlists API endpoints."""

from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest


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
def mock_playlist():
    """Mock playlist data."""
    return {
        "id": "playlist-uuid-123",
        "user_id": "user-123",
        "name": "Test Playlist",
        "description": "A test playlist",
        "tags": ["house", "techno"],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }


@pytest.fixture
def mock_playlist_track():
    """Mock playlist track data."""
    return {
        "id": "track-uuid-123",
        "playlist_id": "playlist-uuid-123",
        "release_id": "release-uuid-123",
        "discogs_release_id": 12345,
        "position": "A1",
        "title": "Test Track",
        "artist": "Test Artist",
        "duration": "6:42",
        "track_order": 1,
        "cover_image_url": "https://example.com/cover.jpg",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }


class TestCreatePlaylist:
    """Tests for POST /api/playlists endpoint."""

    @patch("app.routers.playlists.get_playlist_service")
    @patch("app.dependencies.get_supabase")
    def test_create_playlist_success(
        self,
        mock_dep_supabase,
        mock_get_service,
        client,
        auth_headers,
        mock_auth_response,
        mock_playlist,
    ):
        """Test creating a playlist successfully."""
        # Mock auth
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock service
        mock_service = MagicMock()
        mock_playlist["track_count"] = 0
        mock_service.create_playlist.return_value = mock_playlist
        mock_get_service.return_value = mock_service

        response = client.post(
            "/api/playlists",
            headers=auth_headers,
            json={
                "name": "Test Playlist",
                "description": "A test playlist",
                "tags": ["house", "techno"],
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Playlist"
        assert data["tags"] == ["house", "techno"]

    def test_create_playlist_unauthorized(self, client):
        """Test creating playlist without auth returns 401."""
        response = client.post(
            "/api/playlists",
            json={"name": "Test"},
        )
        assert response.status_code == 401


class TestListPlaylists:
    """Tests for GET /api/playlists endpoint."""

    @patch("app.routers.playlists.get_playlist_service")
    @patch("app.dependencies.get_supabase")
    def test_list_playlists_success(
        self,
        mock_dep_supabase,
        mock_get_service,
        client,
        auth_headers,
        mock_auth_response,
        mock_playlist,
    ):
        """Test listing playlists successfully."""
        # Mock auth
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock service
        mock_service = MagicMock()
        mock_playlist["track_count"] = 5
        mock_service.list_playlists.return_value = ([mock_playlist], 1)
        mock_get_service.return_value = mock_service

        response = client.get("/api/playlists", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["name"] == "Test Playlist"

    @patch("app.routers.playlists.get_playlist_service")
    @patch("app.dependencies.get_supabase")
    def test_list_playlists_empty(
        self,
        mock_dep_supabase,
        mock_get_service,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test listing playlists when empty."""
        # Mock auth
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock service
        mock_service = MagicMock()
        mock_service.list_playlists.return_value = ([], 0)
        mock_get_service.return_value = mock_service

        response = client.get("/api/playlists", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert len(data["items"]) == 0


class TestGetPlaylist:
    """Tests for GET /api/playlists/{id} endpoint."""

    @patch("app.routers.playlists.get_playlist_service")
    @patch("app.dependencies.get_supabase")
    def test_get_playlist_success(
        self,
        mock_dep_supabase,
        mock_get_service,
        client,
        auth_headers,
        mock_auth_response,
        mock_playlist,
        mock_playlist_track,
    ):
        """Test getting playlist with tracks successfully."""
        # Mock auth
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock service
        mock_service = MagicMock()
        playlist_with_tracks = {
            **mock_playlist,
            "tracks": [mock_playlist_track],
            "track_count": 1,
            "total_duration": "6m",
        }
        mock_service.get_playlist_with_tracks.return_value = playlist_with_tracks
        mock_get_service.return_value = mock_service

        response = client.get(
            "/api/playlists/playlist-uuid-123", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Playlist"
        assert len(data["tracks"]) == 1
        assert data["tracks"][0]["title"] == "Test Track"

    @patch("app.routers.playlists.get_playlist_service")
    @patch("app.dependencies.get_supabase")
    def test_get_playlist_not_found(
        self,
        mock_dep_supabase,
        mock_get_service,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test getting non-existent playlist returns 404."""
        # Mock auth
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock service
        mock_service = MagicMock()
        mock_service.get_playlist_with_tracks.return_value = None
        mock_get_service.return_value = mock_service

        response = client.get("/api/playlists/nonexistent-id", headers=auth_headers)

        assert response.status_code == 404


class TestUpdatePlaylist:
    """Tests for PATCH /api/playlists/{id} endpoint."""

    @patch("app.routers.playlists.get_playlist_service")
    @patch("app.dependencies.get_supabase")
    def test_update_playlist_success(
        self,
        mock_dep_supabase,
        mock_get_service,
        client,
        auth_headers,
        mock_auth_response,
        mock_playlist,
    ):
        """Test updating playlist successfully."""
        # Mock auth
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock service
        mock_service = MagicMock()
        updated_playlist = {**mock_playlist, "name": "Updated Playlist", "track_count": 0}
        mock_service.update_playlist.return_value = updated_playlist
        mock_get_service.return_value = mock_service

        response = client.patch(
            "/api/playlists/playlist-uuid-123",
            headers=auth_headers,
            json={"name": "Updated Playlist"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Playlist"

    @patch("app.routers.playlists.get_playlist_service")
    @patch("app.dependencies.get_supabase")
    def test_update_playlist_not_found(
        self,
        mock_dep_supabase,
        mock_get_service,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test updating non-existent playlist returns 404."""
        # Mock auth
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock service
        mock_service = MagicMock()
        mock_service.update_playlist.return_value = None
        mock_get_service.return_value = mock_service

        response = client.patch(
            "/api/playlists/nonexistent-id",
            headers=auth_headers,
            json={"name": "Updated"},
        )

        assert response.status_code == 404


class TestDeletePlaylist:
    """Tests for DELETE /api/playlists/{id} endpoint."""

    @patch("app.routers.playlists.get_playlist_service")
    @patch("app.dependencies.get_supabase")
    def test_delete_playlist_success(
        self,
        mock_dep_supabase,
        mock_get_service,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test deleting playlist successfully."""
        # Mock auth
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock service
        mock_service = MagicMock()
        mock_service.delete_playlist.return_value = True
        mock_get_service.return_value = mock_service

        response = client.delete(
            "/api/playlists/playlist-uuid-123", headers=auth_headers
        )

        assert response.status_code == 204

    @patch("app.routers.playlists.get_playlist_service")
    @patch("app.dependencies.get_supabase")
    def test_delete_playlist_not_found(
        self,
        mock_dep_supabase,
        mock_get_service,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test deleting non-existent playlist returns 404."""
        # Mock auth
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock service
        mock_service = MagicMock()
        mock_service.delete_playlist.return_value = False
        mock_get_service.return_value = mock_service

        response = client.delete(
            "/api/playlists/nonexistent-id", headers=auth_headers
        )

        assert response.status_code == 404


class TestAddTrack:
    """Tests for POST /api/playlists/{id}/tracks endpoint."""

    @patch("app.routers.playlists.get_playlist_service")
    @patch("app.dependencies.get_supabase")
    def test_add_track_success(
        self,
        mock_dep_supabase,
        mock_get_service,
        client,
        auth_headers,
        mock_auth_response,
        mock_playlist_track,
    ):
        """Test adding track to playlist successfully."""
        # Mock auth
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock service
        mock_service = MagicMock()
        mock_service.add_track.return_value = mock_playlist_track
        mock_get_service.return_value = mock_service

        response = client.post(
            "/api/playlists/playlist-uuid-123/tracks",
            headers=auth_headers,
            json={
                "release_id": "release-uuid-123",
                "discogs_release_id": 12345,
                "position": "A1",
                "title": "Test Track",
                "artist": "Test Artist",
                "duration": "6:42",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Track"
        assert data["position"] == "A1"

    @patch("app.routers.playlists.get_playlist_service")
    @patch("app.dependencies.get_supabase")
    def test_add_track_with_cover_image(
        self,
        mock_dep_supabase,
        mock_get_service,
        client,
        auth_headers,
        mock_auth_response,
        mock_playlist_track,
    ):
        """Test adding track with cover_image_url."""
        # Mock auth
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock service
        mock_service = MagicMock()
        mock_service.add_track.return_value = mock_playlist_track
        mock_get_service.return_value = mock_service

        response = client.post(
            "/api/playlists/playlist-uuid-123/tracks",
            headers=auth_headers,
            json={
                "release_id": "release-uuid-123",
                "discogs_release_id": 12345,
                "position": "A1",
                "title": "Test Track",
                "artist": "Test Artist",
                "duration": "6:42",
                "cover_image_url": "https://example.com/cover.jpg",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["cover_image_url"] == "https://example.com/cover.jpg"

    @patch("app.routers.playlists.get_playlist_service")
    @patch("app.dependencies.get_supabase")
    def test_add_track_playlist_not_found(
        self,
        mock_dep_supabase,
        mock_get_service,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test adding track to non-existent playlist returns 404."""
        # Mock auth
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock service
        mock_service = MagicMock()
        mock_service.add_track.side_effect = ValueError("Playlist not found")
        mock_get_service.return_value = mock_service

        response = client.post(
            "/api/playlists/nonexistent-id/tracks",
            headers=auth_headers,
            json={
                "release_id": "release-uuid-123",
                "discogs_release_id": 12345,
                "position": "A1",
                "title": "Test Track",
                "artist": "Test Artist",
            },
        )

        assert response.status_code == 404


class TestRemoveTrack:
    """Tests for DELETE /api/playlists/{id}/tracks/{track_id} endpoint."""

    @patch("app.routers.playlists.get_playlist_service")
    @patch("app.dependencies.get_supabase")
    def test_remove_track_success(
        self,
        mock_dep_supabase,
        mock_get_service,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test removing track from playlist successfully."""
        # Mock auth
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock service
        mock_service = MagicMock()
        mock_service.remove_track.return_value = True
        mock_get_service.return_value = mock_service

        response = client.delete(
            "/api/playlists/playlist-uuid-123/tracks/track-uuid-123",
            headers=auth_headers,
        )

        assert response.status_code == 204

    @patch("app.routers.playlists.get_playlist_service")
    @patch("app.dependencies.get_supabase")
    def test_remove_track_not_found(
        self,
        mock_dep_supabase,
        mock_get_service,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test removing non-existent track returns 404."""
        # Mock auth
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock service
        mock_service = MagicMock()
        mock_service.remove_track.return_value = False
        mock_get_service.return_value = mock_service

        response = client.delete(
            "/api/playlists/playlist-uuid-123/tracks/nonexistent-id",
            headers=auth_headers,
        )

        assert response.status_code == 404


class TestReorderTracks:
    """Tests for PATCH /api/playlists/{id}/tracks/reorder endpoint."""

    @patch("app.routers.playlists.get_playlist_service")
    @patch("app.dependencies.get_supabase")
    def test_reorder_tracks_success(
        self,
        mock_dep_supabase,
        mock_get_service,
        client,
        auth_headers,
        mock_auth_response,
        mock_playlist_track,
    ):
        """Test reordering tracks successfully."""
        # Mock auth
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock service
        mock_service = MagicMock()
        mock_service.reorder_tracks.return_value = [mock_playlist_track]
        mock_get_service.return_value = mock_service

        response = client.patch(
            "/api/playlists/playlist-uuid-123/tracks/reorder",
            headers=auth_headers,
            json={"track_ids": ["track-uuid-123"]},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == "track-uuid-123"

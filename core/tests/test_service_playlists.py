"""Tests for PlaylistService business logic."""

from unittest.mock import MagicMock, patch

import pytest

from app.services.playlists import PlaylistService


@pytest.fixture
def service():
    """Create a PlaylistService instance."""
    return PlaylistService()


@pytest.fixture
def mock_supabase():
    """Mock Supabase client."""
    with patch("app.services.playlists.get_supabase") as mock_get:
        mock_client = MagicMock()
        mock_get.return_value = mock_client
        yield mock_client


class TestCreatePlaylist:
    """Tests for PlaylistService.create_playlist."""

    def test_creates_playlist_with_all_fields(self, service, mock_supabase):
        """Test creating playlist with name, description, tags."""
        mock_response = MagicMock()
        mock_response.data = [
            {
                "id": "playlist-123",
                "user_id": "user-123",
                "name": "My Playlist",
                "description": "A description",
                "tags": ["house"],
                "created_at": "2024-01-01T00:00:00Z",
            }
        ]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = (
            mock_response
        )

        result = service.create_playlist(
            "user-123",
            {"name": "My Playlist", "description": "A description", "tags": ["house"]},
        )

        assert result["name"] == "My Playlist"
        assert result["track_count"] == 0

    def test_creates_playlist_with_defaults(self, service, mock_supabase):
        """Test creating playlist with only name."""
        mock_response = MagicMock()
        mock_response.data = [
            {
                "id": "playlist-123",
                "user_id": "user-123",
                "name": "Minimal",
                "description": None,
                "tags": [],
                "created_at": "2024-01-01T00:00:00Z",
            }
        ]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = (
            mock_response
        )

        result = service.create_playlist("user-123", {"name": "Minimal"})

        assert result["name"] == "Minimal"
        assert result["description"] is None
        assert result["tags"] == []


class TestGetPlaylist:
    """Tests for PlaylistService.get_playlist."""

    def test_returns_playlist_when_found(self, service, mock_supabase):
        """Test getting existing playlist."""
        mock_response = MagicMock()
        mock_response.data = {
            "id": "playlist-123",
            "user_id": "user-123",
            "name": "Test",
        }
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = (
            mock_response
        )

        result = service.get_playlist("playlist-123", "user-123")
        assert result["name"] == "Test"

    def test_returns_none_when_not_found(self, service, mock_supabase):
        """Test getting non-existent playlist."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.side_effect = (
            Exception("No rows")
        )

        result = service.get_playlist("nonexistent", "user-123")
        assert result is None


class TestGetPlaylistWithTracks:
    """Tests for PlaylistService.get_playlist_with_tracks."""

    @patch.object(PlaylistService, "get_playlist")
    def test_returns_none_when_playlist_not_found(
        self, mock_get, service, mock_supabase
    ):
        """Test returns None when playlist doesn't exist."""
        mock_get.return_value = None

        result = service.get_playlist_with_tracks("nonexistent", "user-123")
        assert result is None

    @patch.object(PlaylistService, "get_playlist")
    def test_returns_playlist_with_tracks_and_duration(
        self, mock_get, service, mock_supabase
    ):
        """Test returns playlist with tracks and calculated duration."""
        mock_get.return_value = {
            "id": "playlist-123",
            "name": "Test",
        }

        mock_tracks_response = MagicMock()
        mock_tracks_response.data = [
            {"id": "t1", "title": "Track 1", "duration": "3:30", "track_order": 1},
            {"id": "t2", "title": "Track 2", "duration": "4:15", "track_order": 2},
        ]
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = (
            mock_tracks_response
        )

        result = service.get_playlist_with_tracks("playlist-123", "user-123")

        assert result["track_count"] == 2
        assert result["total_duration"] == "7m"
        assert len(result["tracks"]) == 2

    @patch.object(PlaylistService, "get_playlist")
    def test_handles_hours_in_duration(self, mock_get, service, mock_supabase):
        """Test duration calculation with hours."""
        mock_get.return_value = {"id": "p1", "name": "Long"}

        mock_tracks = MagicMock()
        mock_tracks.data = [
            {"id": "t1", "duration": "30:00", "track_order": 1},
            {"id": "t2", "duration": "45:00", "track_order": 2},
        ]
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = (
            mock_tracks
        )

        result = service.get_playlist_with_tracks("p1", "user-123")
        assert result["total_duration"] == "1h 15m"

    @patch.object(PlaylistService, "get_playlist")
    def test_handles_tracks_without_duration(self, mock_get, service, mock_supabase):
        """Test duration calculation skips tracks without valid duration."""
        mock_get.return_value = {"id": "p1", "name": "Mixed"}

        mock_tracks = MagicMock()
        mock_tracks.data = [
            {"id": "t1", "duration": None, "track_order": 1},
            {"id": "t2", "duration": "3:30", "track_order": 2},
        ]
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = (
            mock_tracks
        )

        result = service.get_playlist_with_tracks("p1", "user-123")
        assert result["total_duration"] == "3m"


class TestListPlaylists:
    """Tests for PlaylistService.list_playlists."""

    def test_list_with_pagination(self, service, mock_supabase):
        """Test listing playlists with pagination."""
        # Build the playlist query chain
        playlist_query = MagicMock()
        playlist_response = MagicMock()
        playlist_response.data = [{"id": "p1", "name": "Playlist 1"}]
        playlist_response.count = 1
        playlist_query.eq.return_value = playlist_query
        playlist_query.order.return_value = playlist_query
        playlist_query.range.return_value = playlist_query
        playlist_query.execute.return_value = playlist_response

        # Build the track count chain
        count_query = MagicMock()
        count_response = MagicMock()
        count_response.count = 5
        count_query.eq.return_value = count_query
        count_query.execute.return_value = count_response

        # Distinguish between table("playlists") and table("playlist_tracks")
        def table_side_effect(name: str) -> MagicMock:
            tbl = MagicMock()
            if name == "playlists":
                tbl.select.return_value = playlist_query
            else:
                tbl.select.return_value = count_query
            return tbl

        mock_supabase.table.side_effect = table_side_effect

        playlists, total = service.list_playlists("user-123", page=1, page_size=50)

        assert total == 1
        assert len(playlists) == 1
        assert playlists[0]["track_count"] == 5


class TestUpdatePlaylist:
    """Tests for PlaylistService.update_playlist."""

    def test_updates_playlist(self, service, mock_supabase):
        """Test updating playlist fields."""
        mock_response = MagicMock()
        mock_response.data = [
            {"id": "p1", "name": "Updated", "tags": ["new"]},
        ]
        mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = (
            mock_response
        )

        count_response = MagicMock()
        count_response.count = 3
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = (
            count_response
        )

        result = service.update_playlist("p1", "user-123", {"name": "Updated"})

        assert result["name"] == "Updated"
        assert result["track_count"] == 3

    def test_returns_none_when_not_found(self, service, mock_supabase):
        """Test updating non-existent playlist."""
        mock_response = MagicMock()
        mock_response.data = []
        mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = (
            mock_response
        )

        result = service.update_playlist("nonexistent", "user-123", {"name": "Test"})
        assert result is None

    @patch.object(PlaylistService, "get_playlist")
    def test_no_update_when_all_values_none(self, mock_get, service, mock_supabase):
        """Test no database update when all values are None."""
        mock_get.return_value = {"id": "p1", "name": "Original"}

        result = service.update_playlist("p1", "user-123", {"name": None})

        assert result["name"] == "Original"


class TestDeletePlaylist:
    """Tests for PlaylistService.delete_playlist."""

    def test_delete_success(self, service, mock_supabase):
        """Test successful deletion."""
        mock_response = MagicMock()
        mock_response.data = [{"id": "p1"}]
        mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = (
            mock_response
        )

        assert service.delete_playlist("p1", "user-123") is True

    def test_delete_not_found(self, service, mock_supabase):
        """Test deletion of non-existent playlist."""
        mock_response = MagicMock()
        mock_response.data = []
        mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = (
            mock_response
        )

        assert service.delete_playlist("nonexistent", "user-123") is False


class TestAddTrack:
    """Tests for PlaylistService.add_track."""

    @patch.object(PlaylistService, "get_playlist")
    def test_add_track_success(self, mock_get, service, mock_supabase):
        """Test adding track to playlist."""
        mock_get.return_value = {"id": "p1", "name": "Test"}

        # Mock getting next order
        mock_order = MagicMock()
        mock_order.data = [{"track_order": 3}]
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = (
            mock_order
        )

        # Mock insert
        mock_insert = MagicMock()
        mock_insert.data = [
            {
                "id": "track-1",
                "playlist_id": "p1",
                "title": "New Track",
                "track_order": 4,
            }
        ]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = (
            mock_insert
        )

        result = service.add_track(
            "p1",
            "user-123",
            {
                "release_id": "r1",
                "discogs_release_id": 123,
                "position": "A1",
                "title": "New Track",
                "artist": "Artist",
            },
        )

        assert result["title"] == "New Track"
        assert result["track_order"] == 4

    @patch.object(PlaylistService, "get_playlist")
    def test_add_track_playlist_not_found(self, mock_get, service, mock_supabase):
        """Test adding track to non-existent playlist raises ValueError."""
        mock_get.return_value = None

        with pytest.raises(ValueError, match="Playlist not found"):
            service.add_track("nonexistent", "user-123", {"title": "Track"})

    @patch.object(PlaylistService, "get_playlist")
    def test_add_track_first_track(self, mock_get, service, mock_supabase):
        """Test adding first track starts at order 1."""
        mock_get.return_value = {"id": "p1", "name": "Test"}

        # No existing tracks
        mock_order = MagicMock()
        mock_order.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = (
            mock_order
        )

        mock_insert = MagicMock()
        mock_insert.data = [{"id": "track-1", "track_order": 1}]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = (
            mock_insert
        )

        result = service.add_track(
            "p1",
            "user-123",
            {
                "release_id": "r1",
                "discogs_release_id": 123,
                "position": "A1",
                "title": "First Track",
                "artist": "Artist",
            },
        )

        assert result["track_order"] == 1


class TestRemoveTrack:
    """Tests for PlaylistService.remove_track."""

    @patch.object(PlaylistService, "get_playlist")
    def test_remove_track_success(self, mock_get, service, mock_supabase):
        """Test removing track from playlist."""
        mock_get.return_value = {"id": "p1"}

        mock_response = MagicMock()
        mock_response.data = [{"id": "track-1"}]
        mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = (
            mock_response
        )

        assert service.remove_track("p1", "track-1", "user-123") is True

    @patch.object(PlaylistService, "get_playlist")
    def test_remove_track_playlist_not_found(self, mock_get, service, mock_supabase):
        """Test removing track from non-existent playlist raises ValueError."""
        mock_get.return_value = None

        with pytest.raises(ValueError, match="Playlist not found"):
            service.remove_track("nonexistent", "track-1", "user-123")


class TestReorderTracks:
    """Tests for PlaylistService.reorder_tracks."""

    @patch.object(PlaylistService, "get_playlist")
    def test_reorder_tracks_success(self, mock_get, service, mock_supabase):
        """Test reordering tracks."""
        mock_get.return_value = {"id": "p1"}

        mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = (
            MagicMock()
        )

        mock_select = MagicMock()
        mock_select.data = [
            {"id": "t2", "track_order": 1},
            {"id": "t1", "track_order": 2},
        ]
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = (
            mock_select
        )

        result = service.reorder_tracks("p1", "user-123", ["t2", "t1"])

        assert len(result) == 2
        assert result[0]["id"] == "t2"

    @patch.object(PlaylistService, "get_playlist")
    def test_reorder_tracks_playlist_not_found(self, mock_get, service, mock_supabase):
        """Test reordering tracks in non-existent playlist raises ValueError."""
        mock_get.return_value = None

        with pytest.raises(ValueError, match="Playlist not found"):
            service.reorder_tracks("nonexistent", "user-123", ["t1"])

"""Tests for Pydantic models validation."""

from datetime import datetime

import pytest
from pydantic import ValidationError

from app.models import (
    AddTrackRequest,
    CreatePlaylist,
    DiscogsCallbackRequest,
    PaginatedReleases,
    PlaylistTrack,
    PlaylistWithTracks,
    Release,
    ReorderTracksRequest,
    SyncSummary,
    UpdatePlaylist,
    UpdateProfile,
)


class TestUpdateProfile:
    """Tests for UpdateProfile model validation."""

    def test_valid_display_name(self):
        profile = UpdateProfile(display_name="John Doe")
        assert profile.display_name == "John Doe"

    def test_empty_display_name_rejected(self):
        with pytest.raises(ValidationError):
            UpdateProfile(display_name="")

    def test_display_name_max_length(self):
        profile = UpdateProfile(display_name="x" * 100)
        assert len(profile.display_name) == 100

    def test_display_name_exceeds_max_length(self):
        with pytest.raises(ValidationError):
            UpdateProfile(display_name="x" * 101)

    def test_display_name_required(self):
        with pytest.raises(ValidationError):
            UpdateProfile()  # type: ignore[call-arg]


class TestDiscogsCallbackRequest:
    """Tests for DiscogsCallbackRequest model validation."""

    def test_valid_callback_request(self):
        req = DiscogsCallbackRequest(oauth_verifier="abc123", state="encrypted_state")
        assert req.oauth_verifier == "abc123"
        assert req.state == "encrypted_state"

    def test_empty_oauth_verifier_rejected(self):
        with pytest.raises(ValidationError):
            DiscogsCallbackRequest(oauth_verifier="", state="state")

    def test_empty_state_rejected(self):
        with pytest.raises(ValidationError):
            DiscogsCallbackRequest(oauth_verifier="verifier", state="")

    def test_missing_fields_rejected(self):
        with pytest.raises(ValidationError):
            DiscogsCallbackRequest()  # type: ignore[call-arg]


class TestCreatePlaylist:
    """Tests for CreatePlaylist model validation."""

    def test_valid_playlist(self):
        playlist = CreatePlaylist(
            name="Test Playlist",
            description="A description",
            tags=["house", "techno"],
        )
        assert playlist.name == "Test Playlist"
        assert playlist.tags == ["house", "techno"]

    def test_minimal_playlist(self):
        playlist = CreatePlaylist(name="Minimal")  # type: ignore[call-arg]
        assert playlist.description is None
        assert playlist.tags == []

    def test_empty_name_rejected(self):
        with pytest.raises(ValidationError):
            CreatePlaylist(name="")  # type: ignore[call-arg]

    def test_name_exceeds_max_length(self):
        with pytest.raises(ValidationError):
            CreatePlaylist(name="x" * 201)  # type: ignore[call-arg]

    def test_description_max_length(self):
        playlist = CreatePlaylist(name="Test", description="x" * 1000)
        assert playlist.description is not None
        assert len(playlist.description) == 1000

    def test_description_exceeds_max_length(self):
        with pytest.raises(ValidationError):
            CreatePlaylist(name="Test", description="x" * 1001)


class TestUpdatePlaylist:
    """Tests for UpdatePlaylist model validation."""

    def test_partial_update(self):
        update = UpdatePlaylist(name="New Name")  # type: ignore[call-arg]
        assert update.name == "New Name"
        assert update.description is None
        assert update.tags is None

    def test_empty_name_rejected(self):
        with pytest.raises(ValidationError):
            UpdatePlaylist(name="")  # type: ignore[call-arg]

    def test_all_none_allowed(self):
        update = UpdatePlaylist()  # type: ignore[call-arg]
        assert update.name is None


class TestAddTrackRequest:
    """Tests for AddTrackRequest model validation."""

    def test_valid_track(self):
        track = AddTrackRequest(
            release_id="r-1",
            discogs_release_id=12345,
            position="A1",
            title="Test Track",
            artist="Test Artist",
            duration="6:42",
            cover_image_url=None,
        )
        assert track.title == "Test Track"
        assert track.duration == "6:42"

    def test_minimal_track(self):
        track = AddTrackRequest(
            release_id="r-1",
            discogs_release_id=12345,
            position="A1",
            title="Test",
            artist="Artist",
            duration=None,
            cover_image_url=None,
        )
        assert track.duration is None
        assert track.cover_image_url is None

    def test_empty_title_rejected(self):
        with pytest.raises(ValidationError):
            AddTrackRequest(
                release_id="r-1",
                discogs_release_id=12345,
                position="A1",
                title="",
                artist="Artist",
                duration=None,
                cover_image_url=None,
            )

    def test_empty_artist_rejected(self):
        with pytest.raises(ValidationError):
            AddTrackRequest(
                release_id="r-1",
                discogs_release_id=12345,
                position="A1",
                title="Track",
                artist="",
                duration=None,
                cover_image_url=None,
            )


class TestReorderTracksRequest:
    """Tests for ReorderTracksRequest model validation."""

    def test_valid_reorder(self):
        req = ReorderTracksRequest(track_ids=["t1", "t2", "t3"])
        assert len(req.track_ids) == 3

    def test_missing_track_ids_rejected(self):
        with pytest.raises(ValidationError):
            ReorderTracksRequest()  # type: ignore[call-arg]


class TestRelease:
    """Tests for Release model."""

    def test_valid_release(self):
        release = Release(
            id="r-1",
            user_id="u-1",
            discogs_release_id=123,
            discogs_instance_id=456,
            title="Test Album",
            artist_name="Test Artist",
            synced_at=datetime.now(),
            created_at=datetime.now(),
        )
        assert release.title == "Test Album"
        assert release.genres == []
        assert release.styles == []
        assert release.year is None

    def test_release_with_all_optional_fields(self):
        release = Release(
            id="r-1",
            user_id="u-1",
            discogs_release_id=123,
            discogs_instance_id=456,
            title="Full Album",
            artist_name="Full Artist",
            year=2020,
            cover_image_url="https://example.com/cover.jpg",
            format="LP",
            genres=["Electronic"],
            styles=["House"],
            labels=["Label"],
            catalog_number="CAT001",
            country="US",
            synced_at=datetime.now(),
            created_at=datetime.now(),
        )
        assert release.year == 2020
        assert release.genres == ["Electronic"]


class TestSyncSummary:
    """Tests for SyncSummary model."""

    def test_valid_summary(self):
        summary = SyncSummary(added=5, updated=3, removed=1, total=10)
        assert summary.added == 5
        assert summary.total == 10


class TestPaginatedReleases:
    """Tests for PaginatedReleases model."""

    def test_valid_paginated(self):
        paginated = PaginatedReleases(
            items=[],
            total=0,
            page=1,
            page_size=50,
            has_more=False,
        )
        assert paginated.total == 0
        assert paginated.has_more is False


class TestPlaylistWithTracks:
    """Tests for PlaylistWithTracks model."""

    def test_playlist_with_tracks(self):
        playlist = PlaylistWithTracks(
            id="p-1",
            user_id="u-1",
            name="Test",
            created_at=datetime.now(),
            tracks=[
                PlaylistTrack(
                    id="t-1",
                    playlist_id="p-1",
                    release_id="r-1",
                    discogs_release_id=123,
                    position="A1",
                    title="Track 1",
                    artist="Artist",
                    track_order=1,
                    created_at=datetime.now(),
                )
            ],
            total_duration="5m",
        )
        assert len(playlist.tracks) == 1
        assert playlist.total_duration == "5m"
        assert playlist.track_count == 0  # Default, not auto-calculated

    def test_empty_playlist(self):
        playlist = PlaylistWithTracks(
            id="p-1",
            user_id="u-1",
            name="Empty",
            created_at=datetime.now(),
        )
        assert playlist.tracks == []
        assert playlist.total_duration is None

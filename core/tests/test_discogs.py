"""Tests for Discogs OAuth endpoints."""

from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest


@pytest.fixture
def mock_user_data():
    """Mock user profile data."""
    return {
        "id": "user-123",
        "email": "test@example.com",
        "display_name": "Test User",
        "avatar_url": None,
        "discogs_username": None,
        "discogs_connected_at": None,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
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


class TestDiscogsAuthorize:
    """Tests for POST /api/discogs/authorize endpoint."""

    @patch("app.routers.discogs.Config")
    @patch("app.routers.discogs.get_discogs_service")
    @patch("app.dependencies.get_supabase")
    def test_authorize_success(
        self,
        mock_dep_supabase,
        mock_get_service,
        mock_config,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test POST /api/discogs/authorize with valid authentication."""
        # Mock Discogs configuration
        mock_config.is_discogs_configured.return_value = True

        # Mock auth validation
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock Discogs service
        mock_service = MagicMock()
        mock_service.get_authorize_url.return_value = (
            "https://discogs.com/oauth/authorize?token=xxx",
            "encrypted_state_token",
        )
        mock_get_service.return_value = mock_service

        response = client.post(
            "/api/discogs/authorize?callback_url=http://localhost:3000/discogs/callback",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "authorization_url" in data
        assert "state" in data
        assert data["authorization_url"] == "https://discogs.com/oauth/authorize?token=xxx"
        assert data["state"] == "encrypted_state_token"

    def test_authorize_unauthorized(self, client):
        """Test POST /api/discogs/authorize without authentication."""
        response = client.post(
            "/api/discogs/authorize?callback_url=http://localhost:3000/discogs/callback"
        )

        assert response.status_code == 401

    @patch("app.routers.discogs.Config")
    @patch("app.dependencies.get_supabase")
    def test_authorize_discogs_not_configured(
        self,
        mock_dep_supabase,
        mock_config,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test POST /api/discogs/authorize when Discogs is not configured."""
        # Mock Discogs not configured
        mock_config.is_discogs_configured.return_value = False

        # Mock auth validation
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        response = client.post(
            "/api/discogs/authorize?callback_url=http://localhost:3000/discogs/callback",
            headers=auth_headers,
        )

        assert response.status_code == 503
        assert "not configured" in response.json()["detail"].lower()


class TestDiscogsCallback:
    """Tests for POST /api/discogs/callback endpoint."""

    @patch("app.routers.discogs.Config")
    @patch("app.routers.discogs.get_supabase")
    @patch("app.routers.discogs.get_discogs_service")
    @patch("app.dependencies.get_supabase")
    def test_callback_success(
        self,
        mock_dep_supabase,
        mock_get_service,
        mock_router_supabase,
        mock_config,
        client,
        auth_headers,
        mock_auth_response,
        mock_user_data,
    ):
        """Test POST /api/discogs/callback with valid verifier and state."""
        # Mock Discogs configuration
        mock_config.is_discogs_configured.return_value = True

        # Mock auth validation
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock Discogs service
        mock_service = MagicMock()
        mock_service.exchange_tokens.return_value = ("access_token", "access_secret")
        mock_service.get_user_identity.return_value = "testdiscogsuser"
        mock_get_service.return_value = mock_service

        # Mock database update
        mock_router_client = MagicMock()
        updated_data = {
            **mock_user_data,
            "discogs_username": "testdiscogsuser",
            "discogs_connected_at": datetime.now().isoformat(),
        }
        mock_response = MagicMock()
        mock_response.data = [updated_data]
        mock_router_client.table.return_value.update.return_value.eq.return_value.execute.return_value = (
            mock_response
        )
        mock_router_supabase.return_value = mock_router_client

        response = client.post(
            "/api/discogs/callback",
            headers=auth_headers,
            json={
                "oauth_verifier": "verifier123",
                "state": "encrypted_state",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["discogs_username"] == "testdiscogsuser"
        assert data["discogs_connected_at"] is not None

    def test_callback_unauthorized(self, client):
        """Test POST /api/discogs/callback without authentication."""
        response = client.post(
            "/api/discogs/callback",
            json={
                "oauth_verifier": "verifier123",
                "state": "encrypted_state",
            },
        )

        assert response.status_code == 401

    @patch("app.routers.discogs.Config")
    @patch("app.routers.discogs.get_discogs_service")
    @patch("app.dependencies.get_supabase")
    def test_callback_invalid_state(
        self,
        mock_dep_supabase,
        mock_get_service,
        mock_config,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test POST /api/discogs/callback with invalid/expired state."""
        from app.services.discogs import DiscogsOAuthError

        # Mock Discogs configuration
        mock_config.is_discogs_configured.return_value = True

        # Mock auth validation
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock Discogs service to raise error
        mock_service = MagicMock()
        mock_service.exchange_tokens.side_effect = DiscogsOAuthError(
            "Authorization session expired. Please try again."
        )
        mock_get_service.return_value = mock_service

        response = client.post(
            "/api/discogs/callback",
            headers=auth_headers,
            json={
                "oauth_verifier": "verifier123",
                "state": "invalid_state",
            },
        )

        assert response.status_code == 400
        assert "expired" in response.json()["detail"].lower()

    @patch("app.routers.discogs.Config")
    @patch("app.dependencies.get_supabase")
    def test_callback_validation_empty_verifier(
        self,
        mock_dep_supabase,
        mock_config,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test POST /api/discogs/callback with empty oauth_verifier."""
        # Mock Discogs configuration
        mock_config.is_discogs_configured.return_value = True

        # Mock auth validation
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        response = client.post(
            "/api/discogs/callback",
            headers=auth_headers,
            json={
                "oauth_verifier": "",
                "state": "some_state",
            },
        )

        assert response.status_code == 422  # Validation error


class TestDiscogsDisconnect:
    """Tests for DELETE /api/discogs/disconnect endpoint."""

    @patch("app.routers.discogs.get_supabase")
    @patch("app.dependencies.get_supabase")
    def test_disconnect_success(
        self,
        mock_dep_supabase,
        mock_router_supabase,
        client,
        auth_headers,
        mock_auth_response,
        mock_user_data,
    ):
        """Test DELETE /api/discogs/disconnect with valid authentication."""
        # Mock auth validation
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock database update
        mock_router_client = MagicMock()
        updated_data = {
            **mock_user_data,
            "discogs_username": None,
            "discogs_access_token": None,
            "discogs_access_token_secret": None,
            "discogs_connected_at": None,
        }
        mock_response = MagicMock()
        mock_response.data = [updated_data]
        mock_router_client.table.return_value.update.return_value.eq.return_value.execute.return_value = (
            mock_response
        )
        mock_router_supabase.return_value = mock_router_client

        response = client.delete(
            "/api/discogs/disconnect",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["discogs_username"] is None

    def test_disconnect_unauthorized(self, client):
        """Test DELETE /api/discogs/disconnect without authentication."""
        response = client.delete("/api/discogs/disconnect")

        assert response.status_code == 401

    @patch("app.routers.discogs.get_supabase")
    @patch("app.dependencies.get_supabase")
    def test_disconnect_user_not_found(
        self,
        mock_dep_supabase,
        mock_router_supabase,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test DELETE /api/discogs/disconnect when user doesn't exist."""
        # Mock auth validation
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock database update to return no data
        mock_router_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = []
        mock_router_client.table.return_value.update.return_value.eq.return_value.execute.return_value = (
            mock_response
        )
        mock_router_supabase.return_value = mock_router_client

        response = client.delete(
            "/api/discogs/disconnect",
            headers=auth_headers,
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

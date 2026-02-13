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


class TestGetCurrentUser:
    """Tests for GET /api/users/me endpoint."""

    @patch("app.routers.users.get_supabase")
    @patch("app.dependencies.get_supabase")
    def test_get_current_user_success(
        self,
        mock_dep_supabase,
        mock_router_supabase,
        client,
        auth_headers,
        mock_auth_response,
        mock_user_data,
    ):
        """Test GET /api/users/me with valid authentication."""
        # Mock dependency auth validation
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock router database query
        mock_router_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = mock_user_data
        mock_router_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = (
            mock_response
        )
        mock_router_supabase.return_value = mock_router_client

        response = client.get("/api/users/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "user-123"
        assert data["email"] == "test@example.com"
        assert data["display_name"] == "Test User"

    def test_get_current_user_unauthorized(self, client):
        """Test GET /api/users/me without authentication."""
        response = client.get("/api/users/me")

        assert response.status_code == 401  # HTTPBearer returns 401 when no token

    @patch("app.routers.users.get_supabase")
    @patch("app.dependencies.get_supabase")
    def test_get_current_user_invalid_token(
        self,
        mock_dep_supabase,
        mock_router_supabase,
        client,
    ):
        """Test GET /api/users/me with invalid JWT token."""
        # Mock auth validation to raise exception
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.side_effect = Exception("Invalid token")
        mock_dep_supabase.return_value = mock_dep_client

        response = client.get(
            "/api/users/me", headers={"Authorization": "Bearer invalid-token"}
        )

        assert response.status_code == 401

    @patch("app.routers.users.get_supabase")
    @patch("app.dependencies.get_supabase")
    def test_get_current_user_not_found(
        self,
        mock_dep_supabase,
        mock_router_supabase,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test GET /api/users/me when user doesn't exist in database."""
        # Mock dependency auth validation
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock router database query to return no data
        mock_router_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = None
        mock_router_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = (
            mock_response
        )
        mock_router_supabase.return_value = mock_router_client

        response = client.get("/api/users/me", headers=auth_headers)

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


class TestUpdateCurrentUser:
    """Tests for PATCH /api/users/me endpoint."""

    @patch("app.routers.users.get_supabase")
    @patch("app.dependencies.get_supabase")
    def test_update_display_name_success(
        self,
        mock_dep_supabase,
        mock_router_supabase,
        client,
        auth_headers,
        mock_auth_response,
        mock_user_data,
    ):
        """Test PATCH /api/users/me with valid display_name."""
        # Mock dependency auth validation
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock router database update
        mock_router_client = MagicMock()
        updated_data = {**mock_user_data, "display_name": "New Name"}
        mock_response = MagicMock()
        mock_response.data = [updated_data]
        mock_router_client.table.return_value.update.return_value.eq.return_value.execute.return_value = (
            mock_response
        )
        mock_router_supabase.return_value = mock_router_client

        response = client.patch(
            "/api/users/me",
            headers=auth_headers,
            json={"display_name": "New Name"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["display_name"] == "New Name"

    def test_update_display_name_unauthorized(self, client):
        """Test PATCH /api/users/me without authentication."""
        response = client.patch(
            "/api/users/me",
            json={"display_name": "New Name"},
        )

        assert response.status_code == 401

    @patch("app.routers.users.get_supabase")
    @patch("app.dependencies.get_supabase")
    def test_update_display_name_validation_empty(
        self,
        mock_dep_supabase,
        mock_router_supabase,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test PATCH /api/users/me with empty display_name."""
        # Mock dependency auth validation
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        response = client.patch(
            "/api/users/me",
            headers=auth_headers,
            json={"display_name": ""},
        )

        assert response.status_code == 422  # Validation error

    @patch("app.routers.users.get_supabase")
    @patch("app.dependencies.get_supabase")
    def test_update_display_name_validation_too_long(
        self,
        mock_dep_supabase,
        mock_router_supabase,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test PATCH /api/users/me with display_name exceeding max length."""
        # Mock dependency auth validation
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        response = client.patch(
            "/api/users/me",
            headers=auth_headers,
            json={"display_name": "x" * 101},  # Exceeds 100 char limit
        )

        assert response.status_code == 422  # Validation error

    @patch("app.routers.users.get_supabase")
    @patch("app.dependencies.get_supabase")
    def test_update_display_name_user_not_found(
        self,
        mock_dep_supabase,
        mock_router_supabase,
        client,
        auth_headers,
        mock_auth_response,
    ):
        """Test PATCH /api/users/me when user doesn't exist."""
        # Mock dependency auth validation
        mock_dep_client = MagicMock()
        mock_dep_client.auth.get_user.return_value = mock_auth_response
        mock_dep_supabase.return_value = mock_dep_client

        # Mock router database update to return no data
        mock_router_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = []
        mock_router_client.table.return_value.update.return_value.eq.return_value.execute.return_value = (
            mock_response
        )
        mock_router_supabase.return_value = mock_router_client

        response = client.patch(
            "/api/users/me",
            headers=auth_headers,
            json={"display_name": "New Name"},
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

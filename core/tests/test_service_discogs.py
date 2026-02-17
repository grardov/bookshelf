"""Tests for DiscogsService business logic."""

import json
from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest

from app.services.discogs import DiscogsOAuthError, DiscogsService


@pytest.fixture
def mock_config():
    """Patch Config class attributes for DiscogsService."""
    with (
        patch("app.services.discogs.Config") as mock_cfg,
        patch("app.config.Config") as mock_cfg2,
    ):
        mock_cfg.DISCOGS_CONSUMER_KEY = "test-key"
        mock_cfg.DISCOGS_CONSUMER_SECRET = "test-secret"
        mock_cfg.DISCOGS_USER_AGENT = "TestAgent/1.0"
        mock_cfg.STATE_ENCRYPTION_KEY = "a" * 64
        mock_cfg2.DISCOGS_CONSUMER_KEY = "test-key"
        mock_cfg2.DISCOGS_CONSUMER_SECRET = "test-secret"
        mock_cfg2.DISCOGS_USER_AGENT = "TestAgent/1.0"
        mock_cfg2.STATE_ENCRYPTION_KEY = "a" * 64
        yield mock_cfg


@pytest.fixture
def service(mock_config):
    """Create a DiscogsService instance with mocked config."""
    return DiscogsService()


class TestGetAuthorizeUrl:
    """Tests for DiscogsService.get_authorize_url."""

    @patch("app.services.discogs.discogs_client.Client")
    def test_returns_url_and_encrypted_state(self, mock_client_cls, service):
        """Test that get_authorize_url returns authorization URL and encrypted state."""
        mock_client = MagicMock()
        mock_client.get_authorize_url.return_value = (
            "req_token",
            "req_secret",
            "https://discogs.com/oauth/authorize?token=req_token",
        )
        mock_client_cls.return_value = mock_client

        url, state = service.get_authorize_url("http://localhost:3000/callback")

        assert url == "https://discogs.com/oauth/authorize?token=req_token"
        assert isinstance(state, str)
        assert len(state) > 0

        mock_client.get_authorize_url.assert_called_once_with(
            callback_url="http://localhost:3000/callback"
        )

    @patch("app.services.discogs.discogs_client.Client")
    def test_encrypted_state_can_be_decrypted(self, mock_client_cls, service):
        """Test that the encrypted state contains valid data."""
        mock_client = MagicMock()
        mock_client.get_authorize_url.return_value = (
            "req_token",
            "req_secret",
            "https://discogs.com/oauth/authorize",
        )
        mock_client_cls.return_value = mock_client

        _, state = service.get_authorize_url("http://localhost:3000/callback")

        # Decrypt the state and verify contents
        state_json = service._fernet.decrypt(state.encode())
        state_data = json.loads(state_json)

        assert state_data["request_token"] == "req_token"
        assert state_data["request_secret"] == "req_secret"
        assert "nonce" in state_data
        assert "expires_at" in state_data


class TestExchangeTokens:
    """Tests for DiscogsService.exchange_tokens."""

    @patch("app.services.discogs.discogs_client.Client")
    def test_exchange_tokens_success(self, mock_client_cls, service):
        """Test successful token exchange."""
        # Create valid encrypted state
        state_data = {
            "request_token": "req_token",
            "request_secret": "req_secret",
            "nonce": "test_nonce",
            "expires_at": (datetime.now(UTC) + timedelta(minutes=5)).isoformat(),
        }
        encrypted_state = service._fernet.encrypt(
            json.dumps(state_data).encode()
        ).decode()

        mock_client = MagicMock()
        mock_client.get_access_token.return_value = ("access_token", "access_secret")
        mock_client_cls.return_value = mock_client

        access, secret = service.exchange_tokens("verifier123", encrypted_state)

        assert access == "access_token"
        assert secret == "access_secret"
        mock_client.set_token.assert_called_once_with("req_token", "req_secret")
        mock_client.get_access_token.assert_called_once_with("verifier123")

    def test_exchange_tokens_invalid_state(self, service):
        """Test token exchange with invalid encrypted state."""
        with pytest.raises(DiscogsOAuthError, match="Invalid state parameter"):
            service.exchange_tokens("verifier123", "invalid_encrypted_state")

    def test_exchange_tokens_expired_state(self, service):
        """Test token exchange with expired state."""
        state_data = {
            "request_token": "req_token",
            "request_secret": "req_secret",
            "nonce": "test_nonce",
            "expires_at": (datetime.now(UTC) - timedelta(minutes=1)).isoformat(),
        }
        encrypted_state = service._fernet.encrypt(
            json.dumps(state_data).encode()
        ).decode()

        with pytest.raises(DiscogsOAuthError, match="expired"):
            service.exchange_tokens("verifier123", encrypted_state)

    @patch("app.services.discogs.discogs_client.Client")
    def test_exchange_tokens_discogs_error(self, mock_client_cls, service):
        """Test token exchange when Discogs API fails."""
        state_data = {
            "request_token": "req_token",
            "request_secret": "req_secret",
            "nonce": "test_nonce",
            "expires_at": (datetime.now(UTC) + timedelta(minutes=5)).isoformat(),
        }
        encrypted_state = service._fernet.encrypt(
            json.dumps(state_data).encode()
        ).decode()

        mock_client = MagicMock()
        mock_client.get_access_token.side_effect = Exception("API error")
        mock_client_cls.return_value = mock_client

        with pytest.raises(DiscogsOAuthError, match="Failed to exchange tokens"):
            service.exchange_tokens("verifier123", encrypted_state)


class TestGetUserIdentity:
    """Tests for DiscogsService.get_user_identity."""

    @patch("app.services.discogs.discogs_client.Client")
    def test_get_user_identity_success(self, mock_client_cls, service):
        """Test successful user identity fetch."""
        mock_identity = MagicMock()
        mock_identity.username = "testuser"

        mock_client = MagicMock()
        mock_client.identity.return_value = mock_identity
        mock_client_cls.return_value = mock_client

        username = service.get_user_identity("access_token", "access_secret")

        assert username == "testuser"
        mock_client.set_token.assert_called_once_with("access_token", "access_secret")

    @patch("app.services.discogs.discogs_client.Client")
    def test_get_user_identity_failure(self, mock_client_cls, service):
        """Test user identity fetch failure."""
        mock_client = MagicMock()
        mock_client.identity.side_effect = Exception("API error")
        mock_client_cls.return_value = mock_client

        with pytest.raises(DiscogsOAuthError, match="Failed to fetch user identity"):
            service.get_user_identity("access_token", "access_secret")

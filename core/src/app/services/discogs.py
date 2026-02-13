"""Discogs OAuth 1.0a service wrapper."""

import base64
import json
import secrets
from datetime import UTC, datetime, timedelta

import discogs_client
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.config import Config


class DiscogsOAuthError(Exception):
    """Custom exception for Discogs OAuth errors."""

    pass


class DiscogsService:
    """Service for Discogs OAuth 1.0a operations."""

    def __init__(self) -> None:
        self.consumer_key = Config.DISCOGS_CONSUMER_KEY
        self.consumer_secret = Config.DISCOGS_CONSUMER_SECRET
        self.user_agent = Config.DISCOGS_USER_AGENT
        self._fernet = self._create_fernet()

    def _create_fernet(self) -> Fernet:
        """Create Fernet instance for state encryption."""
        # Derive a proper key from the state encryption key
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b"bookshelf-discogs-oauth",  # Static salt is fine for this use case
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(
            kdf.derive(Config.STATE_ENCRYPTION_KEY.encode())
        )
        return Fernet(key)

    def _create_client(self) -> discogs_client.Client:
        """Create a new Discogs client instance."""
        return discogs_client.Client(
            self.user_agent,
            consumer_key=self.consumer_key,
            consumer_secret=self.consumer_secret,
        )

    def get_authorize_url(self, callback_url: str) -> tuple[str, str]:
        """Generate authorization URL and encrypted state.

        Args:
            callback_url: URL to redirect back to after authorization

        Returns:
            Tuple of (authorization_url, encrypted_state)
        """
        client = self._create_client()

        # Get request token and authorization URL
        request_token, request_secret, authorize_url = client.get_authorize_url(
            callback_url=callback_url
        )

        # Create state object with request credentials and expiration
        state_data = {
            "request_token": request_token,
            "request_secret": request_secret,
            "nonce": secrets.token_hex(16),  # Prevent replay attacks
            "expires_at": (datetime.now(UTC) + timedelta(minutes=10)).isoformat(),
        }

        # Encrypt state
        encrypted_state = self._fernet.encrypt(json.dumps(state_data).encode()).decode()

        return authorize_url, encrypted_state

    def exchange_tokens(
        self,
        oauth_verifier: str,
        encrypted_state: str,
    ) -> tuple[str, str]:
        """Exchange OAuth verifier for access tokens.

        Args:
            oauth_verifier: Verifier from Discogs callback
            encrypted_state: Encrypted state from authorization step

        Returns:
            Tuple of (access_token, access_token_secret)

        Raises:
            DiscogsOAuthError: If state is invalid, expired, or token exchange fails
        """
        # Decrypt and validate state
        try:
            state_json = self._fernet.decrypt(encrypted_state.encode())
            state_data = json.loads(state_json)
        except Exception as e:
            raise DiscogsOAuthError(f"Invalid state parameter: {e}") from e

        # Check expiration
        expires_at = datetime.fromisoformat(state_data["expires_at"])
        if datetime.now(UTC) > expires_at:
            raise DiscogsOAuthError("Authorization session expired. Please try again.")

        # Create client and set request token
        client = self._create_client()
        client.set_token(state_data["request_token"], state_data["request_secret"])

        # Exchange for access token
        try:
            access_token, access_token_secret = client.get_access_token(oauth_verifier)
        except Exception as e:
            raise DiscogsOAuthError(f"Failed to exchange tokens: {e}") from e

        return access_token, access_token_secret

    def get_user_identity(
        self,
        access_token: str,
        access_token_secret: str,
    ) -> str:
        """Get Discogs username using access tokens.

        Args:
            access_token: OAuth access token
            access_token_secret: OAuth access token secret

        Returns:
            Discogs username

        Raises:
            DiscogsOAuthError: If identity fetch fails
        """
        client = self._create_client()
        client.set_token(access_token, access_token_secret)

        try:
            identity = client.identity()
            return str(identity.username)
        except Exception as e:
            raise DiscogsOAuthError(f"Failed to fetch user identity: {e}") from e


# Singleton instance
_discogs_service: DiscogsService | None = None


def get_discogs_service() -> DiscogsService:
    """Get or create Discogs service singleton."""
    global _discogs_service
    if _discogs_service is None:
        _discogs_service = DiscogsService()
    return _discogs_service

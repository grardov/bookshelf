import logging
import os

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)


class Config:
    """Application configuration loaded from environment variables."""

    # Supabase configuration (required)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Discogs OAuth 1.0a configuration (optional, but required together)
    DISCOGS_CONSUMER_KEY: str = os.getenv("DISCOGS_CONSUMER_KEY", "")
    DISCOGS_CONSUMER_SECRET: str = os.getenv("DISCOGS_CONSUMER_SECRET", "")
    DISCOGS_USER_AGENT: str = os.getenv("DISCOGS_USER_AGENT", "Bookshelf/0.1.0")

    # State encryption key for OAuth flow (required if Discogs is configured)
    STATE_ENCRYPTION_KEY: str = os.getenv("STATE_ENCRYPTION_KEY", "")

    # CORS allowed origins (comma-separated)
    ALLOWED_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
        if origin.strip()
    ]

    @classmethod
    def validate(cls) -> None:
        """Validate that required environment variables are set."""
        missing = []
        if not cls.SUPABASE_URL:
            missing.append("SUPABASE_URL")
        if not cls.SUPABASE_SERVICE_ROLE_KEY:
            missing.append("SUPABASE_SERVICE_ROLE_KEY")

        if missing:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing)}"
            )

        # Warn about incomplete Discogs configuration (optional feature)
        discogs_partial = cls.DISCOGS_CONSUMER_KEY or cls.DISCOGS_CONSUMER_SECRET
        if discogs_partial and not cls.is_discogs_configured():
            logger.warning(
                "Discogs OAuth is partially configured. "
                "Set all of DISCOGS_CONSUMER_KEY, DISCOGS_CONSUMER_SECRET, "
                "and STATE_ENCRYPTION_KEY to enable Discogs integration."
            )

    @classmethod
    def is_discogs_configured(cls) -> bool:
        """Check if Discogs OAuth is fully configured."""
        return bool(
            cls.DISCOGS_CONSUMER_KEY
            and cls.DISCOGS_CONSUMER_SECRET
            and cls.STATE_ENCRYPTION_KEY
        )


# Validate configuration on module import
Config.validate()

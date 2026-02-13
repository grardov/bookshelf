from supabase import Client, create_client

from app.config import Config

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Get Supabase client singleton.

    Returns:
        Initialized Supabase client

    Note:
        Uses SERVICE_ROLE_KEY for admin operations, but user endpoints
        should validate JWT tokens from clients to enforce RLS policies.
    """
    global _supabase_client

    if _supabase_client is None:
        _supabase_client = create_client(
            Config.SUPABASE_URL,
            Config.SUPABASE_SERVICE_ROLE_KEY,
        )

    return _supabase_client

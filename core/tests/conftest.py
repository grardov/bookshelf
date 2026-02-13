import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """FastAPI test client fixture."""
    return TestClient(app)


@pytest.fixture
def mock_supabase_user():
    """Mock Supabase user data."""
    return {
        "id": "user-123",
        "email": "test@example.com",
        "user_metadata": {},
    }

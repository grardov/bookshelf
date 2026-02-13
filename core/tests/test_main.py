def test_health_check(client):
    """Test the /health endpoint returns ok status."""
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_check_returns_json(client):
    """Test the /health endpoint returns JSON content type."""
    response = client.get("/health")

    assert response.headers["content-type"] == "application/json"

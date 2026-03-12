from app.common.schemas.health import HealthResponse


def test_health_response_schema() -> None:
    payload = HealthResponse(status="ok", app="fdd-backend", environment="local")
    assert payload.status == "ok"
    assert payload.app == "fdd-backend"
    assert payload.environment == "local"

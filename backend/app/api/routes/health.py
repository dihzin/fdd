from fastapi import APIRouter

from app.common.schemas.health import HealthResponse
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=HealthResponse)
def healthcheck() -> HealthResponse:
    return HealthResponse(status="ok", app=settings.app_name, environment=settings.environment)

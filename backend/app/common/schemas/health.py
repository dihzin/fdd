from app.common.schemas.base import AppSchema


class HealthResponse(AppSchema):
    status: str
    app: str
    environment: str

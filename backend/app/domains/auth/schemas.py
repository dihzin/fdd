from app.common.schemas.base import AppSchema


class AuthStatusResponse(AppSchema):
    enabled: bool
    mode: str
    message: str


class CurrentUserResponse(AppSchema):
    authenticated: bool
    subject: str | None = None
    role: str | None = None

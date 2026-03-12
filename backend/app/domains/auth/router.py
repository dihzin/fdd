from fastapi import APIRouter

from app.domains.auth.schemas import AuthStatusResponse, CurrentUserResponse
from app.domains.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
service = AuthService()


@router.get("/status", response_model=AuthStatusResponse)
def auth_status() -> AuthStatusResponse:
    return service.status()


@router.get("/me", response_model=CurrentUserResponse)
def read_current_user() -> CurrentUserResponse:
    return service.current_user()

from app.domains.auth.schemas import AuthStatusResponse, CurrentUserResponse


class AuthService:
    def status(self) -> AuthStatusResponse:
        return AuthStatusResponse(
            enabled=False,
            mode="placeholder",
            message="Authentication is not implemented yet.",
        )

    def current_user(self) -> CurrentUserResponse:
        return CurrentUserResponse(authenticated=False)

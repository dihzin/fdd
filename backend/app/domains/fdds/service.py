from fastapi import HTTPException, status


class FddService:
    def list_sections(self) -> list[dict[str, str]]:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="FDD service skeleton created but not implemented.",
        )

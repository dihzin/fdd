from fastapi import HTTPException, status


class ExportService:
    def get_status(self) -> dict[str, str]:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Word export skeleton created but not implemented.",
        )

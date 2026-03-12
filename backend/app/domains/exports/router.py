from fastapi import APIRouter

from app.domains.exports.service import ExportService

router = APIRouter(prefix="/exports", tags=["exports"])


@router.get("/status")
def export_status() -> dict[str, str]:
    service = ExportService()
    return service.get_status()

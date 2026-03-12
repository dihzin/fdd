from fastapi import APIRouter

from app.domains.fdds.service import FddService

router = APIRouter(prefix="/fdds", tags=["fdds"])


@router.get("")
def list_fdds() -> list[dict[str, str]]:
    service = FddService()
    return service.list_sections()

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db_session
from app.domains.requirements.importer import RequirementImportParser
from app.domains.requirements.repository import RequirementRepository
from app.domains.requirements.schemas import (
    RequirementCreate,
    RequirementImportSummary,
    RequirementListItem,
    RequirementRead,
    RequirementUpdate,
)
from app.domains.requirements.service import RequirementService

router = APIRouter(prefix="/requirements", tags=["requirements"])


def get_requirement_service(db: Session = Depends(get_db_session)) -> RequirementService:
    return RequirementService(
        repository=RequirementRepository(db),
        import_parser=RequirementImportParser(),
    )


@router.get("", response_model=list[RequirementListItem])
def list_requirements(
    project_id: uuid.UUID = Query(...),
    service: RequirementService = Depends(get_requirement_service),
) -> list[RequirementListItem]:
    return [RequirementListItem.model_validate(item) for item in service.list_requirements(project_id)]


@router.post("", response_model=RequirementRead, status_code=status.HTTP_201_CREATED)
def create_requirement(
    payload: RequirementCreate,
    service: RequirementService = Depends(get_requirement_service),
) -> RequirementRead:
    return RequirementRead.model_validate(service.create_requirement(payload))


@router.post("/import", response_model=RequirementImportSummary, status_code=status.HTTP_201_CREATED)
async def import_requirements(
    project_id: Annotated[uuid.UUID, Form(...)],
    file: Annotated[UploadFile, File(...)],
    created_by_id: Annotated[uuid.UUID | None, Form()] = None,
    service: RequirementService = Depends(get_requirement_service),
) -> RequirementImportSummary:
    content = await file.read()
    return service.import_requirements(
        project_id=project_id,
        filename=file.filename or "requirements-import",
        content=content,
        created_by_id=created_by_id,
    )


@router.get("/{requirement_id}", response_model=RequirementRead)
def get_requirement(
    requirement_id: uuid.UUID,
    service: RequirementService = Depends(get_requirement_service),
) -> RequirementRead:
    return RequirementRead.model_validate(service.get_requirement(requirement_id))


@router.patch("/{requirement_id}", response_model=RequirementRead)
def update_requirement(
    requirement_id: uuid.UUID,
    payload: RequirementUpdate,
    service: RequirementService = Depends(get_requirement_service),
) -> RequirementRead:
    return RequirementRead.model_validate(service.update_requirement(requirement_id, payload))


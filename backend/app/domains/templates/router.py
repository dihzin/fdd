from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db_session
from app.domains.templates.repository import TemplateRepository
from app.domains.templates.schemas import TemplateCreate, TemplateListItem, TemplateRead, TemplateUpdate
from app.domains.templates.service import TemplateService

router = APIRouter(prefix="/templates", tags=["templates"])


def get_template_service(db: Session = Depends(get_db_session)) -> TemplateService:
    return TemplateService(TemplateRepository(db))


@router.get("", response_model=list[TemplateListItem])
def list_templates(
    organization_id: uuid.UUID | None = Query(default=None),
    service: TemplateService = Depends(get_template_service),
) -> list[TemplateListItem]:
    return [TemplateListItem.model_validate(item) for item in service.list_templates(organization_id)]


@router.post("", response_model=TemplateRead, status_code=status.HTTP_201_CREATED)
def create_template(
    payload: TemplateCreate,
    service: TemplateService = Depends(get_template_service),
) -> TemplateRead:
    return TemplateRead.model_validate(service.create_template(payload))


@router.get("/{template_id}", response_model=TemplateRead)
def get_template(
    template_id: uuid.UUID,
    service: TemplateService = Depends(get_template_service),
) -> TemplateRead:
    return TemplateRead.model_validate(service.get_template(template_id))


@router.patch("/{template_id}", response_model=TemplateRead)
def update_template(
    template_id: uuid.UUID,
    payload: TemplateUpdate,
    service: TemplateService = Depends(get_template_service),
) -> TemplateRead:
    return TemplateRead.model_validate(service.update_template(template_id, payload))

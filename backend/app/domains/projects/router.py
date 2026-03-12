from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db_session
from app.domains.projects.repository import ProjectRepository
from app.domains.projects.schemas import ProjectCreate, ProjectListItem, ProjectRead, ProjectUpdate
from app.domains.projects.service import ProjectService

router = APIRouter(prefix="/projects", tags=["projects"])


def get_project_service(db: Session = Depends(get_db_session)) -> ProjectService:
    return ProjectService(ProjectRepository(db))


@router.get("", response_model=list[ProjectListItem])
def list_projects(
    organization_id: uuid.UUID | None = Query(default=None),
    service: ProjectService = Depends(get_project_service),
) -> list[ProjectListItem]:
    return [ProjectListItem.model_validate(project) for project in service.list_projects(organization_id)]


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    service: ProjectService = Depends(get_project_service),
) -> ProjectRead:
    return ProjectRead.model_validate(service.create_project(payload))


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(
    project_id: uuid.UUID,
    service: ProjectService = Depends(get_project_service),
) -> ProjectRead:
    return ProjectRead.model_validate(service.get_project(project_id))


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    service: ProjectService = Depends(get_project_service),
) -> ProjectRead:
    return ProjectRead.model_validate(service.update_project(project_id, payload))

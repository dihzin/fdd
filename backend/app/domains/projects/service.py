from __future__ import annotations

import uuid

from app.common.errors.http import not_found
from app.domains.projects.models import Project
from app.domains.projects.repository import ProjectRepository
from app.domains.projects.schemas import ProjectCreate, ProjectUpdate


class ProjectService:
    def __init__(self, repository: ProjectRepository) -> None:
        self.repository = repository

    def list_projects(self, organization_id: uuid.UUID | None = None) -> list[Project]:
        return self.repository.list(organization_id=organization_id)

    def get_project(self, project_id: uuid.UUID) -> Project:
        project = self.repository.get(project_id)
        if not project:
            raise not_found("Project", project_id)
        return project

    def create_project(self, payload: ProjectCreate) -> Project:
        return self.repository.create(payload)

    def update_project(self, project_id: uuid.UUID, payload: ProjectUpdate) -> Project:
        project = self.get_project(project_id)
        return self.repository.update(project, payload)

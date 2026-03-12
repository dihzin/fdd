from __future__ import annotations

import uuid

from sqlalchemy import Select, select
from sqlalchemy.orm import Session, selectinload

from app.domains.projects.models import Project
from app.domains.projects.schemas import ProjectCreate, ProjectUpdate


class ProjectRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, organization_id: uuid.UUID | None = None) -> list[Project]:
        stmt: Select[tuple[Project]] = (
            select(Project)
            .options(selectinload(Project.members))
            .order_by(Project.created_at.desc())
        )
        if organization_id:
            stmt = stmt.where(Project.organization_id == organization_id)
        return list(self.db.scalars(stmt).all())

    def get(self, project_id: uuid.UUID) -> Project | None:
        stmt = (
            select(Project)
            .where(Project.id == project_id)
            .options(selectinload(Project.members))
        )
        return self.db.scalar(stmt)

    def create(self, payload: ProjectCreate) -> Project:
        project = Project(**payload.model_dump())
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def update(self, project: Project, payload: ProjectUpdate) -> Project:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(project, field, value)
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

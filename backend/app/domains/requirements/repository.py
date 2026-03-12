from __future__ import annotations

import uuid

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.domains.requirements.models import Requirement
from app.domains.requirements.schemas import RequirementCreate, RequirementUpdate


class RequirementRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, project_id: uuid.UUID) -> list[Requirement]:
        stmt: Select[tuple[Requirement]] = (
            select(Requirement)
            .where(Requirement.project_id == project_id)
            .order_by(Requirement.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def get(self, requirement_id: uuid.UUID) -> Requirement | None:
        stmt = select(Requirement).where(Requirement.id == requirement_id)
        return self.db.scalar(stmt)

    def get_by_project_and_code(self, project_id: uuid.UUID, code: str) -> Requirement | None:
        stmt = select(Requirement).where(
            Requirement.project_id == project_id,
            Requirement.code == code,
        )
        return self.db.scalar(stmt)

    def get_existing_codes(self, project_id: uuid.UUID, codes: set[str]) -> set[str]:
        if not codes:
            return set()

        stmt = select(Requirement.code).where(
            Requirement.project_id == project_id,
            Requirement.code.in_(codes),
        )
        return set(self.db.scalars(stmt).all())

    def create(self, payload: RequirementCreate) -> Requirement:
        requirement = Requirement(**payload.model_dump())
        self.db.add(requirement)
        self.db.commit()
        self.db.refresh(requirement)
        return requirement

    def update(self, requirement: Requirement, payload: RequirementUpdate) -> Requirement:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(requirement, field, value)
        self.db.add(requirement)
        self.db.commit()
        self.db.refresh(requirement)
        return requirement

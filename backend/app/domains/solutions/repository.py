from __future__ import annotations

import uuid

from sqlalchemy import Select, select
from sqlalchemy.orm import Session, selectinload

from app.domains.requirements.models import Requirement
from app.domains.solutions.models import Solution, SolutionRequirement
from app.domains.solutions.schemas import SolutionCreate, SolutionRequirementLinkCreate, SolutionUpdate


class SolutionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, project_id: uuid.UUID) -> list[Solution]:
        stmt: Select[tuple[Solution]] = (
            select(Solution)
            .where(Solution.project_id == project_id)
            .options(
                selectinload(Solution.solution_requirements).selectinload(SolutionRequirement.requirement)
            )
            .order_by(Solution.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def get(self, solution_id: uuid.UUID) -> Solution | None:
        stmt = (
            select(Solution)
            .where(Solution.id == solution_id)
            .options(
                selectinload(Solution.solution_requirements).selectinload(SolutionRequirement.requirement)
            )
        )
        return self.db.scalar(stmt)

    def get_by_project_and_name(self, project_id: uuid.UUID, name: str) -> Solution | None:
        stmt = select(Solution).where(
            Solution.project_id == project_id,
            Solution.name == name,
        )
        return self.db.scalar(stmt)

    def get_requirement(self, requirement_id: uuid.UUID) -> Requirement | None:
        stmt = select(Requirement).where(Requirement.id == requirement_id)
        return self.db.scalar(stmt)

    def get_solution_requirement(
        self,
        solution_id: uuid.UUID,
        requirement_id: uuid.UUID,
    ) -> SolutionRequirement | None:
        stmt = select(SolutionRequirement).where(
            SolutionRequirement.solution_id == solution_id,
            SolutionRequirement.requirement_id == requirement_id,
        )
        return self.db.scalar(stmt)

    def create(self, payload: SolutionCreate) -> Solution:
        solution = Solution(**payload.model_dump())
        self.db.add(solution)
        self.db.commit()
        self.db.refresh(solution)
        return self.get(solution.id) or solution

    def update(self, solution: Solution, payload: SolutionUpdate) -> Solution:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(solution, field, value)
        self.db.add(solution)
        self.db.commit()
        self.db.refresh(solution)
        return self.get(solution.id) or solution

    def add_requirement_link(
        self,
        solution: Solution,
        payload: SolutionRequirementLinkCreate,
    ) -> Solution:
        link = SolutionRequirement(
            solution_id=solution.id,
            requirement_id=payload.requirement_id,
            fit_type=payload.fit_type,
            rationale=payload.rationale,
            sort_order=payload.sort_order,
        )
        self.db.add(link)
        self.db.commit()
        return self.get(solution.id) or solution

    def remove_requirement_link(self, link: SolutionRequirement) -> None:
        self.db.delete(link)
        self.db.commit()

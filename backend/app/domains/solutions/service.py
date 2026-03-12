from __future__ import annotations

import uuid

from app.common.errors.http import bad_request, conflict, not_found
from app.domains.solutions.models import Solution
from app.domains.solutions.repository import SolutionRepository
from app.domains.solutions.schemas import (
    SolutionCreate,
    SolutionRequirementLinkCreate,
    SolutionUpdate,
    SolutionWizardContext,
    SolutionWizardDraftSave,
)


class SolutionService:
    def __init__(self, repository: SolutionRepository) -> None:
        self.repository = repository

    def list_solutions(self, project_id: uuid.UUID) -> list[Solution]:
        return self.repository.list(project_id=project_id)

    def get_solution(self, solution_id: uuid.UUID) -> Solution:
        solution = self.repository.get(solution_id)
        if not solution:
            raise not_found("Solution", solution_id)
        return solution

    def create_solution(self, payload: SolutionCreate) -> Solution:
        existing = self.repository.get_by_project_and_name(payload.project_id, payload.name)
        if existing:
            raise conflict(f"Solution name '{payload.name}' already exists in this project.")
        return self.repository.create(payload)

    def update_solution(self, solution_id: uuid.UUID, payload: SolutionUpdate) -> Solution:
        solution = self.get_solution(solution_id)
        if payload.name and payload.name != solution.name:
            existing = self.repository.get_by_project_and_name(solution.project_id, payload.name)
            if existing:
                raise conflict(f"Solution name '{payload.name}' already exists in this project.")
        return self.repository.update(solution, payload)

    def link_requirement(
        self,
        solution_id: uuid.UUID,
        payload: SolutionRequirementLinkCreate,
    ) -> Solution:
        solution = self.get_solution(solution_id)
        requirement = self.repository.get_requirement(payload.requirement_id)
        if not requirement:
            raise not_found("Requirement", payload.requirement_id)
        if requirement.project_id != solution.project_id:
            raise bad_request("Requirement must belong to the same project as the solution.")
        existing_link = self.repository.get_solution_requirement(solution.id, requirement.id)
        if existing_link:
            raise conflict("Requirement is already linked to this solution.")
        return self.repository.add_requirement_link(solution, payload)

    def unlink_requirement(self, solution_id: uuid.UUID, requirement_id: uuid.UUID) -> Solution:
        solution = self.get_solution(solution_id)
        link = self.repository.get_solution_requirement(solution.id, requirement_id)
        if not link:
            raise not_found("Solution requirement link", requirement_id)
        self.repository.remove_requirement_link(link)
        return self.get_solution(solution.id)

    def save_wizard_draft(
        self,
        solution_id: uuid.UUID,
        payload: SolutionWizardDraftSave,
    ) -> Solution:
        solution = self.get_solution(solution_id)
        update_payload = SolutionUpdate(wizard_context=payload.wizard_context)
        return self.repository.update(solution, update_payload)

    def get_wizard_context(self, solution_id: uuid.UUID) -> tuple[Solution, SolutionWizardContext]:
        solution = self.get_solution(solution_id)
        context = SolutionWizardContext.model_validate(solution.wizard_context or {})
        return solution, context

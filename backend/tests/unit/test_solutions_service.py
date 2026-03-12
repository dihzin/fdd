from __future__ import annotations

import uuid
from datetime import UTC, datetime

import pytest
from fastapi import HTTPException

from app.common.enums import RequirementPriority, RequirementStatus, RequirementType, SolutionStatus
from app.domains.solutions.service import SolutionService
from app.domains.solutions.schemas import (
    SolutionCreate,
    SolutionRequirementLinkCreate,
    SolutionUpdate,
    SolutionWizardDraftSave,
)


class FakeRequirement:
    def __init__(self, requirement_id: uuid.UUID, project_id: uuid.UUID, code: str) -> None:
        self.id = requirement_id
        self.project_id = project_id
        self.code = code
        self.title = f"Requirement {code}"
        self.requirement_type = RequirementType.FUNCTIONAL
        self.module = "SD"
        self.priority = RequirementPriority.MEDIUM
        self.status = RequirementStatus.DRAFT


class FakeLink:
    def __init__(self, solution_id: uuid.UUID, requirement: FakeRequirement, sort_order: int = 0) -> None:
        self.id = uuid.uuid4()
        self.solution_id = solution_id
        self.requirement_id = requirement.id
        self.requirement = requirement
        self.sort_order = sort_order
        self.fit_type = None
        self.rationale = None
        self.created_at = datetime.now(UTC)


class FakeSolution:
    def __init__(self, solution_id: uuid.UUID, project_id: uuid.UUID, name: str) -> None:
        self.id = solution_id
        self.project_id = project_id
        self.name = name
        self.description = None
        self.module = None
        self.phase = None
        self.status = SolutionStatus.DRAFT
        self.wizard_context = None
        self.created_by_id = None
        self.created_at = datetime.now(UTC)
        self.updated_at = datetime.now(UTC)
        self.solution_requirements: list[FakeLink] = []


class FakeSolutionRepository:
    def __init__(self) -> None:
        self.solutions: dict[uuid.UUID, FakeSolution] = {}
        self.requirements: dict[uuid.UUID, FakeRequirement] = {}

    def list(self, project_id: uuid.UUID):
        return [solution for solution in self.solutions.values() if solution.project_id == project_id]

    def get(self, solution_id: uuid.UUID):
        return self.solutions.get(solution_id)

    def get_by_project_and_name(self, project_id: uuid.UUID, name: str):
        for solution in self.solutions.values():
            if solution.project_id == project_id and solution.name == name:
                return solution
        return None

    def get_requirement(self, requirement_id: uuid.UUID):
        return self.requirements.get(requirement_id)

    def get_solution_requirement(self, solution_id: uuid.UUID, requirement_id: uuid.UUID):
        solution = self.solutions[solution_id]
        for link in solution.solution_requirements:
            if link.requirement_id == requirement_id:
                return link
        return None

    def create(self, payload: SolutionCreate):
        solution = FakeSolution(uuid.uuid4(), payload.project_id, payload.name)
        solution.description = payload.description
        solution.module = payload.module
        solution.phase = payload.phase
        solution.status = payload.status
        solution.wizard_context = payload.wizard_context
        self.solutions[solution.id] = solution
        return solution

    def update(self, solution: FakeSolution, payload: SolutionUpdate):
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(solution, field, value)
        solution.updated_at = datetime.now(UTC)
        return solution

    def add_requirement_link(self, solution: FakeSolution, payload: SolutionRequirementLinkCreate):
        requirement = self.requirements[payload.requirement_id]
        solution.solution_requirements.append(FakeLink(solution.id, requirement, payload.sort_order))
        return solution

    def remove_requirement_link(self, link: FakeLink):
        solution = self.solutions[link.solution_id]
        solution.solution_requirements = [item for item in solution.solution_requirements if item.id != link.id]


def test_create_solution_rejects_duplicate_name_in_project():
    repo = FakeSolutionRepository()
    project_id = uuid.uuid4()
    existing = FakeSolution(uuid.uuid4(), project_id, "OTC Core")
    repo.solutions[existing.id] = existing
    service = SolutionService(repo)

    with pytest.raises(HTTPException) as exc:
        service.create_solution(
            SolutionCreate(project_id=project_id, name="OTC Core", description=None, module=None, phase=None)
        )

    assert exc.value.status_code == 409


def test_link_requirement_rejects_requirement_from_other_project():
    repo = FakeSolutionRepository()
    solution = FakeSolution(uuid.uuid4(), uuid.uuid4(), "Billing Enhancements")
    requirement = FakeRequirement(uuid.uuid4(), uuid.uuid4(), "REQ-9")
    repo.solutions[solution.id] = solution
    repo.requirements[requirement.id] = requirement
    service = SolutionService(repo)

    with pytest.raises(HTTPException) as exc:
        service.link_requirement(
            solution.id,
            SolutionRequirementLinkCreate(requirement_id=requirement.id),
        )

    assert exc.value.status_code == 400


def test_link_and_unlink_requirement_updates_solution_links():
    repo = FakeSolutionRepository()
    project_id = uuid.uuid4()
    solution = FakeSolution(uuid.uuid4(), project_id, "Pricing")
    requirement = FakeRequirement(uuid.uuid4(), project_id, "REQ-10")
    repo.solutions[solution.id] = solution
    repo.requirements[requirement.id] = requirement
    service = SolutionService(repo)

    updated = service.link_requirement(
        solution.id,
        SolutionRequirementLinkCreate(requirement_id=requirement.id, sort_order=2),
    )
    assert len(updated.solution_requirements) == 1
    assert updated.solution_requirements[0].requirement_id == requirement.id

    updated = service.unlink_requirement(solution.id, requirement.id)
    assert updated.solution_requirements == []


def test_save_and_get_wizard_context_roundtrip():
    repo = FakeSolutionRepository()
    project_id = uuid.uuid4()
    solution = FakeSolution(uuid.uuid4(), project_id, "Pricing")
    repo.solutions[solution.id] = solution
    service = SolutionService(repo)

    payload = SolutionWizardDraftSave(
        wizard_context={
            "context": {
                "summary": "Regional rollout for OTC process harmonization.",
                "bullets": ["Brazil localization", "Shared SAP core"],
            },
            "business_problem": {
                "summary": "Manual variations by country create operational rework.",
            },
            "current_process": {"summary": "Current process is fragmented."},
            "future_process": {"summary": "Future process centralizes pricing logic."},
            "integrations": [
                {
                    "name": "Tax engine",
                    "source_system": "SAP S/4",
                    "target_system": "TaxOne",
                    "description": "Billing sends fiscal payload.",
                }
            ],
            "business_rules": [
                {"title": "Credit hold", "description": "Orders on credit hold cannot bill."}
            ],
            "technical_impacts": [
                {"area": "SD pricing", "impact": "New condition routine and output mapping."}
            ],
        }
    )

    saved = service.save_wizard_draft(solution.id, payload)
    _, wizard = service.get_wizard_context(solution.id)

    assert saved.wizard_context["context"]["summary"] == payload.wizard_context.context.summary
    assert wizard.future_process.summary == "Future process centralizes pricing logic."
    assert wizard.integrations[0].name == "Tax engine"

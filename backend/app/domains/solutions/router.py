from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db_session
from app.domains.solutions.models import Solution
from app.domains.solutions.repository import SolutionRepository
from app.domains.solutions.schemas import (
    SolutionCreate,
    SolutionListItem,
    SolutionRead,
    SolutionRequirementLinkCreate,
    SolutionUpdate,
    SolutionWizardDraftResponse,
    SolutionWizardDraftSave,
)
from app.domains.solutions.service import SolutionService

router = APIRouter(prefix="/solutions", tags=["solutions"])


def get_solution_service(db: Session = Depends(get_db_session)) -> SolutionService:
    return SolutionService(SolutionRepository(db))


def to_solution_list_item(solution: Solution) -> SolutionListItem:
    return SolutionListItem(
        id=solution.id,
        project_id=solution.project_id,
        name=solution.name,
        description=solution.description,
        module=solution.module,
        phase=solution.phase,
        status=solution.status,
        requirement_count=len(solution.solution_requirements),
        updated_at=solution.updated_at,
    )


def to_solution_read(solution: Solution) -> SolutionRead:
    return SolutionRead(
        id=solution.id,
        project_id=solution.project_id,
        name=solution.name,
        description=solution.description,
        module=solution.module,
        phase=solution.phase,
        status=solution.status,
        requirement_count=len(solution.solution_requirements),
        updated_at=solution.updated_at,
        wizard_context=solution.wizard_context,
        created_by_id=solution.created_by_id,
        created_at=solution.created_at,
        requirements=[
            {
                "link_id": link.id,
                "requirement_id": link.requirement_id,
                "code": link.requirement.code,
                "title": link.requirement.title,
                "requirement_type": link.requirement.requirement_type,
                "module": link.requirement.module,
                "priority": link.requirement.priority,
                "status": link.requirement.status,
                "sort_order": link.sort_order,
                "fit_type": link.fit_type,
                "rationale": link.rationale,
                "linked_at": link.created_at,
            }
            for link in solution.solution_requirements
        ],
    )


@router.get("", response_model=list[SolutionListItem])
def list_solutions(
    project_id: uuid.UUID = Query(...),
    service: SolutionService = Depends(get_solution_service),
) -> list[SolutionListItem]:
    return [to_solution_list_item(item) for item in service.list_solutions(project_id)]


@router.post("", response_model=SolutionRead, status_code=status.HTTP_201_CREATED)
def create_solution(
    payload: SolutionCreate,
    service: SolutionService = Depends(get_solution_service),
) -> SolutionRead:
    return to_solution_read(service.create_solution(payload))


@router.get("/{solution_id}", response_model=SolutionRead)
def get_solution(
    solution_id: uuid.UUID,
    service: SolutionService = Depends(get_solution_service),
) -> SolutionRead:
    return to_solution_read(service.get_solution(solution_id))


@router.patch("/{solution_id}", response_model=SolutionRead)
def update_solution(
    solution_id: uuid.UUID,
    payload: SolutionUpdate,
    service: SolutionService = Depends(get_solution_service),
) -> SolutionRead:
    return to_solution_read(service.update_solution(solution_id, payload))


@router.post("/{solution_id}/requirements", response_model=SolutionRead, status_code=status.HTTP_201_CREATED)
def link_requirement_to_solution(
    solution_id: uuid.UUID,
    payload: SolutionRequirementLinkCreate,
    service: SolutionService = Depends(get_solution_service),
) -> SolutionRead:
    return to_solution_read(service.link_requirement(solution_id, payload))


@router.delete(
    "/{solution_id}/requirements/{requirement_id}",
    response_model=SolutionRead,
)
def unlink_requirement_from_solution(
    solution_id: uuid.UUID,
    requirement_id: uuid.UUID,
    service: SolutionService = Depends(get_solution_service),
) -> SolutionRead:
    return to_solution_read(service.unlink_requirement(solution_id, requirement_id))


@router.get("/{solution_id}/wizard", response_model=SolutionWizardDraftResponse)
def get_solution_wizard(
    solution_id: uuid.UUID,
    service: SolutionService = Depends(get_solution_service),
) -> SolutionWizardDraftResponse:
    solution, context = service.get_wizard_context(solution_id)
    return SolutionWizardDraftResponse(
        solution_id=solution.id,
        project_id=solution.project_id,
        wizard_context=context,
        updated_at=solution.updated_at,
    )


@router.put("/{solution_id}/wizard", response_model=SolutionWizardDraftResponse)
def save_solution_wizard(
    solution_id: uuid.UUID,
    payload: SolutionWizardDraftSave,
    service: SolutionService = Depends(get_solution_service),
) -> SolutionWizardDraftResponse:
    solution = service.save_wizard_draft(solution_id, payload)
    return SolutionWizardDraftResponse(
        solution_id=solution.id,
        project_id=solution.project_id,
        wizard_context=payload.wizard_context,
        updated_at=solution.updated_at,
    )

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import Field

from app.common.enums import RequirementPriority, RequirementStatus, RequirementType, SolutionStatus
from app.common.schemas.base import AppSchema


class WizardNarrativeBlock(AppSchema):
    summary: str | None = None
    bullets: list[str] = Field(default_factory=list)


class WizardIntegrationItem(AppSchema):
    name: str = Field(max_length=120)
    source_system: str | None = Field(default=None, max_length=80)
    target_system: str | None = Field(default=None, max_length=80)
    description: str | None = None


class WizardBusinessRuleItem(AppSchema):
    title: str = Field(max_length=150)
    description: str
    criticality: str | None = Field(default=None, max_length=40)


class WizardTechnicalImpactItem(AppSchema):
    area: str = Field(max_length=120)
    impact: str
    owner: str | None = Field(default=None, max_length=120)


class SolutionWizardContext(AppSchema):
    schema_version: int = 1
    context: WizardNarrativeBlock = Field(default_factory=WizardNarrativeBlock)
    business_problem: WizardNarrativeBlock = Field(default_factory=WizardNarrativeBlock)
    current_process: WizardNarrativeBlock = Field(default_factory=WizardNarrativeBlock)
    future_process: WizardNarrativeBlock = Field(default_factory=WizardNarrativeBlock)
    integrations: list[WizardIntegrationItem] = Field(default_factory=list)
    business_rules: list[WizardBusinessRuleItem] = Field(default_factory=list)
    technical_impacts: list[WizardTechnicalImpactItem] = Field(default_factory=list)


class SolutionRequirementRead(AppSchema):
    link_id: uuid.UUID
    requirement_id: uuid.UUID
    code: str
    title: str
    requirement_type: RequirementType = Field(serialization_alias="type")
    module: str | None = None
    priority: RequirementPriority
    status: RequirementStatus
    sort_order: int
    fit_type: str | None = None
    rationale: str | None = None
    linked_at: datetime


class SolutionBase(AppSchema):
    name: str = Field(max_length=200)
    description: str | None = None
    module: str | None = Field(default=None, max_length=80)
    phase: str | None = Field(default=None, max_length=80)
    status: SolutionStatus = SolutionStatus.DRAFT
    wizard_context: SolutionWizardContext | None = None


class SolutionCreate(SolutionBase):
    project_id: uuid.UUID
    created_by_id: uuid.UUID | None = None


class SolutionUpdate(AppSchema):
    name: str | None = Field(default=None, max_length=200)
    description: str | None = None
    module: str | None = Field(default=None, max_length=80)
    phase: str | None = Field(default=None, max_length=80)
    status: SolutionStatus | None = None
    wizard_context: SolutionWizardContext | None = None


class SolutionListItem(AppSchema):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    description: str | None = None
    module: str | None = None
    phase: str | None = None
    status: SolutionStatus
    requirement_count: int
    updated_at: datetime


class SolutionRead(SolutionListItem):
    wizard_context: SolutionWizardContext | None = None
    created_by_id: uuid.UUID | None = None
    created_at: datetime
    requirements: list[SolutionRequirementRead] = Field(default_factory=list)


class SolutionRequirementLinkCreate(AppSchema):
    requirement_id: uuid.UUID
    fit_type: str | None = Field(default=None, max_length=20)
    rationale: str | None = None
    sort_order: int = 0


class SolutionWizardDraftSave(AppSchema):
    wizard_context: SolutionWizardContext


class SolutionWizardDraftResponse(AppSchema):
    solution_id: uuid.UUID
    project_id: uuid.UUID
    wizard_context: SolutionWizardContext
    updated_at: datetime

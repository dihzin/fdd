from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import AliasChoices, Field

from app.common.enums import RequirementPriority, RequirementStatus, RequirementType
from app.common.schemas.base import AppSchema


class RequirementBase(AppSchema):
    code: str = Field(max_length=80)
    title: str = Field(max_length=255)
    description: str | None = None
    requirement_type: RequirementType = Field(
        validation_alias=AliasChoices("type", "requirement_type"),
        serialization_alias="type",
    )
    module: str | None = Field(default=None, max_length=80)
    source_system: str | None = Field(default=None, max_length=80)
    target_system: str | None = Field(default=None, max_length=80)
    priority: RequirementPriority = RequirementPriority.MEDIUM
    status: RequirementStatus = RequirementStatus.DRAFT


class RequirementCreate(RequirementBase):
    project_id: uuid.UUID
    created_by_id: uuid.UUID | None = None


class RequirementUpdate(AppSchema):
    code: str | None = Field(default=None, max_length=80)
    title: str | None = Field(default=None, max_length=255)
    description: str | None = None
    requirement_type: RequirementType | None = Field(
        default=None,
        validation_alias=AliasChoices("type", "requirement_type"),
        serialization_alias="type",
    )
    module: str | None = Field(default=None, max_length=80)
    source_system: str | None = Field(default=None, max_length=80)
    target_system: str | None = Field(default=None, max_length=80)
    priority: RequirementPriority | None = None
    status: RequirementStatus | None = None


class RequirementListItem(AppSchema):
    id: uuid.UUID
    project_id: uuid.UUID
    code: str
    title: str
    requirement_type: RequirementType = Field(serialization_alias="type")
    module: str | None = None
    source_system: str | None = None
    target_system: str | None = None
    priority: RequirementPriority
    status: RequirementStatus
    updated_at: datetime


class RequirementRead(RequirementListItem):
    description: str | None = None
    created_by_id: uuid.UUID | None = None
    created_at: datetime


class RequirementImportRowInput(RequirementBase):
    pass


class RequirementImportFailure(AppSchema):
    row_number: int
    raw_data: dict[str, str | None]
    errors: list[str]


class RequirementImportSummary(AppSchema):
    filename: str
    project_id: uuid.UUID
    total_rows: int
    created_rows: int
    failed_rows: int
    imported_codes: list[str]
    failures: list[RequirementImportFailure]
    mapped_columns: dict[str, str]

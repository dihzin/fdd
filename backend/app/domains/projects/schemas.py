from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import Field

from app.common.enums import ProjectMemberRole, ProjectStatus
from app.common.schemas.base import AppSchema


class ProjectMemberRead(AppSchema):
    id: uuid.UUID
    user_id: uuid.UUID
    member_role: ProjectMemberRole
    allocation_pct: float | None = None
    joined_at: datetime


class ProjectBase(AppSchema):
    code: str = Field(max_length=50)
    name: str = Field(max_length=200)
    description: str | None = None
    client_name: str | None = Field(default=None, max_length=200)
    status: ProjectStatus = ProjectStatus.DRAFT
    sap_landscape: dict | None = None
    start_date: date | None = None
    end_date: date | None = None


class ProjectCreate(ProjectBase):
    organization_id: uuid.UUID
    created_by_id: uuid.UUID | None = None


class ProjectUpdate(AppSchema):
    code: str | None = Field(default=None, max_length=50)
    name: str | None = Field(default=None, max_length=200)
    description: str | None = None
    client_name: str | None = Field(default=None, max_length=200)
    status: ProjectStatus | None = None
    sap_landscape: dict | None = None
    start_date: date | None = None
    end_date: date | None = None


class ProjectListItem(AppSchema):
    id: uuid.UUID
    organization_id: uuid.UUID
    code: str
    name: str
    client_name: str | None = None
    status: ProjectStatus
    updated_at: datetime


class ProjectRead(ProjectListItem):
    description: str | None = None
    sap_landscape: dict | None = None
    start_date: date | None = None
    end_date: date | None = None
    created_by_id: uuid.UUID | None = None
    created_at: datetime
    members: list[ProjectMemberRead] = Field(default_factory=list)

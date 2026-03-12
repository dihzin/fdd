from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import Field

from app.common.enums import DocumentType, TemplateScope
from app.common.schemas.base import AppSchema


class TemplateBase(AppSchema):
    name: str = Field(max_length=200)
    code: str = Field(max_length=80)
    description: str | None = None
    template_scope: TemplateScope
    document_type: DocumentType = DocumentType.FDD
    version: int
    storage_path: str
    is_active: bool = True


class TemplateCreate(TemplateBase):
    organization_id: uuid.UUID | None = None
    created_by_id: uuid.UUID | None = None


class TemplateUpdate(AppSchema):
    name: str | None = Field(default=None, max_length=200)
    description: str | None = None
    storage_path: str | None = None
    is_active: bool | None = None
    version: int | None = None


class TemplateListItem(AppSchema):
    id: uuid.UUID
    organization_id: uuid.UUID | None = None
    name: str
    code: str
    template_scope: TemplateScope
    document_type: DocumentType
    version: int
    is_active: bool
    updated_at: datetime


class TemplateRead(TemplateListItem):
    description: str | None = None
    storage_path: str
    created_by_id: uuid.UUID | None = None
    created_at: datetime

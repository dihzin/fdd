from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import Field

from app.common.enums import DocumentStatus, DocumentType, SectionStatus
from app.common.schemas.base import AppSchema


class FddBaseSectionDefinition(AppSchema):
    section_key: str
    section_title: str
    section_order: int


class DocumentSectionRead(AppSchema):
    id: uuid.UUID
    section_key: str
    section_title: str
    section_order: int
    content_json: dict | None = None
    content_text: str | None = None
    status: SectionStatus
    updated_by_id: uuid.UUID | None = None
    updated_at: datetime


class FddDocumentCreate(AppSchema):
    project_id: uuid.UUID
    solution_id: uuid.UUID | None = None
    template_id: uuid.UUID
    title: str = Field(max_length=255)
    created_by_id: uuid.UUID | None = None
    snapshot_payload: dict | None = None


class DocumentUpdate(AppSchema):
    solution_id: uuid.UUID | None = None
    template_id: uuid.UUID | None = None
    title: str | None = Field(default=None, max_length=255)
    status: DocumentStatus | None = None
    version: int | None = None
    generated_file_path: str | None = None
    snapshot_payload: dict | None = None
    approved_by_id: uuid.UUID | None = None
    approved_at: datetime | None = None


class DocumentSectionUpdate(AppSchema):
    section_title: str | None = Field(default=None, max_length=255)
    content_json: dict | None = None
    content_text: str | None = None
    status: SectionStatus | None = None
    updated_by_id: uuid.UUID | None = None


class GenerateDocumentSectionRequest(AppSchema):
    updated_by_id: uuid.UUID | None = None


class DocumentListItem(AppSchema):
    id: uuid.UUID
    project_id: uuid.UUID
    solution_id: uuid.UUID | None = None
    template_id: uuid.UUID
    title: str
    document_type: DocumentType
    status: DocumentStatus
    version: int
    section_count: int
    updated_at: datetime


class DocumentRead(DocumentListItem):
    generated_file_path: str | None = None
    snapshot_payload: dict | None = None
    created_by_id: uuid.UUID | None = None
    approved_by_id: uuid.UUID | None = None
    approved_at: datetime | None = None
    created_at: datetime
    sections: list[DocumentSectionRead] = Field(default_factory=list)


class DocumentStructureResponse(AppSchema):
    id: uuid.UUID
    title: str
    project_id: uuid.UUID
    solution_id: uuid.UUID | None = None
    template_id: uuid.UUID
    document_type: DocumentType
    status: DocumentStatus
    sections: list[DocumentSectionRead]

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.dependencies import get_db_session
from app.domains.documents.docx_export_service import FddDocxExportService
from app.domains.documents.fdd_generation_service import FddSectionGenerationService
from app.domains.documents.models import Document, DocumentSection
from app.domains.documents.repository import DocumentRepository
from app.domains.documents.schemas import (
    DocumentListItem,
    DocumentRead,
    DocumentSectionRead,
    DocumentSectionUpdate,
    DocumentStructureResponse,
    DocumentUpdate,
    FddDocumentCreate,
    GenerateDocumentSectionRequest,
)
from app.domains.documents.service import DocumentService

router = APIRouter(prefix="/documents", tags=["documents"])


def get_document_service(db: Session = Depends(get_db_session)) -> DocumentService:
    return DocumentService(DocumentRepository(db))


def get_fdd_generation_service(db: Session = Depends(get_db_session)) -> FddSectionGenerationService:
    return FddSectionGenerationService(DocumentRepository(db))


def get_docx_export_service(db: Session = Depends(get_db_session)) -> FddDocxExportService:
    return FddDocxExportService(DocumentRepository(db))


def to_document_section_read(section: DocumentSection) -> DocumentSectionRead:
    return DocumentSectionRead.model_validate(section)


def to_document_list_item(document: Document) -> DocumentListItem:
    return DocumentListItem(
        id=document.id,
        project_id=document.project_id,
        solution_id=document.solution_id,
        template_id=document.template_id,
        title=document.title,
        document_type=document.document_type,
        status=document.status,
        version=document.version,
        section_count=len(document.sections),
        updated_at=document.updated_at,
    )


def to_document_read(document: Document) -> DocumentRead:
    return DocumentRead(
        id=document.id,
        project_id=document.project_id,
        solution_id=document.solution_id,
        template_id=document.template_id,
        title=document.title,
        document_type=document.document_type,
        status=document.status,
        version=document.version,
        section_count=len(document.sections),
        updated_at=document.updated_at,
        generated_file_path=document.generated_file_path,
        snapshot_payload=document.snapshot_payload,
        created_by_id=document.created_by_id,
        approved_by_id=document.approved_by_id,
        approved_at=document.approved_at,
        created_at=document.created_at,
        sections=[to_document_section_read(section) for section in document.sections],
    )


@router.get("", response_model=list[DocumentListItem])
def list_documents(
    project_id: uuid.UUID | None = Query(default=None),
    service: DocumentService = Depends(get_document_service),
) -> list[DocumentListItem]:
    return [to_document_list_item(item) for item in service.list_documents(project_id)]


@router.post("/fdds", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
def create_fdd_document(
    payload: FddDocumentCreate,
    service: DocumentService = Depends(get_document_service),
) -> DocumentRead:
    return to_document_read(service.create_fdd_document(payload))


@router.get("/{document_id}", response_model=DocumentRead)
def get_document(
    document_id: uuid.UUID,
    service: DocumentService = Depends(get_document_service),
) -> DocumentRead:
    return to_document_read(service.get_document(document_id))


@router.get("/{document_id}/structure", response_model=DocumentStructureResponse)
def get_document_structure(
    document_id: uuid.UUID,
    service: DocumentService = Depends(get_document_service),
) -> DocumentStructureResponse:
    document = service.get_document_structure(document_id)
    return DocumentStructureResponse(
        id=document.id,
        title=document.title,
        project_id=document.project_id,
        solution_id=document.solution_id,
        template_id=document.template_id,
        document_type=document.document_type,
        status=document.status,
        sections=[to_document_section_read(section) for section in document.sections],
    )


@router.patch("/{document_id}", response_model=DocumentRead)
def update_document(
    document_id: uuid.UUID,
    payload: DocumentUpdate,
    service: DocumentService = Depends(get_document_service),
) -> DocumentRead:
    return to_document_read(service.update_document(document_id, payload))


@router.patch("/{document_id}/sections/{section_id}", response_model=DocumentSectionRead)
def update_document_section(
    document_id: uuid.UUID,
    section_id: uuid.UUID,
    payload: DocumentSectionUpdate,
    service: DocumentService = Depends(get_document_service),
) -> DocumentSectionRead:
    return to_document_section_read(service.update_section(document_id, section_id, payload))


@router.post("/{document_id}/sections/{section_id}/generate", response_model=DocumentSectionRead)
def generate_document_section(
    document_id: uuid.UUID,
    section_id: uuid.UUID,
    payload: GenerateDocumentSectionRequest,
    service: FddSectionGenerationService = Depends(get_fdd_generation_service),
) -> DocumentSectionRead:
    return to_document_section_read(
        service.generate_section(
            document_id=document_id,
            section_id=section_id,
            updated_by_id=payload.updated_by_id,
        )
    )


@router.post("/{document_id}/export/docx")
def export_document_docx(
    document_id: uuid.UUID,
    service: FddDocxExportService = Depends(get_docx_export_service),
) -> FileResponse:
    exported = service.export(document_id)
    return FileResponse(
        path=exported.output_path,
        filename=exported.filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )

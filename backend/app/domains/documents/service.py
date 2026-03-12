from __future__ import annotations

import uuid

from app.common.enums import DocumentType
from app.common.errors.http import bad_request, not_found
from app.domains.documents.fdd_sections import DEFAULT_FDD_SECTIONS
from app.domains.documents.models import Document, DocumentSection
from app.domains.documents.repository import DocumentRepository
from app.domains.documents.schemas import DocumentSectionUpdate, DocumentUpdate, FddDocumentCreate


class DocumentService:
    def __init__(self, repository: DocumentRepository) -> None:
        self.repository = repository

    def list_documents(self, project_id: uuid.UUID | None = None) -> list[Document]:
        return self.repository.list(project_id=project_id)

    def get_document(self, document_id: uuid.UUID) -> Document:
        document = self.repository.get(document_id)
        if not document:
            raise not_found("Document", document_id)
        return document

    def create_fdd_document(self, payload: FddDocumentCreate) -> Document:
        return self.repository.create_fdd_document(payload, DEFAULT_FDD_SECTIONS)

    def update_document(self, document_id: uuid.UUID, payload: DocumentUpdate) -> Document:
        document = self.get_document(document_id)
        return self.repository.update(document, payload)

    def get_document_structure(self, document_id: uuid.UUID) -> Document:
        document = self.get_document(document_id)
        if document.document_type != DocumentType.FDD:
            raise bad_request("Structured section workflow is only supported for FDD documents.")
        return document

    def update_section(
        self,
        document_id: uuid.UUID,
        section_id: uuid.UUID,
        payload: DocumentSectionUpdate,
    ) -> DocumentSection:
        document = self.get_document_structure(document_id)
        section = self.repository.get_section(document.id, section_id)
        if not section:
            raise not_found("Document section", section_id)
        return self.repository.update_section(section, payload)

from __future__ import annotations

import uuid

from sqlalchemy import Select, select
from sqlalchemy.orm import Session, selectinload

from app.common.enums import DocumentType
from app.domains.documents.models import Document, DocumentSection
from app.domains.documents.schemas import DocumentSectionUpdate, DocumentUpdate, FddBaseSectionDefinition, FddDocumentCreate
from app.domains.solutions.models import Solution, SolutionRequirement


class DocumentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, project_id: uuid.UUID | None = None) -> list[Document]:
        stmt: Select[tuple[Document]] = (
            select(Document)
            .options(selectinload(Document.sections))
            .order_by(Document.updated_at.desc())
        )
        if project_id:
            stmt = stmt.where(Document.project_id == project_id)
        return list(self.db.scalars(stmt).all())

    def get(self, document_id: uuid.UUID) -> Document | None:
        stmt = (
            select(Document)
            .where(Document.id == document_id)
            .options(
                selectinload(Document.sections),
                selectinload(Document.project),
                selectinload(Document.template),
                selectinload(Document.solution)
                .selectinload(Solution.solution_requirements)
                .selectinload(SolutionRequirement.requirement),
            )
        )
        return self.db.scalar(stmt)

    def get_section(self, document_id: uuid.UUID, section_id: uuid.UUID) -> DocumentSection | None:
        stmt = select(DocumentSection).where(
            DocumentSection.document_id == document_id,
            DocumentSection.id == section_id,
        )
        return self.db.scalar(stmt)

    def create_fdd_document(
        self,
        payload: FddDocumentCreate,
        base_sections: list[FddBaseSectionDefinition],
    ) -> Document:
        document = Document(
            project_id=payload.project_id,
            solution_id=payload.solution_id,
            template_id=payload.template_id,
            title=payload.title,
            document_type=DocumentType.FDD,
            snapshot_payload=payload.snapshot_payload,
            created_by_id=payload.created_by_id,
        )
        document.sections = [
            DocumentSection(
                section_key=section.section_key,
                section_title=section.section_title,
                section_order=section.section_order,
                content_json={},
                content_text="",
            )
            for section in base_sections
        ]
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        return self.get(document.id) or document

    def update(self, document: Document, payload: DocumentUpdate) -> Document:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(document, field, value)
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        return self.get(document.id) or document

    def update_section(self, section: DocumentSection, payload: DocumentSectionUpdate) -> DocumentSection:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(section, field, value)
        self.db.add(section)
        self.db.commit()
        self.db.refresh(section)
        return section

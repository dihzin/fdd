from __future__ import annotations

import uuid
from dataclasses import dataclass
from pathlib import Path

from docxtpl import DocxTemplate

from app.common.errors.http import not_found
from app.core.config import settings
from app.domains.documents.docx_mapping import build_docx_context
from app.domains.documents.models import Document
from app.domains.documents.repository import DocumentRepository
from app.domains.documents.schemas import DocumentUpdate


@dataclass(slots=True)
class ExportedDocxFile:
    document: Document
    output_path: Path
    filename: str


class FddDocxExportService:
    def __init__(self, repository: DocumentRepository) -> None:
        self.repository = repository

    def export(self, document_id: uuid.UUID) -> ExportedDocxFile:
        document = self.repository.get(document_id)
        if not document:
            raise not_found("Document", document_id)

        template_path = Path(document.template.storage_path) if document.template else settings.default_fdd_template_path
        if not template_path.exists():
            raise not_found("Template file", template_path)

        settings.document_export_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{document.id}_fdd.docx"
        output_path = settings.document_export_dir / filename

        template = DocxTemplate(template_path)
        template.render(build_docx_context(document))
        template.save(output_path)

        self.repository.update(
            document,
            DocumentUpdate(generated_file_path=str(output_path)),
        )
        refreshed = self.repository.get(document.id) or document
        return ExportedDocxFile(document=refreshed, output_path=output_path, filename=filename)

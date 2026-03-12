from __future__ import annotations

import uuid

from app.common.enums import SectionStatus
from app.common.errors.http import not_found
from app.domains.documents.llm_adapter import LLMAdapter, StubLLMAdapter
from app.domains.documents.models import DocumentSection
from app.domains.documents.repository import DocumentRepository
from app.domains.documents.schemas import DocumentSectionUpdate
from app.domains.documents.section_generation import SectionGenerationContext, get_section_generator


class FddSectionGenerationService:
    def __init__(
        self,
        repository: DocumentRepository,
        llm_adapter: LLMAdapter | None = None,
    ) -> None:
        self.repository = repository
        self.llm_adapter = llm_adapter or StubLLMAdapter()

    def generate_section(
        self,
        *,
        document_id: uuid.UUID,
        section_id: uuid.UUID,
        updated_by_id: uuid.UUID | None = None,
    ) -> DocumentSection:
        document = self.repository.get(document_id)
        if not document:
            raise not_found("Document", document_id)

        section = next((item for item in document.sections if item.id == section_id), None)
        if not section:
            raise not_found("Document section", section_id)

        context = SectionGenerationContext(
            project={
                "id": str(document.project.id),
                "code": document.project.code,
                "name": document.project.name,
                "client_name": document.project.client_name,
                "description": document.project.description,
            },
            solution={
                "id": str(document.solution.id),
                "name": document.solution.name,
                "description": document.solution.description,
                "module": document.solution.module,
                "phase": document.solution.phase,
                "status": document.solution.status.value,
            }
            if document.solution
            else None,
            requirements=[
                {
                    "id": str(link.requirement.id),
                    "code": link.requirement.code,
                    "title": link.requirement.title,
                    "description": link.requirement.description,
                    "priority": link.requirement.priority.value,
                    "status": link.requirement.status.value,
                    "module": link.requirement.module,
                    "source_system": link.requirement.source_system,
                    "target_system": link.requirement.target_system,
                }
                for link in (document.solution.solution_requirements if document.solution else [])
            ],
            wizard=document.solution.wizard_context if document.solution else None,
        )

        section_service = get_section_generator(section.section_key)
        prompt = section_service.build_prompt(section.section_title, context)
        generated = self.llm_adapter.generate_section(prompt)

        return self.repository.update_section(
            section,
            DocumentSectionUpdate(
                content_text=generated.content_text,
                content_json=generated.content_json,
                status=SectionStatus.GENERATED,
                updated_by_id=updated_by_id,
            ),
        )

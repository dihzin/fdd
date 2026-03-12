from __future__ import annotations

import uuid
from datetime import UTC, datetime

from app.common.enums import DocumentStatus, DocumentType, SectionStatus
from app.domains.documents.fdd_sections import DEFAULT_FDD_SECTIONS
from app.domains.documents.fdd_generation_service import FddSectionGenerationService
from app.domains.documents.llm_adapter import LLMAdapter, LLMSectionPrompt, LLMSectionResponse
from app.domains.documents.service import DocumentService
from app.domains.documents.schemas import DocumentSectionUpdate, FddDocumentCreate
from app.common.enums import RequirementPriority, RequirementStatus, RequirementType, SolutionStatus


class FakeProject:
    def __init__(self, project_id: uuid.UUID) -> None:
        self.id = project_id
        self.code = "PRJ-001"
        self.name = "SAP OTC Rollout"
        self.client_name = "Contoso"
        self.description = "Global OTC design."


class FakeRequirement:
    def __init__(self) -> None:
        self.id = uuid.uuid4()
        self.code = "REQ-001"
        self.title = "Billing integration"
        self.description = "Send billing data to tax platform."
        self.priority = RequirementPriority.HIGH
        self.status = RequirementStatus.APPROVED
        self.requirement_type = RequirementType.INTEGRATION
        self.module = "SD"
        self.source_system = "SAP S/4"
        self.target_system = "TaxOne"


class FakeSolutionRequirement:
    def __init__(self, requirement: FakeRequirement) -> None:
        self.id = uuid.uuid4()
        self.requirement = requirement
        self.requirement_id = requirement.id


class FakeSolution:
    def __init__(self, project_id: uuid.UUID) -> None:
        self.id = uuid.uuid4()
        self.project_id = project_id
        self.name = "Billing Localization"
        self.description = "Localized billing flow."
        self.module = "SD"
        self.phase = "Design"
        self.status = SolutionStatus.DRAFT
        self.wizard_context = {
            "business_problem": {"summary": "Local fiscal rules drive billing variations."},
            "current_process": {"summary": "Current process uses manual tax handling."},
            "future_process": {"summary": "Future process standardizes the integration."},
        }
        self.solution_requirements = [FakeSolutionRequirement(FakeRequirement())]


class FakeSection:
    def __init__(self, document_id: uuid.UUID, section_key: str, section_title: str, section_order: int) -> None:
        self.id = uuid.uuid4()
        self.document_id = document_id
        self.section_key = section_key
        self.section_title = section_title
        self.section_order = section_order
        self.content_json = {}
        self.content_text = ""
        self.status = SectionStatus.DRAFT
        self.updated_by_id = None
        self.updated_at = datetime.now(UTC)


class FakeDocument:
    def __init__(self, document_id: uuid.UUID, payload: FddDocumentCreate) -> None:
        self.id = document_id
        self.project_id = payload.project_id
        self.solution_id = payload.solution_id
        self.template_id = payload.template_id
        self.title = payload.title
        self.document_type = DocumentType.FDD
        self.status = DocumentStatus.DRAFT
        self.version = 1
        self.generated_file_path = None
        self.snapshot_payload = payload.snapshot_payload
        self.created_by_id = payload.created_by_id
        self.approved_by_id = None
        self.approved_at = None
        self.created_at = datetime.now(UTC)
        self.updated_at = datetime.now(UTC)
        self.sections: list[FakeSection] = []
        self.project = FakeProject(payload.project_id)
        self.solution = FakeSolution(payload.project_id) if payload.solution_id else None


class FakeDocumentRepository:
    def __init__(self) -> None:
        self.documents: dict[uuid.UUID, FakeDocument] = {}

    def list(self, project_id=None):
        if project_id is None:
            return list(self.documents.values())
        return [document for document in self.documents.values() if document.project_id == project_id]

    def get(self, document_id: uuid.UUID):
        return self.documents.get(document_id)

    def get_section(self, document_id: uuid.UUID, section_id: uuid.UUID):
        document = self.documents.get(document_id)
        if not document:
            return None
        for section in document.sections:
            if section.id == section_id:
                return section
        return None

    def create_fdd_document(self, payload: FddDocumentCreate, base_sections):
        document = FakeDocument(uuid.uuid4(), payload)
        document.sections = [
            FakeSection(document.id, section.section_key, section.section_title, section.section_order)
            for section in base_sections
        ]
        self.documents[document.id] = document
        return document

    def update(self, document, payload):
        return document

    def update_section(self, section, payload: DocumentSectionUpdate):
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(section, field, value)
        section.updated_at = datetime.now(UTC)
        return section


class FakeLLMAdapter(LLMAdapter):
    def generate_section(self, prompt: LLMSectionPrompt) -> LLMSectionResponse:
        return LLMSectionResponse(
            content_text=f"Generated content for {prompt.section_key}",
            content_json={"section_key": prompt.section_key, "prompt_title": prompt.section_title},
        )


def test_create_fdd_document_populates_base_sections():
    service = DocumentService(FakeDocumentRepository())
    payload = FddDocumentCreate(
        project_id=uuid.uuid4(),
        solution_id=None,
        template_id=uuid.uuid4(),
        title="FDD OTC",
    )

    document = service.create_fdd_document(payload)

    assert document.document_type == DocumentType.FDD
    assert len(document.sections) == len(DEFAULT_FDD_SECTIONS)
    assert document.sections[0].section_key == DEFAULT_FDD_SECTIONS[0].section_key


def test_update_section_updates_only_target_section():
    repo = FakeDocumentRepository()
    service = DocumentService(repo)
    document = service.create_fdd_document(
        FddDocumentCreate(
            project_id=uuid.uuid4(),
            solution_id=None,
            template_id=uuid.uuid4(),
            title="FDD OTC",
        )
    )
    target_section = document.sections[1]

    updated = service.update_section(
        document.id,
        target_section.id,
        DocumentSectionUpdate(
            content_text="Updated narrative",
            content_json={"type": "doc", "content": []},
            status=SectionStatus.REVIEWED,
        ),
    )

    assert updated.content_text == "Updated narrative"
    assert updated.status == SectionStatus.REVIEWED
    assert updated.section_key == target_section.section_key


def test_generate_section_persists_generated_content():
    repo = FakeDocumentRepository()
    document = repo.create_fdd_document(
        FddDocumentCreate(
            project_id=uuid.uuid4(),
            solution_id=uuid.uuid4(),
            template_id=uuid.uuid4(),
            title="FDD OTC",
        ),
        DEFAULT_FDD_SECTIONS,
    )
    target_section = document.sections[0]
    generation_service = FddSectionGenerationService(repo, llm_adapter=FakeLLMAdapter())

    updated = generation_service.generate_section(
        document_id=document.id,
        section_id=target_section.id,
    )

    assert updated.content_text == f"Generated content for {target_section.section_key}"
    assert updated.content_json["section_key"] == target_section.section_key
    assert updated.status == SectionStatus.GENERATED

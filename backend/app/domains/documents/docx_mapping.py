from __future__ import annotations

from dataclasses import dataclass

from app.domains.documents.models import Document


@dataclass(frozen=True, slots=True)
class SectionPlaceholderMapping:
    section_key: str
    placeholder: str


DEFAULT_SECTION_PLACEHOLDERS: tuple[SectionPlaceholderMapping, ...] = (
    SectionPlaceholderMapping("objective_scope", "fdd_objective_scope"),
    SectionPlaceholderMapping("business_process", "fdd_business_process"),
    SectionPlaceholderMapping("requirements_coverage", "fdd_requirements_coverage"),
    SectionPlaceholderMapping("functional_design", "fdd_functional_design"),
    SectionPlaceholderMapping("interfaces_data", "fdd_interfaces_data"),
    SectionPlaceholderMapping("security_controls", "fdd_security_controls"),
    SectionPlaceholderMapping("assumptions_dependencies", "fdd_assumptions_dependencies"),
    SectionPlaceholderMapping("test_considerations", "fdd_test_considerations"),
)


def build_docx_context(document: Document) -> dict[str, str]:
    section_map = {section.section_key: section for section in document.sections}
    context = {
        "document_title": document.title,
        "project_name": document.project.name,
        "project_code": document.project.code,
        "client_name": document.project.client_name or "",
        "solution_name": document.solution.name if document.solution else "",
        "document_status": document.status.value,
    }

    for mapping in DEFAULT_SECTION_PLACEHOLDERS:
        section = section_map.get(mapping.section_key)
        context[mapping.placeholder] = section.content_text if section and section.content_text else ""

    return context

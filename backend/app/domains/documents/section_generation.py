from __future__ import annotations

from dataclasses import dataclass

from app.common.errors.http import bad_request
from app.domains.documents.llm_adapter import LLMSectionPrompt


@dataclass(slots=True)
class SectionGenerationContext:
    project: dict
    solution: dict | None
    requirements: list[dict]
    wizard: dict | None


class BaseSectionGenerationService:
    section_key: str
    instructions: str

    def build_prompt(self, section_title: str, context: SectionGenerationContext) -> LLMSectionPrompt:
        return LLMSectionPrompt(
            section_key=self.section_key,
            section_title=section_title,
            instructions=self.instructions,
            context={
                "project": context.project,
                "solution": context.solution,
                "requirements": context.requirements,
                "wizard": context.wizard,
            },
        )


class ObjectiveScopeSectionService(BaseSectionGenerationService):
    section_key = "objective_scope"
    instructions = "Describe the FDD objective, scope boundaries, rollout purpose and SAP landscape context."


class BusinessProcessSectionService(BaseSectionGenerationService):
    section_key = "business_process"
    instructions = "Explain the current and target business process flow, actors and relevant operational checkpoints."


class RequirementsCoverageSectionService(BaseSectionGenerationService):
    section_key = "requirements_coverage"
    instructions = "Map linked requirements to the intended solution coverage, including explicit design decisions and gaps."


class FunctionalDesignSectionService(BaseSectionGenerationService):
    section_key = "functional_design"
    instructions = "Describe the functional design choices, SAP behaviors, configuration implications and user-facing outcomes."


class InterfacesDataSectionService(BaseSectionGenerationService):
    section_key = "interfaces_data"
    instructions = "Summarize interfaces, data movement, source and target systems, and integration assumptions."


class SecurityControlsSectionService(BaseSectionGenerationService):
    section_key = "security_controls"
    instructions = "Document security, authorization and control considerations relevant to the design."


class AssumptionsDependenciesSectionService(BaseSectionGenerationService):
    section_key = "assumptions_dependencies"
    instructions = "List assumptions, dependencies, constraints and external decisions that affect delivery."


class TestConsiderationsSectionService(BaseSectionGenerationService):
    section_key = "test_considerations"
    instructions = "Describe the testing focus, validation checkpoints and expected acceptance considerations."


SECTION_GENERATORS: dict[str, BaseSectionGenerationService] = {
    service.section_key: service
    for service in [
        ObjectiveScopeSectionService(),
        BusinessProcessSectionService(),
        RequirementsCoverageSectionService(),
        FunctionalDesignSectionService(),
        InterfacesDataSectionService(),
        SecurityControlsSectionService(),
        AssumptionsDependenciesSectionService(),
        TestConsiderationsSectionService(),
    ]
}


def get_section_generator(section_key: str) -> BaseSectionGenerationService:
    generator = SECTION_GENERATORS.get(section_key)
    if not generator:
        raise bad_request(f"No generation service configured for section_key '{section_key}'.")
    return generator

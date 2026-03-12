from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(slots=True)
class LLMSectionPrompt:
    section_key: str
    section_title: str
    instructions: str
    context: dict


@dataclass(slots=True)
class LLMSectionResponse:
    content_text: str
    content_json: dict


class LLMAdapter(Protocol):
    def generate_section(self, prompt: LLMSectionPrompt) -> LLMSectionResponse:
        ...


class StubLLMAdapter:
    def generate_section(self, prompt: LLMSectionPrompt) -> LLMSectionResponse:
        project = prompt.context.get("project", {})
        solution = prompt.context.get("solution", {})
        requirements = prompt.context.get("requirements", [])
        wizard = prompt.context.get("wizard", {})

        lines = [
            f"# {prompt.section_title}",
            "",
            prompt.instructions,
            "",
            "## Project context",
            f"- Project: {project.get('name', 'N/A')}",
            f"- Client: {project.get('client_name', 'N/A')}",
        ]

        if solution:
            lines.extend(
                [
                    "",
                    "## Solution context",
                    f"- Solution: {solution.get('name', 'N/A')}",
                    f"- Module: {solution.get('module', 'N/A')}",
                    f"- Phase: {solution.get('phase', 'N/A')}",
                ]
            )

        if requirements:
            lines.append("")
            lines.append("## Linked requirements")
            lines.extend(
                [
                    f"- {item['code']}: {item['title']} ({item['priority']}, {item['status']})"
                    for item in requirements
                ]
            )

        if wizard:
            lines.extend(
                [
                    "",
                    "## Wizard inputs",
                    f"- Business problem: {wizard.get('business_problem', {}).get('summary', 'N/A')}",
                    f"- Current process: {wizard.get('current_process', {}).get('summary', 'N/A')}",
                    f"- Future process: {wizard.get('future_process', {}).get('summary', 'N/A')}",
                ]
            )

        content_text = "\n".join(lines).strip()
        content_json = {
            "section_key": prompt.section_key,
            "section_title": prompt.section_title,
            "instructions": prompt.instructions,
            "context_snapshot": prompt.context,
            "generated_blocks": [
                {"type": "heading", "text": prompt.section_title},
                {"type": "markdown", "text": content_text},
            ],
        }
        return LLMSectionResponse(content_text=content_text, content_json=content_json)

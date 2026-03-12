from __future__ import annotations

import uuid

from app.common.errors.http import not_found
from app.domains.templates.models import Template
from app.domains.templates.repository import TemplateRepository
from app.domains.templates.schemas import TemplateCreate, TemplateUpdate


class TemplateService:
    def __init__(self, repository: TemplateRepository) -> None:
        self.repository = repository

    def list_templates(self, organization_id: uuid.UUID | None = None) -> list[Template]:
        return self.repository.list(organization_id=organization_id)

    def get_template(self, template_id: uuid.UUID) -> Template:
        template = self.repository.get(template_id)
        if not template:
            raise not_found("Template", template_id)
        return template

    def create_template(self, payload: TemplateCreate) -> Template:
        return self.repository.create(payload)

    def update_template(self, template_id: uuid.UUID, payload: TemplateUpdate) -> Template:
        template = self.get_template(template_id)
        return self.repository.update(template, payload)

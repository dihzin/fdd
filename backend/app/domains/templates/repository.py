from __future__ import annotations

import uuid

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.domains.templates.models import Template
from app.domains.templates.schemas import TemplateCreate, TemplateUpdate


class TemplateRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, organization_id: uuid.UUID | None = None) -> list[Template]:
        stmt: Select[tuple[Template]] = select(Template).order_by(Template.updated_at.desc())
        if organization_id:
            stmt = stmt.where(
                (Template.organization_id == organization_id) | (Template.organization_id.is_(None))
            )
        return list(self.db.scalars(stmt).all())

    def get(self, template_id: uuid.UUID) -> Template | None:
        stmt = select(Template).where(Template.id == template_id)
        return self.db.scalar(stmt)

    def create(self, payload: TemplateCreate) -> Template:
        template = Template(**payload.model_dump())
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template

    def update(self, template: Template, payload: TemplateUpdate) -> Template:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(template, field, value)
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template

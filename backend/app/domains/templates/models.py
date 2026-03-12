from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums import DocumentType, TemplateScope
from app.db.base_class import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.domains.documents.models import Document
    from app.domains.organizations.models import Organization
    from app.domains.users.models import User


class Template(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "templates"
    __table_args__ = (
        Index("ix_templates_template_scope_is_active", "template_scope", "is_active"),
        Index("ix_templates_organization_id_document_type", "organization_id", "document_type"),
        Index("ux_templates_organization_id_code_version", "organization_id", "code", "version", unique=True),
    )

    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str | None] = mapped_column(Text())
    template_scope: Mapped[TemplateScope] = mapped_column(
        Enum(TemplateScope, name="template_scope"),
        nullable=False,
    )
    document_type: Mapped[DocumentType] = mapped_column(
        Enum(DocumentType, name="document_type"),
        nullable=False,
        default=DocumentType.FDD,
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_path: Mapped[str] = mapped_column(Text(), nullable=False)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True, server_default="true")
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )

    organization: Mapped["Organization | None"] = relationship(back_populates="templates")
    created_by: Mapped["User | None"] = relationship(
        back_populates="created_templates",
        foreign_keys=[created_by_id],
    )
    documents: Mapped[list["Document"]] = relationship(back_populates="template")

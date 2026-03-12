from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums import DocumentStatus, DocumentType, SectionStatus
from app.db.base_class import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.domains.projects.models import Project
    from app.domains.solutions.models import Solution
    from app.domains.templates.models import Template
    from app.domains.users.models import User


class Document(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "documents"
    __table_args__ = (
        Index("ix_documents_project_id_status", "project_id", "status"),
        Index("ix_documents_template_id", "template_id"),
        Index("ix_documents_project_id_document_type_version", "project_id", "document_type", "version"),
        Index(
            "ix_documents_solution_id_not_null",
            "solution_id",
            postgresql_where=text("solution_id IS NOT NULL"),
        ),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    solution_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("solutions.id", ondelete="SET NULL"),
    )
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("templates.id", ondelete="RESTRICT"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    document_type: Mapped[DocumentType] = mapped_column(
        Enum(DocumentType, name="document_type", create_type=False),
        nullable=False,
        default=DocumentType.FDD,
    )
    status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus, name="document_status"),
        nullable=False,
        default=DocumentStatus.DRAFT,
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    generated_file_path: Mapped[str | None] = mapped_column(Text())
    snapshot_payload: Mapped[dict | None] = mapped_column(JSONB)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    approved_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    project: Mapped["Project"] = relationship(back_populates="documents")
    solution: Mapped["Solution | None"] = relationship(back_populates="documents")
    template: Mapped["Template"] = relationship(back_populates="documents")
    created_by: Mapped["User | None"] = relationship(
        back_populates="created_documents",
        foreign_keys=[created_by_id],
    )
    approved_by: Mapped["User | None"] = relationship(
        back_populates="approved_documents",
        foreign_keys=[approved_by_id],
    )
    sections: Mapped[list["DocumentSection"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="DocumentSection.section_order",
    )


class DocumentSection(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "document_sections"
    __table_args__ = (
        UniqueConstraint("document_id", "section_key"),
        UniqueConstraint("document_id", "section_order"),
        Index("ix_document_sections_document_id_status", "document_id", "status"),
    )

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
    )
    section_key: Mapped[str] = mapped_column(String(80), nullable=False)
    section_title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_text: Mapped[str | None] = mapped_column(Text())
    content_json: Mapped[dict | None] = mapped_column(JSONB)
    section_order: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[SectionStatus] = mapped_column(
        Enum(SectionStatus, name="section_status"),
        nullable=False,
        default=SectionStatus.DRAFT,
    )
    source_type: Mapped[str | None] = mapped_column(String(30))
    generated_from_requirement_ids: Mapped[list[uuid.UUID] | None] = mapped_column(
        ARRAY(UUID(as_uuid=True))
    )
    updated_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )

    document: Mapped["Document"] = relationship(back_populates="sections")
    updated_by: Mapped["User | None"] = relationship(
        back_populates="updated_document_sections",
        foreign_keys=[updated_by_id],
    )

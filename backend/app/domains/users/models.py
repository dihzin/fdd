from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums import UserRole
from app.db.base_class import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.domains.documents.models import Document, DocumentSection
    from app.domains.organizations.models import Organization
    from app.domains.projects.models import Project, ProjectMember
    from app.domains.requirements.models import Requirement
    from app.domains.solutions.models import Solution
    from app.domains.templates.models import Template


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_organization_id_is_active", "organization_id", "is_active"),
        Index("ux_users_organization_id_email", "organization_id", "email", unique=True),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"),
        nullable=False,
        default=UserRole.CONSULTANT,
    )
    job_title: Mapped[str | None] = mapped_column(String(120))
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True, server_default="true")
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    organization: Mapped["Organization"] = relationship(back_populates="users")
    project_members: Mapped[list["ProjectMember"]] = relationship(back_populates="user")
    created_projects: Mapped[list["Project"]] = relationship(
        back_populates="created_by",
        foreign_keys="Project.created_by_id",
    )
    created_requirements: Mapped[list["Requirement"]] = relationship(
        back_populates="created_by",
        foreign_keys="Requirement.created_by_id",
    )
    created_solutions: Mapped[list["Solution"]] = relationship(
        back_populates="created_by",
        foreign_keys="Solution.created_by_id",
    )
    created_documents: Mapped[list["Document"]] = relationship(
        back_populates="created_by",
        foreign_keys="Document.created_by_id",
    )
    approved_documents: Mapped[list["Document"]] = relationship(
        back_populates="approved_by",
        foreign_keys="Document.approved_by_id",
    )
    created_templates: Mapped[list["Template"]] = relationship(
        back_populates="created_by",
        foreign_keys="Template.created_by_id",
    )
    updated_document_sections: Mapped[list["DocumentSection"]] = relationship(
        back_populates="updated_by",
        foreign_keys="DocumentSection.updated_by_id",
    )

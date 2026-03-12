from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Index, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums import ProjectMemberRole, ProjectStatus
from app.db.base_class import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.domains.documents.models import Document
    from app.domains.organizations.models import Organization
    from app.domains.requirements.models import Requirement
    from app.domains.solutions.models import Solution
    from app.domains.users.models import User


class Project(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "projects"
    __table_args__ = (
        Index("ix_projects_organization_id_status", "organization_id", "status"),
        Index("ix_projects_organization_id_created_at", "organization_id", "created_at"),
        Index("uq_projects_organization_id_code", "organization_id", "code", unique=True),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text())
    client_name: Mapped[str | None] = mapped_column(String(200))
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus, name="project_status"),
        nullable=False,
        default=ProjectStatus.DRAFT,
    )
    sap_landscape: Mapped[dict | None] = mapped_column(JSONB)
    start_date: Mapped[date | None] = mapped_column(Date())
    end_date: Mapped[date | None] = mapped_column(Date())
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )

    organization: Mapped["Organization"] = relationship(back_populates="projects")
    created_by: Mapped["User | None"] = relationship(
        back_populates="created_projects",
        foreign_keys=[created_by_id],
    )
    members: Mapped[list["ProjectMember"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
    )
    requirements: Mapped[list["Requirement"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
    )
    solutions: Mapped[list["Solution"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
    )
    documents: Mapped[list["Document"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
    )


class ProjectMember(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "project_members"
    __table_args__ = (
        Index("ix_project_members_user_id", "user_id"),
        Index("ix_project_members_project_id_member_role", "project_id", "member_role"),
        Index("uq_project_members_project_id_user_id", "project_id", "user_id", unique=True),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    member_role: Mapped[ProjectMemberRole] = mapped_column(
        Enum(ProjectMemberRole, name="project_member_role"),
        nullable=False,
    )
    allocation_pct: Mapped[float | None] = mapped_column(Numeric(5, 2))
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    project: Mapped["Project"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="project_members")

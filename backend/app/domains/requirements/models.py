from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums import RequirementPriority, RequirementStatus, RequirementType
from app.db.base_class import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.domains.projects.models import Project
    from app.domains.solutions.models import SolutionRequirement
    from app.domains.users.models import User


class Requirement(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "requirements"
    __table_args__ = (
        Index("ix_requirements_project_id_status", "project_id", "status"),
        Index("ix_requirements_project_id_priority", "project_id", "priority"),
        Index("ix_requirements_project_id_module", "project_id", "module"),
        Index("ux_requirements_project_id_code", "project_id", "code", unique=True),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text())
    requirement_type: Mapped[RequirementType] = mapped_column(
        Enum(RequirementType, name="requirement_type"),
        nullable=False,
    )
    priority: Mapped[RequirementPriority] = mapped_column(
        Enum(RequirementPriority, name="requirement_priority"),
        nullable=False,
        default=RequirementPriority.MEDIUM,
    )
    status: Mapped[RequirementStatus] = mapped_column(
        Enum(RequirementStatus, name="requirement_status"),
        nullable=False,
        default=RequirementStatus.DRAFT,
    )
    module: Mapped[str | None] = mapped_column(String(80))
    source_system: Mapped[str | None] = mapped_column(String(80))
    target_system: Mapped[str | None] = mapped_column(String(80))
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )

    project: Mapped["Project"] = relationship(back_populates="requirements")
    created_by: Mapped["User | None"] = relationship(
        back_populates="created_requirements",
        foreign_keys=[created_by_id],
    )
    solution_links: Mapped[list["SolutionRequirement"]] = relationship(
        back_populates="requirement",
        cascade="all, delete-orphan",
    )

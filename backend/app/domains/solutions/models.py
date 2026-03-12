from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums import SolutionStatus
from app.db.base_class import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.domains.documents.models import Document
    from app.domains.projects.models import Project
    from app.domains.requirements.models import Requirement
    from app.domains.users.models import User


class Solution(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "solutions"
    __table_args__ = (
        Index("ix_solutions_project_id_status", "project_id", "status"),
        Index("ix_solutions_project_id_created_at", "project_id", "created_at"),
        Index("uq_solutions_project_id_name", "project_id", "name", unique=True),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text())
    module: Mapped[str | None] = mapped_column(String(80))
    phase: Mapped[str | None] = mapped_column(String(80))
    status: Mapped[SolutionStatus] = mapped_column(
        Enum(SolutionStatus, name="solution_status"),
        nullable=False,
        default=SolutionStatus.DRAFT,
    )
    wizard_context: Mapped[dict | None] = mapped_column(JSONB)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )

    project: Mapped["Project"] = relationship(back_populates="solutions")
    created_by: Mapped["User | None"] = relationship(
        back_populates="created_solutions",
        foreign_keys=[created_by_id],
    )
    solution_requirements: Mapped[list["SolutionRequirement"]] = relationship(
        back_populates="solution",
        cascade="all, delete-orphan",
    )
    documents: Mapped[list["Document"]] = relationship(back_populates="solution")


class SolutionRequirement(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "solution_requirements"
    __table_args__ = (
        Index("ix_solution_requirements_requirement_id", "requirement_id"),
        Index("ix_solution_requirements_solution_id_sort_order", "solution_id", "sort_order"),
        Index("uq_solution_requirements_solution_id_requirement_id", "solution_id", "requirement_id", unique=True),
    )

    solution_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("solutions.id", ondelete="CASCADE"),
        nullable=False,
    )
    requirement_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("requirements.id", ondelete="CASCADE"),
        nullable=False,
    )
    fit_type: Mapped[str | None] = mapped_column(String(20))
    rationale: Mapped[str | None] = mapped_column(Text())
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    solution: Mapped["Solution"] = relationship(back_populates="solution_requirements")
    requirement: Mapped["Requirement"] = relationship(back_populates="solution_links")

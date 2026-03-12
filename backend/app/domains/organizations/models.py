from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.domains.projects.models import Project
    from app.domains.templates.models import Template
    from app.domains.users.models import User


class Organization(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "organizations"
    __table_args__ = (UniqueConstraint("slug"),)

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(80), nullable=False)
    legal_name: Mapped[str | None] = mapped_column(String(255))
    sap_customer_code: Mapped[str | None] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True, server_default="true")

    users: Mapped[list["User"]] = relationship(back_populates="organization")
    projects: Mapped[list["Project"]] = relationship(back_populates="organization")
    templates: Mapped[list["Template"]] = relationship(back_populates="organization")

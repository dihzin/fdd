"""initial MVP schema

Revision ID: 0001_initial_mvp
Revises:
Create Date: 2026-03-12 00:00:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "0001_initial_mvp"
down_revision = None
branch_labels = None
depends_on = None


user_role = sa.Enum("admin", "consultant", "reviewer", "viewer", name="user_role")
project_status = sa.Enum("draft", "active", "on_hold", "completed", "archived", name="project_status")
project_member_role = sa.Enum("owner", "manager", "consultant", "reviewer", name="project_member_role")
requirement_type = sa.Enum(
    "business",
    "functional",
    "technical",
    "integration",
    "report",
    name="requirement_type",
)
requirement_priority = sa.Enum("low", "medium", "high", "critical", name="requirement_priority")
requirement_status = sa.Enum(
    "draft",
    "refined",
    "approved",
    "implemented",
    "rejected",
    name="requirement_status",
)
solution_status = sa.Enum("draft", "proposed", "approved", "archived", name="solution_status")
template_scope = sa.Enum("global", "organization", name="template_scope")
document_type = sa.Enum("fdd", name="document_type")
document_status = sa.Enum("draft", "in_review", "approved", "exported", "archived", name="document_status")
section_status = sa.Enum("draft", "generated", "reviewed", "approved", name="section_status")


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    bind = op.get_bind()
    for enum_type in (
        user_role,
        project_status,
        project_member_role,
        requirement_type,
        requirement_priority,
        requirement_status,
        solution_status,
        template_scope,
        document_type,
        document_status,
        section_status,
    ):
        enum_type.create(bind, checkfirst=True)

    op.create_table(
        "organizations",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("legal_name", sa.String(length=255), nullable=True),
        sa.Column("sap_customer_code", sa.String(length=50), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_organizations")),
        sa.UniqueConstraint("slug", name=op.f("uq_organizations_slug")),
    )

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("job_title", sa.String(length=120), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_users_organization_id_organizations"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
    )
    op.create_index("ix_users_organization_id_is_active", "users", ["organization_id", "is_active"], unique=False)
    op.create_index("ux_users_organization_id_email", "users", ["organization_id", "email"], unique=True)

    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("client_name", sa.String(length=200), nullable=True),
        sa.Column("status", project_status, nullable=False),
        sa.Column("sap_landscape", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_projects_organization_id_organizations"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["created_by_id"],
            ["users.id"],
            name=op.f("fk_projects_created_by_id_users"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_projects")),
    )
    op.create_index("ix_projects_organization_id_created_at", "projects", ["organization_id", "created_at"], unique=False)
    op.create_index("ix_projects_organization_id_status", "projects", ["organization_id", "status"], unique=False)
    op.create_index("uq_projects_organization_id_code", "projects", ["organization_id", "code"], unique=True)

    op.create_table(
        "templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("code", sa.String(length=80), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("template_scope", template_scope, nullable=False),
        sa.Column("document_type", document_type, nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("storage_path", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_templates_organization_id_organizations"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["created_by_id"],
            ["users.id"],
            name=op.f("fk_templates_created_by_id_users"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_templates")),
    )
    op.create_index("ix_templates_organization_id_document_type", "templates", ["organization_id", "document_type"], unique=False)
    op.create_index("ix_templates_template_scope_is_active", "templates", ["template_scope", "is_active"], unique=False)
    op.create_index("ux_templates_organization_id_code_version", "templates", ["organization_id", "code", "version"], unique=True)

    op.create_table(
        "project_members",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("member_role", project_member_role, nullable=False),
        sa.Column("allocation_pct", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_project_members_project_id_projects"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_project_members_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_project_members")),
    )
    op.create_index("ix_project_members_project_id_member_role", "project_members", ["project_id", "member_role"], unique=False)
    op.create_index("ix_project_members_user_id", "project_members", ["user_id"], unique=False)
    op.create_index("uq_project_members_project_id_user_id", "project_members", ["project_id", "user_id"], unique=True)

    op.create_table(
        "requirements",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("requirement_type", requirement_type, nullable=False),
        sa.Column("priority", requirement_priority, nullable=False),
        sa.Column("status", requirement_status, nullable=False),
        sa.Column("module", sa.String(length=80), nullable=True),
        sa.Column("source_system", sa.String(length=80), nullable=True),
        sa.Column("target_system", sa.String(length=80), nullable=True),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_requirements_project_id_projects"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["created_by_id"],
            ["users.id"],
            name=op.f("fk_requirements_created_by_id_users"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_requirements")),
    )
    op.create_index("ix_requirements_project_id_module", "requirements", ["project_id", "module"], unique=False)
    op.create_index("ix_requirements_project_id_priority", "requirements", ["project_id", "priority"], unique=False)
    op.create_index("ix_requirements_project_id_status", "requirements", ["project_id", "status"], unique=False)
    op.create_index("ux_requirements_project_id_code", "requirements", ["project_id", "code"], unique=True)

    op.create_table(
        "solutions",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("module", sa.String(length=80), nullable=True),
        sa.Column("phase", sa.String(length=80), nullable=True),
        sa.Column("status", solution_status, nullable=False),
        sa.Column("wizard_context", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_solutions_project_id_projects"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["created_by_id"],
            ["users.id"],
            name=op.f("fk_solutions_created_by_id_users"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_solutions")),
    )
    op.create_index("ix_solutions_project_id_created_at", "solutions", ["project_id", "created_at"], unique=False)
    op.create_index("ix_solutions_project_id_status", "solutions", ["project_id", "status"], unique=False)
    op.create_index("uq_solutions_project_id_name", "solutions", ["project_id", "name"], unique=True)

    op.create_table(
        "solution_requirements",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("solution_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("requirement_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("fit_type", sa.String(length=20), nullable=True),
        sa.Column("rationale", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["solution_id"],
            ["solutions.id"],
            name=op.f("fk_solution_requirements_solution_id_solutions"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["requirement_id"],
            ["requirements.id"],
            name=op.f("fk_solution_requirements_requirement_id_requirements"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_solution_requirements")),
    )
    op.create_index("ix_solution_requirements_requirement_id", "solution_requirements", ["requirement_id"], unique=False)
    op.create_index("ix_solution_requirements_solution_id_sort_order", "solution_requirements", ["solution_id", "sort_order"], unique=False)
    op.create_index("uq_solution_requirements_solution_id_requirement_id", "solution_requirements", ["solution_id", "requirement_id"], unique=True)

    op.create_table(
        "documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("solution_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("template_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("document_type", document_type, nullable=False),
        sa.Column("status", document_status, nullable=False),
        sa.Column("version", sa.Integer(), server_default=sa.text("1"), nullable=False),
        sa.Column("generated_file_path", sa.Text(), nullable=True),
        sa.Column("snapshot_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("approved_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name=op.f("fk_documents_project_id_projects"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["solution_id"],
            ["solutions.id"],
            name=op.f("fk_documents_solution_id_solutions"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["template_id"],
            ["templates.id"],
            name=op.f("fk_documents_template_id_templates"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["created_by_id"],
            ["users.id"],
            name=op.f("fk_documents_created_by_id_users"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["approved_by_id"],
            ["users.id"],
            name=op.f("fk_documents_approved_by_id_users"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_documents")),
    )
    op.create_index("ix_documents_project_id_document_type_version", "documents", ["project_id", "document_type", "version"], unique=False)
    op.create_index("ix_documents_project_id_status", "documents", ["project_id", "status"], unique=False)
    op.create_index(
        "ix_documents_solution_id_not_null",
        "documents",
        ["solution_id"],
        unique=False,
        postgresql_where=sa.text("solution_id IS NOT NULL"),
    )
    op.create_index("ix_documents_template_id", "documents", ["template_id"], unique=False)

    op.create_table(
        "document_sections",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("section_key", sa.String(length=80), nullable=False),
        sa.Column("section_title", sa.String(length=255), nullable=False),
        sa.Column("content_text", sa.Text(), nullable=True),
        sa.Column("content_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("section_order", sa.Integer(), nullable=False),
        sa.Column("status", section_status, nullable=False),
        sa.Column("source_type", sa.String(length=30), nullable=True),
        sa.Column("generated_from_requirement_ids", postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=True),
        sa.Column("updated_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["documents.id"],
            name=op.f("fk_document_sections_document_id_documents"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["updated_by_id"],
            ["users.id"],
            name=op.f("fk_document_sections_updated_by_id_users"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_document_sections")),
        sa.UniqueConstraint("document_id", "section_key", name=op.f("uq_document_sections_document_id_section_key")),
        sa.UniqueConstraint("document_id", "section_order", name=op.f("uq_document_sections_document_id_section_order")),
    )
    op.create_index("ix_document_sections_document_id_status", "document_sections", ["document_id", "status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_document_sections_document_id_status", table_name="document_sections")
    op.drop_table("document_sections")

    op.drop_index("ix_documents_template_id", table_name="documents")
    op.drop_index("ix_documents_solution_id_not_null", table_name="documents", postgresql_where=sa.text("solution_id IS NOT NULL"))
    op.drop_index("ix_documents_project_id_status", table_name="documents")
    op.drop_index("ix_documents_project_id_document_type_version", table_name="documents")
    op.drop_table("documents")

    op.drop_index("uq_solution_requirements_solution_id_requirement_id", table_name="solution_requirements")
    op.drop_index("ix_solution_requirements_solution_id_sort_order", table_name="solution_requirements")
    op.drop_index("ix_solution_requirements_requirement_id", table_name="solution_requirements")
    op.drop_table("solution_requirements")

    op.drop_index("uq_solutions_project_id_name", table_name="solutions")
    op.drop_index("ix_solutions_project_id_status", table_name="solutions")
    op.drop_index("ix_solutions_project_id_created_at", table_name="solutions")
    op.drop_table("solutions")

    op.drop_index("ux_requirements_project_id_code", table_name="requirements")
    op.drop_index("ix_requirements_project_id_status", table_name="requirements")
    op.drop_index("ix_requirements_project_id_priority", table_name="requirements")
    op.drop_index("ix_requirements_project_id_module", table_name="requirements")
    op.drop_table("requirements")

    op.drop_index("uq_project_members_project_id_user_id", table_name="project_members")
    op.drop_index("ix_project_members_user_id", table_name="project_members")
    op.drop_index("ix_project_members_project_id_member_role", table_name="project_members")
    op.drop_table("project_members")

    op.drop_index("ux_templates_organization_id_code_version", table_name="templates")
    op.drop_index("ix_templates_template_scope_is_active", table_name="templates")
    op.drop_index("ix_templates_organization_id_document_type", table_name="templates")
    op.drop_table("templates")

    op.drop_index("uq_projects_organization_id_code", table_name="projects")
    op.drop_index("ix_projects_organization_id_status", table_name="projects")
    op.drop_index("ix_projects_organization_id_created_at", table_name="projects")
    op.drop_table("projects")

    op.drop_index("ux_users_organization_id_email", table_name="users")
    op.drop_index("ix_users_organization_id_is_active", table_name="users")
    op.drop_table("users")

    op.drop_table("organizations")

    bind = op.get_bind()
    for enum_type in (
        section_status,
        document_status,
        document_type,
        template_scope,
        solution_status,
        requirement_status,
        requirement_priority,
        requirement_type,
        project_member_role,
        project_status,
        user_role,
    ):
        enum_type.drop(bind, checkfirst=True)

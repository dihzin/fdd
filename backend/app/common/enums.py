from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    CONSULTANT = "consultant"
    REVIEWER = "reviewer"
    VIEWER = "viewer"


class ProjectStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class ProjectMemberRole(str, Enum):
    OWNER = "owner"
    MANAGER = "manager"
    CONSULTANT = "consultant"
    REVIEWER = "reviewer"


class RequirementType(str, Enum):
    BUSINESS = "business"
    FUNCTIONAL = "functional"
    TECHNICAL = "technical"
    INTEGRATION = "integration"
    REPORT = "report"


class RequirementPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RequirementStatus(str, Enum):
    DRAFT = "draft"
    REFINED = "refined"
    APPROVED = "approved"
    IMPLEMENTED = "implemented"
    REJECTED = "rejected"


class SolutionStatus(str, Enum):
    DRAFT = "draft"
    PROPOSED = "proposed"
    APPROVED = "approved"
    ARCHIVED = "archived"


class TemplateScope(str, Enum):
    GLOBAL = "global"
    ORGANIZATION = "organization"


class DocumentType(str, Enum):
    FDD = "fdd"


class DocumentStatus(str, Enum):
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    EXPORTED = "exported"
    ARCHIVED = "archived"


class SectionStatus(str, Enum):
    DRAFT = "draft"
    GENERATED = "generated"
    REVIEWED = "reviewed"
    APPROVED = "approved"

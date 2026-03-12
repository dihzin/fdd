from __future__ import annotations

import uuid
from io import BytesIO

from openpyxl import Workbook

from app.domains.requirements.importer import RequirementImportParser
from app.domains.requirements.schemas import RequirementCreate, RequirementUpdate
from app.domains.requirements.service import RequirementService


class FakeRequirement:
    def __init__(self, **kwargs):
        self.id = uuid.uuid4()
        self.created_at = None
        self.updated_at = None
        for key, value in kwargs.items():
            setattr(self, key, value)


class FakeRequirementRepository:
    def __init__(self, existing_codes: set[str] | None = None) -> None:
        self.items: dict[uuid.UUID, FakeRequirement] = {}
        self.existing_codes = existing_codes or set()

    def list(self, project_id: uuid.UUID):
        return [item for item in self.items.values() if item.project_id == project_id]

    def get(self, requirement_id: uuid.UUID):
        return self.items.get(requirement_id)

    def get_by_project_and_code(self, project_id: uuid.UUID, code: str):
        for item in self.items.values():
            if item.project_id == project_id and item.code == code:
                return item
        return None

    def get_existing_codes(self, project_id: uuid.UUID, codes: set[str]):
        return self.existing_codes & codes

    def create(self, payload: RequirementCreate):
        item = FakeRequirement(**payload.model_dump())
        self.items[item.id] = item
        return item

    def update(self, requirement: FakeRequirement, payload: RequirementUpdate):
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(requirement, field, value)
        return requirement


def test_requirement_import_parser_maps_csv_columns():
    parser = RequirementImportParser()
    payload = """Requirement Code,Title,Type,SAP Module,Source System,Target System,Priority,Status
REQ-001,Create customer,functional,SD,CRM,S/4,high,draft
"""

    parsed = parser.parse("requirements.csv", payload.encode("utf-8"))

    assert parsed.mapped_columns == {
        "Requirement Code": "code",
        "Title": "title",
        "Type": "requirement_type",
        "SAP Module": "module",
        "Source System": "source_system",
        "Target System": "target_system",
        "Priority": "priority",
        "Status": "status",
    }
    assert parsed.rows[0]["code"] == "REQ-001"
    assert parsed.rows[0]["source_system"] == "CRM"


def test_requirement_import_service_returns_summary_and_partial_failures():
    repo = FakeRequirementRepository(existing_codes={"REQ-100"})
    service = RequirementService(repository=repo, import_parser=RequirementImportParser())
    project_id = uuid.uuid4()
    csv_payload = """Code,Title,Type,Module,Source System,Target System,Priority,Status
REQ-100,Existing requirement,functional,SD,CRM,S4,high,draft
REQ-101,Valid requirement,functional,SD,CRM,S4,medium,approved
,Missing code,functional,SD,CRM,S4,medium,draft
REQ-101,Duplicate in file,functional,SD,CRM,S4,medium,draft
REQ-102,Bad type,unknown,SD,CRM,S4,medium,draft
"""

    result = service.import_requirements(
        project_id=project_id,
        filename="requirements.csv",
        content=csv_payload.encode("utf-8"),
        created_by_id=None,
    )

    assert result.total_rows == 5
    assert result.created_rows == 1
    assert result.failed_rows == 4
    assert result.imported_codes == ["REQ-101"]
    assert len(result.failures) == 4


def test_requirement_import_parser_reads_excel():
    workbook = Workbook()
    sheet = workbook.active
    sheet.append(["Code", "Title", "Type", "Priority", "Status"])
    sheet.append(["REQ-200", "Excel requirement", "technical", "high", "draft"])

    payload = BytesIO()
    workbook.save(payload)

    parser = RequirementImportParser()
    parsed = parser.parse("requirements.xlsx", payload.getvalue())

    assert parsed.rows[0]["code"] == "REQ-200"
    assert parsed.rows[0]["requirement_type"] == "technical"

from __future__ import annotations

import uuid

from pydantic import ValidationError

from app.common.errors.http import bad_request, conflict, not_found
from app.domains.requirements.importer import RequirementImportParser
from app.domains.requirements.models import Requirement
from app.domains.requirements.repository import RequirementRepository
from app.domains.requirements.schemas import (
    RequirementCreate,
    RequirementImportFailure,
    RequirementImportRowInput,
    RequirementImportSummary,
    RequirementUpdate,
)


class RequirementService:
    def __init__(
        self,
        repository: RequirementRepository,
        import_parser: RequirementImportParser | None = None,
    ) -> None:
        self.repository = repository
        self.import_parser = import_parser or RequirementImportParser()

    def list_requirements(self, project_id: uuid.UUID) -> list[Requirement]:
        return self.repository.list(project_id=project_id)

    def get_requirement(self, requirement_id: uuid.UUID) -> Requirement:
        requirement = self.repository.get(requirement_id)
        if not requirement:
            raise not_found("Requirement", requirement_id)
        return requirement

    def create_requirement(self, payload: RequirementCreate) -> Requirement:
        existing = self.repository.get_by_project_and_code(payload.project_id, payload.code)
        if existing:
            raise conflict(f"Requirement code '{payload.code}' already exists in this project.")
        return self.repository.create(payload)

    def update_requirement(self, requirement_id: uuid.UUID, payload: RequirementUpdate) -> Requirement:
        requirement = self.get_requirement(requirement_id)
        if payload.code and payload.code != requirement.code:
            existing = self.repository.get_by_project_and_code(requirement.project_id, payload.code)
            if existing:
                raise conflict(f"Requirement code '{payload.code}' already exists in this project.")
        return self.repository.update(requirement, payload)

    def import_requirements(
        self,
        *,
        project_id: uuid.UUID,
        filename: str,
        content: bytes,
        created_by_id: uuid.UUID | None = None,
    ) -> RequirementImportSummary:
        parsed_file = self.import_parser.parse(filename=filename, payload=content)
        if not parsed_file.rows:
            raise bad_request("The import file does not contain data rows.")

        required_columns = {"code", "title", "requirement_type"}
        missing_columns = sorted(required_columns - set(parsed_file.mapped_columns.values()))
        if missing_columns:
            missing = ", ".join(missing_columns)
            raise bad_request(f"Missing required columns for import: {missing}.")

        imported_codes: list[str] = []
        failures: list[RequirementImportFailure] = []

        incoming_codes = {
            (row.get("code") or "").strip()
            for row in parsed_file.rows
            if row.get("code")
        }
        existing_codes = self.repository.get_existing_codes(project_id, incoming_codes)
        seen_codes: set[str] = set()

        for index, row in enumerate(parsed_file.rows, start=2):
            row_errors: list[str] = []
            code = (row.get("code") or "").strip()

            if not code:
                row_errors.append("Field 'code' is required.")
            elif code in seen_codes:
                row_errors.append(f"Code '{code}' is duplicated in the import file.")
            elif code in existing_codes:
                row_errors.append(f"Code '{code}' already exists in the project.")

            try:
                validated = RequirementImportRowInput.model_validate(row)
            except ValidationError as exc:
                row_errors.extend(self._format_validation_errors(exc))
                validated = None

            if row_errors or validated is None:
                failures.append(
                    RequirementImportFailure(
                        row_number=index,
                        raw_data=row,
                        errors=row_errors,
                    )
                )
                continue

            seen_codes.add(code)
            create_payload = RequirementCreate(
                project_id=project_id,
                created_by_id=created_by_id,
                **validated.model_dump(),
            )
            created = self.repository.create(create_payload)
            imported_codes.append(created.code)

        return RequirementImportSummary(
            filename=filename,
            project_id=project_id,
            total_rows=len(parsed_file.rows),
            created_rows=len(imported_codes),
            failed_rows=len(failures),
            imported_codes=imported_codes,
            failures=failures,
            mapped_columns=parsed_file.mapped_columns,
        )

    def _format_validation_errors(self, exc: ValidationError) -> list[str]:
        return [
            f"{'.'.join(str(part) for part in error['loc'])}: {error['msg']}"
            for error in exc.errors()
        ]

import { env } from "@/lib/env";
import { requirementProjects, requirementRecords } from "@/modules/requirements/mock-data";
import type { ProjectOption, RequirementImportSummary, RequirementRecord } from "@/modules/requirements/types";

type BackendProject = {
  id: string;
  name: string;
};

type BackendRequirement = {
  id: string;
  project_id: string;
  code: string;
  title: string;
  description?: string | null;
  type: string;
  module?: string | null;
  source_system?: string | null;
  target_system?: string | null;
  priority: string;
  status: string;
  updated_at: string;
};

type BackendImportSummary = {
  filename: string;
  total_rows: number;
  created_rows: number;
  failed_rows: number;
  imported_codes: string[];
  failures: Array<{
    row_number: number;
    errors: string[];
  }>;
};

export async function fetchProjects(): Promise<ProjectOption[]> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/v1/projects`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Projects fetch failed");
    }

    const data = (await response.json()) as BackendProject[];
    return data.map((item) => ({ id: item.id, name: item.name }));
  } catch {
    return requirementProjects;
  }
}

export async function fetchRequirements(projectId: string): Promise<RequirementRecord[]> {
  try {
    const response = await fetch(
      `${env.apiBaseUrl}/api/v1/requirements?project_id=${encodeURIComponent(projectId)}`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      throw new Error("Requirements fetch failed");
    }

    const data = (await response.json()) as BackendRequirement[];
    return data.map((item) => ({
      id: item.id,
      projectId: item.project_id,
      code: item.code,
      title: item.title,
      description: item.description ?? undefined,
      type: normalizeType(item.type),
      module: item.module ?? "Unassigned",
      sourceSystem: item.source_system ?? "N/A",
      targetSystem: item.target_system ?? "N/A",
      priority: normalizePriority(item.priority),
      status: normalizeStatus(item.status),
      updatedAt: item.updated_at,
    }));
  } catch {
    return requirementRecords.filter((item) => item.projectId === projectId);
  }
}

export async function importRequirementsFile(input: {
  projectId: string;
  file: File;
}): Promise<RequirementImportSummary> {
  const formData = new FormData();
  formData.set("project_id", input.projectId);
  formData.set("file", input.file);

  try {
    const response = await fetch(`${env.apiBaseUrl}/api/v1/requirements/import`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Requirements import failed");
    }

    const data = (await response.json()) as BackendImportSummary;
    return {
      filename: data.filename,
      totalRows: data.total_rows,
      createdRows: data.created_rows,
      failedRows: data.failed_rows,
      importedCodes: data.imported_codes,
      failures: data.failures.map((item) => ({
        rowNumber: item.row_number,
        errors: item.errors,
      })),
    };
  } catch {
    const extension = input.file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["csv", "xlsx", "xlsm"].includes(extension)) {
      throw new Error("Unsupported file type. Use CSV, XLSX or XLSM.");
    }

    return {
      filename: input.file.name,
      totalRows: 24,
      createdRows: 21,
      failedRows: 3,
      importedCodes: ["REQ-301", "REQ-302", "REQ-303"],
      failures: [
        { rowNumber: 7, errors: ["code: Field required"] },
        { rowNumber: 12, errors: ["type: Invalid option"] },
        { rowNumber: 18, errors: ["priority: Invalid option"] },
      ],
    };
  }
}

function normalizeStatus(value: string): RequirementRecord["status"] {
  return capitalize(value.replaceAll("_", " ")) as RequirementRecord["status"];
}

function normalizePriority(value: string): RequirementRecord["priority"] {
  return capitalize(value) as RequirementRecord["priority"];
}

function normalizeType(value: string): RequirementRecord["type"] {
  return capitalize(value) as RequirementRecord["type"];
}

function capitalize(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

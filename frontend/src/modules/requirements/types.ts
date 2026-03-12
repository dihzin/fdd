export type RequirementStatus = "Draft" | "Refined" | "Approved" | "Implemented" | "Rejected";
export type RequirementPriority = "Low" | "Medium" | "High" | "Critical";
export type RequirementType = "Business" | "Functional" | "Technical" | "Integration" | "Report";

export type ProjectOption = {
  id: string;
  name: string;
};

export type RequirementRecord = {
  id: string;
  projectId: string;
  code: string;
  title: string;
  description?: string;
  type: RequirementType;
  module: string;
  sourceSystem: string;
  targetSystem: string;
  priority: RequirementPriority;
  status: RequirementStatus;
  updatedAt: string;
};

export type RequirementImportSummary = {
  filename: string;
  totalRows: number;
  createdRows: number;
  failedRows: number;
  importedCodes: string[];
  failures: Array<{
    rowNumber: number;
    errors: string[];
  }>;
};

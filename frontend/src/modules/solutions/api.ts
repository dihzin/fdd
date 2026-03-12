import { env } from "@/lib/env";
import { fetchProjects, fetchRequirements } from "@/modules/requirements/api";
import { solutionRecords } from "@/modules/solutions/mock-data";
import type {
  SolutionCreateInput,
  SolutionLinkRequirementInput,
  SolutionRecord,
  SolutionRequirementLink,
  SolutionWizardContext,
  SolutionWizardPayload,
} from "@/modules/solutions/types";

type BackendSolutionListItem = {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  module?: string | null;
  phase?: string | null;
  status: string;
  requirement_count: number;
  updated_at: string;
};

type BackendSolutionRead = BackendSolutionListItem & {
  requirements: Array<{
    link_id: string;
    requirement_id: string;
    code: string;
    title: string;
    type?: string;
    requirement_type?: string;
    module?: string | null;
    priority: string;
    status: string;
    sort_order: number;
  }>;
  wizard_context?: unknown;
};

type BackendWizardNarrativeBlock = {
  summary?: string | null;
  bullets?: string[] | null;
};

type BackendWizardIntegrationItem = {
  name: string;
  source_system?: string | null;
  target_system?: string | null;
  description?: string | null;
};

type BackendWizardBusinessRuleItem = {
  title: string;
  description: string;
  criticality?: string | null;
};

type BackendWizardTechnicalImpactItem = {
  area: string;
  impact: string;
  owner?: string | null;
};

type BackendWizardContext = {
  schema_version?: number;
  context?: BackendWizardNarrativeBlock | null;
  business_problem?: BackendWizardNarrativeBlock | null;
  current_process?: BackendWizardNarrativeBlock | null;
  future_process?: BackendWizardNarrativeBlock | null;
  integrations?: BackendWizardIntegrationItem[] | null;
  business_rules?: BackendWizardBusinessRuleItem[] | null;
  technical_impacts?: BackendWizardTechnicalImpactItem[] | null;
};

type BackendWizardPayload = {
  solution_id: string;
  project_id: string;
  updated_at: string;
  wizard_context: BackendWizardContext;
};

export { fetchProjects, fetchRequirements };

export async function fetchSolutions(projectId: string): Promise<SolutionRecord[]> {
  try {
    const listResponse = await fetch(
      `${env.apiBaseUrl}/api/v1/solutions?project_id=${encodeURIComponent(projectId)}`,
      { cache: "no-store" },
    );
    if (!listResponse.ok) {
      throw new Error("Solutions fetch failed");
    }

    const listData = (await listResponse.json()) as BackendSolutionListItem[];
    const detailedSolutions = await Promise.all(
      listData.map(async (item) => {
        const detailResponse = await fetch(`${env.apiBaseUrl}/api/v1/solutions/${item.id}`, { cache: "no-store" });
        if (!detailResponse.ok) {
          throw new Error("Solution detail fetch failed");
        }

        const detail = (await detailResponse.json()) as BackendSolutionRead;
        return mapSolution(detail);
      }),
    );

    return detailedSolutions;
  } catch {
    return solutionRecords.filter((item) => item.projectId === projectId);
  }
}

export async function createSolution(input: SolutionCreateInput): Promise<SolutionRecord> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/v1/solutions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_id: input.projectId,
        name: input.name,
        description: input.description || null,
        module: input.module || null,
        phase: input.phase || null,
      }),
    });

    if (!response.ok) {
      throw new Error("Solution creation failed");
    }

    const data = (await response.json()) as BackendSolutionRead;
    return mapSolution(data);
  } catch {
    const now = new Date().toISOString();
    const createdSolution: SolutionRecord = {
      id: `solution-${crypto.randomUUID()}`,
      projectId: input.projectId,
      name: input.name,
      description: input.description,
      module: input.module || "Unassigned",
      phase: input.phase || "Backlog",
      status: "Draft",
      requirementCount: 0,
      updatedAt: now,
      requirements: [],
      wizardReady: false,
    };

    solutionRecords.unshift(createdSolution);
    return createdSolution;
  }
}

export async function linkRequirementToSolution(
  input: SolutionLinkRequirementInput,
): Promise<SolutionRecord> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/v1/solutions/${input.solutionId}/requirements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requirement_id: input.requirementId,
      }),
    });

    if (!response.ok) {
      throw new Error("Requirement linking failed");
    }

    const data = (await response.json()) as BackendSolutionRead;
    return mapSolution(data);
  } catch {
    const solution = solutionRecords.find((item) => item.id === input.solutionId);
    const requirement = (await fetchRequirements(solution?.projectId ?? "")).find((item) => item.id === input.requirementId);
    if (!solution || !requirement) {
      throw new Error("Unable to link selected requirement.");
    }

    if (solution.requirements.some((item) => item.requirementId === input.requirementId)) {
      return solution;
    }

    const linkedRequirement: SolutionRequirementLink = {
      linkId: `link-${solution.id}-${requirement.id}`,
      requirementId: requirement.id,
      code: requirement.code,
      title: requirement.title,
      type: requirement.type,
      module: requirement.module,
      priority: requirement.priority,
      status: requirement.status,
      sortOrder: solution.requirements.length + 1,
    };

    const updatedSolution: SolutionRecord = {
      ...solution,
      requirementCount: solution.requirements.length + 1,
      updatedAt: new Date().toISOString(),
      requirements: [...solution.requirements, linkedRequirement],
    };

    const solutionIndex = solutionRecords.findIndex((item) => item.id === input.solutionId);
    if (solutionIndex >= 0) {
      solutionRecords[solutionIndex] = updatedSolution;
    }

    return updatedSolution;
  }
}

export async function fetchSolution(solutionId: string): Promise<SolutionRecord> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/v1/solutions/${solutionId}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Solution detail fetch failed");
    }

    const data = (await response.json()) as BackendSolutionRead;
    return mapSolution(data);
  } catch {
    const solution = solutionRecords.find((item) => item.id === solutionId);
    if (!solution) {
      throw new Error("Solution not found.");
    }

    return solution;
  }
}

export async function fetchSolutionWizard(solutionId: string): Promise<SolutionWizardPayload> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/v1/solutions/${solutionId}/wizard`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Solution wizard fetch failed");
    }

    const data = (await response.json()) as BackendWizardPayload;
    return {
      solutionId: data.solution_id,
      projectId: data.project_id,
      updatedAt: data.updated_at,
      wizardContext: mapWizardContext(data.wizard_context),
    };
  } catch {
    const solution = solutionRecords.find((item) => item.id === solutionId);
    if (!solution) {
      throw new Error("Solution not found.");
    }

    return {
      solutionId: solution.id,
      projectId: solution.projectId,
      updatedAt: solution.updatedAt,
      wizardContext: solution.wizardContext ?? createEmptyWizardContext(),
    };
  }
}

export async function saveSolutionWizard(input: {
  solutionId: string;
  wizardContext: SolutionWizardContext;
}): Promise<SolutionWizardPayload> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/v1/solutions/${input.solutionId}/wizard`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        wizard_context: unmapWizardContext(input.wizardContext),
      }),
    });
    if (!response.ok) {
      throw new Error("Solution wizard save failed");
    }

    const data = (await response.json()) as BackendWizardPayload;
    const payload = {
      solutionId: data.solution_id,
      projectId: data.project_id,
      updatedAt: data.updated_at,
      wizardContext: mapWizardContext(data.wizard_context),
    };
    updateLocalWizardCache(payload);
    return payload;
  } catch {
    const solution = solutionRecords.find((item) => item.id === input.solutionId);
    if (!solution) {
      throw new Error("Solution not found.");
    }

    const payload = {
      solutionId: solution.id,
      projectId: solution.projectId,
      updatedAt: new Date().toISOString(),
      wizardContext: input.wizardContext,
    };
    updateLocalWizardCache(payload);
    return payload;
  }
}

function mapSolution(item: BackendSolutionRead): SolutionRecord {
  return {
    id: item.id,
    projectId: item.project_id,
    name: item.name,
    description: item.description ?? undefined,
    module: item.module ?? "Unassigned",
    phase: item.phase ?? "Backlog",
    status: normalizeStatus(item.status),
    requirementCount: item.requirement_count,
    updatedAt: item.updated_at,
    requirements: item.requirements.map((requirement) => ({
      linkId: requirement.link_id,
      requirementId: requirement.requirement_id,
      code: requirement.code,
      title: requirement.title,
      type: capitalize(requirement.type ?? requirement.requirement_type ?? "Functional"),
      module: requirement.module ?? "Unassigned",
      priority: capitalize(requirement.priority),
      status: capitalize(requirement.status.replaceAll("_", " ")),
      sortOrder: requirement.sort_order,
    })),
    wizardReady: Boolean(item.wizard_context),
    wizardContext: item.wizard_context ? mapWizardContext(item.wizard_context as BackendWizardContext) : undefined,
  };
}

function normalizeStatus(value: string): SolutionRecord["status"] {
  if (value === "draft") {
    return "Draft";
  }

  if (value === "ready") {
    return "Ready";
  }

  return "In Review";
}

function capitalize(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapWizardContext(input: BackendWizardContext | undefined): SolutionWizardContext {
  return {
    schemaVersion: input?.schema_version ?? 1,
    context: mapNarrativeBlock(input?.context),
    businessProblem: mapNarrativeBlock(input?.business_problem),
    currentProcess: mapNarrativeBlock(input?.current_process),
    futureProcess: mapNarrativeBlock(input?.future_process),
    integrations: (input?.integrations ?? []).map((item) => ({
      name: item.name,
      sourceSystem: item.source_system ?? "",
      targetSystem: item.target_system ?? "",
      description: item.description ?? "",
    })),
    businessRules: (input?.business_rules ?? []).map((item) => ({
      title: item.title,
      description: item.description,
      criticality: item.criticality ?? "",
    })),
    technicalImpacts: (input?.technical_impacts ?? []).map((item) => ({
      area: item.area,
      impact: item.impact,
      owner: item.owner ?? "",
    })),
  };
}

function unmapWizardContext(input: SolutionWizardContext): BackendWizardContext {
  return {
    schema_version: input.schemaVersion,
    context: unmapNarrativeBlock(input.context),
    business_problem: unmapNarrativeBlock(input.businessProblem),
    current_process: unmapNarrativeBlock(input.currentProcess),
    future_process: unmapNarrativeBlock(input.futureProcess),
    integrations: input.integrations.map((item) => ({
      name: item.name,
      source_system: item.sourceSystem || null,
      target_system: item.targetSystem || null,
      description: item.description || null,
    })),
    business_rules: input.businessRules.map((item) => ({
      title: item.title,
      description: item.description,
      criticality: item.criticality || null,
    })),
    technical_impacts: input.technicalImpacts.map((item) => ({
      area: item.area,
      impact: item.impact,
      owner: item.owner || null,
    })),
  };
}

function mapNarrativeBlock(input: BackendWizardNarrativeBlock | null | undefined) {
  return {
    summary: input?.summary ?? "",
    bullets: input?.bullets ?? [],
  };
}

function unmapNarrativeBlock(input: { summary: string; bullets: string[] }) {
  return {
    summary: input.summary || null,
    bullets: input.bullets,
  };
}

function createEmptyWizardContext(): SolutionWizardContext {
  return {
    schemaVersion: 1,
    context: { summary: "", bullets: [] },
    businessProblem: { summary: "", bullets: [] },
    currentProcess: { summary: "", bullets: [] },
    futureProcess: { summary: "", bullets: [] },
    integrations: [],
    businessRules: [],
    technicalImpacts: [],
  };
}

function updateLocalWizardCache(payload: SolutionWizardPayload) {
  const solutionIndex = solutionRecords.findIndex((item) => item.id === payload.solutionId);
  if (solutionIndex >= 0) {
    solutionRecords[solutionIndex] = {
      ...solutionRecords[solutionIndex],
      updatedAt: payload.updatedAt,
      wizardReady: hasWizardContent(payload.wizardContext),
      wizardContext: payload.wizardContext,
    };
  }
}

function hasWizardContent(context: SolutionWizardContext) {
  return Boolean(
    context.context.summary ||
      context.businessProblem.summary ||
      context.currentProcess.summary ||
      context.futureProcess.summary ||
      context.integrations.length ||
      context.businessRules.length ||
      context.technicalImpacts.length,
  );
}

import { requirementRecords } from "@/modules/requirements/mock-data";
import type { SolutionRecord, SolutionWizardContext } from "@/modules/solutions/types";

function narrative(summary: string, bullets: string[]): SolutionWizardContext["context"] {
  return { summary, bullets };
}

function buildWizardContext(solutionName: string): SolutionWizardContext {
  return {
    schemaVersion: 1,
    context: narrative(`${solutionName} consolidates the scoped functional package for the project.`, [
      "Scope aligns business demand with SAP implementation boundary.",
      "Requirements are grouped to support structured FDD generation.",
    ]),
    businessProblem: narrative("Current business flow has manual checkpoints and low visibility.", [
      "Approval lead time is inconsistent.",
      "Teams need clearer control points and exception handling.",
    ]),
    currentProcess: narrative("Current-state flow relies on manual validations and fragmented handoffs.", [
      "Business users rekey data between systems.",
      "Exceptions are handled outside SAP.",
    ]),
    futureProcess: narrative("Future-state flow centralizes orchestration and decision points in SAP.", [
      "Standardized control path for core scenarios.",
      "Exception routing becomes explicit and auditable.",
    ]),
    integrations: [
      {
        name: "Workflow Orchestrator",
        sourceSystem: "SAP S/4",
        targetSystem: "Workflow",
        description: "Coordinates approval or exception routing where applicable.",
      },
    ],
    businessRules: [
      {
        title: "Approval threshold",
        description: "Critical transactions above threshold require explicit approval before completion.",
        criticality: "High",
      },
    ],
    technicalImpacts: [
      {
        area: "Authorizations",
        impact: "Role review required for new approval responsibilities.",
        owner: "Security",
      },
    ],
  };
}

function buildLinkedRequirement(requirementId: string, sortOrder: number) {
  const requirement = requirementRecords.find((item) => item.id === requirementId);
  if (!requirement) {
    throw new Error(`Unknown requirement ${requirementId}`);
  }

  return {
    linkId: `link-${requirement.id}`,
    requirementId: requirement.id,
    code: requirement.code,
    title: requirement.title,
    type: requirement.type,
    module: requirement.module,
    priority: requirement.priority,
    status: requirement.status,
    sortOrder,
  };
}

export const solutionRecords: SolutionRecord[] = [
  {
    id: "solution-otc-core",
    projectId: "sap-otc-rollout",
    name: "OTC Billing & Credit Control",
    description:
      "Core design package for billing, localized output and credit release orchestration across the OTC stream.",
    module: "SD",
    phase: "Design",
    status: "In Review",
    requirementCount: 3,
    updatedAt: "2026-03-12T10:30:00Z",
    requirements: [
      buildLinkedRequirement("req-101", 1),
      buildLinkedRequirement("req-118", 2),
      buildLinkedRequirement("req-133", 3),
    ],
    wizardReady: true,
    wizardContext: buildWizardContext("OTC Billing & Credit Control"),
  },
  {
    id: "solution-p2p-governance",
    projectId: "procure-global",
    name: "Supplier Onboarding Governance",
    description: "Solution scope for upstream onboarding validations before vendor extension into SAP.",
    module: "MM",
    phase: "Discovery",
    status: "Draft",
    requirementCount: 1,
    updatedAt: "2026-03-11T14:15:00Z",
    requirements: [buildLinkedRequirement("req-204", 1)],
    wizardReady: false,
    wizardContext: {
      schemaVersion: 1,
      context: narrative("", []),
      businessProblem: narrative("", []),
      currentProcess: narrative("", []),
      futureProcess: narrative("", []),
      integrations: [],
      businessRules: [],
      technicalImpacts: [],
    },
  },
  {
    id: "solution-close-cockpit",
    projectId: "finance-close",
    name: "Close Cockpit Notifications",
    description: "Lean package for close alerting and controller visibility during the monthly close cycle.",
    module: "FI",
    phase: "Build",
    status: "Ready",
    requirementCount: 1,
    updatedAt: "2026-03-10T16:40:00Z",
    requirements: [buildLinkedRequirement("req-221", 1)],
    wizardReady: true,
    wizardContext: buildWizardContext("Close Cockpit Notifications"),
  },
];

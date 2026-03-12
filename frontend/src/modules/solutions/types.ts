export type SolutionStatus = "Draft" | "In Review" | "Ready";

export type WizardNarrativeBlock = {
  summary: string;
  bullets: string[];
};

export type WizardIntegrationItem = {
  name: string;
  sourceSystem: string;
  targetSystem: string;
  description: string;
};

export type WizardBusinessRuleItem = {
  title: string;
  description: string;
  criticality: string;
};

export type WizardTechnicalImpactItem = {
  area: string;
  impact: string;
  owner: string;
};

export type SolutionWizardContext = {
  schemaVersion: number;
  context: WizardNarrativeBlock;
  businessProblem: WizardNarrativeBlock;
  currentProcess: WizardNarrativeBlock;
  futureProcess: WizardNarrativeBlock;
  integrations: WizardIntegrationItem[];
  businessRules: WizardBusinessRuleItem[];
  technicalImpacts: WizardTechnicalImpactItem[];
};

export type SolutionWizardStepKey =
  | "context"
  | "businessProblem"
  | "currentProcess"
  | "futureProcess"
  | "integrations"
  | "businessRules"
  | "technicalImpacts";

export type SolutionWizardPayload = {
  solutionId: string;
  projectId: string;
  updatedAt: string;
  wizardContext: SolutionWizardContext;
};

export type SolutionRequirementLink = {
  linkId: string;
  requirementId: string;
  code: string;
  title: string;
  type: string;
  module: string;
  priority: string;
  status: string;
  sortOrder: number;
};

export type SolutionRecord = {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  module: string;
  phase: string;
  status: SolutionStatus;
  requirementCount: number;
  updatedAt: string;
  requirements: SolutionRequirementLink[];
  wizardReady: boolean;
  wizardContext?: SolutionWizardContext;
};

export type SolutionCreateInput = {
  projectId: string;
  name: string;
  description?: string;
  module: string;
  phase: string;
};

export type SolutionLinkRequirementInput = {
  solutionId: string;
  requirementId: string;
};

export const dashboardMetrics = [
  { label: "Projetos ativos", value: "12" },
  { label: "Requisitos abertos", value: "186" },
  { label: "Pacotes de solucao", value: "34" },
  { label: "FDDs em rascunho", value: "27" },
];

export const projects = [
  {
    id: "sap-otc-rollout",
    name: "S/4HANA OTC Rollout",
    client: "Contoso Manufacturing",
    methodology: "Fit-to-standard",
    stage: "Desenho",
    lead: "Marina Costa",
  },
  {
    id: "procure-global",
    name: "Global Procure-to-Pay Harmonization",
    client: "Northwind Group",
    methodology: "Agil hibrido",
    stage: "Blueprint",
    lead: "Lucas Menezes",
  },
  {
    id: "finance-close",
    name: "Finance Close Optimization",
    client: "Fabrikam Energy",
    methodology: "Entrega em ondas",
    stage: "Validacao",
    lead: "Beatriz Lima",
  },
];

export const requirements = [
  { code: "REQ-101", title: "Tax integration for billing", module: "SD", source: "S/4", target: "TaxOne", priority: "High", status: "Approved" },
  { code: "REQ-118", title: "Credit block release workflow", module: "SD", source: "S/4", target: "Workflow", priority: "Medium", status: "Draft" },
  { code: "REQ-133", title: "Localized invoice output", module: "Output", source: "S/4", target: "Adobe Forms", priority: "High", status: "Refined" },
];

export const solutions = [
  { name: "Billing localization package", module: "SD", phase: "Design", requirements: 14, status: "Draft" },
  { name: "Credit management controls", module: "FSCM", phase: "Blueprint", requirements: 8, status: "Proposed" },
  { name: "Output and archive orchestration", module: "Output", phase: "Validation", requirements: 11, status: "Approved" },
];

export const documents = [
  { id: "fdd-001", name: "FDD OTC Brasil", project: "S/4HANA OTC Rollout", solution: "Pacote de localizacao de faturamento", version: 3, status: "Em revisao" },
  { id: "fdd-002", name: "FDD Global Pricing", project: "S/4HANA OTC Rollout", solution: "Governanca de precificacao", version: 2, status: "Rascunho" },
  { id: "fdd-003", name: "FDD Credit Workflow", project: "Global Procure-to-Pay Harmonization", solution: "Controles de credito", version: 4, status: "Aprovado" },
];

export const templates = [
  { name: "Template FDD Corporativo", scope: "Global", version: "v3", status: "Ativo" },
  { name: "Adendo LATAM FDD", scope: "Regional", version: "v1", status: "Ativo" },
  { name: "Variacao Financeira do Cliente", scope: "Cliente", version: "v2", status: "Rascunho" },
];

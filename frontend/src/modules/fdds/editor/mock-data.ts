import type { FddDocument, FddSection } from "@/modules/fdds/editor/types";

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function buildSection(input: {
  id: string;
  sectionKey: string;
  title: string;
  order: number;
  summary: string;
  owner: string;
  status: FddSection["generationStatus"];
  updatedAt: string;
  contentHtml: string;
}): FddSection {
  return {
    id: input.id,
    sectionKey: input.sectionKey,
    title: input.title,
    order: input.order,
    summary: input.summary,
    owner: input.owner,
    generationStatus: input.status,
    updatedAt: input.updatedAt,
    wordCount: stripHtml(input.contentHtml).split(/\s+/).filter(Boolean).length,
    contentHtml: input.contentHtml,
    contentText: stripHtml(input.contentHtml),
    contentJson: {
      source: "mock",
      html: input.contentHtml,
    },
  };
}

export const sampleDocument: FddDocument = {
  id: "fdd-001",
  title: "FDD S/4HANA OTC Global Rollout",
  projectId: "sap-otc-rollout",
  solutionId: "solution-otc-core",
  templateId: "template-corporate-fdd-v3",
  documentType: "fdd",
  status: "in_review",
  version: 3,
  sections: [
    buildSection({
      id: "section-1",
      sectionKey: "objective_scope",
      title: "1. Objective and Scope",
      order: 1,
      summary: "Project framing, target business outcome and landscape in scope.",
      owner: "Solution Architecture",
      status: "approved",
      updatedAt: "2026-03-12T09:12:00Z",
      contentHtml:
        "<h2>Objective</h2><p>This document defines the functional design for the localized order-to-cash solution in the SAP S/4HANA template rollout. The section establishes the solution intent, target geography coverage and integration boundaries.</p><p>The scope includes sales order capture, pricing determination, output management, billing, tax hand-off and monitoring responsibilities across the business and support teams.</p>",
    }),
    buildSection({
      id: "section-2",
      sectionKey: "business_process",
      title: "2. Business Process Narrative",
      order: 2,
      summary: "Narrative for the target process, actors and exception flows.",
      owner: "Functional Lead",
      status: "reviewed",
      updatedAt: "2026-03-12T09:48:00Z",
      contentHtml:
        "<h2>Business process</h2><p>Customer service creates the sales order in SAP using harmonized order reasons, pricing conditions and customer master extensions. The process supports standard order creation and a controlled exception path for manual pricing review.</p><p>Credit check is triggered before delivery creation. Billing follows the local fiscal timeline and sends the relevant document payload to downstream tax and archive services.</p>",
    }),
    buildSection({
      id: "section-3",
      sectionKey: "requirements_coverage",
      title: "3. Functional Requirements Coverage",
      order: 3,
      summary: "Coverage matrix linking approved requirements to design decisions.",
      owner: "Requirements Engineering",
      status: "draft",
      updatedAt: "2026-03-12T10:03:00Z",
      contentHtml:
        "<h2>Coverage</h2><p>This section maps the approved requirements to the proposed design components, identifies impacted SAP objects and clarifies what remains as an implementation assumption.</p>",
    }),
    buildSection({
      id: "section-4",
      sectionKey: "interfaces_data",
      title: "4. Interface and Data Design",
      order: 4,
      summary: "Inbound and outbound interfaces, payloads and controls.",
      owner: "Integration Team",
      status: "generated",
      updatedAt: "2026-03-12T10:24:00Z",
      contentHtml:
        "<h2>Integration scope</h2><p>The AI assistant drafted the baseline interface landscape. Enrich payload assumptions, failure handling and control responsibilities where needed.</p>",
    }),
    buildSection({
      id: "section-5",
      sectionKey: "test_considerations",
      title: "5. Test and Acceptance Notes",
      order: 5,
      summary: "Entry criteria, test focus and sign-off checkpoints.",
      owner: "QA and Business Validation",
      status: "draft",
      updatedAt: "2026-03-12T10:40:00Z",
      contentHtml:
        "<h2>Validation approach</h2><p>Capture the scenarios required for SIT, UAT and cutover readiness. Highlight dependencies that affect sign-off quality.</p>",
    }),
  ],
};

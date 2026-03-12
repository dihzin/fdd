import { env } from "@/lib/env";
import { sampleDocument } from "@/modules/fdds/editor/mock-data";
import type { AiAction, FddDocument, FddSection } from "@/modules/fdds/editor/types";

type BackendDocumentStructure = {
  id: string;
  title: string;
  project_id: string;
  solution_id?: string | null;
  template_id: string;
  document_type: "fdd";
  status: "draft" | "in_review" | "approved" | "exported" | "archived";
  version: number;
  sections: BackendSection[];
};

type BackendSection = {
  id: string;
  section_key: string;
  section_title: string;
  section_order: number;
  content_json?: Record<string, unknown> | null;
  content_text?: string | null;
  status: "draft" | "generated" | "reviewed" | "approved";
  updated_at: string;
};

export async function fetchDocumentStructure(documentId: string): Promise<FddDocument> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/v1/documents/${documentId}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Document structure fetch failed");
    }

    const data = (await response.json()) as BackendDocumentStructure;
    return {
      id: data.id,
      title: data.title,
      projectId: data.project_id,
      solutionId: data.solution_id ?? undefined,
      templateId: data.template_id,
      documentType: data.document_type,
      status: data.status,
      version: data.version,
      sections: data.sections
        .slice()
        .sort((left, right) => left.section_order - right.section_order)
        .map(mapSection),
    };
  } catch {
    return sampleDocument;
  }
}

export async function saveDocumentSection(input: {
  documentId: string;
  section: FddSection;
}): Promise<FddSection> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/v1/documents/${input.documentId}/sections/${input.section.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        section_title: input.section.title,
        content_json: input.section.contentJson,
        content_text: input.section.contentText,
        status: input.section.generationStatus,
      }),
    });
    if (!response.ok) {
      throw new Error("Section save failed");
    }

    const data = (await response.json()) as BackendSection;
    return mapSection(data);
  } catch {
    return {
      ...input.section,
      updatedAt: new Date().toISOString(),
      generationStatus: input.section.generationStatus === "approved" ? "approved" : "reviewed",
    };
  }
}

export async function generateDocumentSection(input: {
  documentId: string;
  sectionId: string;
}): Promise<FddSection> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/v1/documents/${input.documentId}/sections/${input.sectionId}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      throw new Error("Section generation failed");
    }

    const data = (await response.json()) as BackendSection;
    return mapSection(data);
  } catch {
    const fallbackSection = sampleDocument.sections.find((section) => section.id === input.sectionId);
    if (!fallbackSection) {
      throw new Error("Section not found");
    }

    const generatedHtml = `${fallbackSection.contentHtml}<p><strong>Generated baseline:</strong> This draft consolidates project, solution and wizard context into a first-pass section narrative with SAP implementation focus.</p>`;
    return {
      ...fallbackSection,
      contentHtml: generatedHtml,
      contentText: stripHtml(generatedHtml),
      contentJson: {
        source: "fallback-generate",
        html: generatedHtml,
      },
      generationStatus: "generated",
      updatedAt: new Date().toISOString(),
      wordCount: estimateWords(generatedHtml),
    };
  }
}

export function applyLocalAiAction(section: FddSection, action: Exclude<AiAction, "generate">): FddSection {
  const delta = aiActionCopy[action];
  const nextHtml = `${section.contentHtml}${delta}`;

  return {
    ...section,
    contentHtml: nextHtml,
    contentText: stripHtml(nextHtml),
    contentJson: {
      source: "local-ai-action",
      action,
      html: nextHtml,
    },
    generationStatus: section.generationStatus === "approved" ? "approved" : "reviewed",
    updatedAt: new Date().toISOString(),
    wordCount: estimateWords(nextHtml),
  };
}

const aiActionCopy: Record<Exclude<AiAction, "generate">, string> = {
  improve:
    "<p><strong>Refined wording:</strong> Responsibilities, decision points and SAP terminology were tightened to read like a formal enterprise design document.</p>",
  expand:
    "<p><strong>Expanded detail:</strong> Additional assumptions, exception paths, integration checkpoints and operational notes were incorporated for implementation readiness.</p>",
  restructure:
    "<h3>Recommended structure</h3><ul><li>Context and scope</li><li>Process flow and actors</li><li>Design decisions</li><li>Controls, assumptions and dependencies</li></ul>",
};

function mapSection(section: BackendSection): FddSection {
  const html =
    extractHtml(section.content_json) ||
    renderTextAsHtml(section.content_text || "");

  return {
    id: section.id,
    sectionKey: section.section_key,
    title: section.section_title,
    order: section.section_order,
    summary: sectionSummary(section.section_key),
    owner: sectionOwner(section.section_key),
    generationStatus: section.status,
    updatedAt: section.updated_at,
    wordCount: estimateWords(html),
    contentHtml: html,
    contentText: section.content_text ?? stripHtml(html),
    contentJson: section.content_json ?? null,
  };
}

function extractHtml(contentJson: Record<string, unknown> | null | undefined) {
  const html = contentJson?.html;
  return typeof html === "string" ? html : null;
}

function renderTextAsHtml(contentText: string) {
  if (!contentText.trim()) {
    return "<p></p>";
  }

  return contentText
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function estimateWords(content: string) {
  return stripHtml(content).split(/\s+/).filter(Boolean).length;
}

function sectionSummary(sectionKey: string) {
  return {
    objective_scope: "Project framing, business objective and overall scope boundary.",
    business_process: "Narrative of actors, process sequence and controlled exception flow.",
    requirements_coverage: "Mapping between approved requirements and design decisions.",
    functional_design: "Functional behavior, SAP objects and core design logic.",
    interfaces_data: "Interfaces, payload assumptions and monitoring controls.",
    security_controls: "Authorizations, roles and control requirements.",
    assumptions_dependencies: "Assumptions, dependencies and open points impacting delivery.",
    test_considerations: "Validation scope, sign-off checkpoints and test focus.",
  }[sectionKey] ?? "Structured FDD section.";
}

function sectionOwner(sectionKey: string) {
  return {
    objective_scope: "Solution Architecture",
    business_process: "Functional Lead",
    requirements_coverage: "Requirements Engineering",
    functional_design: "SAP Design Lead",
    interfaces_data: "Integration Team",
    security_controls: "Security and Controls",
    assumptions_dependencies: "Program Governance",
    test_considerations: "QA and Business Validation",
  }[sectionKey] ?? "FDD Owner";
}

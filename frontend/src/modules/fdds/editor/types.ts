export type SectionGenerationStatus = "draft" | "generated" | "reviewed" | "approved";

export type AiAction = "generate" | "improve" | "expand" | "restructure";

export type FddSection = {
  id: string;
  sectionKey: string;
  title: string;
  order: number;
  summary: string;
  owner: string;
  generationStatus: SectionGenerationStatus;
  updatedAt: string;
  wordCount: number;
  contentHtml: string;
  contentText: string;
  contentJson: Record<string, unknown> | null;
};

export type FddDocument = {
  id: string;
  title: string;
  projectId: string;
  solutionId?: string;
  templateId: string;
  documentType: "fdd";
  status: "draft" | "in_review" | "approved" | "exported" | "archived";
  version: number;
  sections: FddSection[];
};

export type FddEditorContent = {
  html: string;
  text: string;
  json: Record<string, unknown>;
};

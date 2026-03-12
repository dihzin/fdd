export type DocumentExportFormat = "docx";

export async function exportDocumentFile(input: {
  documentId: string;
  format: DocumentExportFormat;
  filename: string;
}) {
  const endpoint = exportEndpoint(input.documentId, input.format);
  const response = await fetch(endpoint, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("O servico de exportacao nao conseguiu gerar o arquivo neste momento.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = ensureExtension(sanitizeFilename(input.filename), input.format);
  window.document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);

  return {
    filename: anchor.download,
  };
}

export function buildDocumentExportFilename(input: {
  projectName: string;
  solutionName?: string | null;
  version: number;
  format: DocumentExportFormat;
}) {
  const project = slugifySegment(input.projectName || "project");
  const solution = slugifySegment(input.solutionName || "document");
  const version = `v${input.version}`;

  return ensureExtension(`${project}__${solution}__${version}`, input.format);
}

function exportEndpoint(documentId: string, format: DocumentExportFormat) {
  const pathByFormat: Record<DocumentExportFormat, string> = {
    docx: `/api/v1/documents/${documentId}/export/docx`,
  };

  return `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}${pathByFormat[format]}`;
}

function sanitizeFilename(value: string) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-");
}

function ensureExtension(filename: string, format: DocumentExportFormat) {
  const extension = `.${format}`;
  return filename.endsWith(extension) ? filename : `${filename}${extension}`;
}

function slugifySegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "item";
}

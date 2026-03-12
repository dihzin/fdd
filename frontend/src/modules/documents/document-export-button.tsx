"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { buildDocumentExportFilename, exportDocumentFile, type DocumentExportFormat } from "@/modules/documents/export";

type DocumentExportButtonProps = {
  documentId: string;
  projectName: string;
  solutionName?: string | null;
  version: number;
  format?: DocumentExportFormat;
  label?: string;
  compact?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
};

export function DocumentExportButton({
  documentId,
  projectName,
  solutionName,
  version,
  format = "docx",
  label,
  compact = false,
  disabled = false,
  disabledMessage,
}: DocumentExportButtonProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const exportMutation = useMutation({
    mutationFn: exportDocumentFile,
    onSuccess: (result) => {
      setFeedback(`Arquivo baixado: ${result.filename}`);
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel exportar o documento agora.");
    },
  });

  const buttonLabel = label ?? `Exportar ${format.toUpperCase()}`;

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <button
        type="button"
        onClick={() =>
          exportMutation.mutate({
            documentId,
            format,
            filename: buildDocumentExportFilename({
              projectName,
              solutionName,
              version,
              format,
            }),
          })
        }
        disabled={disabled || exportMutation.isPending}
        className={`rounded-2xl border text-sm font-semibold transition ${
          compact
            ? "border-[var(--border)] bg-white px-3 py-2 text-slate-700 hover:border-slate-300"
            : "border-slate-900 bg-slate-900 px-4 py-3 text-white hover:bg-slate-800"
        } disabled:cursor-wait disabled:opacity-60`}
      >
        {exportMutation.isPending ? "Exportando..." : buttonLabel}
      </button>
      {disabled && disabledMessage ? (
        <p className="text-xs leading-5 text-amber-700">{disabledMessage}</p>
      ) : null}
      {feedback ? (
        <p className={`text-xs leading-5 ${exportMutation.isError ? "text-rose-700" : "text-slate-500"}`}>{feedback}</p>
      ) : null}
    </div>
  );
}

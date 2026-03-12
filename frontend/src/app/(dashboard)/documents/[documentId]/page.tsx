import { FddEditorWorkspace } from "@/modules/fdds/editor/fdd-editor-workspace";

export default async function DocumentEditorPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return <FddEditorWorkspace documentId={documentId} />;
}

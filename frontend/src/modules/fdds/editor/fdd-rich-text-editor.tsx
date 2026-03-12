"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

import type { FddEditorContent } from "@/modules/fdds/editor/types";

type FddRichTextEditorProps = {
  content: string;
  onChange: (content: FddEditorContent) => void;
};

export function FddRichTextEditor({ content, onChange }: FddRichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    editorProps: {
      attributes: {
        class:
          "fdd-editor min-h-[520px] rounded-[1.75rem] border border-[var(--border)] bg-white px-7 py-6 text-[15px] leading-7 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] focus:outline-none",
      },
    },
    content,
    onUpdate: ({ editor: currentEditor }) => {
      onChange({
        html: currentEditor.getHTML(),
        text: currentEditor.getText(),
        json: currentEditor.getJSON() as Record<string, unknown>,
      });
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const current = editor.getHTML();
    if (current !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) {
    return <div className="min-h-[520px] animate-pulse rounded-[1.75rem] border border-[var(--border)] bg-white/70" />;
  }

  const toggleHeading = (level: 2 | 3) => {
    editor.chain().focus().toggleHeading({ level }).run();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-[1.6rem] border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#f3f7fb_100%)] p-3">
        <ToolbarButton isActive={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          Negrito
        </ToolbarButton>
        <ToolbarButton isActive={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          Italico
        </ToolbarButton>
        <ToolbarButton isActive={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          Lista
        </ToolbarButton>
        <ToolbarButton isActive={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          Numerada
        </ToolbarButton>
        <ToolbarButton isActive={editor.isActive("heading", { level: 2 })} onClick={() => toggleHeading(2)}>
          H2
        </ToolbarButton>
        <ToolbarButton isActive={editor.isActive("heading", { level: 3 })} onClick={() => toggleHeading(3)}>
          H3
        </ToolbarButton>
        <ToolbarButton isActive={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          Citacao
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

type ToolbarButtonProps = {
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
};

function ToolbarButton({ children, isActive, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
        isActive
          ? "bg-[var(--accent)] text-white shadow-[0_12px_24px_rgba(15,118,110,0.22)]"
          : "bg-[var(--surface-muted)] text-slate-700 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

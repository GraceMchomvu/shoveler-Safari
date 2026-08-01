import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { useEffect, useRef, useState } from "react";
import { uploadFromComputer } from "../lib/upload";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

function normalizeEditorHtml(html: string) {
  const raw = (html || "").trim() || "<p></p>";
  // Avoid empty bold wrappers that leave Bold stuck on while typing
  return raw
    .replace(/<strong>\s*<\/strong>/gi, "")
    .replace(/<b>\s*<\/b>/gi, "");
}

export default function RichEditor({ value, onChange, placeholder }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // New lines / paragraphs start as normal text, not bold
        bold: {
          keepOnSplit: false,
        },
        italic: {
          keepOnSplit: false,
        },
      }),
      Image.configure({
        HTMLAttributes: { class: "rounded-lg max-w-full h-auto my-3" },
      }),
    ],
    content: normalizeEditorHtml(value),
    onCreate: ({ editor: ed }) => {
      ed.view.dispatch(ed.state.tr.setStoredMarks([]));
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        class:
          "cms-editor max-w-none min-h-[220px] px-3 py-3 focus:outline-none text-[15px] leading-relaxed",
      },
      transformPastedHTML(html) {
        // Pasted text comes in as normal weight unless it was intentionally bold
        return html;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = normalizeEditorHtml(value);
    const current = editor.getHTML();
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false });
      // Don't leave Bold armed for the next keystroke after content loads
      editor.view.dispatch(editor.state.tr.setStoredMarks([]));
    }
  }, [value, editor]);

  if (!editor) return null;

  const btn = (active: boolean) =>
    `px-2.5 py-1 rounded text-xs font-medium border ${
      active
        ? "bg-[var(--gold)] border-[var(--gold)] text-[#1a1f1a]"
        : "bg-white border-[var(--border)] text-[var(--ink)] hover:bg-[var(--cream)]"
    }`;

  async function insertPhotoFromComputer(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const media = await uploadFromComputer(file);
      editor.chain().focus().unsetBold().setImage({ src: media.url, alt: media.originalName }).run();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not upload photo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden relative">
      <div className="flex flex-wrap gap-1.5 border-b border-[var(--border)] bg-[var(--cream)]/60 px-2 py-2">
        <button
          type="button"
          className={btn(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          type="button"
          className={btn(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          type="button"
          className={btn(editor.isActive("heading", { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          Heading
        </button>
        <button
          type="button"
          className={btn(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          Bullets
        </button>
        <button
          type="button"
          className={btn(editor.isActive("orderedList"))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          Numbers
        </button>
        <button
          type="button"
          className={btn(false)}
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "Uploading…" : "Add photo"}
        </button>
        <button
          type="button"
          className={btn(false)}
          onClick={() => editor.chain().focus().unsetAllMarks().setParagraph().run()}
        >
          Clear format
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => insertPhotoFromComputer(e.target.files)}
        />
      </div>
      {!value && placeholder && (
        <div className="px-3 pt-3 text-sm text-[var(--muted)] pointer-events-none absolute opacity-0">
          {placeholder}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

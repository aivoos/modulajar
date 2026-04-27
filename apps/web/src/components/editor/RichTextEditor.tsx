"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder, readOnly }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: placeholder ?? "Tulis di sini...",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value || "",
    editable: !readOnly,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200 flex-wrap">
          {[
            { label: "B", action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
            { label: "I", action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
            { label: "U", action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline") },
          ].map(({ label, action, active }) => (
            <button
              key={label}
              onMouseDown={(e) => { e.preventDefault(); action(); }}
              className={`w-7 h-7 rounded text-sm font-bold flex items-center justify-center transition-colors ${
                active ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="w-px h-4 bg-gray-300 mx-1" />
          {[
            { label: "H2", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
            { label: "H3", action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
          ].map(({ label, action, active }) => (
            <button
              key={label}
              onMouseDown={(e) => { e.preventDefault(); action(); }}
              className={`px-2 h-7 rounded text-xs font-bold flex items-center justify-center transition-colors ${
                active ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="w-px h-4 bg-gray-300 mx-1" />
          {[
            { label: "• List", action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
            { label: "1. List", action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
          ].map(({ label, action, active }) => (
            <button
              key={label}
              onMouseDown={(e) => { e.preventDefault(); action(); }}
              className={`px-2 h-7 rounded text-xs flex items-center justify-center transition-colors ${
                active ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <EditorContent
        editor={editor}
        className="px-4 py-3 text-sm text-gray-900 min-h-[120px] prose prose-sm max-w-none focus:outline-none"
      />
    </div>
  );
}
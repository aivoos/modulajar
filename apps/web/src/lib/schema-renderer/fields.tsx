// SchemaRenderer — renders ModuleTemplate.schema JSONB → React form
// Ref: modulajar-master-v3.jsx — Day 9 + Day 14 AI Assist
import React, { Suspense, useState } from "react";
import { type SchemaField, type SchemaSection, type ModuleContent } from "./types";
import dynamic from "next/dynamic";

// Lazy-load Tiptap editor (requires client-side hooks)
const RichTextEditor = dynamic(
  () => import("@/components/editor/RichTextEditor").then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-400 bg-gray-50">
        Memuat editor...
      </div>
    ),
  }
);

interface Props {
  schema: SchemaSection[];
  content: ModuleContent;
  onChange: (key: string, value: unknown) => void;
  readOnly?: boolean;
  moduleId?: string;
}

// ── Field Components ─────────────────────────────────────────────

function TextField({ field, value, onChange, readOnly, moduleId }: {
  field: SchemaField; value: string | null; onChange: (v: string) => void; readOnly?: boolean; moduleId?: string;
}) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  async function handleAiAssist() {
    if (!moduleId) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch("/api/agent/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_id: moduleId, section: field.key, mode: "suggest", current_content: value ?? "" }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setAiResult(data.result);
      }
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {!readOnly && moduleId && (
          <button
            onClick={handleAiAssist}
            disabled={aiLoading}
            className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50"
            title="Bantuan AI"
            type="button"
          >
            {aiLoading ? "🤖..." : "🤖 AI"}
          </button>
        )}
      </div>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        placeholder={field.hint ?? field.label}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
      />
      {field.hint && <p className="text-xs text-gray-400 mt-1">{field.hint}</p>}
      {aiResult && (
        <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-700">
          <p className="text-xs font-medium text-indigo-500 mb-1">💡 Saran AI</p>
          <p className="whitespace-pre-wrap">{aiResult}</p>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => { onChange(value ? `${value}\n\n${aiResult}` : aiResult); setAiResult(null); }}
              className="text-xs text-indigo-600 hover:underline"
            >+ Tambahkan</button>
            <button
              type="button"
              onClick={() => setAiResult(null)}
              className="text-xs text-gray-400 hover:underline"
            >Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TextareaField({ field, value, onChange, readOnly }: {
  field: SchemaField; value: string | null; onChange: (v: string) => void; readOnly?: boolean;
}) {
  if (readOnly) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          value={value ?? ""}
          disabled
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm resize-none bg-gray-50 text-gray-600"
        />
        {field.hint && <p className="text-xs text-gray-400 mt-1">{field.hint}</p>}
      </div>
    );
  }

  // Use Tiptap RichTextEditor for textarea fields in edit mode
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Suspense fallback={
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.hint ?? field.label}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      }>
        <RichTextEditor
          value={value ?? ""}
          onChange={onChange}
          placeholder={field.hint ?? field.label}
          readOnly={readOnly}
        />
      </Suspense>
      {field.hint && <p className="text-xs text-gray-400 mt-1">{field.hint}</p>}
    </div>
  );
}

function TableField({ field, value, onChange, readOnly }: {
  field: SchemaField; value: Record<string, string>[] | null; onChange: (v: Record<string, string>[]) => void; readOnly?: boolean;
}) {
  const firstKey = field.columns?.[0]?.key ?? "Kolom";
  const rows = value ?? [{ [firstKey]: "" }];

  function updateRow(idx: number, col: string, val: string) {
    const updated = rows.map((r, i) => i === idx ? { ...r, [col]: val } : r);
    onChange(updated);
  }

  function addRow() {
    onChange([...rows, { [firstKey]: "" }]);
  }

  function removeRow(idx: number) {
    if (rows.length <= 1) return;
    onChange(rows.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-3 py-2 text-left w-10">#</th>
              {(field.columns ?? []).map((col) => (
                <th key={col.key} className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">{col.label}</th>
              ))}
              {!readOnly && <th className="border border-gray-200 w-10" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td className="border border-gray-200 px-3 py-2 text-gray-400 text-xs">{idx + 1}</td>
                {(field.columns ?? []).map((col) => (
                  <td key={col.key} className="border border-gray-200 px-2 py-1">
                    <input
                      type="text"
                      value={row[col.key] ?? ""}
                      onChange={(e) => updateRow(idx, col.key, e.target.value)}
                      disabled={readOnly}
                      className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-0 text-sm"
                    />
                  </td>
                ))}
                {!readOnly && (
                  <td className="border border-gray-200 px-2 py-1">
                    <button
                      onClick={() => removeRow(idx)}
                      className="text-gray-400 hover:text-red-500 text-xs px-1"
                    >✕</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <button onClick={addRow} className="mt-2 text-xs text-indigo-600 hover:underline">
          + Tambah baris
        </button>
      )}
    </div>
  );
}

// ── Section Renderer ──────────────────────────────────────────

function SectionRenderer({ section, content, onChange, readOnly, depth = 0, moduleId }: {
  section: SchemaSection;
  content: ModuleContent;
  onChange: (key: string, value: unknown) => void;
  readOnly?: boolean;
  depth?: number;
  moduleId?: string;
}) {
  return (
    <div className={`${depth > 0 ? "ml-4 pl-4 border-l-2 border-gray-100" : ""}`}>
      <h3 className="text-base font-semibold text-gray-900 mb-4">{section.title}</h3>
      <div className="space-y-4">
        {section.fields.map((field) => {
          const value = content[field.key] ?? null;

          if (field.type === "textarea" || field.type === "text") {
            const Comp = field.type === "textarea" ? TextareaField : TextField;
            return (
              <Comp
                key={field.key}
                field={field}
                value={value as string | null}
                onChange={(v) => onChange(field.key, v)}
                readOnly={readOnly}
                moduleId={moduleId}
              />
            );
          }

          if (field.type === "table") {
            return (
              <TableField
                key={field.key}
                field={field}
                value={value as Record<string, string>[] | null}
                onChange={(v) => onChange(field.key, v)}
                readOnly={readOnly}
              />
            );
          }

          if (field.type === "checkbox") {
            return (
              <div key={field.key} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id={`cb-${field.key}`}
                  checked={!!value}
                  onChange={(e) => onChange(field.key, e.target.checked)}
                  disabled={readOnly}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <label htmlFor={`cb-${field.key}`} className="text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.hint && <p className="text-xs text-gray-400 mt-0.5">{field.hint}</p>}
                </div>
              </div>
            );
          }

          if (field.type === "select") {
            return (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <select
                  value={(value as string | null) ?? ""}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  disabled={readOnly}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-50"
                >
                  <option value="">— Pilih —</option>
                  {(field.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {field.hint && <p className="text-xs text-gray-400 mt-1">{field.hint}</p>}
              </div>
            );
          }

          return null;
        })}

        {section.sections?.map((sub) => (
          <div key={sub.id} className="mt-6 pt-4 border-t border-gray-100">
            <SectionRenderer section={sub} content={content} onChange={onChange} readOnly={readOnly} depth={depth + 1} moduleId={moduleId} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Export ─────────────────────────────────────────────────

export function SchemaRenderer({ schema, content, onChange, readOnly, moduleId }: Props) {
  const sorted = [...schema].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-8">
      {sorted.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          content={content}
          onChange={onChange}
          readOnly={readOnly}
          moduleId={moduleId}
        />
      ))}
    </div>
  );
}

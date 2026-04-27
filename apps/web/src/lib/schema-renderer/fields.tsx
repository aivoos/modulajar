// SchemaRenderer — renders ModuleTemplate.schema JSONB → React form
import React from "react";
import { type SchemaField, type SchemaSection, type ModuleContent } from "./types";

interface Props {
  schema: SchemaSection[];
  content: ModuleContent;
  onChange: (key: string, value: unknown) => void;
  readOnly?: boolean;
}

// ── Field Components ─────────────────────────────────────────────

function TextField({ field, value, onChange, readOnly }: {
  field: SchemaField; value: string | null; onChange: (v: string) => void; readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        placeholder={field.hint ?? field.label}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-600"
      />
      {field.hint && <p className="text-xs text-gray-400 mt-1">{field.hint}</p>}
    </div>
  );
}

function TextareaField({ field, value, onChange, readOnly }: {
  field: SchemaField; value: string | null; onChange: (v: string) => void; readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        placeholder={field.hint ?? field.label}
        rows={4}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:bg-gray-50 disabled:text-gray-600"
      />
      {field.hint && <p className="text-xs text-gray-400 mt-1">{field.hint}</p>}
    </div>
  );
}

function TableField({ field, value, onChange, readOnly }: {
  field: SchemaField; value: Record<string, string>[] | null; onChange: (v: Record<string, string>[]) => void; readOnly?: boolean;
}) {
  const rows = value ?? [{ [field.columns?.[0] ?? "Kolom"]: "" }];

  function updateRow(idx: number, col: string, val: string) {
    const updated = rows.map((r, i) => i === idx ? { ...r, [col]: val } : r);
    onChange(updated);
  }

  function addRow() {
    onChange([...rows, { [field.columns?.[0] ?? "Kolom"]: "" }]);
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
                <th key={col} className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">{col}</th>
              ))}
              {!readOnly && <th className="border border-gray-200 w-10" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td className="border border-gray-200 px-3 py-2 text-gray-400 text-xs">{idx + 1}</td>
                {(field.columns ?? []).map((col) => (
                  <td key={col} className="border border-gray-200 px-2 py-1">
                    <input
                      type="text"
                      value={row[col] ?? ""}
                      onChange={(e) => updateRow(idx, col, e.target.value)}
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

function SectionRenderer({ section, content, onChange, readOnly, depth = 0 }: {
  section: SchemaSection;
  content: ModuleContent;
  onChange: (key: string, value: unknown) => void;
  readOnly?: boolean;
  depth?: number;
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

          return null;
        })}

        {section.sections?.map((sub) => (
          <div key={sub.id} className="mt-6 pt-4 border-t border-gray-100">
            <SectionRenderer section={sub} content={content} onChange={onChange} readOnly={readOnly} depth={depth + 1} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Export ─────────────────────────────────────────────────

export function SchemaRenderer({ schema, content, onChange, readOnly }: Props) {
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
        />
      ))}
    </div>
  );
}

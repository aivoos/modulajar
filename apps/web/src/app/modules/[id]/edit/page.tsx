"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { SchemaRenderer } from "@/lib/schema-renderer/fields";
import type { ModuleTemplateSchema, ModuleContent } from "@/lib/schema-renderer/types";

interface Section {
  id: string;
  title: string;
}

function SidebarOutline({ sections, active, onClick }: {
  sections: Section[]; active: string; onClick: (id: string) => void;
}) {
  return (
    <aside className="w-52 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
      <div className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
        Sections
      </div>
      {sections.map((s) => (
        <button
          key={s.id}
          onClick={() => onClick(s.id)}
          className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
            active === s.id
              ? "bg-indigo-50 text-indigo-700 font-medium border-l-2 border-indigo-600"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            active === s.id ? "bg-indigo-600" : "bg-gray-300"
          }`} />
          {s.title}
        </button>
      ))}
    </aside>
  );
}

export default function ModuleEditorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [module, setModule] = useState<{
    id: string; title: string; subject: string; phase: string | null; status: string; content: ModuleContent;
  } | null>(null);
  const [schema, setSchema] = useState<ModuleTemplateSchema | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState("");
  const [content, setContent] = useState<ModuleContent>({});
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const debounceRef = useRef<any>(null);

  // Load module + template
  useEffect(() => {
    async function load() {
      const { data: mod, error } = await supabase
        .from("modules")
        .select("id, title, subject, phase, status, content, template_id, curriculum_version_id")
        .eq("id", params.id)
        .single();

      if (error || !mod) { router.push("/modules"); return; }

      setModule(mod as typeof module);
      setTitle(mod.title ?? "Modul Baru");
      setContent((mod.content as ModuleContent) ?? {});

      // Load template schema
      const { data: tmpl } = await supabase
        .from("module_templates")
        .select("schema")
        .eq("id", mod.template_id)
        .single();

      if (tmpl) {
        const parsed = tmpl.schema as ModuleTemplateSchema;
        setSchema(parsed);
        const sorted = [...parsed.sections].sort((a, b) => a.order - b.order);
        setSections(sorted.map((s) => ({ id: s.id, title: s.title })));
        setActiveSection(sorted[0]?.id ?? "");
      }

      setLoading(false);
    }
    load();
  }, [params.id, router]);

  // Auto-scroll to active section
  useEffect(() => {
    const el = document.getElementById(`section-${activeSection}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeSection]);

  // Debounced autosave
  const save = useCallback(async (updates: ModuleContent) => {
    if (!params.id) return;
    setSaveStatus("saving");

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const merged = { ...content, ...updates } as ModuleContent;
      const { error } = await supabase
        .from("modules")
        .update({ title, content: merged, updated_at: new Date().toISOString() })
        .eq("id", params.id);

      if (error) {
        setSaveStatus("error");
        console.error("Autosave failed:", error);
      } else {
        setContent(merged);
        setSaveStatus("saved");
      }
    }, 2000);
  }, [params.id, title, content]);

  function handleChange(key: string, value: unknown) {
    const updated = { ...content, [key]: value } as unknown as ModuleContent;
    setContent(updated);
    save(updated);
  }

  function handleTitleBlur() {
    if (!params.id) return;
    supabase.from("modules").update({ title }).eq("id", params.id);
  }

  async function handlePublish() {
    if (!params.id) return;
    const { error } = await supabase
      .from("modules")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", params.id);

    if (!error) router.push(`/modules/${params.id}`);
  }

  if (loading) {
    return (
      <div className="flex flex-1">
        <div className="w-52 flex-shrink-0 bg-gray-50 animate-pulse" />
        <div className="flex-1 p-8 space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!schema || !module) return null;

  const sortedSections = [...schema.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <SidebarOutline
        sections={sections}
        active={activeSection}
        onClick={setActiveSection}
      />

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/modules")}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >← Kembali</button>

          <div className="flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="text-lg font-semibold text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-0 w-full"
              placeholder="Judul Modul"
            />
          </div>

          {/* Save indicator */}
          <span className="text-xs">
            {saveStatus === "saving" && <span className="text-amber-500">● Menyimpan...</span>}
            {saveStatus === "saved" && <span className="text-green-500">● Tersimpan</span>}
            {saveStatus === "error" && <span className="text-red-500">● Gagal menyimpan</span>}
          </span>

          {module.status === "draft" && (
            <button
              onClick={handlePublish}
              className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700"
            >
              Publish
            </button>
          )}
          {module.status === "published" && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Published</span>
          )}
          <Link
            href={`/modules/${params.id}`}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Preview
          </Link>
        </div>

        {/* Sections */}
        <div className="p-6 max-w-3xl mx-auto space-y-10">
          {sortedSections.map((section) => (
            <div key={section.id} id={`section-${section.id}`} className="scroll-mt-20">
              <SchemaRenderer
                schema={[section]}
                content={content}
                onChange={handleChange}
                readOnly={module.status === "published"}
                moduleId={module.id}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

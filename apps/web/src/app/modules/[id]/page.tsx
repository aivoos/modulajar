"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { SchemaRenderer } from "@/lib/schema-renderer/fields";
import type { ModuleTemplateSchema, ModuleContent } from "@/lib/schema-renderer/types";

export default function ModulePreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [module, setModule] = useState<{
    id: string; title: string; subject: string; fase: string; kelas: number[]; status: string;
    created_at: string; published_at: string | null; content: ModuleContent; user_id: string;
  } | null>(null);
  const [schema, setSchema] = useState<ModuleTemplateSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: mod, error } = await supabase
        .from("modules")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error || !mod) { router.push("/modules"); return; }

      // Access check: own or curated
      if (mod.user_id !== user?.id && !mod.is_curated) {
        router.push("/modules"); return;
      }

      setModule(mod as typeof module);

      // Load template schema
      const { data: tmpl } = await supabase
        .from("module_templates")
        .select("schema")
        .eq("id", mod.module_template_id)
        .single();

      if (tmpl) setSchema(tmpl.schema as ModuleTemplateSchema);

      // Load author name
      const { data: author } = await supabase.from("users").select("full_name").eq("id", mod.user_id).single();
      setAuthorName(author?.full_name ?? "Guru");

      setLoading(false);
    }
    load();
  }, [params.id, router]);

  if (loading) return (
    <div className="p-8 max-w-4xl mx-auto space-y-4">
      <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
      <div className="h-40 bg-gray-100 rounded animate-pulse" />
      <div className="h-40 bg-gray-100 rounded animate-pulse" />
    </div>
  );

  if (!schema || !module) return null;

  const sortedSections = [...schema.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">
              ← Kembali
            </button>
            <div>
              <h1 className="font-bold text-gray-900">{module.title}</h1>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{module.subject}</span>
                <span>Fase {module.fase}</span>
                <span>Kelas {module.kelas.join(", ")}</span>
                <span className="text-gray-300">•</span>
                <span>Oleh {authorName}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full ${
              module.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {module.status === "published" ? "Dipublikasi" : "Draft"}
            </span>
            {module.status === "draft" && (
              <button
                onClick={async () => {
                  await supabase.from("modules").update({ status: "published" }).eq("id", params.id);
                  router.refresh();
                }}
                className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg font-medium"
              >
                Publish
              </button>
            )}
            {module.status === "published" && (
              <a
                href={`/modules/${params.id}/edit`}
                className="px-4 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg"
              >
                Edit Lagi
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        {sortedSections.map((section) => (
          <div key={section.id} className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{section.title}</h2>
            <SchemaRenderer
              schema={[section]}
              content={(module.content as ModuleContent) ?? {}}
              onChange={() => {}}
              readOnly
            />
          </div>
        ))}

        {/* Metadata footer */}
        <div className="text-center text-xs text-gray-400 space-y-1">
          <p>Dibuat dengan Modulajar</p>
          <p>Dibuat {new Date(module.created_at).toLocaleDateString("id-ID")} {module.published_at ? `· Publikasi ${new Date(module.published_at).toLocaleDateString("id-ID")}` : ""}</p>
        </div>
      </main>
    </div>
  );
}
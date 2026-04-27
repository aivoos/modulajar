// Modules layout — sidebar nav shell
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabase/server";

export default async function ModulesLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">M</div>
            <span className="font-bold text-gray-900 text-sm">Modulajar</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {[
            { href: "/modules", label: "Daftar Modul", icon: "📚" },
            { href: "/modules/new", label: "Buat Modul Baru", icon: "+" },
            { href: "/library", label: "Library Publik", icon: "🌐" },
            { href: "/settings", label: "Pengaturan", icon: "⚙️" },
          ].map(({ href, label, icon }) => (
            <a key={href} href={href} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <span>{icon}</span>
              <span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <div className="text-xs text-gray-400 px-3">
            {(user as { full_name?: string }).full_name ?? "Guru"}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
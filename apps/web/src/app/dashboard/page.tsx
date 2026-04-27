// Dashboard — placeholder (full impl Phase 1)
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await getServerUser();

  if (!user) redirect("/login");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Selamat pagi" : hour < 18 ? "Selamat siang" : "Selamat sore";
  const name = (user as { full_name?: string }).full_name?.split(" ")[0] ?? "Guru";

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <span className="font-bold text-gray-900">Modulajar</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/modules" className="text-gray-500 hover:text-gray-900">Modul</a>
            <a href="/settings" className="text-gray-500 hover:text-gray-900">Pengaturan</a>
            <form action="/auth/logout" method="POST">
              <button className="text-gray-500 hover:text-gray-900">Keluar</button>
            </form>
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {name}!</h1>
          <p className="text-gray-500 mt-1">Semangat membuat modul ajar hari ini.</p>
        </div>

        {/* CTA */}
        <div className="mb-8">
          <a
            href="/modules/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            <span className="text-xl">+</span>
            Buat Modul Baru
          </a>
        </div>

        {/* Stats placeholder */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Draft", value: "0", color: "text-gray-400" },
            { label: "Selesai", value: "0", color: "text-green-600" },
            { label: "Perlu Update", value: "0", color: "text-amber-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className={`text-3xl font-bold ${color}`}>{value}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Recent modules placeholder */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Modul Terbaru</h2>
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📚</p>
            <p>Belum ada modul. Yuk mulai buat modul pertama!</p>
            <a href="/modules/new" className="text-indigo-600 font-medium hover:underline mt-2 inline-block">
              Buat sekarang →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
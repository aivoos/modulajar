// Module share page — /m/[slug]
// Generates OG image + SEO meta for shared modules
import { Metadata } from "next";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = decodeURIComponent(slug).replace(/-/g, " ");
  const description = `Modul ajar Kurikulum Merdeka: ${title}. Dibuat dengan Modulajar — platform AI untuk guru Indonesia.`;

  return {
    title: `${title} — Modulajar`,
    description,
    openGraph: {
      title: `${title} — Modulajar`,
      description,
      images: [
        {
          url: `/api/og?type=module&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(description)}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Modulajar`,
      description,
      images: [`/api/og?type=module&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(description)}`],
    },
  };
}

export default async function ModuleSharePage({ params }: Props) {
  const { slug } = await params;
  const title = decodeURIComponent(slug).replace(/-/g, " ");

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex flex-col">
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <span className="font-bold text-gray-900">Modulajar</span>
          </div>
          <Link href="/" className="text-sm text-indigo-600 font-medium hover:underline">Beranda</Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="text-center max-w-lg">
          <div className="text-6xl mb-6">📘</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{title}</h1>
          <p className="text-lg text-gray-500 mb-8 leading-relaxed">
            Modul ajar Kurikulum Merdeka ini dibuat dengan Modulajar — platform AI untuk guru Indonesia.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Buat Modul Gratis →
            </Link>
            <Link
              href="/library"
              className="px-8 py-3.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Lihat Library
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4">Gratis 2 modul/bulan · Tanpa kartu kredit</p>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center">
        <p className="text-xs text-gray-400">© 2026 CV. Artesis Sinar Endah Perdana</p>
      </footer>
    </div>
  );
}

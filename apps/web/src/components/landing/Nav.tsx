import Link from "next/link";

interface NavProps {
  transparent?: boolean;
}

export function Nav({ transparent = false }: NavProps) {
  const bgClass = transparent
    ? "bg-transparent"
    : "bg-white/85 backdrop-blur-xl border-b border-gray-200/60";

  return (
    <header className={`sticky top-0 z-50 ${bgClass}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-200 group-hover:shadow-md group-hover:shadow-indigo-200 transition-all">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 3h5v5H3zM10 3h5v5h-5zM3 10h5v5H3zM13 12l3 3M16 12l-3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-base tracking-tight">Modulajar</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#fitur" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">Fitur</Link>
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">Harga</Link>
            <Link href="/blog/cara-buat-modul-ajar" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">Blog</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:inline-flex text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Masuk
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
            >
              Mulai Gratis
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

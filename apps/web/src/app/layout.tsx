// Next.js 15 App Router — placeholder entry
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modulajar",
  description: "Buat Modul Ajar Kurikulum Merdeka dalam menit",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

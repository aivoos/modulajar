import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Modulajar — Buat Modul Ajar Kurikulum Merdeka dalam menit",
  description: "Buat modul ajar Kurikulum Merdeka dengan bantuan AI. Gratis untuk guru Indonesia.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
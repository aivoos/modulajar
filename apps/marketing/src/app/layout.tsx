import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Modulajar — Buat Modul Ajar Kurikulum Merdeka dalam Menit",
    template: "%s | Modulajar",
  },
  description:
    "Platform AI untuk guru Indonesia. Buat modul ajar Kurikulum Merdeka lengkap dalam 60 detik. CP, TP, ATP, Kegiatan, dan Asesmen otomatis.",
  keywords: ["modul ajar","kurikulum merdeka","AI guru","merdeka mengajar","CP TP ATP"],
  authors: [{ name: "CV. Artesis Sinar Endah Perdana" }],
  creator: "Modulajar",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://modulajar.app"),
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Modulajar",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["/api/og"] },
  robots: { index: true, follow: true },
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
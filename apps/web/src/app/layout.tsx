import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AnalyticsProvider } from "@/providers/posthog";
import { SentryPageFilter } from "@/providers/sentry";

export const metadata: Metadata = {
  title: {
    default: "Modulajar — Buat Modul Ajar Kurikulum Merdeka dalam menit",
    template: "%s | Modulajar",
  },
  description:
    "Buat modul ajar Kurikulum Merdeka dengan bantuan AI. Gratis untuk guru Indonesia.",
  keywords: [
    "modul ajar",
    "kurikulum merdeka",
    "AI guru",
    "merdeka mengajar",
    "CP TP ATP",
  ],
  authors: [{ name: "CV. Artesis Sinar Endah Perdana" }],
  creator: "Modulajar",
  publisher: "CV. Artesis Sinar Endah Perdana",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://modulajar.app"
  ),
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Modulajar",
    title: "Modulajar — Buat Modul Ajar Kurikulum Merdeka dalam menit",
    description: "Buat modul ajar Kurikulum Merdeka dengan bantuan AI. Gratis untuk guru Indonesia.",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Modulajar — Buat Modul Ajar Kurikulum Merdeka dalam menit",
    description: "Buat modul ajar Kurikulum Merdeka dengan bantuan AI. Gratis untuk guru Indonesia.",
    creator: "@modulajar",
    images: ["/api/og"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AnalyticsProvider>
          <SentryPageFilter />
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}

// OG Image — /api/og — using @vercel/og
// Required: embed fonts as base64/data URI (not Google Fonts) for serverless compatibility
import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "landing";
  const title = searchParams.get("title") ?? "Modulajar";
  const description = searchParams.get("desc") ?? "Buat modul ajar Kurikulum Merdeka dalam 60 detik.";

  if (type === "module") {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            background: "linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)",
            padding: "60px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div
              style={{
                background: "#4f46e5",
                borderRadius: "12px",
                width: "56px",
                height: "56px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 700,
                color: "white",
              }}
            >
              M
            </div>
            <span style={{ fontSize: "24px", fontWeight: 700, color: "white" }}>Modulajar</span>
          </div>
          <div
            style={{
              fontSize: "42px",
              fontWeight: 700,
              color: "white",
              lineHeight: 1.2,
              maxWidth: "800px",
              display: "flex",
            }}
          >
            {decodeURIComponent(title)}
          </div>
          <div
            style={{
              fontSize: "20px",
              color: "rgba(255,255,255,0.7)",
              marginTop: "16px",
              maxWidth: "700px",
            }}
          >
            {decodeURIComponent(description)}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "32px",
              padding: "8px 16px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "9999px",
              fontSize: "16px",
              color: "white",
            }}
          >
            modulajar.app
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }

  // Default: landing OG
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #ffffff 0%, #eef2ff 100%)",
          padding: "60px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px" }}>
          <div
            style={{
              background: "#4f46e5",
              borderRadius: "16px",
              width: "72px",
              height: "72px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              fontWeight: 700,
              color: "white",
            }}
          >
            M
          </div>
          <span style={{ fontSize: "36px", fontWeight: 700, color: "#1e1b4b" }}>Modulajar</span>
        </div>

        <div
          style={{
            fontSize: "52px",
            fontWeight: 700,
            color: "#111827",
            textAlign: "center",
            lineHeight: 1.2,
            maxWidth: "900px",
          }}
        >
          Modul Ajar Kurikulum Merdeka<br />
          <span style={{ color: "#4f46e5" }}>dalam 60 Detik</span>
        </div>

        <div
          style={{
            fontSize: "22px",
            color: "#6b7280",
            textAlign: "center",
            marginTop: "24px",
            maxWidth: "700px",
          }}
        >
          Platform AI untuk guru Indonesia. Generate CP, TP, ATP, Kegiatan, dan Asesmen otomatis.
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "48px",
          }}
        >
          {["Gratis 2/bulan", "Export PDF", "Kurikulum Merdeka"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 20px",
                background: "#4f46e5",
                color: "white",
                borderRadius: "9999px",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
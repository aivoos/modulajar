// PDF Export — /api/modules/:id/export
// Generates A4 PDF from module content using puppeteer-core
// Ref: modulajar-master-v3.jsx — Day 10
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";
import puppeteer from "puppeteer-core";

// ── HTML Template ───────────────────────────────────────────────

function moduleToHtml(
  mod: {
    title: string; subject: string; fase: string; kelas: string | string[];
    duration_minutes: number | null; content: Record<string, unknown>; user_id: string;
  },
  authorName: string,
  isFree: boolean
): string {
  const c = mod.content ?? {};
  const kelasStr = Array.isArray(mod.kelas)
    ? mod.kelas.join(", ")
    : (mod.kelas ?? "");

  const wrapText = (v: unknown): string => {
    if (!v) return "—";
    if (typeof v === "string") return v;
    if (typeof v === "object") {
      if (Array.isArray(v)) {
        return v.map(wrapText).filter(Boolean).join("<br/>");
      }
      return JSON.stringify(v);
    }
    return String(v);
  };

  const wrapTable = (rows: unknown[] | null, columns: string[]): string => {
    if (!rows || rows.length === 0) {
      return `<tr><td colspan="${columns.length}" style="color:#999">Belum ada data</td></tr>`;
    }
    return rows.map((row: unknown) => {
      const r = row as Record<string, unknown>;
      return `<tr>${columns.map((col) => `<td>${r[col] ?? ""}</td>`).join("")}</tr>`;
    }).join("");
  };

  const watermarkStyle = isFree
    ? `
      body::before {
        content: "MODULAJAR — UPGRADE KE GO/PLUS";
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-30deg);
        font-size: 3rem;
        color: rgba(99, 102, 241, 0.07);
        font-weight: bold;
        pointer-events: none;
        z-index: 9999;
        white-space: nowrap;
      }`
    : "";

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif;
    font-size: 11pt;
    color: #1a1a2e;
    background: white;
    line-height: 1.5;
    padding: 0;
  }
  ${watermarkStyle}

  /* A4 page margins */
  @page {
    size: A4;
    margin: 2cm 2.5cm;
  }

  /* Header */
  .page-header {
    border-bottom: 2px solid #4f46e5;
    padding-bottom: 12px;
    margin-bottom: 16px;
    page-break-after: avoid;
  }
  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .logo-text {
    font-size: 18pt;
    font-weight: 700;
    color: #4f46e5;
  }
  .header-meta {
    text-align: right;
    font-size: 8pt;
    color: #6b7280;
    line-height: 1.4;
  }

  /* Identity box */
  .identity-box {
    background: #f5f3ff;
    border: 1px solid #c7d2fe;
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 20px;
    page-break-inside: avoid;
  }
  .identity-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 24px;
    font-size: 10pt;
  }
  .identity-item { display: flex; gap: 8px; }
  .identity-label { font-weight: 600; color: #6b7280; min-width: 110px; }
  .identity-value { color: #1a1a2e; }

  /* Section */
  .section {
    margin-bottom: 20px;
    page-break-inside: avoid;
  }
  .section-title {
    font-size: 12pt;
    font-weight: 700;
    color: #4f46e5;
    border-bottom: 1.5px solid #e0e7ff;
    padding-bottom: 5px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-title::before {
    content: "";
    display: inline-block;
    width: 4px;
    height: 16px;
    background: #4f46e5;
    border-radius: 2px;
  }

  /* Content blocks */
  .text-content {
    font-size: 11pt;
    color: #374151;
    margin-bottom: 8px;
    white-space: pre-wrap;
  }
  .list-content {
    padding-left: 24px;
    font-size: 11pt;
    color: #374151;
  }
  .list-content li { margin-bottom: 4px; }

  /* Table */
  .content-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
    margin-top: 8px;
  }
  .content-table th {
    background: #eef2ff;
    color: #4f46e5;
    font-weight: 600;
    text-align: left;
    padding: 8px 12px;
    border: 1px solid #c7d2fe;
  }
  .content-table td {
    padding: 6px 12px;
    border: 1px solid #e5e7eb;
    vertical-align: top;
    color: #374151;
  }
  .content-table tr:nth-child(even) td { background: #f9fafb; }

  /* CP list */
  .cp-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .cp-item {
    background: #fefce8;
    border: 1px solid #fde68a;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 10pt;
    color: #713f12;
  }

  /* Footer */
  .page-footer {
    margin-top: 30px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
    font-size: 8pt;
    color: #9ca3af;
    display: flex;
    justify-content: space-between;
    page-break-before: avoid;
  }
  .footer-left { font-style: italic; }
  .footer-right { color: #4f46e5; font-weight: 600; }
</style>
</head>
<body>

<!-- Header -->
<div class="page-header">
  <div class="header-row">
    <div class="logo-text">📘 Modulajar</div>
    <div class="header-meta">
      ${mod.subject} · Fase ${mod.fase} · Kelas ${kelasStr}<br/>
      ${mod.duration_minutes ? `Alokasi: ${mod.duration_minutes} menit` : ""}
    </div>
  </div>
</div>

<!-- Identity Box -->
<div class="identity-box">
  <div style="font-weight:700;font-size:14pt;color:#4f46e5;margin-bottom:10px;text-align:center">
    ${mod.title}
  </div>
  <div class="identity-grid">
    <div class="identity-item"><span class="identity-label">Mata Pelajaran</span><span class="identity-value">${mod.subject}</span></div>
    <div class="identity-item"><span class="identity-label">Fase</span><span class="identity-value">${mod.fase}</span></div>
    <div class="identity-item"><span class="identity-label">Kelas</span><span class="identity-value">${kelasStr}</span></div>
    <div class="identity-item"><span class="identity-label">Alokasi Waktu</span><span class="identity-value">${mod.duration_minutes ?? 80} menit</span></div>
    <div class="identity-item"><span class="identity-label">Gaya Belajar</span><span class="identity-value">${wrapText(c["gaya_belajar"] ?? c["learning_style"] ?? "Campuran")}</span></div>
    <div class="identity-item"><span class="identity-label">Penyusun</span><span class="identity-value">${authorName}</span></div>
  </div>
</div>

${c["cp_list"] ? `
<!-- Capaian Pembelajaran -->
<div class="section">
  <div class="section-title">Capaian Pembelajaran (CP)</div>
  ${Array.isArray(c["cp_list"]) ? `
  <div class="cp-list">
    ${c["cp_list"].map((cp: unknown) => `<div class="cp-item">${wrapText(cp)}</div>`).join("")}
  </div>` : `<div class="text-content">${wrapText(c["cp_list"])}</div>`}
</div>` : ""}

${c["tujuan_pembelajaran"] ? `
<!-- Tujuan Pembelajaran -->
<div class="section">
  <div class="section-title">Tujuan Pembelajaran</div>
  ${Array.isArray(c["tujuan_pembelajaran"]) ? `
  <ul class="list-content">
    ${c["tujuan_pembelajaran"].map((tp: unknown) => `<li>${wrapText(tp)}</li>`).join("")}
  </ul>` : `<div class="text-content">${wrapText(c["tujuan_pembelajaran"])}</div>`}
</div>` : ""}

${c["alur_tp"] ? `
<!-- Alur Tujuan Pembelajaran -->
<div class="section">
  <div class="section-title">Alur Tujuan Pembelajaran</div>
  ${Array.isArray(c["alur_tp"]) ? `
  <table class="content-table">
    <thead><tr><th>Minggu</th><th>Topik</th><th>TP</th><th>Indikator</th></tr></thead>
    <tbody>
      ${c["alur_tp"].map((row: unknown, i: number) => {
        const r = row as Record<string, unknown>;
        return `<tr><td style="text-align:center;font-weight:600">${r["minggu"] ?? r["week"] ?? (i+1)}</td>
          <td>${r["topik"] ?? r["topic"] ?? ""}</td>
          <td>${r["tp"] ?? r["tp_code"] ?? ""}</td>
          <td>${r["indikator"] ?? r["indicators"] ?? ""}</td></tr>`;
      }).join("")}
    </tbody>
  </table>` : `<div class="text-content">${wrapText(c["alur_tp"])}</div>`}
</div>` : ""}

${c["kegiatan"] ? `
<!-- Kegiatan Pembelajaran -->
<div class="section">
  <div class="section-title">Kegiatan Pembelajaran</div>
  ${Array.isArray(c["kegiatan"]) ? `
  <table class="content-table">
    <thead><tr><th>Fase</th><th>Kegiatan</th><th>Durasi</th><th>Metode</th></tr></thead>
    <tbody>
      ${c["kegiatan"].map((row: unknown) => {
        const r = row as Record<string, unknown>;
        return `<tr>
          <td style="font-weight:600;color:#4f46e5;background:#eef2ff">${r["phase"] ?? r["fase"] ?? ""}</td>
          <td>${r["activity"] ?? r["kegiatan"] ?? ""}</td>
          <td style="text-align:center">${r["duration"] ?? r["durasi"] ?? ""}</td>
          <td>${r["method"] ?? r["metode"] ?? ""}</td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>` : `<div class="text-content">${wrapText(c["kegiatan"])}</div>`}
</div>` : ""}

${c["diferensiasi"] || c["asesmen"] ? `
<!-- Diferensiasi & Asesmen -->
<div class="section">
  <div class="section-title">Diferensiasi & Asesmen</div>
  ${c["diferensiasi"] ? `<div class="text-content"><strong>Diferensiasi:</strong><br/>${wrapText(c["diferensiasi"])}</div>` : ""}
  ${c["asesmen"] ? (() => {
    const a = c["asesmen"] as Record<string, unknown>;
    const sections = [];
    if (a["diagnostik"]) sections.push(`<div style="margin-top:8px"><strong>Asesmen Diagnostik:</strong><br/>${wrapText(a["diagnostik"])}</div>`);
    if (a["formatif"]) sections.push(`<div style="margin-top:8px"><strong>Asesmen Formatif:</strong><br/>${wrapText(a["formatif"])}</div>`);
    if (a["sumatif"]) sections.push(`<div style="margin-top:8px"><strong>Asesmen Sumatif:</strong><br/>${wrapText(a["sumatif"])}</div>`);
    return sections.join("");
  })() : ""}
</div>` : ""}

<!-- Footer -->
<div class="page-footer">
  <div class="footer-left">Dibuat oleh ${authorName} dengan Modulajar</div>
  <div class="footer-right">modulajar.app</div>
</div>

</body></html>`;

  return html;
}

// ── Route Handler ───────────────────────────────────────────────

export const pdfRoutes = new Elysia({ prefix: "/api/modules" })
  .get("/:id/export", async ({ params, request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();

    // Fetch module + check ownership
    const { data: mod, error: modErr } = await supabase
      .from("modules")
      .select("id, title, subject, fase, kelas, duration_minutes, content, user_id, mode, status, is_curated")
      .eq("id", params["id"])
      .single();

    if (modErr || !mod) { set.status = 404; return { error: "module_not_found" }; }
    if (mod.user_id !== userId && !mod.is_curated) { set.status = 403; return { error: "forbidden" }; }

    // Check PDF access — free tier cannot download
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", userId)
      .maybeSingle();

    const isFree = !sub || sub.plan === "free";

    // Get author name
    const { data: author } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", mod.user_id)
      .single();
    const authorName = author?.full_name ?? "Guru";

    // Generate HTML
    const html = moduleToHtml(mod, authorName, isFree);

    // Generate PDF via Puppeteer (Serverless-compatible)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let pdfBuffer: any;

      // Determine executable path based on environment
      let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      if (!executablePath) {
        // Try common system paths
        const paths = [
          // Linux common
          "/usr/bin/chromium-browser",
          "/usr/bin/chromium",
          "/usr/bin/google-chrome",
          "/snap/bin/chromium",
          // Bun / Node environments
          process.env.HOME + "/.cache/puppeteer/chrome/linux-128.0.6613.114/chrome-linux64/chrome",
          // @sparticuz/chromium default
          "/tmp/chromium",
        ];
        for (const p of paths) {
          try { require("node:fs").accessSync(p); executablePath = p; break; } catch { /* next */ }
        }
      }

      let browser;
      if (executablePath) {
        browser = await puppeteer.launch({ executablePath, args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"] });
      } else {
        // Try @sparticuz/chromium for serverless
        try {
          const sparticuz = await import("@sparticuz/chromium");
          executablePath = await sparticuz.default.executablePath();
          browser = await puppeteer.launch({ executablePath, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
        } catch {
          // No browser available — return HTML fallback
          const encoder = new TextEncoder();
          const body = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(html));
              controller.close();
            },
          });
          return new Response(body, {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Content-Disposition": `attachment; filename="${encodeURIComponent(mod.title)}.html"`,
            },
          });
        }
      }

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "2cm", bottom: "2cm", left: "2.5cm", right: "2.5cm" },
      });
      await browser.close();

      // Upload to Supabase Storage
      const fileName = `exports/${mod.id}_${Date.now()}.pdf`;
      const pdfData = Buffer.from(pdfBuffer as unknown as ArrayBuffer);
      const { error: uploadErr } = await supabase.storage
        .from("exports")
        .upload(fileName, pdfData, {
          contentType: "application/pdf",
          upsert: true,
        });

      // Get signed URL (7 day expiry)
      const { data: signedUrl } = await supabase.storage
        .from("exports")
        .createSignedUrl(fileName, 60 * 60 * 24 * 7);

      return {
        download_url: signedUrl?.signedUrl ?? null,
        // Fallback: return PDF directly in response
        pdf: pdfBuffer.toString("base64"),
      };
    } catch (err) {
      console.error("[pdf] generation failed:", err);
      set.status = 500;
      return { error: "pdf_generation_failed" };
    }
  });
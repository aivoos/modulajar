// Invoice PDF — POST /api/invoice/:paymentId/pdf
// Generates formal invoice PDF (INV-YYYY-NNNNNN) with NPWP, PPN 11%
// Ref: modulajar-master-v3.jsx — Day 12
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";
import { PLAN_LIMITS, PPN_RATE } from "@modulajar/shared";
import { invoiceNumber } from "@modulajar/shared";
import { sendEmail } from "../lib/email";
import puppeteer from "puppeteer-core";

// ── Invoice HTML Template ──────────────────────────────────────

function invoiceHtml(params: {
  invoiceNo: string;
  issueDate: string;
  dueDate: string;
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  plan: string;
  billingCycle: string;
  subtotal: number;
  ppnAmount: number;
  total: number;
  npwp: string;
}): string {
  const formatIDR = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #111827; background: white; line-height: 1.5; }
  @page { size: A4; margin: 2cm 2.5cm; }

  /* Header */
  .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 3px solid #4f46e5; padding-bottom: 16px; }
  .company-name { font-size: 20pt; font-weight: 700; color: #4f46e5; }
  .company-name small { font-size: 9pt; font-weight: 400; color: #6b7280; display: block; }
  .invoice-meta { text-align: right; }
  .invoice-title { font-size: 22pt; font-weight: 700; color: #111827; }
  .invoice-number { font-size: 12pt; color: #4f46e5; font-weight: 600; margin-top: 4px; }
  .invoice-dates { font-size: 9pt; color: #6b7280; margin-top: 6px; line-height: 1.8; }

  /* Addresses */
  .addresses { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .address-block { }
  .address-label { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; font-weight: 600; margin-bottom: 4px; }
  .address-value { font-size: 10pt; color: #374151; line-height: 1.7; }

  /* Items table */
  table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  thead tr { background: #4f46e5; color: white; }
  thead th { padding: 10px 14px; text-align: left; font-weight: 600; font-size: 9pt; }
  thead th:last-child { text-align: right; }
  tbody tr { border-bottom: 1px solid #e5e7eb; }
  tbody tr:nth-child(even) { background: #f9fafb; }
  tbody td { padding: 9px 14px; color: #374151; }
  tbody td:last-child { text-align: right; font-weight: 600; }
  .no-border td { border: none; }
  .total-row { background: #eef2ff !important; }
  .total-row td { font-weight: 700; color: #4f46e5; font-size: 11pt; }

  /* Tax summary */
  .tax-summary { margin-top: 12px; }
  .tax-row { display: flex; justify-content: flex-end; margin-bottom: 4px; font-size: 10pt; }
  .tax-label { color: #6b7280; min-width: 180px; text-align: right; padding-right: 8px; }
  .tax-value { color: #374151; font-weight: 600; min-width: 120px; text-align: right; }
  .tax-total { font-size: 13pt !important; color: #4f46e5 !important; font-weight: 700 !important; margin-top: 8px; padding-top: 8px; border-top: 2px solid #4f46e5; }

  /* Footer */
  .invoice-footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; display: flex; gap: 40px; }
  .npwp-block { flex: 1; }
  .npwp-label { font-size: 8pt; text-transform: uppercase; color: #9ca3af; margin-bottom: 2px; }
  .npwp-value { font-size: 10pt; font-weight: 600; color: #374151; }
  .notes-block { flex: 2; font-size: 9pt; color: #9ca3af; line-height: 1.6; }
  .signature-block { text-align: right; font-size: 10pt; color: #6b7280; margin-top: 40px; }
  .signature-line { border-top: 1px solid #e5e7eb; width: 160px; margin-left: auto; padding-top: 4px; }
</style>
</head>
<body>

<!-- Header -->
<div class="invoice-header">
  <div>
    <div class="company-name">
      CV. Artesis Sinar Endah Perdana
      <small>Platform AI untuk Guru Indonesia</small>
    </div>
    <div style="font-size:9pt;color:#6b7280;margin-top:6px;line-height:1.7">
      Jl. Sudirman No. 123, Jakarta Pusat 10220<br/>
      Email: hello@modulajar.app · Web: modulajar.app
    </div>
  </div>
  <div class="invoice-meta">
    <div class="invoice-title">INVOICE</div>
    <div class="invoice-number">${params.invoiceNo}</div>
    <div class="invoice-dates">
      Tanggal: ${params.issueDate}<br/>
      Jatuh Tempo: ${params.dueDate}
    </div>
  </div>
</div>

<!-- Addresses -->
<div class="addresses">
  <div class="address-block">
    <div class="address-label">Ditagihkan kepada</div>
    <div class="address-value">
      <strong>${params.customerName}</strong><br/>
      ${params.customerEmail}<br/>
      ${params.customerAddress ?? ""}
    </div>
  </div>
  <div class="address-block">
    <div class="address-label">Dari</div>
    <div class="address-value">
      <strong>CV. Artesis Sinar Endah Perdana</strong><br/>
      NPWP: ${params.npwp}<br/>
      Jl. Sudirman No. 123, Jakarta Pusat
    </div>
  </div>
</div>

<!-- Items -->
<table>
  <thead>
    <tr>
      <th>Deskripsi</th>
      <th>Periode</th>
      <th>Jumlah</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Langganan Modulajar Plan <strong>${params.plan.charAt(0).toUpperCase() + params.plan.slice(1)}</strong></td>
      <td>${params.billingCycle === "yearly" ? "Tahunan (12 bulan)" : "Bulanan"}</td>
      <td>${formatIDR(params.subtotal)}</td>
    </tr>
    <tr class="no-border">
      <td colspan="2" style="text-align:right;font-size:9pt;color:#9ca3af">Subtotal</td>
      <td>${formatIDR(params.subtotal)}</td>
    </tr>
    <tr class="no-border">
      <td colspan="2" style="text-align:right;font-size:9pt;color:#9ca3af">PPN ${PPN_RATE * 100}%</td>
      <td>${formatIDR(params.ppnAmount)}</td>
    </tr>
    <tr class="total-row no-border">
      <td colspan="2" style="text-align:right">TOTAL</td>
      <td>${formatIDR(params.total)}</td>
    </tr>
  </tbody>
</table>

<!-- Footer -->
<div class="invoice-footer">
  <div class="npwp-block">
    <div class="npwp-label">NPWP Perusahaan</div>
    <div class="npwp-value">${params.npwp}</div>
  </div>
  <div class="notes-block">
    Faktur pajak ini dibuat sesuai dengan UU PPN No. 42 Tahun 2009.<br/>
    Pembayaran dapat melalui transfer ke: BCA 1234567890 (CV. Artesis Sinar Endah Perdana).<br/>
    Invoice ini sah tanpa tanda tangan basah.
  </div>
</div>

</body>
</html>`;
}

// ── Get / Generate Invoice Number ───────────────────────────────

async function getNextInvoiceNumber(supabase: ReturnType<typeof createAdminClient>): Promise<string> {
  const year = new Date().getFullYear();
  const { data } = await supabase
    .from("invoice_sequences")
    .select("last_seq")
    .eq("year", year)
    .single();

  const seq = (data?.last_seq ?? 0) + 1;
  await supabase.from("invoice_sequences").upsert({ year, last_seq: seq });
  return invoiceNumber(year, seq);
}

// ── Launch Puppeteer ─────────────────────────────────────────────

async function launchBrowser() {
  let executablePath = process.env["PUPPETEER_EXECUTABLE_PATH"];
  if (!executablePath) {
    const paths = [
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/usr/bin/google-chrome",
      "/snap/bin/chromium",
      process.env.HOME + "/.cache/puppeteer/chrome/linux-128.0.6613.114/chrome-linux64/chrome",
      "/tmp/chromium",
    ];
    for (const p of paths) {
      try { require("node:fs").accessSync(p); executablePath = p; break; } catch { /* next */ }
    }
  }

  if (executablePath) {
    return puppeteer.launch({ executablePath, args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"] });
  }

  // Serverless fallback
  try {
    const sparticuz = await import("@sparticuz/chromium");
    const path = await sparticuz.default.executablePath();
    return puppeteer.launch({ executablePath: path, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  } catch {
    return null;
  }
}

// ── Route ────────────────────────────────────────────────────────

export const invoiceRoutes = new Elysia({ prefix: "invoice" })

  // POST /api/invoice/:paymentId/pdf — generate + upload invoice PDF
  .post("/:paymentId/pdf", async ({ params, request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();

    // Fetch payment
    const { data: pay, error: payErr } = await supabase
      .from("payments")
      .select("*")
      .eq("id", params["paymentId"])
      .single();

    if (payErr || !pay) { set.status = 404; return { error: "payment_not_found" }; }
    if (pay.user_id !== userId) { set.status = 403; return { error: "forbidden" }; }

    // Check if already has PDF
    if (pay.pdf_url && pay.pdf_signed_url) {
      return { pdf_url: pay.pdf_signed_url, invoice_number: pay.invoice_number ?? null, already_generated: true };
    }

    // Fetch user + subscription
    const { data: user } = await supabase.from("users").select("full_name, email").eq("id", userId).single();
    const { data: sub } = await supabase.from("subscriptions").select("plan, billing_cycle").eq("user_id", userId).maybeSingle();

    const plan = pay.plan ?? sub?.plan ?? "go";
    const billingCycle = pay.billing_cycle ?? sub?.billing_cycle ?? "monthly";
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] as unknown as Record<string, number> | undefined;
    const basePrice = billingCycle === "yearly"
      ? (limits?.["price_yearly_idr"] ?? limits?.["price_idr"] ?? 49000)
      : (limits?.["price_idr"] ?? 49000);

    const ppnAmount = Math.round(basePrice * PPN_RATE);
    const total = basePrice + ppnAmount;

    // Generate invoice number
    const invNo = await getNextInvoiceNumber(supabase);
    const issueDate = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
    const npwp = "01.234.567.8-012.000";

    // Generate HTML
    const html = invoiceHtml({
      invoiceNo: invNo,
      issueDate,
      dueDate,
      customerName: user?.full_name ?? "Customer",
      customerEmail: user?.email ?? "",
      plan,
      billingCycle,
      subtotal: basePrice,
      ppnAmount,
      total,
      npwp,
    });

    // Render PDF
    const browser = await launchBrowser();
    let pdfBuffer: Buffer | null = null;

    if (browser) {
      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        pdfBuffer = await page.pdf({ format: "A4", printBackground: true, margin: { top: "2cm", bottom: "2cm", left: "2.5cm", right: "2.5cm" } }) as unknown as Buffer;
        await browser.close();
      } catch (err) {
        console.error("[invoice-pdf] puppeteer error:", err);
        if (browser) await browser.close().catch(() => {});
      }
    }

    let pdfUrl = pay.pdf_url ?? null;

    if (pdfBuffer) {
      // Upload to invoices/ bucket (30-day signed URL)
      const fileName = `invoices/${invNo}.pdf`;
      const { error: uploadErr } = await supabase.storage
        .from("invoices")
        .upload(fileName, pdfBuffer, { contentType: "application/pdf", upsert: true });

      if (!uploadErr) {
        const signed = await supabase.storage
          .from("invoices")
          .createSignedUrl(fileName, 60 * 60 * 24 * 30);

        pdfUrl = (signed as { data: { signedUrl: string } } | null)?.data?.signedUrl ?? null;

        // Update payment record
        await supabase.from("payments").update({
          invoice_number: invNo,
          pdf_url: `invoices/${fileName}`,
          pdf_signed_url: pdfUrl,
          pdf_url_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }).eq("id", pay.id);
      }
    }

    // Trigger payment_success email asynchronously
    if (pay.status === "paid" && user) {
      sendEmail(userId, {
        type: "payment_success",
        userName: user.full_name,
        plan,
        amount: total,
        invoiceNumber: invNo,
      }).catch((err) => console.error("[invoice] email send failed:", err));
    }

    return {
      pdf_url: pdfUrl,
      invoice_number: invNo,
      total,
      ppn: ppnAmount,
    };
  })

  // GET /api/invoice/:paymentId — get invoice details
  .get("/:paymentId", async ({ params, request, set }) => {
    const userId = request.headers.get("X-User-ID");
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data: pay, error: payErr } = await supabase
      .from("payments")
      .select("*")
      .eq("id", params["paymentId"])
      .single();

    if (payErr || !pay) { set.status = 404; return { error: "payment_not_found" }; }
    if (pay.user_id !== userId) { set.status = 403; return { error: "forbidden" }; }

    return pay;
  });
// Email service — Resend
// Ref: modulajar-master-v3.jsx — Day 12
import { Resend } from "resend";
import { createAdminClient } from "@modulajar/db";
import { formatIDR } from "@modulajar/shared";

const resend = new Resend(process.env["RESEND_API_KEY"] ?? "");
const FROM = "Modulajar <noreply@resend.modulajar.app>";
const BASE_URL = process.env["NEXT_PUBLIC_BASE_URL"] ?? "http://localhost:3000";

// ── Helpers ─────────────────────────────────────────────────────

async function getUserEmail(userId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("users").select("email").eq("id", userId).single();
  return data?.email ?? null;
}

// ── HTML Layout ─────────────────────────────────────────────────

function htmlLayout(body: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Modulajar</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f9fafb; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .header { background: #4f46e5; padding: 24px; text-align: center; }
  .header-logo { font-size: 20px; font-weight: 700; color: white; }
  .header-logo span { opacity: 0.8; font-weight: 400; }
  .body { padding: 32px 32px 24px; }
  .footer { padding: 20px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.6; }
  h1 { font-size: 22px; color: #111827; margin: 0 0 8px; }
  h2 { font-size: 18px; color: #111827; margin: 0 0 16px; }
  p { color: #374151; line-height: 1.6; margin: 0 0 16px; }
  .btn { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; }
  .btn-outline { background: white; color: #4f46e5 !important; border: 2px solid #4f46e5; }
  .alert { padding: 14px 18px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; }
  .alert-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
  .alert-error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
  .alert-warning { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .info-box { background: #f5f3ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .info-box .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px; }
  .info-box .value { font-size: 16px; font-weight: 700; color: #111827; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
  .text-center { text-align: center; }
  .mt-4 { margin-top: 16px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="header-logo">📘 Modulajar <span>— Kurikulum Merdeka</span></div>
  </div>
  <div class="body">${body}</div>
  <div class="footer">
    Email ini dikirim oleh Modulajar · CV. Artesis Sinar Endah Perdana<br/>
    Jl. Sudirman No. 123, Jakarta Pusat 10220<br/>
    NPWP: 01.234.567.8-012.000<br/>
    <a href="${BASE_URL}" style="color:#4f46e5">modulajar.app</a> · <a href="mailto:hello@modulajar.app" style="color:#4f46e5">hello@modulajar.app</a>
  </div>
</div>
</body>
</html>`;
}

// ── Email Templates ─────────────────────────────────────────────

function welcomeEmail(name: string): string {
  return htmlLayout(`
    <h1>Selamat Datang, ${name}! 👋</h1>
    <p>Terima kasih sudah bergabung di <strong>Modulajar</strong> — platform AI untuk guru Indonesia dalam membuat modul ajar Kurikulum Merdeka.</p>
    <div class="info-box">
      <div class="label">Yang bisa kamu lakukan sekarang</div>
      <div class="value">Buat 2 modul gratis/bulan</div>
    </div>
    <p>Berikut langkah cepat untuk memulai:</p>
    <ol style="color:#374151;line-height:1.8;padding-left:20px">
      <li>Pilih mata pelajaran dan fase kelas</li>
      <li>Klik "Generate dengan AI" — modul jadi dalam 60 detik</li>
      <li>Edit bagian yang perlu disesuaikan</li>
      <li>Download PDF atau langsung gunakan di kelas</li>
    </ol>
    <div class="text-center mt-4">
      <a href="${BASE_URL}/modules/new" class="btn">Buat Modul Pertama →</a>
    </div>
    <hr class="divider"/>
    <p style="font-size:13px;color:#9ca3af;margin:0">Bermasalah dengan akun? Balas email ini atau hubungi <a href="mailto:hello@modulajar.app" style="color:#4f46e5">hello@modulajar.app</a>.</p>
  `);
}

function paymentSuccessEmail(params: {
  userName: string;
  plan: string;
  amount: number;
  invoiceNumber: string;
  pdfUrl?: string;
}): string {
  const planLabel = params.plan.charAt(0).toUpperCase() + params.plan.slice(1);
  const invoiceHtml = params.invoiceNumber
    ? `<div class="info-box"><div class="label">Invoice</div><div class="value">${params.invoiceNumber}</div></div>`
    : "";
  return htmlLayout(`
    <h1>Pembayaran Berhasil! ✅</h1>
    <p>Halo <strong>${params.userName}</strong>,</p>
    <p>Pembayaran langganan Modulajar kamu telah kami terima.</p>
    <div class="alert alert-success">
      <strong>Plan ${planLabel} aktif!</strong> Sekarang kamu bisa menikmati semua fitur premium.
    </div>
    <div class="info-box">
      <div class="label">Jumlah Pembayaran</div>
      <div class="value">${formatIDR(params.amount)}</div>
    </div>
    ${invoiceHtml}
    <p style="font-size:14px;color:#6b7280">Invoice PDF tersedia di halaman <a href="${BASE_URL}/settings/billing" style="color:#4f46e5">Pengaturan Langganan</a>.</p>
    <div class="text-center mt-4">
      <a href="${BASE_URL}/modules/new" class="btn">Buat Modul Sekarang →</a>
    </div>
  `);
}

function paymentFailedEmail(params: {
  userName: string;
  plan: string;
  failureReason?: string;
}): string {
  const planLabel = params.plan.charAt(0).toUpperCase() + params.plan.slice(1);
  return htmlLayout(`
    <h1>Pembayaran Gagal ❌</h1>
    <p>Halo <strong>${params.userName}</strong>,</p>
    <p>Mohon maaf, pembayaran untuk plan <strong>${planLabel}</strong> tidak dapat diproses.</p>
    ${params.failureReason ? `<div class="alert alert-error">${params.failureReason}</div>` : ""}
    <div class="alert alert-warning">
      <strong>Apa selanjutnya?</strong> Kuota Free kamu tetap aktif. Silakan coba bayar kembali kapan saja di <a href="${BASE_URL}/settings/billing" style="color:#4f46e5">Pengaturan Langganan</a>.
    </div>
    <div class="text-center mt-4">
      <a href="${BASE_URL}/settings/billing" class="btn">Coba Lagi →</a>
    </div>
  `);
}

function subscriptionExpiringEmail(params: {
  userName: string;
  daysLeft: number;
  plan: string;
}): string {
  const planLabel = params.plan.charAt(0).toUpperCase() + params.plan.slice(1);
  return htmlLayout(`
    <h1>Langganan Segera Berakhir ⏰</h1>
    <p>Halo <strong>${params.userName}</strong>,</p>
    <p>Langganan plan <strong>${planLabel}</strong> kamu akan berakhir dalam <strong>${params.daysLeft} hari</strong>.</p>
    <div class="alert alert-warning">
      Setelah masa berlaku habis, akses ke fitur premium akan dinonaktifkan. Modul yang sudah dibuat tetap tersimpan.
    </div>
    <p>Perpanjang sekarang agar tidak terganggu:</p>
    <div class="text-center mt-4">
      <a href="${BASE_URL}/settings/billing" class="btn">Perpanjang Langganan →</a>
    </div>
  `);
}

function quotaWarningEmail(params: {
  userName: string;
  used: number;
  limit: number;
  left: number;
}): string {
  return htmlLayout(`
    <h1>Kuota AI Hampir Habis ⚠️</h1>
    <p>Halo <strong>${params.userName}</strong>,</p>
    <p>Kamu sudah menggunakan <strong>${params.used} dari ${params.limit}</strong> modul AI bulan ini. Tinggal <strong>${params.left} modul</strong> lagi.</p>
    <div class="alert alert-warning">
      Quart Habis? Upgrade ke plan Go (Rp 49.000/bulan) atau Plus (Rp 99.000/bulan) untuk kuota lebih besar.
    </div>
    <div class="text-center mt-4">
      <a href="${BASE_URL}/settings/billing" class="btn">Upgrade Sekarang →</a>
    </div>
  `);
}

function exportReadyEmail(params: {
  userName: string;
  moduleTitle: string;
  exportUrl?: string;
}): string {
  return htmlLayout(`
    <h1>Modul Siap Diunduh 📄</h1>
    <p>Halo <strong>${params.userName}</strong>,</p>
    <p>Modul ajar <strong>"${params.moduleTitle}"</strong> sudah selesai diproses dan siap diunduh.</p>
    <div class="text-center mt-4">
      <a href="${BASE_URL}/modules/new" class="btn">Lihat Modul →</a>
    </div>
  `);
}

function schoolInviteEmail(params: {
  inviteeName: string;
  schoolName: string;
  inviterName: string;
  inviteUrl: string;
}): string {
  return htmlLayout(`
    <h1>Undangan Bergabung di Sekolah 🏫</h1>
    <p>Halo <strong>${params.inviteeName}</strong>,</p>
    <p><strong>${params.inviterName}</strong> mengundang kamu untuk bergabung di <strong>${params.schoolName}</strong> di Modulajar.</p>
    <div class="text-center mt-4">
      <a href="${params.inviteUrl}" class="btn">Terima Undangan →</a>
    </div>
    <p style="font-size:13px;color:#9ca3af;margin-top:20px">Jika kamu tidak mengenali email ini, abaikan saja.</p>
  `);
}

function migrationReadyEmail(params: {
  userName: string;
  moduleTitle: string;
  fromVersion: string;
  toVersion: string;
}): string {
  return htmlLayout(`
    <h1>Modul Perlu Dimigrasikan 🔄</h1>
    <p>Halo <strong>${params.userName}</strong>,</p>
    <p>Modul <strong>"${params.moduleTitle}"</strong> perlu dimigrasikan dari ${params.fromVersion} ke <strong>${params.toVersion}</strong> karena ada pembaruan dari BS KAP.</p>
    <div class="alert alert-warning">
      Modul lama tetap bisa digunakan, tapi disarankan untuk review dan migrasi agar sesuai kurikulum terbaru.
    </div>
    <div class="text-center mt-4">
      <a href="${BASE_URL}/modules/new" class="btn">Mulai Migrasi →</a>
    </div>
  `);
}

// ── Send Function ───────────────────────────────────────────────

type EmailTemplate =
  | { type: "welcome"; name: string }
  | { type: "payment_success"; userName: string; plan: string; amount: number; invoiceNumber?: string; pdfUrl?: string }
  | { type: "payment_failed"; userName: string; plan: string; failureReason?: string }
  | { type: "subscription_expiring"; userName: string; daysLeft: number; plan: string }
  | { type: "quota_warning"; userName: string; used: number; limit: number; left: number }
  | { type: "export_ready"; userName: string; moduleTitle: string; exportUrl?: string }
  | { type: "school_invite"; inviteeName: string; schoolName: string; inviterName: string; inviteUrl: string }
  | { type: "migration_ready"; userName: string; moduleTitle: string; fromVersion: string; toVersion: string };

export async function sendEmail(userId: string, template: EmailTemplate): Promise<{ success: boolean; error?: string }> {
  const email = await getUserEmail(userId);
  if (!email) return { success: false, error: "user_email_not_found" };

  let subject: string;
  let html: string;

  switch (template.type) {
    case "welcome":
      subject = "Selamat Datang di Modulajar! 🎉";
      html = welcomeEmail(template.name);
      break;
    case "payment_success":
      subject = `Pembayaran Berhasil — Modulajar ${template.plan.toUpperCase()}`;
      html = paymentSuccessEmail({ userName: template.userName, plan: template.plan, amount: template.amount, invoiceNumber: template.invoiceNumber ?? "", pdfUrl: template.pdfUrl });
      break;
    case "payment_failed":
      subject = `Pembayaran Gagal — Modulajar ${template.plan.toUpperCase()}`;
      html = paymentFailedEmail({ userName: template.userName, plan: template.plan, failureReason: template.failureReason });
      break;
    case "subscription_expiring":
      subject = `Langganan Modulajar Segera Berakhir — ${template.daysLeft} Hari Lagi`;
      html = subscriptionExpiringEmail({ userName: template.userName, daysLeft: template.daysLeft, plan: template.plan });
      break;
    case "quota_warning":
      subject = "Kuota AI Modulajar Hampir Habis ⚠️";
      html = quotaWarningEmail({ userName: template.userName, used: template.used, limit: template.limit, left: template.left });
      break;
    case "export_ready":
      subject = `Modul "${template.moduleTitle}" Siap Diunduh`;
      html = exportReadyEmail({ userName: template.userName, moduleTitle: template.moduleTitle, exportUrl: template.exportUrl });
      break;
    case "school_invite":
      subject = `Undangan Bergabung di ${template.schoolName}`;
      html = schoolInviteEmail(template);
      break;
    case "migration_ready":
      subject = `Modul "${template.moduleTitle}" Perlu Dimigrasikan`;
      html = migrationReadyEmail({ userName: template.userName, moduleTitle: template.moduleTitle, fromVersion: template.fromVersion, toVersion: template.toVersion });
      break;
  }

  if (!process.env["RESEND_API_KEY"]) {
    console.warn("[email] RESEND_API_KEY not set — skipping email send to", email);
    return { success: false, error: "resend_not_configured" };
  }

  try {
    const { error } = await resend.emails.send({ from: FROM, to: email, subject, html });
    if (error) {
      console.error("[email] send failed:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("[email] exception:", err);
    return { success: false, error: "email_send_exception" };
  }
}

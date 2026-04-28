// Launch checklist page — /launch
// 15-point checklist for go-live readiness
// Ref: modulajar-master-v3.jsx — Day 15
"use client";
import { useState } from "react";
import Link from "next/link";

const CHECKLIST = [
  {
    category: "Auth & Users",
    items: [
      { id: "auth-email", label: "Register email — signup → email confirm → onboarding flow", status: "pending" },
      { id: "auth-google", label: "Register Google OAuth — redirect → callback → dashboard", status: "pending" },
      { id: "auth-login", label: "Login email + Google — session → protected routes", status: "pending" },
      { id: "auth-logout", label: "Logout — clear session → redirect to landing", status: "pending" },
      { id: "auth-reset", label: "Password reset — forgot → email → reset → login", status: "pending" },
    ],
  },
  {
    category: "AI Module Generation",
    items: [
      { id: "ai-full", label: "Full AI generate — CP → TP → ATP → Activity → Asesmen → Validator", status: "pending" },
      { id: "ai-scratch", label: "Scratch editor — create empty module, fill fields manually", status: "pending" },
      { id: "ai-stream", label: "SSE streaming — progress shown in real-time, no polling", status: "pending" },
      { id: "ai-quota", label: "Quota enforcement — free 2/month, block at limit, upgrade prompt", status: "pending" },
    ],
  },
  {
    category: "Billing & Payments",
    items: [
      { id: "billing-go", label: "Checkout Go plan — Xendit invoice → QRIS/OVO/VA → success banner", status: "pending" },
      { id: "billing-plus", label: "Checkout Plus plan — same flow, correct amount", status: "pending" },
      { id: "billing-topup", label: "Top-up credits — Rp 5.000 → +3 credits → reflected in quota bar", status: "pending" },
      { id: "billing-webhook", label: "Xendit webhook — payment.paid → activate subscription → quota increased", status: "pending" },
      { id: "billing-invoice", label: "Invoice PDF — generated after payment, sent via email", status: "pending" },
      { id: "billing-auto-renew", label: "Auto-renewal disclosure visible on billing page", status: "pending" },
    ],
  },
  {
    category: "PDF & Export",
    items: [
      { id: "pdf-free", label: "PDF export Free — watermark visible, upgrade prompt shown", status: "pending" },
      { id: "pdf-paid", label: "PDF export paid — no watermark, clean A4 output", status: "pending" },
      { id: "pdf-email", label: "Export ready email — sent after PDF generation completes", status: "pending" },
    ],
  },
  {
    category: "Legal & Privacy",
    items: [
      { id: "legal-tos", label: "ToS checkbox on register — required, disabled submit until checked", status: "pending" },
      { id: "legal-cookies", label: "Cookie consent banner — opt-in/opt-out, preference saved in localStorage", status: "pending" },
      { id: "legal-privacy", label: "Privacy policy — Anthropic data handling + AWS SG storage mentioned", status: "pending" },
      { id: "legal-terms", label: "Terms, Privacy, Refund, Cookies pages — all accessible from footer", status: "pending" },
    ],
  },
  {
    category: "SEO & Social",
    items: [
      { id: "seo-sitemap", label: "Sitemap.xml — includes all public pages, updated automatically", status: "pending" },
      { id: "seo-robots", label: "Robots.txt — allows crawlers, blocks /api/, /settings/, /admin/", status: "pending" },
      { id: "seo-og", label: "OG image — /api/og returns valid 1200×630 image for landing + modules", status: "pending" },
      { id: "seo-schema", label: "Schema.org JSON-LD — Organization, SoftwareApplication, FAQPage on landing", status: "pending" },
      { id: "seo-blog", label: "Blog article — /blog/cara-buat-modul-ajar indexed, share buttons work", status: "pending" },
    ],
  },
  {
    category: "Infrastructure",
    items: [
      { id: "env-xendit", label: "XENDIT_SECRET — set in production env, webhooks configured", status: "pending" },
      { id: "env-resend", label: "RESEND_API_KEY — set, welcome + payment emails sending", status: "pending" },
      { id: "env-posthog", label: "NEXT_PUBLIC_POSTHOG_KEY + HOST — events flowing to PostHog EU", status: "pending" },
      { id: "env-supabase", label: "Supabase — RLS policies active, migrations applied, storage buckets created", status: "pending" },
      { id: "env-sentry", label: "SENTRY_DSN — errors captured in Sentry dashboard", status: "pending" },
      { id: "env-cron", label: "CRON_SECRET — set, quota_reset + grace_period_check crons firing", status: "pending" },
    ],
  },
  {
    category: "PWA & Offline",
    items: [
      { id: "pwa-install", label: "PWA installable — add to homescreen on mobile Chrome/Safari", status: "pending" },
      { id: "pwa-offline", label: "PWA offline mode — module viewer works without internet", status: "pending" },
    ],
  },
];

const TOTAL_ITEMS = CHECKLIST.reduce((sum, cat) => sum + cat.items.length, 0);

export default function LaunchPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((checkedCount / TOTAL_ITEMS) * 100);

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const statusColor = pct === 100 ? "text-green-600" : pct >= 70 ? "text-amber-600" : "text-red-600";
  const barColor = pct === 100 ? "bg-green-500" : pct >= 70 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <span className="font-bold text-gray-900">Modulajar</span>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Launch Day</span>
          </div>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">← Landing</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🚀 Launch Checklist</h1>
          <p className="text-gray-500 text-sm">15-point critical path untuk go-live. Semua item harus hijau sebelum launch.</p>
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-semibold text-gray-900">
                {checkedCount} / {TOTAL_ITEMS} items checked
              </span>
              <span className={`ml-3 text-sm font-bold ${statusColor}`}>{pct}%</span>
            </div>
            {pct === 100 ? (
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">✅ READY TO LAUNCH</span>
            ) : pct >= 70 ? (
              <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-semibold">⚠️ Almost there</span>
            ) : (
              <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">❌ Not ready</span>
            )}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Launch rule */}
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <span className="text-red-500 text-lg mt-0.5">⚠️</span>
          <div className="text-sm text-red-700">
            <strong>LAUNCH hanya hari Selasa atau Rabu pagi.</strong> Jumat sore/Siang = DILARANG. Kalau ada bug kritis weekend, tidak bisa fix.
          </div>
        </div>

        {/* Critical paths first */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {CHECKLIST.map((cat) => (
            <div key={cat.category} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 text-sm">{cat.category}</h2>
                  <span className="text-xs text-gray-400">
                    {cat.items.filter((i) => checked[i.id]).length}/{cat.items.length}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {cat.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <button
                      onClick={() => toggle(item.id)}
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        checked[item.id]
                          ? "bg-indigo-600 border-indigo-600"
                          : "border-gray-300 hover:border-indigo-400"
                      }`}
                    >
                      {checked[item.id] && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                    <span className={`text-xs leading-relaxed ${checked[item.id] ? "text-gray-400 line-through" : "text-gray-700"}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Launch CTA */}
        {pct === 100 && (
          <div className="bg-green-600 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">🎉 Ready to Launch!</h2>
            <p className="text-green-100 text-sm mb-6 max-w-md mx-auto">
              Semua item checklist sudah hijau. Modulajar.app siap di-launch.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => alert("Deploy pipeline triggered! 🚀")}
                className="px-6 py-3 bg-white text-green-700 font-semibold rounded-xl hover:bg-green-50 transition-colors"
              >
                Deploy to Production →
              </button>
              <button
                onClick={() => {
                  const text = encodeURIComponent("🚨 Modulajar LAZIM!\nBuat modul ajar Kurikulum Merdeka dalam 60 detik!\nmodulajar.app");
                  window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
                }}
                className="px-6 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
              >
                Tweet Launch 🚀
              </button>
            </div>
          </div>
        )}

        {/* Pre-launch social copy */}
        {pct >= 70 && pct < 100 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4">
            <p className="text-sm text-indigo-700">
              <strong>Ready {pct}%</strong> — {TOTAL_ITEMS - checkedCount} item tersisa. Kerjakan yang paling kritis dulu (Billing + Auth + PDF).
              Billing/Xendit perlu verified account. Jika belum, launch dengan Free tier dulu, billing sprint setelahnya.
            </p>
          </div>
        )}

        {/* Notes */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">📋 Catatan Launch</h3>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>• <strong>Free + Go tier launch dulu.</strong> Plus dan Sekolah post-launch sprint.</li>
            <li>• <strong>Xendit verification</strong> butuh 2-3 hari. Kalau belum verified, billing mundur, launch Free-only dulu.</li>
            <li>• <strong>10 curated modules</strong> perlu di-generate manual via Full AI sebelum launch. Set is_curated=true setelah review.</li>
            <li>• <strong>Post-launch Sprint 1</strong> (Plus tier: Jurnal + Nilai) aktif SETELAH ada 50+ Go users aktif.</li>
            <li>• <strong>Social blast:</strong> grup Facebook Guru Indonesia + Twitter/X di-post bersamaan dengan launch.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

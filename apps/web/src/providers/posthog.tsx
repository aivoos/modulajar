"use client";

import { PostHogProvider as PHProvider } from "posthog-js/react";
import posthog from "posthog-js";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CookieConsentBanner } from "@/components/cookie-consent";

const COOKIE_KEY = "modulajar_cookie_consent";

function initPostHog() {
  if (
    typeof window === "undefined" ||
    !process.env.NEXT_PUBLIC_POSTHOG_KEY ||
    !process.env.NEXT_PUBLIC_POSTHOG_HOST
  )
    return;

  const consent = localStorage.getItem(COOKIE_KEY);

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false,
    autocapture: consent === "accepted",
    opt_out_capturing_by_default: consent !== "accepted",
  });

  // Listen for consent acceptance (from banner)
  window.addEventListener("cookie-consent-accepted", () => {
    posthog.opt_in_capturing();
  });
}

if (typeof window !== "undefined") {
  initPostHog();
}

function PageTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined" || !posthog.__loaded) return;
    const url =
      window.location.origin +
      pathname +
      (searchParams?.toString() ? "?" + searchParams.toString() : "");
    posthog.capture("$pageview", { current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageTrackerInner />
      </Suspense>
      {children}
      <CookieConsentBanner />
    </PHProvider>
  );
}

export { posthog };

// ── Posthog Event Helpers ────────────────────────────────────────
// Fire these from anywhere: import { analytics } from "@/providers/posthog"

export const analytics = {
  signup(method: string) {
    posthog.capture("sign_up", { method });
  },
  login(method: string) {
    posthog.capture("login", { method });
  },
  module_created(mode: "full_ai" | "scratch" | "curated") {
    posthog.capture("module_created", { mode });
  },
  module_generated(moduleId: string, subject: string, fase: string) {
    posthog.capture("module_generated", { moduleId, subject, fase });
  },
  module_exported(format: "pdf" | "html") {
    posthog.capture("module_exported", { format });
  },
  payment_started(plan: string) {
    posthog.capture("payment_started", { plan });
  },
  payment_completed(plan: string, amount: number) {
    posthog.capture("payment_completed", { plan, amount });
  },
  help_article_viewed(articleId: string) {
    posthog.capture("help_article_viewed", { articleId });
  },
  cta_clicked(location: string, label: string) {
    posthog.capture("cta_clicked", { location, label });
  },
  upgrade_cta_clicked(plan: string, location: string) {
    posthog.capture("upgrade_cta_clicked", { plan, location });
  },
};

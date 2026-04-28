"use client";

import { PostHogProvider as PHProvider } from "posthog-js/react";
import posthog from "posthog-js";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function initPostHog() {
  if (
    typeof window === "undefined" ||
    !process.env.NEXT_PUBLIC_POSTHOG_KEY ||
    !process.env.NEXT_PUBLIC_POSTHOG_HOST
  )
    return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false,
    autocapture: true,
    loaded: (ph) => {
      ph.opt_in_capturing();
    },
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
    </PHProvider>
  );
}

export { posthog };

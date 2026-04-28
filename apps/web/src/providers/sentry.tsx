"use client";

import * as Sentry from "@sentry/nextjs";
import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function SentryTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || initialized.current) return;
    initialized.current = true;

    // Try to set user from session storage if set by auth callback
    const userData = sessionStorage.getItem("sentry_user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        Sentry.setUser({ id: user.id, email: user.email });
      } catch {
        // ignore
      }
    }
  }, [pathname, searchParams]);

  return null;
}

export function SentryPageFilter() {
  return (
    <Suspense fallback={null}>
      <SentryTrackerInner />
    </Suspense>
  );
}

export function setSentryUser(id: string, email: string, metadata?: Record<string, string>) {
  Sentry.setUser({ id, email, ...metadata });
}

export function clearSentryUser() {
  Sentry.setUser(null);
}
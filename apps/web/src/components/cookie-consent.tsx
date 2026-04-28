"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_KEY = "modulajar_cookie_consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
    // Re-init posthog capture — pageview already tracked on load if accepted
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cookie-consent-accepted"));
    }
  }

  function decline() {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-600 leading-relaxed">
            Kami menggunakan cookie dan analitik untuk meningkatkan pengalamanmu di Modulajar.{" "}
            <Link href="/privacy" className="text-indigo-600 hover:underline text-xs">
              Pelajari lebih lanjut
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            Tolak
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700"
          >
            Terima
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook: check if analytics is consented
export function useAnalyticsConsent() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(COOKIE_KEY) === "accepted";
}

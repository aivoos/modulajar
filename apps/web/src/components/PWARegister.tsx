"use client";
/**
 * PWARegister — registers service worker and initializes offline sync
 * Ref: modulajar-spec-v3.jsx — Sprint 2 S2-3 PWA Offline
 */
import { useEffect } from "react";
import { getOfflineDB } from "@/lib/offline";

export function PWARegister() {
  useEffect(() => {
    // Initialize offline DB (lazy — will open on first access)
    // Register service worker via next-pwa (configured in next.config.mjs)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] SW registered:", registration.scope);
        })
        .catch((err) => {
          // SW registration fails in dev or without proper hosting config — non-critical
          console.warn("[PWA] SW registration failed:", err.message);
        });
    }

    // Initialize offline DB early (pre-open)
    try {
      const db = getOfflineDB();
      db.open().catch(() => {
        // IndexedDB not available — non-critical on some browsers
      });
    } catch {
      // Dexie not available
    }

    // Sync pending items when coming back online
    const handleOnline = () => {
      // Deferred sync via Background Sync API if available, otherwise immediate
      if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((reg) => {
          (reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register("modulajar-sync")
            .catch(() => {/* Background sync not available */});
        });
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return null;
}
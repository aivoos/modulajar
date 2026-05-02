"use client";
/**
 * PWA Registration hook — registers service worker and handles online/offline events
 * Ref: modulajar-spec-v3.jsx — Sprint 2 S2-3 PWA Offline
 */
import { useEffect, useState } from "react";
import { getPendingSyncCount, syncJournalDrafts, syncGradeDrafts } from "@/lib/offline";

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnlineState, setIsOnlineState] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Check if already installed
    if (typeof window !== "undefined" && window.matchMedia) {
      const mq = window.matchMedia("(display-mode: standalone)");
      setIsInstalled(mq.matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true);

      const handler = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  useEffect(() => {
    // Online/offline detection
    const handleOnline = () => setIsOnlineState(true);
    const handleOffline = () => setIsOnlineState(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnlineState(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    // Update pending count
    async function updateCount() {
      try {
        setPendingCount(await getPendingSyncCount());
      } catch {
        // IndexedDB not available
      }
    }
    updateCount();
    const interval = setInterval(updateCount, 30_000); // every 30s
    return () => clearInterval(interval);
  }, []);

  // Sync when coming back online
  useEffect(() => {
    if (isOnlineState && pendingCount > 0) {
      const userId = getCurrentUserId();
      if (userId) {
        syncJournalDrafts(userId).catch(() => {/* non-blocking */});
        syncGradeDrafts(userId).catch(() => {/* non-blocking */});
      }
    }
  }, [isOnlineState, pendingCount]);

  return { isInstalled, isOnline: isOnlineState, pendingCount };
}

function getCurrentUserId(): string | null {
  // Access from localStorage (same pattern as supabase client)
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("sb-smygdfpsaikujoypiysl-auth-token");
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return parsed?.user?.id ?? null;
  } catch {
    return null;
  }
}

export function PendingSyncBanner() {
  const { isOnline: online, pendingCount } = usePWA();

  if (online || pendingCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 px-4 py-2 rounded-xl text-sm flex items-center gap-2">
      <span>[offline]</span>
      <span>{pendingCount} data menunggu sync saat online</span>
    </div>
  );
}

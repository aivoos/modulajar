/**
 * Dexie.js — IndexedDB wrapper for Modulajar offline support
 * Ref: modulajar-spec-v3.jsx — Sprint 2 S2-3 PWA Offline
 *
 * Stores:
 * - journalDrafts: unsaved journal entries when offline
 * - gradeDrafts: unsaved grade entries when offline
 * - pendingSync: queued API requests to sync when back online
 */

import Dexie, { type Table } from "dexie";

export interface JournalDraft {
  id?: number; // auto-increment
  teaching_class_id: string;
  user_id: string;
  date: string;
  topic: string;
  activity_main: string | null;
  tp_achievement: number | null;
  created_at: string; // local timestamp
  synced: boolean; // false = pending sync
}

export interface GradeDraft {
  id?: number;
  teaching_class_id: string;
  user_id: string;
  student_id: string;
  assessment_type: "formatif" | "sumatif" | "diagnostik";
  tp_code: string;
  score: number | null;
  notes: string | null;
  created_at: string;
  synced: boolean;
}

export interface PendingSync {
  id?: number;
  type: "journal" | "grade";
  method: "POST" | "PUT" | "DELETE";
  endpoint: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export class ModulajarOfflineDB extends Dexie {
  journalDrafts!: Table<JournalDraft, number>;
  gradeDrafts!: Table<GradeDraft, number>;
  pendingSync!: Table<PendingSync, number>;

  constructor() {
    super("ModulajarOffline");
    this.version(1).stores({
      journalDrafts: "++id, teaching_class_id, user_id, date, synced",
      gradeDrafts: "++id, teaching_class_id, user_id, student_id, assessment_type, synced",
      pendingSync: "++id, type, createdAt",
    });
  }
}

// Singleton instance
let _db: ModulajarOfflineDB | null = null;

export function getOfflineDB(): ModulajarOfflineDB {
  if (!_db) {
    _db = new ModulajarOfflineDB();
  }
  return _db;
}

// ── Convenience helpers ─────────────────────────────────────────────

/** Check if we're online */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

/** Save a journal draft (offline or online, always saves locally first) */
export async function saveJournalDraft(draft: Omit<JournalDraft, "id" | "created_at" | "synced">): Promise<number> {
  const db = getOfflineDB();
  const id = await db.journalDrafts.add({
    ...draft,
    created_at: new Date().toISOString(),
    synced: false,
  } as JournalDraft);

  // If online, try to sync immediately
  if (isOnline()) {
    syncJournalDrafts(draft.user_id).catch(() => {/* will retry via pending sync */});
  }

  return id;
}

/** Get all unsynced journal drafts for a user */
export async function getUnsyncedJournalDrafts(userId: string): Promise<JournalDraft[]> {
  const db = getOfflineDB();
  return db.journalDrafts.where({ user_id: userId, synced: false }).toArray();
}

/** Mark journal drafts as synced */
export async function markJournalDraftsSynced(ids: number[]): Promise<void> {
  const db = getOfflineDB();
  await db.journalDrafts.where("id").anyOf(ids).modify({ synced: true });
}

/** Sync all unsynced journal drafts to the server */
export async function syncJournalDrafts(userId: string): Promise<{ synced: number; failed: number }> {
  const db = getOfflineDB();
  const drafts = await db.journalDrafts.where({ user_id: userId, synced: false }).toArray();

  let synced = 0;
  let failed = 0;

  for (const draft of drafts) {
    try {
      const res = await fetch(`/api/journals/${draft.teaching_class_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": userId,
        },
        body: JSON.stringify({
          date: draft.date,
          topic: draft.topic,
          activity_main: draft.activity_main,
          tp_achievement: draft.tp_achievement,
        }),
      });

      if (res.ok && draft.id !== undefined) {
        await db.journalDrafts.delete(draft.id);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

/** Save a grade draft */
export async function saveGradeDraft(draft: Omit<GradeDraft, "id" | "created_at" | "synced">): Promise<number> {
  const db = getOfflineDB();
  const id = await db.gradeDrafts.add({
    ...draft,
    created_at: new Date().toISOString(),
    synced: false,
  } as GradeDraft);

  if (isOnline()) {
    syncGradeDrafts(draft.user_id).catch(() => {/* will retry */});
  }

  return id;
}

/** Get all unsynced grade drafts */
export async function getUnsyncedGradeDrafts(userId: string): Promise<GradeDraft[]> {
  const db = getOfflineDB();
  return db.gradeDrafts.where({ user_id: userId, synced: false }).toArray();
}

/** Sync grade drafts */
export async function syncGradeDrafts(userId: string): Promise<{ synced: number; failed: number }> {
  const db = getOfflineDB();
  const drafts = await db.gradeDrafts.where({ user_id: userId, synced: false }).toArray();

  // Group by classId for batch insert
  const byClass: Record<string, GradeDraft[]> = {};
  for (const d of drafts) {
    if (!byClass[d.teaching_class_id]) byClass[d.teaching_class_id] = [];
    byClass[d.teaching_class_id].push(d);
  }

  let synced = 0;
  let failed = 0;

  for (const [classId, classDrafts] of Object.entries(byClass)) {
    try {
      const entries = classDrafts.map((d) => ({
        student_id: d.student_id,
        assessment_type: d.assessment_type,
        tp_code: d.tp_code,
        score: d.score,
        notes: d.notes,
      }));

      const res = await fetch(`/api/grades/${classId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": userId,
        },
        body: JSON.stringify({ entries }),
      });

      if (res.ok) {
        const ids = classDrafts.map((d) => d.id!).filter(Boolean);
        await db.gradeDrafts.bulkDelete(ids);
        synced += classDrafts.length;
      } else {
        failed += classDrafts.length;
      }
    } catch {
      failed += classDrafts.length;
    }
  }

  return { synced, failed };
}

/** Count pending sync items for a user */
export async function getPendingSyncCount(userId?: string): Promise<number> {
  const db = getOfflineDB();
  if (userId) {
    const [journals, grades] = await Promise.all([
      db.journalDrafts.where("user_id").equals(userId).and(r => !r.synced).count(),
      db.gradeDrafts.where("user_id").equals(userId).and(r => !r.synced).count(),
    ]);
    return journals + grades;
  }
  return await db.journalDrafts.count() + await db.gradeDrafts.count();
}

/** Clear all synced items (cleanup) */
export async function clearSyncedData(): Promise<void> {
  const db = getOfflineDB();
  const allDrafts = await Promise.all([
    db.journalDrafts.toArray(),
    db.gradeDrafts.toArray(),
  ]);
  const toDelete = [
    ...allDrafts[0].filter(r => r.synced && r.id !== undefined).map(r => r.id!),
    ...allDrafts[1].filter(r => r.synced && r.id !== undefined).map(r => r.id!),
  ];
  if (toDelete.length > 0) {
    await Promise.all([
      db.journalDrafts.bulkDelete(toDelete.filter((_, i) => i < allDrafts[0].length)),
      db.gradeDrafts.bulkDelete(toDelete.filter((_, i) => i >= allDrafts[0].length)),
    ]);
  }
}
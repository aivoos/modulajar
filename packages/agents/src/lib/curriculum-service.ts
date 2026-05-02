// CurriculumService — In-memory CP cache with 5-minute TTL
// Reduces redundant DB queries for learning_outcomes (CP data)
import { createAdminClient } from "@modulajar/db";

interface CPEntry {
  elemen: string;
  sub_elemen: string | null;
  deskripsi: string;
}

interface CachedCP {
  data: CPEntry[];
  ttl: number;
}

/** Singleton: caches CP data by (subject, phase) with 5min TTL. */
class CurriculumServiceClass {
  private cache = new Map<string, CachedCP>();

  /** Generate cache key from subject + phase. */
  private key(subject: string, phase: string): string {
    return `${subject}::${phase}`.toLowerCase();
  }

  /** Fetch CP data from DB (with cache). */
  async getCP(subject: string, phase: string): Promise<CPEntry[]> {
    const cacheKey = this.key(subject, phase);
    const now = Date.now();

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.ttl > now) {
      return cached.data;
    }

    // Fetch from DB
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("learning_outcomes")
      .select("elemen, sub_elemen, deskripsi")
      .eq("subject", subject)
      .eq("phase", phase)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error(`[CurriculumService] DB error for ${subject}/${phase}:`, error);
      throw error;
    }

    const cpData: CPEntry[] = (data ?? []).map((row) => ({
      elemen: row.elemen,
      sub_elemen: row.sub_elemen,
      deskripsi: row.deskripsi,
    }));

    // Cache for 5 minutes
    this.cache.set(cacheKey, {
      data: cpData,
      ttl: now + 5 * 60 * 1000, // 5 min TTL
    });

    return cpData;
  }

  /** Clear cache (useful for testing or forced refresh). */
  clear(subject?: string, phase?: string): void {
    if (subject && phase) {
      this.cache.delete(this.key(subject, phase));
    } else if (subject) {
      // Clear all for a subject
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${subject}::`.toLowerCase())) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

// Singleton instance
export const CurriculumService = new CurriculumServiceClass();

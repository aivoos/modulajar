"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { saveJournalDraft, getUnsyncedJournalDrafts, isOnline } from "@/lib/offline";
import { PendingSyncBanner } from "@/hooks/usePWA";

interface Student {
  id: string;
  name: string;
  nis: string | null;
  gender: "L" | "P" | null;
  is_active: boolean;
  sort_order: number;
}

interface TeachingClass {
  id: string;
  subject: string;
  grade: string;
  class_name: string;
  phase: string | null;
  student_count: number;
  notes: string | null;
  academic_years?: { id: string; label: string };
  students: Student[];
}

interface Journal {
  id: string;
  teaching_class_id: string;
  date: string;
  topic: string;
  activity_open: string | null;
  activity_main: string | null;
  activity_close: string | null;
  tp_achievement: number | null;
  notes: string | null;
  photo_urls: string[];
}

interface Attendance {
  student_id: string;
  status: "H" | "S" | "I" | "A";
  notes: string | null;
}

export default function JournalDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const router = useRouter();
  const [cls, setCls] = useState<TeachingClass | null>(null);
  const [journal, setJournal] = useState<Journal | null>(null);
  const [attendances, setAttendances] = useState<Record<string, Attendance>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("date") || new Date().toISOString().split("T")[0];
  });

  // Form state
  const [topic, setTopic] = useState("");
  const [activityOpen, setActivityOpen] = useState("");
  const [activityMain, setActivityMain] = useState("");
  const [activityClose, setActivityClose] = useState("");
  const [tpAchievement, setTpAchievement] = useState(80);
  const [notes, setNotes] = useState("");
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Check offline drafts
      try {
        const unsynced = await getUnsyncedJournalDrafts(user.id);
        setPendingOfflineCount(unsynced.filter(u => u.teaching_class_id === classId && u.date === date).length);
      } catch {
        // IndexedDB not available, ignore
      }

      // Fetch class + students
      const classRes = await fetch(`/api/teaching-classes/${classId}`);
      if (!classRes.ok) {
        setLoading(false);
        return;
      }
      const { data: clsData } = await classRes.json();
      setCls(clsData);

      // Fetch journal for this date
      const { data: journalData } = await supabase
        .from("journals")
        .select("*")
        .eq("teaching_class_id", classId)
        .eq("date", date)
        .maybeSingle();

      if (journalData) {
        setJournal(journalData as Journal);
        setTopic(journalData.topic ?? "");
        setActivityOpen(journalData.activity_open ?? "");
        setActivityMain(journalData.activity_main ?? "");
        setActivityClose(journalData.activity_close ?? "");
        setTpAchievement(journalData.tp_achievement ?? 80);
        setNotes(journalData.notes ?? "");
      }

      // Fetch attendances for this journal
      if (journalData) {
        const { data: attData } = await supabase
          .from("attendances")
          .select("*")
          .eq("journal_id", journalData.id);
        const attMap: Record<string, Attendance> = {};
        (attData ?? []).forEach((a: Record<string, unknown>) => {
          attMap[a.student_id as string] = {
            student_id: a.student_id as string,
            status: a.status as "H" | "S" | "I" | "A",
            notes: a.notes as string | null,
          };
        });
        setAttendances(attMap);
      }

      setLoading(false);
    }
    load();
  }, [classId, date, router]);

  async function handleSave() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // If offline, save to IndexedDB and skip server
      if (!isOnline()) {
        await saveJournalDraft({
          teaching_class_id: classId,
          user_id: user.id,
          date,
          topic,
          activity_main: activityMain || null,
          tp_achievement: tpAchievement,
        });
        setPendingOfflineCount(c => c + 1);
        setSaving(false);
        alert("📴 Jurnal disimpan offline — akan di-sync saat koneksi kembali.");
        return;
      }

      // Upsert journal
      const { data: journalData, error: journalError } = await supabase
        .from("journals")
        .upsert({
          id: journal?.id,
          user_id: user.id,
          teaching_class_id: classId,
          date,
          topic,
          activity_open: activityOpen || null,
          activity_main: activityMain || null,
          activity_close: activityClose || null,
          tp_achievement: tpAchievement,
          notes: notes || null,
          photo_urls: journal?.photo_urls ?? [],
        }, { onConflict: "teaching_class_id,date" })
        .select("id")
        .single();

      if (journalError) throw journalError;

      // Upsert attendances
      const attendancePayloads = Object.entries(attendances).map(([studentId, att]) => ({
        journal_id: journalData.id,
        student_id: studentId,
        status: att.status,
        notes: att.notes,
      }));

      if (attendancePayloads.length > 0) {
        const res = await fetch("/api/attendances/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ""}` },
          body: JSON.stringify({ journal_id: journalData.id, attendances: attendancePayloads }),
        });
        if (!res.ok) throw new Error("attendance_save_failed");
      }

      setJournal(journalData as Journal);
      alert("Jurnal tersimpan!");
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan jurnal. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-[#0D1117] flex items-center justify-center"><p className="text-[#64748B]">Memuat...</p></div>;
  }

  if (!cls) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#64748B]">Kelas tidak ditemukan</p>
          <Link href="/journal" className="text-[#818CF8] text-sm hover:underline mt-2">← Kembali</Link>
        </div>
      </div>
    );
  }

  const attendanceCounts = { H: 0, S: 0, I: 0, A: 0 };
  Object.values(attendances).forEach((a) => { attendanceCounts[a.status]++; });

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <header className="bg-[#0D1117] border-b border-[#161B27] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/journal" className="text-[#475569] hover:text-[#64748B]">←</Link>
            <span className="font-bold text-[#F1F5F9]">Jurnal</span>
          </div>
          {pendingOfflineCount > 0 && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
              📴 {pendingOfflineCount} draft offline
            </span>
          )}
        </div>
      </header>

      <PendingSyncBanner />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Class header */}
        <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#4F46E5]/20 rounded-xl flex items-center justify-center">
              <span className="text-[#818CF8] font-bold text-lg">{cls.class_name}</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#E2E8F0]">{cls.subject} — {cls.grade}</h1>
              <p className="text-xs text-[#475569]">
                {cls.student_count} siswa · {cls.academic_years?.label ?? "Tahun ajaran aktif"}
              </p>
            </div>
          </div>
        </div>

        {/* Date picker */}
        <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-4">
          <label className="block text-sm text-[#64748B] mb-2">Tanggal Jurnal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-[#1A2030] border border-[#21293A] text-[#E2E8F0] rounded-lg px-4 py-2 w-full focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Journal form */}
        <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-5 space-y-4">
          <h2 className="font-semibold text-[#E2E8F0]">📝 Catatan Kegiatan</h2>

          <div>
            <label className="block text-sm text-[#64748B] mb-2">Topik Pembelajaran *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Contoh: Aljabar Linear - Sistem Persamaan"
              className="w-full bg-[#1A2030] border border-[#21293A] text-[#E2E8F0] rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-[#64748B] mb-2">Kegiatan Pendahuluan (opsional)</label>
            <textarea
              value={activityOpen}
              onChange={(e) => setActivityOpen(e.target.value)}
              placeholder="Apersepsi, motivasi,koneksi pelajaran lalu..."
              rows={2}
              className="w-full bg-[#1A2030] border border-[#21293A] text-[#E2E8F0] rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-[#64748B] mb-2">Kegiatan Inti *</label>
            <textarea
              value={activityMain}
              onChange={(e) => setActivityMain(e.target.value)}
              placeholder="Deskripsi kegiatan utama, metode, media..."
              rows={3}
              className="w-full bg-[#1A2030] border border-[#21293A] text-[#E2E8F0] rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-[#64748B] mb-2">Penutup (opsional)</label>
            <textarea
              value={activityClose}
              onChange={(e) => setActivityClose(e.target.value)}
              placeholder="Refleksi, tugas follow-up..."
              rows={2}
              className="w-full bg-[#1A2030] border border-[#21293A] text-[#E2E8F0] rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-[#64748B] mb-2">
              Capaian TP: {tpAchievement}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={tpAchievement}
              onChange={(e) => setTpAchievement(parseInt(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-[#475569] mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#64748B] mb-2">Catatan Tambahan (opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan khusus, kendala, siswa yang perlu perhatian..."
              rows={2}
              className="w-full bg-[#1A2030] border border-[#21293A] text-[#E2E8F0] rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Attendance */}
        <div className="bg-[#161B27] rounded-xl border border-[#21293A] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#E2E8F0]">📋 Absensi</h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-600">H: {attendanceCounts.H}</span>
              <span className="text-yellow-600">S: {attendanceCounts.S}</span>
              <span className="text-blue-600">I: {attendanceCounts.I}</span>
              <span className="text-red-600">A: {attendanceCounts.A}</span>
            </div>
          </div>

          <div className="text-sm text-[#64748B]">
            Klik tombol status untuk mengubah urutan: H → S → I → A
          </div>

          {cls.students.map((student) => {
            const att = attendances[student.id] || { student_id: student.id, status: "H" as const, notes: null };
            const statusColors = {
              H: "bg-green-100 text-green-700",
              S: "bg-yellow-100 text-yellow-700",
              I: "bg-blue-100 text-blue-700",
              A: "bg-red-100 text-red-700",
            };
            const nextStatus: Record<string, "H" | "S" | "I" | "A"> = { H: "S", S: "I", I: "A", A: "H" };

            return (
              <div key={student.id} className="flex items-center gap-3 py-2 border-b border-[#1A2030] last:border-0">
                <span className="text-xs text-[#475569] w-6">{student.sort_order ?? "#"}</span>
                <span className="flex-1 text-sm text-[#E2E8F0]">{student.name}</span>
                <button
                  onClick={() => setAttendances((prev) => ({
                    ...prev,
                    [student.id]: { ...att, status: nextStatus[att.status] },
                  }))}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusColors[att.status]}`}
                >
                  {att.status}
                </button>
                <input
                  type="text"
                  value={att.notes ?? ""}
                  onChange={(e) => setAttendances((prev) => ({
                    ...prev,
                    [student.id]: { ...att, notes: e.target.value || null },
                  }))}
                  placeholder="Ket..."
                  className="w-20 bg-[#1A2030] border border-[#21293A] text-[#E2E8F0] rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !topic.trim() || !activityMain.trim()}
            className="flex-1 py-3 bg-[#4F46E5] text-white rounded-xl font-semibold hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Menyimpan..." : "Simpan Jurnal"}
          </button>
          <Link
            href="/journal"
            className="px-6 py-3 bg-[#161B27] border border-[#21293A] text-[#E2E8F0] rounded-xl font-medium hover:bg-[#1A2030] transition-colors"
          >
            Batal
          </Link>
        </div>
      </main>
    </div>
  );
}

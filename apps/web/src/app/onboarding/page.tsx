"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const STEP_TITLES = ["Nama Sekolah", "Mata Pelajaran", "Fase & Jenjang"];
const MAPEL = [
  "Bahasa Indonesia", "Matematika", "IPA", "IPS",
  "Bahasa Inggris", "PJOK", "Seni Budaya", "Prakarya",
  "Pendidikan Agama", "PKn", "Bahasa Daerah",
];
const FASES = ["A", "B", "C", "D", "E", "F"];

// Indonesian grade mapping per fase
const FASE_GRADES: Record<string, string[]> = {
  A: ["1", "2", "3"],
  B: ["4", "5", "6"],
  C: ["7", "8", "9"],
  D: ["10", "11", "12"],
  E: ["11", "12"],
  F: ["12"],
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [subject, setSubject] = useState("");
  const [phase, setPhase] = useState("");
  const [grade, setGrade] = useState("");
  const [pushOptIn, setPushOptIn] = useState(false);

  async function handleFinish() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Get or create school
    if (schoolName.trim()) {
      const { data: existingSchool } = await supabase
        .from("schools")
        .select("id, name")
        .ilike("name", schoolName.trim())
        .limit(1)
        .single();

      if (existingSchool) {
        await supabase.from("users").update({ school_id: existingSchool.id }).eq("id", user.id);
      } else {
        const { data: newSchool } = await supabase
          .from("schools")
          .insert({ name: schoolName.trim(), plan: "free" })
          .select("id")
          .single();
        if (newSchool?.id) {
          await supabase.from("users").update({ school_id: newSchool.id }).eq("id", user.id);
        }
      }
    }

    // Save user profile
    await supabase.from("users").update({
      default_subject: subject || null,
      default_phase: (phase ? (phase as "A" | "B" | "C" | "D" | "E" | "F") : null),
      default_grade: grade || null,
      onboarding_done: true,
    }).eq("id", user.id);

    // Push opt-in: register for push notifications if granted
    if (pushOptIn && typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          const sub = await navigator.serviceWorker.ready;
          const pushSub = await sub.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env["NEXT_PUBLIC_VAPID_KEY"],
          });
          await supabase.from("push_subscriptions").insert({
            user_id: user.id,
            endpoint: pushSub.endpoint,
            p256dh: Buffer.from(pushSub.getKey("p256dh")!).toString("base64"),
            auth: Buffer.from(pushSub.getKey("auth")!).toString("base64"),
            device_info: navigator.userAgent,
          });
        }
      } catch (e) {
        // Push registration failed — continue
        console.warn("[onboarding] push subscription failed:", e);
      }
    }

    router.push("/dashboard");
  }

  const gradeOptions = phase ? FASE_GRADES[phase] ?? [] : [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-white p-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mt-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
          <span className="font-bold text-gray-900">Modulajar</span>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Step {step} of 3</span>
            <button onClick={() => router.push("/dashboard")} className="text-indigo-600 hover:underline">
              Lewati
            </button>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${(step / 3) * 100}%` }}/>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-6">{STEP_TITLES[step - 1]}</h2>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">
              Nama sekolah membantu kami menyesuaikan modul ajar dengan kurikulum yang berlaku.
              Opsional — bisa diisi nanti.
            </p>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="SMA Negeri 1 Bandung"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Lanjut
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">Pilih mata pelajaran utama yang Anda ajar:</p>
            <div className="grid grid-cols-2 gap-2">
              {MAPEL.map((m) => (
                <button
                  key={m}
                  onClick={() => setSubject(m)}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    subject === m ? "bg-indigo-50 border-indigo-600 text-indigo-600" : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(3)}
              disabled={!subject}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              Lanjut
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-gray-500 mb-3">Fase Kurikulum Merdeka:</p>
              <div className="flex gap-3 flex-wrap">
                {FASES.map((f) => (
                  <button
                    key={f}
                    onClick={() => { setPhase(f); setGrade(""); }}
                    className={`w-14 h-14 rounded-xl border text-lg font-bold transition-all ${
                      phase === f ? "bg-indigo-50 border-indigo-600 text-indigo-600" : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {phase && (
              <div>
                <p className="text-sm text-gray-500 mb-3">Jenjang (kelas berapa):</p>
                <div className="flex gap-2 flex-wrap">
                  {gradeOptions.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGrade(g)}
                      className={`px-5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        grade === g ? "bg-indigo-50 border-indigo-600 text-indigo-600" : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      Kelas {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Push notification opt-in */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushOptIn}
                  onChange={(e) => setPushOptIn(e.target.checked)}
                  className="mt-0.5 rounded border-amber-400"
                />
                <div>
                  <p className="text-sm font-medium text-amber-800">🔔 Reminder Jurnal Harian</p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Aktifkan notifikasi untuk mendapat pengingat jurnal setiap sore. Kami tidak akan mengirim spam — hanya pengingat jurnal saja.
                  </p>
                </div>
              </label>
            </div>

            <button
              onClick={handleFinish}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Mulai Menggunakan Modulajar"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
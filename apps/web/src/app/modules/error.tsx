"use client";
export default function ModulesError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6 text-center">
      <p className="text-red-500 mb-4">Gagal memuat modul: {error.message}</p>
      <button onClick={reset} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
        Coba Lagi
      </button>
    </div>
  );
}
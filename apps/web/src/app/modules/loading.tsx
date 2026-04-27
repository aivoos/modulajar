export default function ModulesLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg" />
      <div className="flex gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-20 bg-gray-200 rounded-full" />
        ))}
      </div>
      <div className="grid gap-3 mt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white rounded-xl border border-gray-200" />
        ))}
      </div>
    </div>
  );
}
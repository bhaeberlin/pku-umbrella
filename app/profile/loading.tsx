// Instant fallback for the Profile tab — mirrors the overview layout.
export default function ProfileLoading() {
  return (
    <div className="flex flex-col min-h-dvh px-6 pb-28 animate-pulse">
      {/* Header */}
      <div className="pt-14 pb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gray-200 flex-shrink-0" />
        <div className="space-y-2">
          <div className="h-3 w-20 bg-gray-200 rounded" />
          <div className="h-5 w-40 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-gray-50" />
        ))}
      </div>

      {/* Deposit card */}
      <div className="h-24 rounded-2xl bg-gray-50 mb-6" />

      {/* Badges strip */}
      <div className="mb-6">
        <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-14 h-14 rounded-2xl bg-gray-100 flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Menu rows */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded-2xl bg-gray-50" />
        ))}
      </div>
    </div>
  )
}

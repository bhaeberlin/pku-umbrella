// Instant fallback shown the moment a station navigation starts.
// Mirrors the map-strip + bottom-sheet layout so the swap isn't jarring.
export default function StationLoading() {
  return (
    <div className="relative h-dvh overflow-hidden bg-gray-200">
      {/* Map strip placeholder */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gray-200" />

      {/* Bottom sheet */}
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl" style={{ top: 160 }}>
        <div className="pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
        </div>
        <div className="px-6 pt-1 pb-4 flex items-start justify-between gap-3 animate-pulse">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 bg-gray-200 rounded" />
            <div className="h-5 w-44 bg-gray-200 rounded" />
            <div className="h-3 w-52 bg-gray-100 rounded" />
          </div>
          <div className="w-11 h-11 bg-gray-200 rounded-xl flex-shrink-0" />
        </div>
        <div className="px-6 pt-2 space-y-4 animate-pulse">
          <div className="h-7 w-40 bg-gray-100 rounded-full" />
          <div className="h-3 w-28 bg-gray-200 rounded" />
          <div className="flex gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-10 h-10 bg-gray-200 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

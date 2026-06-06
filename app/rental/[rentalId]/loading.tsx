// Instant fallback for the rental detail page.
export default function RentalLoading() {
  return (
    <div className="flex flex-col min-h-dvh animate-pulse">
      <div className="px-6 pt-12 pb-5 border-b border-gray-100 space-y-2">
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-6 w-40 bg-gray-200 rounded" />
      </div>

      <div className="flex-1 px-6 pt-6 pb-10 space-y-6">
        <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-28 bg-gray-200 rounded" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="h-4 w-40 bg-gray-200 rounded" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-gray-200 bg-gray-50" />
          ))}
        </div>
      </div>
    </div>
  )
}

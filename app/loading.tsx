// Instant fallback for the home page.
export default function HomeLoading() {
  return (
    <div className="flex flex-col min-h-dvh px-6 animate-pulse">
      <div className="pt-14 pb-8 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-gray-200 rounded" />
          <div className="h-7 w-44 bg-gray-200 rounded" />
          <div className="h-3 w-52 bg-gray-100 rounded" />
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
      </div>

      <div className="space-y-3 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-gray-50" />
        ))}
      </div>

      <div className="flex-1" />

      <div className="pb-10 space-y-3">
        <div className="h-14 rounded-2xl bg-gray-200" />
      </div>
    </div>
  )
}

import Link from 'next/link'
import type { Station } from '@/lib/types'

// Shared list of stations for returning an umbrella. Stations with no free dock
// (available >= capacity) are shown as "Full" and are not tappable.
export default function ReturnStationsList({ stations }: { stations: Station[] }) {
  return (
    <div className="space-y-2">
      {stations.map(s => {
        const slotsFree = Math.max(0, s.capacity - s.available)
        const isFull = slotsFree === 0

        const inner = (
          <>
            <div className="min-w-0 pr-3">
              <p className="font-medium text-gray-800 text-sm">{s.name}</p>
              {s.description && <p className="text-xs text-gray-400 truncate">{s.description}</p>}
            </div>
            <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
              isFull ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
            }`}>
              {isFull ? 'Full' : `${slotsFree} slots free`}
            </span>
          </>
        )

        if (isFull) {
          return (
            <div
              key={s.id}
              aria-disabled
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 opacity-60"
            >
              {inner}
            </div>
          )
        }

        return (
          <Link
            key={s.id}
            href={`/station/${s.id}`}
            prefetch
            className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 active:bg-gray-50"
          >
            {inner}
          </Link>
        )
      })}
    </div>
  )
}

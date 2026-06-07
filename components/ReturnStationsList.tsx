import Link from 'next/link'
import type { Station } from '@/lib/types'
import type { Lang } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n/dictionaries'
import { localizeStation } from '@/lib/i18n/stations'

// Shared list of stations for returning an umbrella. Stations with no free dock
// (available >= capacity) are shown as "Full" and are not tappable.
//
// Rendered from BOTH server components (rental/stations pages) and a client
// component (StationClient), so it takes `lang` as a plain prop and reads the
// dictionary directly instead of using the client-only useDict() hook.
export default function ReturnStationsList({ stations, lang }: { stations: Station[]; lang: Lang }) {
  const d = getDict(lang)
  return (
    <div className="space-y-2">
      {stations.map(s => {
        const slotsFree = Math.max(0, s.capacity - s.available)
        const isFull = slotsFree === 0
        const loc = localizeStation(s, lang)

        const inner = (
          <>
            <div className="min-w-0 pr-3">
              <p className="font-medium text-gray-800 text-sm">{loc.name}</p>
              {loc.description && <p className="text-xs text-gray-400 truncate">{loc.description}</p>}
            </div>
            <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
              isFull ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
            }`}>
              {isFull ? d.stations.full : d.stations.slotsFree(slotsFree)}
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

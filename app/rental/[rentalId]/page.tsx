import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import ReturnStationsList from '@/components/ReturnStationsList'
import UsageCost from '@/components/UsageCost'
import { getDictServer } from '@/lib/i18n/server'
import { localizeStation } from '@/lib/i18n/stations'
import { intlLocale, type Lang } from '@/lib/i18n/config'
import type { Dict } from '@/lib/i18n/dictionaries'
import type { RentalWithDetails } from '@/lib/types'

interface Props {
  params: Promise<{ rentalId: string }>
}

function formatElapsed(ms: number, d: Dict) {
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return d.time.minutesAgo(mins)
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? d.time.hmAgo(hrs, rem) : d.time.hoursAgo(hrs)
}

function formatDeadline(borrowedAt: string, lang: Lang) {
  const deadline = new Date(new Date(borrowedAt).getTime() + 24 * 60 * 60 * 1000)
  return deadline.toLocaleString(intlLocale(lang), {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

export default async function RentalPage({ params }: Props) {
  const { rentalId } = await params
  const supabase = await createServerSupabaseClient()
  const { lang, d } = await getDictServer()

  // Auth (local JWT verify) and the station list don't depend on each other.
  const [claimsRes, allStationsRes] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.from('stations').select('*').order('available', { ascending: false }),
  ])

  const userId = (claimsRes.data?.claims?.sub as string | undefined) ?? null
  if (!userId) notFound()

  const allStations = allStationsRes.data

  const { data: rental } = await supabase
    .from('rentals')
    .select(`
      *,
      umbrella:umbrellas(*),
      borrow_station:stations!rentals_borrow_station_id_fkey(*),
      return_station:stations!rentals_return_station_id_fkey(*)
    `)
    .eq('id', rentalId)
    .eq('user_id', userId)
    .single()

  if (!rental) notFound()

  const r = rental as RentalWithDetails
  const umbrellaShort = r.umbrella_id.slice(-4).toUpperCase()
  const elapsed = Date.now() - new Date(r.borrowed_at).getTime()

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <div className="px-6 pt-12 pb-5 border-b border-gray-100">
        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">{d.rental.active}</p>
        <h1 className="text-xl font-bold text-gray-900">{d.umbrella.label(umbrellaShort)}</h1>
      </div>

      <div className="flex-1 px-6 pt-6 pb-28 space-y-6">
        {/* Rental details card */}
        <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{d.rental.borrowedFrom}</span>
            <span className="font-medium text-gray-800">{localizeStation(r.borrow_station, lang).name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{d.rental.timeBorrowed}</span>
            <span className="font-medium text-gray-800">{formatElapsed(elapsed, d)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{d.rental.returnBy}</span>
            <span className="font-medium text-orange-600">{formatDeadline(r.borrowed_at, lang)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{d.rental.usageSoFar}</span>
            <UsageCost borrowedAt={r.borrowed_at} className="font-medium text-gray-800" />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{d.rental.rate}</span>
            <span className="font-medium text-gray-800">{d.pricing.label}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{d.rental.deposit}</span>
            <span className="font-medium text-gray-800">
              {r.deposit_status === 'kept' ? d.rental.depositOnFile : d.rental.depositHeld}
            </span>
          </div>
        </div>

        {/* Return stations */}
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">{d.rental.returnToAny}</h2>
          <ReturnStationsList stations={allStations ?? []} lang={lang} />
        </div>
      </div>
    </div>
  )
}

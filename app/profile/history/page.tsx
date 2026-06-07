import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { rentalMinutes } from '@/lib/profileStats'
import { formatDate, formatDuration } from '@/lib/format'
import { formatYuan } from '@/lib/pricing'
import { getDictServer } from '@/lib/i18n/server'
import { localizeStation } from '@/lib/i18n/stations'
import type { RentalWithDetails } from '@/lib/types'

export default async function HistoryPage() {
  const supabase = await createServerSupabaseClient()
  const { lang, d } = await getDictServer()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = (claims?.claims?.sub as string | undefined) ?? null
  if (!userId) redirect('/login?redirect=/profile/history')

  const { data } = await supabase
    .from('rentals')
    .select(`
      *,
      borrow_station:stations!rentals_borrow_station_id_fkey(*),
      return_station:stations!rentals_return_station_id_fkey(*)
    `)
    .eq('user_id', userId)
    .order('borrowed_at', { ascending: false })

  const rentals = (data ?? []) as RentalWithDetails[]

  return (
    <div className="flex flex-col min-h-dvh pb-28">
      <div className="px-6 pt-12 pb-5 border-b border-gray-100">
        <Link href="/profile" className="text-sm text-gray-400 mb-3 block active:opacity-60">{d.common.backToProfile}</Link>
        <h1 className="text-xl font-bold text-gray-900">{d.history.title}</h1>
      </div>

      <div className="flex-1 px-6 pt-6">
        {rentals.length === 0 ? (
          <p className="text-gray-400 text-sm text-center mt-12">{d.history.none}</p>
        ) : (
          <div className="space-y-3">
            {rentals.map(r => {
              const isActive = r.status === 'active'
              const mins = rentalMinutes(r)
              return (
                <div key={r.id} className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800 text-sm">{d.umbrella.label(r.umbrella_id.slice(-4).toUpperCase())}</span>
                    {isActive ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{d.history.active}</span>
                    ) : (
                      <span className="text-xs text-gray-400">{formatDate(r.returned_at ?? r.borrowed_at, lang)}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {r.borrow_station ? localizeStation(r.borrow_station, lang).name : '—'}
                    {r.return_station ? <span className="text-gray-400"> → {localizeStation(r.return_station, lang).name}</span> : null}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{formatDuration(mins, lang)}{isActive ? d.history.soFar : ''}</span>
                    <span>·</span>
                    <span>{d.history.fee(formatYuan(Number(r.usage_fee ?? 0)))}</span>
                    <span>·</span>
                    <span>
                      {r.deposit_status === 'held' ? d.history.depositHeld
                        : r.deposit_status === 'kept' ? d.history.depositOnFile
                        : d.history.depositRefunded}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

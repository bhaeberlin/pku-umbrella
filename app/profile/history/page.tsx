import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { rentalMinutes } from '@/lib/profileStats'
import { formatDate, formatDuration } from '@/lib/format'
import { formatYuan } from '@/lib/pricing'
import type { RentalWithDetails } from '@/lib/types'

export default async function HistoryPage() {
  const supabase = await createServerSupabaseClient()
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
        <Link href="/profile" className="text-sm text-gray-400 mb-3 block active:opacity-60">← Profile</Link>
        <h1 className="text-xl font-bold text-gray-900">Rent history</h1>
      </div>

      <div className="flex-1 px-6 pt-6">
        {rentals.length === 0 ? (
          <p className="text-gray-400 text-sm text-center mt-12">No rentals yet.</p>
        ) : (
          <div className="space-y-3">
            {rentals.map(r => {
              const isActive = r.status === 'active'
              const mins = rentalMinutes(r)
              return (
                <div key={r.id} className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800 text-sm">Umbrella #{r.umbrella_id.slice(-4).toUpperCase()}</span>
                    {isActive ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Active</span>
                    ) : (
                      <span className="text-xs text-gray-400">{formatDate(r.returned_at ?? r.borrowed_at)}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {r.borrow_station?.name ?? '—'}
                    {r.return_station ? <span className="text-gray-400"> → {r.return_station.name}</span> : null}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{formatDuration(mins)}{isActive ? ' so far' : ''}</span>
                    <span>·</span>
                    <span>Fee {formatYuan(Number(r.usage_fee ?? 0))}</span>
                    <span>·</span>
                    <span>
                      {r.deposit_status === 'held' ? 'Deposit held'
                        : r.deposit_status === 'kept' ? 'Deposit on file'
                        : 'Deposit refunded'}
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

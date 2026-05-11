import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { COLORS } from '@/lib/colors'
import type { RentalWithDetails } from '@/lib/types'

interface Props {
  params: Promise<{ rentalId: string }>
}

function formatElapsed(ms: number) {
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? `${hrs}h ${rem}m ago` : `${hrs} hour${hrs !== 1 ? 's' : ''} ago`
}

function formatDeadline(borrowedAt: string) {
  const deadline = new Date(new Date(borrowedAt).getTime() + 24 * 60 * 60 * 1000)
  return deadline.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

export default async function RentalPage({ params }: Props) {
  const { rentalId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: rental } = await supabase
    .from('rentals')
    .select(`
      *,
      umbrella:umbrellas(*),
      borrow_station:stations!rentals_borrow_station_id_fkey(*),
      return_station:stations!rentals_return_station_id_fkey(*)
    `)
    .eq('id', rentalId)
    .eq('user_id', user.id)
    .single()

  if (!rental) notFound()

  const r = rental as RentalWithDetails
  const colorInfo = COLORS[r.umbrella.color] ?? COLORS.black
  const umbrellaShort = r.umbrella_id.slice(-4).toUpperCase()
  const elapsed = Date.now() - new Date(r.borrowed_at).getTime()

  const { data: allStations } = await supabase
    .from('stations')
    .select('*')
    .order('available', { ascending: false })

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <div className="px-6 pt-12 pb-5 border-b border-gray-100">
        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Active rental</p>
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-full ${colorInfo.bg}`} />
          <h1 className="text-xl font-bold text-gray-900">#{umbrellaShort} · {colorInfo.label}</h1>
        </div>
      </div>

      <div className="flex-1 px-6 pt-6 pb-10 space-y-6">
        {/* Rental details card */}
        <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Borrowed from</span>
            <span className="font-medium text-gray-800">{r.borrow_station.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Time borrowed</span>
            <span className="font-medium text-gray-800">{formatElapsed(elapsed)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Return by</span>
            <span className="font-medium text-orange-600">{formatDeadline(r.borrowed_at)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Deposit</span>
            <span className="font-medium text-gray-800">
              {r.deposit_status === 'kept' ? '¥30 on file (instant next borrow)' : '¥30 held'}
            </span>
          </div>
        </div>

        {/* Return stations */}
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Return to any station</h2>
          <div className="space-y-2">
            {(allStations ?? []).map(s => (
              <a
                key={s.id}
                href={`/station/${s.id}`}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 active:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.description}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  s.available < s.capacity
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {s.capacity - s.available} slots free
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import ReturnStationsList from '@/components/ReturnStationsList'
import UsageCost from '@/components/UsageCost'
import { PRICING_LABEL } from '@/lib/pricing'

export default async function StationsPage() {
  const supabase = await createServerSupabaseClient()
  const [stationsRes, claimsRes] = await Promise.all([
    supabase.from('stations').select('*').order('name'),
    supabase.auth.getClaims(),
  ])
  const stations = stationsRes.data ?? []
  const userId = (claimsRes.data?.claims?.sub as string | undefined) ?? null

  // If the user has an active rental, this screen is about returning, not renting.
  let activeRental: { id: string; umbrella_id: string; borrowed_at: string } | null = null
  if (userId) {
    const { data } = await supabase
      .from('rentals')
      .select('id, umbrella_id, borrowed_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()
    activeRental = data
  }

  // ── RETURN MODE ─────────────────────────────────────────────────────────────
  if (activeRental) {
    const umbrellaShort = activeRental.umbrella_id.slice(-4).toUpperCase()
    return (
      <div className="flex flex-col min-h-dvh">
        <div className="px-6 pt-12 pb-5 border-b border-gray-100">
          <Link href="/" className="text-sm text-gray-400 mb-3 block active:opacity-60">← Back</Link>
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Husan 护伞</p>
          <h1 className="text-xl font-bold text-gray-900">Return your umbrella</h1>
        </div>

        <div className="flex-1 px-6 pt-6 pb-10 space-y-6">
          {/* Active rental summary */}
          <Link href={`/rental/${activeRental.id}`} className="block">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 active:opacity-80 transition-opacity">
              <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider mb-2">Active rental</p>
              <p className="font-semibold text-gray-800">Umbrella #{umbrellaShort}</p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-200/70">
                <span className="text-sm text-gray-500">Usage so far</span>
                <UsageCost borrowedAt={activeRental.borrowed_at} className="ml-auto font-semibold text-gray-800" />
              </div>
              <p className="text-xs text-gray-400 mt-1">{PRICING_LABEL}</p>
            </div>
          </Link>

          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-3">Return to any station</h2>
            <ReturnStationsList stations={stations} />
          </div>
        </div>
      </div>
    )
  }

  // ── RENT MODE (no active rental) ────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-dvh">
      <div className="px-6 pt-12 pb-5 border-b border-gray-100">
        <Link href="/" className="text-sm text-gray-400 mb-3 block active:opacity-60">← Back</Link>
        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Husan 护伞</p>
        <h1 className="text-xl font-bold text-gray-900">All stations</h1>
      </div>

      <div className="flex-1 px-6 pt-6 pb-10">
        {stations.length === 0 ? (
          <p className="text-gray-400 text-sm text-center mt-12">No stations found.</p>
        ) : (
          <div className="space-y-2">
            {stations.map(s => (
              <Link
                key={s.id}
                href={`/station/${s.id}`}
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-gray-200 active:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 pr-3">
                  <p className="font-medium text-gray-800 text-sm">{s.name}</p>
                  {s.description && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{s.description}</p>
                  )}
                </div>
                <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  s.available > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {s.available > 0 ? `${s.available} free` : 'Empty'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { COLORS } from '@/lib/colors'
import type { RentalWithDetails } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let activeRental: RentalWithDetails | null = null

  if (user) {
    const { data } = await supabase
      .from('rentals')
      .select(`
        *,
        umbrella:umbrellas(*),
        borrow_station:stations!rentals_borrow_station_id_fkey(*),
        return_station:stations!rentals_return_station_id_fkey(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
    if (data) activeRental = data as RentalWithDetails
  }

  return (
    <div className="flex flex-col min-h-dvh px-6">

      {/* Header */}
      <div className="pt-14 pb-8 flex items-center justify-between">
        <div>
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Líng Sǎn 灵伞</p>
          <h1 className="text-2xl font-bold text-gray-900">Umbrellas @ PKU</h1>
          <p className="text-sm text-gray-400 mt-1">Borrow · Use · Return anywhere</p>
        </div>
        <img src="/logo.png" alt="Líng Sǎn 灵伞" className="w-12 h-12 rounded-xl flex-shrink-0" />
      </div>

      {/* Active rental card — only shown when logged in with active rental */}
      {activeRental && <ActiveRentalCard rental={activeRental} />}

      {/* How it works */}
      <div className="mb-8">
        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-4">How it works</p>
        <div className="space-y-3">
          <Step
            icon="📱"
            title="Scan the QR code"
            desc="Find a station on campus and scan the QR code on the rack — it opens right here."
          />
          <Step
            icon="☂"
            title="Pick a color and borrow"
            desc="Choose your favourite color. A refundable deposit is held and returned when you're done."
          />
          <Step
            icon="✓"
            title="Return to any station"
            desc="Drop it off at whichever PKU station is closest — not just where you borrowed it."
          />
        </div>
      </div>

      <div className="flex-1" />

      {/* CTAs */}
      <div className="pb-10 space-y-3">
        <Link
          href="/stations"
          className="block w-full py-4 rounded-2xl bg-blue-600 text-white font-semibold text-center text-lg active:scale-[0.98] transition-transform"
        >
          Find a station
        </Link>
        {!user && (
          <Link
            href="/login"
            className="block w-full py-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold text-center active:scale-[0.98] transition-transform"
          >
            Log in
          </Link>
        )}
      </div>
    </div>
  )
}

function ActiveRentalCard({ rental }: { rental: RentalWithDetails }) {
  const colorInfo = COLORS[rental.umbrella.color] ?? COLORS.black
  const umbrellaShort = rental.umbrella_id.slice(-4).toUpperCase()
  const elapsed = Math.floor((Date.now() - new Date(rental.borrowed_at).getTime()) / 60000)
  const elapsedText = elapsed < 60
    ? `${elapsed}m ago`
    : `${Math.floor(elapsed / 60)}h ${elapsed % 60}m ago`

  return (
    <Link href={`/rental/${rental.id}`} className="block mb-8">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 active:opacity-80 transition-opacity">
        <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider mb-3">Active rental</p>
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-4 h-4 rounded-full ${colorInfo.bg}`} />
          <span className="font-semibold text-gray-800">#{umbrellaShort} · {colorInfo.label}</span>
          <span className="ml-auto text-sm text-gray-400">{elapsedText}</span>
        </div>
        <p className="text-sm text-gray-500">{rental.borrow_station.name}</p>
        <p className="text-sm text-blue-600 font-medium mt-3">View rental →</p>
      </div>
    </Link>
  )
}

function Step({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 bg-gray-50 rounded-2xl p-4">
      <span className="text-2xl mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

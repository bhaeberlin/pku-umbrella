import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import RefundDepositButton from '@/components/RefundDepositButton'
import LogoutButton from '@/components/LogoutButton'
import UsageCost from '@/components/UsageCost'
import { computeStats } from '@/lib/profileStats'
import { computeBadges } from '@/lib/badges'
import { maskPhone, formatDuration } from '@/lib/format'
import { formatYuan } from '@/lib/pricing'
import { getDictServer } from '@/lib/i18n/server'
import type { Profile, Rental } from '@/lib/types'

function PersonIcon() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  )
}

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { lang, d } = await getDictServer()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = (claims?.claims?.sub as string | undefined) ?? null
  if (!userId) redirect('/login?redirect=/profile')

  const [profileRes, rentalsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    // Overview only needs raw rental columns (stats, badges, active pill) — no joins.
    supabase
      .from('rentals')
      .select('*')
      .eq('user_id', userId)
      .order('borrowed_at', { ascending: false }),
  ])

  const profile = (profileRes.data ?? null) as Profile | null
  const rentals = (rentalsRes.data ?? []) as Rental[]
  const stats = computeStats(rentals)
  const badges = computeBadges(rentals, profile)
  const earned = badges.filter(b => b.earned)
  const active = rentals.find(r => r.status === 'active') ?? null

  return (
    <div className="flex flex-col min-h-dvh px-6 pb-28">
      {/* Header */}
      <div className="pt-14 pb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
          <PersonIcon />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">{d.profile.title}</p>
          <h1 className="text-xl font-bold text-gray-900">{maskPhone(profile?.phone, d.profile.unknownNumber)}</h1>
        </div>
      </div>

      {/* Active rental indicator (small) */}
      {active && (
        <Link href={`/rental/${active.id}`} className="block mb-5">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 active:opacity-80 transition-opacity">
            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-800">{d.profile.umbrellaOut}</span>
            <UsageCost borrowedAt={active.borrowed_at} className="ml-auto text-sm font-semibold text-gray-800" />
            <span className="text-blue-600 text-sm">→</span>
          </div>
        </Link>
      )}

      {/* Usage stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Stat label={d.profile.borrows} value={String(stats.borrows)} />
        <Stat label={d.profile.totalTime} value={formatDuration(stats.minutes, lang)} />
        <Stat label={d.profile.totalSpent} value={formatYuan(stats.spent)} />
        <Stat label={d.profile.stationsVisited} value={String(stats.stationsVisited)} />
      </div>

      {/* Deposit situation */}
      {active ? (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">{d.profile.deposit}</p>
          <p className="font-semibold text-gray-800">{d.profile.depositHeldDuring}</p>
          <p className="text-sm text-gray-500 mt-1">{d.profile.depositReturnedWhen}</p>
        </div>
      ) : profile?.deposit_on_file ? (
        <RefundDepositButton />
      ) : (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">{d.profile.deposit}</p>
          <p className="font-semibold text-gray-800">{d.profile.noDeposit}</p>
          <p className="text-sm text-gray-500 mt-1">{d.profile.noDepositSub}</p>
        </div>
      )}

      {/* Badges strip */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">{d.profile.badges}</h2>
          <Link href="/profile/badges" className="text-sm text-blue-600 font-medium">{d.profile.seeAll}</Link>
        </div>
        {earned.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {earned.map(b => (
              <div key={b.id} className="flex flex-col items-center gap-1 flex-shrink-0 w-20">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl">{b.emoji}</div>
                <span className="text-[11px] text-gray-600 text-center leading-tight">{d.badges[b.id].label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">{d.profile.noBadges}</p>
        )}
      </div>

      {/* Menu */}
      <div className="space-y-2 mb-8">
        <MenuRow href="/profile/history" label={d.profile.history} />
        <MenuRow href="/profile/badges" label={d.profile.badges} />
        <MenuRow href="/profile/help" label={d.profile.helpSupport} />
        <MenuRow href="/profile/about" label={d.profile.about} />
      </div>

      <div className="flex-1" />
      <LogoutButton />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function MenuRow({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-gray-200 active:bg-gray-50 transition-colors"
    >
      <span className="font-medium text-gray-800 text-sm">{label}</span>
      <span className="text-gray-400">→</span>
    </Link>
  )
}

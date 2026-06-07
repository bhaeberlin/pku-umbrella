import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { computeBadges } from '@/lib/badges'
import type { Profile, Rental } from '@/lib/types'

export default async function BadgesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = (claims?.claims?.sub as string | undefined) ?? null
  if (!userId) redirect('/login?redirect=/profile/badges')

  const [profileRes, rentalsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('rentals').select('*').eq('user_id', userId),
  ])

  const badges = computeBadges(
    (rentalsRes.data ?? []) as Rental[],
    (profileRes.data ?? null) as Profile | null,
  )
  const earnedCount = badges.filter(b => b.earned).length

  return (
    <div className="flex flex-col min-h-dvh pb-28">
      <div className="px-6 pt-12 pb-5 border-b border-gray-100">
        <Link href="/profile" className="text-sm text-gray-400 mb-3 block active:opacity-60">← Profile</Link>
        <h1 className="text-xl font-bold text-gray-900">Badges</h1>
        <p className="text-sm text-gray-400 mt-1">{earnedCount} of {badges.length} earned</p>
      </div>

      <div className="flex-1 px-6 pt-6">
        <div className="space-y-3">
          {badges.map(b => (
            <div
              key={b.id}
              className={`flex items-center gap-4 rounded-2xl p-4 border ${
                b.earned ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                b.earned ? '' : 'grayscale opacity-40'
              }`}>
                {b.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold text-sm ${b.earned ? 'text-gray-900' : 'text-gray-500'}`}>{b.label}</p>
                  {b.earned && <span className="text-xs text-blue-600 font-medium">Earned</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{b.description}</p>
                {!b.earned && b.progress && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${Math.round((b.progress.current / b.progress.target) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">{b.progress.current} / {b.progress.target}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

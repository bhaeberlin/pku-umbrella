import type { Rental, Profile } from './types'

// Badge ids line up 1:1 with the `badges.*` keys in the i18n dictionaries,
// where each badge's label + description live (so they translate). This module
// only computes which badges are earned; the UI looks up the copy by id.
export type BadgeId = 'first_drop' | 'regular' | 'pro' | 'speedy' | 'explorer' | 'saver'

export interface Badge {
  id: BadgeId
  emoji: string
  earned: boolean
  progress?: { current: number; target: number }
}

// All badges are derived from rental history — no backend state needed.
export function computeBadges(rentals: Rental[], profile: Profile | null): Badge[] {
  const borrows = rentals.length

  const stations = new Set<string>()
  let speedy = false
  let keptDeposit = profile?.deposit_on_file ?? false
  for (const r of rentals) {
    if (r.borrow_station_id) stations.add(r.borrow_station_id)
    if (r.return_station_id) stations.add(r.return_station_id)
    if (r.status === 'returned' && Number(r.usage_fee ?? 0) === 0) speedy = true
    if (r.deposit_status === 'kept') keptDeposit = true
  }
  const stationsVisited = stations.size

  return [
    { id: 'first_drop', emoji: '🌂', earned: borrows >= 1, progress: { current: Math.min(borrows, 1), target: 1 } },
    { id: 'regular', emoji: '☔', earned: borrows >= 5, progress: { current: Math.min(borrows, 5), target: 5 } },
    { id: 'pro', emoji: '🏆', earned: borrows >= 10, progress: { current: Math.min(borrows, 10), target: 10 } },
    { id: 'speedy', emoji: '⚡', earned: speedy },
    { id: 'explorer', emoji: '🗺️', earned: stationsVisited >= 3, progress: { current: Math.min(stationsVisited, 3), target: 3 } },
    { id: 'saver', emoji: '💰', earned: keptDeposit },
  ]
}

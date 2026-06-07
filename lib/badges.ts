import type { Rental, Profile } from './types'

export interface Badge {
  id: string
  label: string
  emoji: string
  description: string
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
    {
      id: 'first_drop',
      label: 'First Drop',
      emoji: '🌂',
      description: 'Borrow your first umbrella.',
      earned: borrows >= 1,
      progress: { current: Math.min(borrows, 1), target: 1 },
    },
    {
      id: 'regular',
      label: 'Regular',
      emoji: '☔',
      description: 'Borrow 5 times.',
      earned: borrows >= 5,
      progress: { current: Math.min(borrows, 5), target: 5 },
    },
    {
      id: 'pro',
      label: 'Umbrella Pro',
      emoji: '🏆',
      description: 'Borrow 10 times.',
      earned: borrows >= 10,
      progress: { current: Math.min(borrows, 10), target: 10 },
    },
    {
      id: 'speedy',
      label: 'Speedy Returner',
      emoji: '⚡',
      description: 'Return within the free 10 minutes.',
      earned: speedy,
    },
    {
      id: 'explorer',
      label: 'Campus Explorer',
      emoji: '🗺️',
      description: 'Use 3 different stations.',
      earned: stationsVisited >= 3,
      progress: { current: Math.min(stationsVisited, 3), target: 3 },
    },
    {
      id: 'saver',
      label: 'Deposit Keeper',
      emoji: '💰',
      description: 'Keep your deposit on file for instant re-borrows.',
      earned: keptDeposit,
    },
  ]
}

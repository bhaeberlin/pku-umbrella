import type { Rental } from './types'

export interface ProfileStats {
  borrows: number          // lifetime borrows (all rentals)
  minutes: number          // total minutes used across returned rentals
  spent: number            // total usage fees paid (¥)
  stationsVisited: number  // distinct borrow/return stations touched
}

/** Duration of a rental in whole minutes (uses returned_at, else now). */
export function rentalMinutes(r: Pick<Rental, 'borrowed_at' | 'returned_at'>): number {
  const end = r.returned_at ? new Date(r.returned_at).getTime() : Date.now()
  return Math.max(0, Math.round((end - new Date(r.borrowed_at).getTime()) / 60000))
}

export function computeStats(rentals: Rental[]): ProfileStats {
  const stations = new Set<string>()
  let minutes = 0
  let spent = 0

  for (const r of rentals) {
    if (r.borrow_station_id) stations.add(r.borrow_station_id)
    if (r.return_station_id) stations.add(r.return_station_id)
    if (r.status === 'returned') minutes += rentalMinutes(r)
    spent += Number(r.usage_fee ?? 0)
  }

  return {
    borrows: rentals.length,
    minutes,
    spent: Math.round(spent * 100) / 100,
    stationsVisited: stations.size,
  }
}

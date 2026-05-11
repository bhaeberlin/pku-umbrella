export type UmbrellaColor = 'red' | 'blue' | 'yellow' | 'green' | 'black'
export type UmbrellaStatus = 'available' | 'rented' | 'maintenance'
export type RentalStatus = 'active' | 'returned'
export type DepositStatus = 'held' | 'kept' | 'refunded'

export interface Station {
  id: string
  name: string
  description: string | null
  capacity: number
  available: number
}

export interface Umbrella {
  id: string
  station_id: string | null
  color: UmbrellaColor
  status: UmbrellaStatus
}

export interface Profile {
  id: string
  phone: string | null
  active_rental_id: string | null
}

export interface Rental {
  id: string
  user_id: string
  umbrella_id: string
  borrow_station_id: string
  return_station_id: string | null
  borrowed_at: string
  returned_at: string | null
  status: RentalStatus
  deposit_status: DepositStatus
}

export interface RentalWithDetails extends Rental {
  umbrella: Umbrella
  borrow_station: Station
  return_station: Station | null
}

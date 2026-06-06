import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import StationClient from '@/components/StationClient'
import type { RentalWithDetails } from '@/lib/types'

interface Props {
  params: Promise<{ stationId: string }>
}

export default async function StationPage({ params }: Props) {
  const { stationId } = await params
  const supabase = await createServerSupabaseClient()

  // Wave 1 — everything that doesn't depend on the user, in parallel.
  // getClaims() verifies the JWT locally (cached JWKS) instead of a round-trip
  // to the auth server, so it's effectively free here.
  const [stationRes, allStationsRes, claimsRes] = await Promise.all([
    supabase.from('stations').select('*').eq('id', stationId).single(),
    supabase.from('stations').select('*').order('name'),
    supabase.auth.getClaims(),
  ])

  if (stationRes.error || !stationRes.data) notFound()

  const station = stationRes.data
  const allStations = allStationsRes.data ?? []
  const userId = (claimsRes.data?.claims?.sub as string | undefined) ?? null

  let activeRental: RentalWithDetails | null = null
  let depositOnFile = false

  if (userId) {
    // Wave 2 — the two user-dependent queries in parallel.
    const [rentalRes, profileRes] = await Promise.all([
      supabase
        .from('rentals')
        .select(`
          *,
          umbrella:umbrellas(*),
          borrow_station:stations!rentals_borrow_station_id_fkey(*),
          return_station:stations!rentals_return_station_id_fkey(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('deposit_on_file')
        .eq('id', userId)
        .single(),
    ])

    activeRental = rentalRes.data as RentalWithDetails | null
    depositOnFile = profileRes.data?.deposit_on_file ?? false
  }

  return (
    <StationClient
      station={station}
      userId={userId}
      activeRental={activeRental}
      depositOnFile={depositOnFile}
      allStations={allStations}
    />
  )
}

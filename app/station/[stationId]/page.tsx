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

  // Fetch station + all stations in parallel
  const [stationRes, allStationsRes, { data: { user } }] = await Promise.all([
    supabase.from('stations').select('*').eq('id', stationId).single(),
    supabase.from('stations').select('*').order('name'),
    supabase.auth.getUser(),
  ])

  if (stationRes.error || !stationRes.data) notFound()

  const station = stationRes.data
  const allStations = allStationsRes.data ?? []

  // Fetch umbrellas at this station
  const { data: umbrellas } = await supabase
    .from('umbrellas')
    .select('*')
    .eq('station_id', stationId)

  let activeRental: RentalWithDetails | null = null
  let depositOnFile = false

  if (user) {
    // Fetch active rental with umbrella + station details
    const { data: rental } = await supabase
      .from('rentals')
      .select(`
        *,
        umbrella:umbrellas(*),
        borrow_station:stations!rentals_borrow_station_id_fkey(*),
        return_station:stations!rentals_return_station_id_fkey(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    activeRental = rental as RentalWithDetails | null

    const { data: profile } = await supabase
      .from('profiles')
      .select('deposit_on_file')
      .eq('id', user.id)
      .single()

    depositOnFile = profile?.deposit_on_file ?? false
  }

  return (
    <StationClient
      station={station}
      umbrellas={umbrellas ?? []}
      userId={user?.id ?? null}
      activeRental={activeRental}
      depositOnFile={depositOnFile}
      allStations={allStations}
    />
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const { rentalId, stationId, keepDeposit } = await req.json()

  // Verify this rental belongs to the authenticated user
  const { data: rental } = await supabase
    .from('rentals')
    .select('id')
    .eq('id', rentalId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!rental) {
    return NextResponse.json({ error: 'rental_not_found' }, { status: 404 })
  }

  const { data: fee, error } = await supabase.rpc('return_umbrella', {
    p_rental_id: rentalId,
    p_station_id: stationId,
    p_keep_deposit: keepDeposit,
  })

  if (error) {
    // Surface the full-station case with a stable code the client can map.
    const code = /station_full/.test(error.message) ? 'station_full' : error.message
    return NextResponse.json({ error: code }, { status: 400 })
  }

  // Deposit follows the user's choice: kept → on file, refunded → cleared.
  await supabase.from('profiles').update({ deposit_on_file: !!keepDeposit }).eq('id', user.id)

  return NextResponse.json({ success: true, fee: fee ?? 0 })
}

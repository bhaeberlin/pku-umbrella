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

  const { error } = await supabase.rpc('return_umbrella', {
    p_rental_id: rentalId,
    p_station_id: stationId,
    p_keep_deposit: keepDeposit,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const { stationId } = await req.json()

  const { data: rentalId, error } = await supabase.rpc('borrow_umbrella', {
    p_station_id: stationId,
    p_user_id: user.id,
    p_color: null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // The user now has a ¥99 deposit with us (held during this rental).
  await supabase.from('profiles').update({ deposit_on_file: true }).eq('id', user.id)

  // Return the rental's umbrella id for the success screen
  const { data: rental } = await supabase
    .from('rentals')
    .select('id, umbrella_id')
    .eq('id', rentalId)
    .single()

  return NextResponse.json({
    rentalId,
    umbrellaShort: rental?.umbrella_id?.slice(-4).toUpperCase(),
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const { stationId, color } = await req.json()

  const { data: rentalId, error } = await supabase.rpc('borrow_umbrella', {
    p_station_id: stationId,
    p_user_id: user.id,
    p_color: color ?? null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Return rental with umbrella details for the success screen
  const { data: rental } = await supabase
    .from('rentals')
    .select('id, umbrella_id, umbrellas(color, id)')
    .eq('id', rentalId)
    .single()

  return NextResponse.json({
    rentalId,
    color: (rental?.umbrellas as unknown as { color: string } | null)?.color,
    umbrellaShort: rental?.umbrella_id?.slice(-4).toUpperCase(),
  })
}

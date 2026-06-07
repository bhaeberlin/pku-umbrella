import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Flip any kept deposits to refunded (history) …
  const { error } = await supabase
    .from('rentals')
    .update({ deposit_status: 'refunded' })
    .eq('user_id', user.id)
    .eq('status', 'returned')
    .eq('deposit_status', 'kept')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // … and clear the deposit-on-file flag (the source of truth for the UI).
  const { error: pErr } = await supabase
    .from('profiles')
    .update({ deposit_on_file: false })
    .eq('id', user.id)

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

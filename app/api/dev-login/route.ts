import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Demo auth: there is no real SMS provider (requires a registered company in
// China). Instead, the universal verification code is always "000000". This
// route binds a phone number to a real Supabase auth user + session, without
// any real verification — so RLS and auth.uid() keep working everywhere else.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const DEMO_CODE = '000000'

// Derive a stable email + password from the phone number. The password is only
// ever computed server-side, never exposed to the client.
function credsFor(digits: string) {
  const secret = process.env.DEMO_AUTH_SECRET ?? 'pku-umbrella-demo'
  const email = `${digits}@demo.pku-umbrella.local`
  const password = crypto.createHash('sha256').update(digits + secret).digest('hex')
  return { email, password }
}

export async function POST(req: NextRequest) {
  const { phone, code } = await req.json()

  if (code !== DEMO_CODE) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 401 })
  }

  const digits = String(phone ?? '').replace('+86', '').replace(/\D/g, '')
  if (digits.length !== 11) {
    return NextResponse.json({ error: 'invalid_phone' }, { status: 400 })
  }

  const { email, password } = credsFor(digits)
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Find-or-create the user for this phone, and ensure the password is known.
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    phone: '+86' + digits,
    phone_confirm: true,
  })

  let userId: string
  if (created.error) {
    // User already exists (by email or phone) — locate and reset the password.
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existing = list?.users.find(
      u => u.email === email || u.phone === digits || u.phone === '86' + digits
    )
    if (!existing) {
      return NextResponse.json({ error: created.error.message }, { status: 500 })
    }
    userId = existing.id
    // Also (re)set the email — older users created via the real phone-OTP flow
    // have no email, so without this the email sign-in below would fail.
    await admin.auth.admin.updateUserById(userId, { email, password, email_confirm: true })
  } else {
    userId = created.data.user.id
  }

  // Mint a real session by signing in with the known credentials.
  const anon = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: signIn, error: signErr } = await anon.auth.signInWithPassword({ email, password })
  if (signErr || !signIn.session) {
    return NextResponse.json({ error: signErr?.message ?? 'sign_in_failed' }, { status: 500 })
  }

  // Make sure the profile carries the human-readable phone for display.
  await admin.from('profiles').update({ phone: '+86' + digits }).eq('id', userId)

  return NextResponse.json({
    access_token: signIn.session.access_token,
    refresh_token: signIn.session.refresh_token,
  })
}

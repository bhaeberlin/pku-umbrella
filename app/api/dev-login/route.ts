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
  const anon = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Fast path — returning phone (the common case): one round-trip. The
  // password is deterministic, so an existing user signs straight in.
  let signIn = await anon.auth.signInWithPassword({ email, password })

  // Slow path — user doesn't exist yet, or credentials drifted (e.g. a legacy
  // phone-only user from the old OTP flow). Create or repair, then retry.
  if (signIn.error || !signIn.data.session) {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone: '+86' + digits,
      phone_confirm: true,
    })

    if (created.error) {
      // Already exists but couldn't sign in — locate the id and reset email +
      // password. Try profiles first (cheap), fall back to listUsers.
      const { data: prof } = await admin
        .from('profiles')
        .select('id')
        .eq('phone', '+86' + digits)
        .maybeSingle()

      let userId = prof?.id as string | undefined
      if (!userId) {
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
        userId = list?.users.find(
          u => u.email === email || u.phone === digits || u.phone === '86' + digits
        )?.id
      }
      if (!userId) {
        return NextResponse.json({ error: created.error.message }, { status: 500 })
      }
      await admin.auth.admin.updateUserById(userId, { email, password, email_confirm: true })
    }

    signIn = await anon.auth.signInWithPassword({ email, password })
    if (signIn.error || !signIn.data.session) {
      return NextResponse.json({ error: signIn.error?.message ?? 'sign_in_failed' }, { status: 500 })
    }
  }

  return NextResponse.json({
    access_token: signIn.data.session.access_token,
    refresh_token: signIn.data.session.refresh_token,
  })
}

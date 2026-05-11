import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Supabase custom SMS hook sends: { user: {...}, sms: { otp } }
  const otp = body.sms?.otp ?? body.otp
  const phone = body.user?.phone ?? body.phone

  if (!otp || !phone) {
    return NextResponse.json({ error: 'missing phone or otp' }, { status: 400 })
  }

  // Bypass mode: if smsbao credentials are not set, log the OTP and succeed
  // Remove this block once smsbao account is configured
  if (!process.env.SMSBAO_USERNAME || !process.env.SMSBAO_PASSWORD) {
    console.log(`[SMS BYPASS] Phone: ${phone}  OTP: ${otp}`)
    return NextResponse.json({ success: true, bypass: true })
  }

  const phone_clean = phone.replace('+86', '').replace(/\s/g, '')
  const message = `【灵伞】您的验证码是 ${otp}，5分钟内有效。`

  const url = new URL('https://api.smsbao.com/sms')
  url.searchParams.set('u', process.env.SMSBAO_USERNAME)
  url.searchParams.set('p', process.env.SMSBAO_PASSWORD)
  url.searchParams.set('m', phone_clean)
  url.searchParams.set('c', message)

  const res = await fetch(url.toString())
  const text = await res.text()

  if (text.trim() !== '0') {
    console.error(`smsbao error code: ${text}`)
    return NextResponse.json({ error: `smsbao error: ${text}` }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Supabase custom SMS hook sends: { user: {...}, sms: { otp } }
  const otp = body.sms?.otp ?? body.otp
  const phone = body.user?.phone ?? body.phone

  if (!otp || !phone) {
    return NextResponse.json({ error: 'missing phone or otp' }, { status: 400 })
  }

  // Bypass mode: log the OTP when yunpian API key is not set
  if (!process.env.YUNPIAN_APIKEY) {
    console.log(`[SMS BYPASS] Phone: ${phone}  OTP: ${otp}`)
    return NextResponse.json({ success: true, bypass: true })
  }

  const phone_clean = phone.replace('+86', '').replace(/\s/g, '')
  // Signature 【灵伞】must be registered and approved in the yunpian dashboard first
  const message = `【灵伞】您的验证码是 ${otp}，5分钟内有效。`

  const params = new URLSearchParams({
    apikey: process.env.YUNPIAN_APIKEY,
    mobile: phone_clean,
    text: message,
  })

  const res = await fetch('https://sms.yunpian.com/v2/sms/single_send.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  const data = await res.json()

  if (data.code !== 0) {
    console.error(`yunpian error: ${data.code} — ${data.msg}`)
    return NextResponse.json({ error: `yunpian error: ${data.msg}` }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

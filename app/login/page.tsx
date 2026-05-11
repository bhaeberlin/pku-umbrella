'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Step = 'phone' | 'otp'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect') ?? '/'
  const supabase = createClient()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  async function sendOtp() {
    setError('')
    const fullPhone = '+86' + phone.replace(/\s/g, '')
    if (!/^\+86\d{11}$/.test(fullPhone)) {
      setError('Please enter an 11-digit Chinese mobile number')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setStep('otp')
    setCountdown(60)
    setTimeout(() => otpRefs.current[0]?.focus(), 100)
  }

  async function verifyOtp() {
    setError('')
    const token = otp.join('')
    if (token.length !== 6) {
      setError('Enter all 6 digits')
      return
    }
    const fullPhone = '+86' + phone.replace(/\s/g, '')
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ phone: fullPhone, token, type: 'sms' })
    setLoading(false)
    if (error) {
      setError('Incorrect code — please try again')
      return
    }
    router.replace(redirect)
  }

  function handleOtpInput(i: number, val: string) {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
    if (!val && i > 0) otpRefs.current[i - 1]?.focus()
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus()
    }
  }

  return (
    <div className="flex flex-col min-h-dvh px-6 pt-16 pb-8">
      {/* Header */}
      <div className="mb-10">
        <div className="text-3xl mb-2">☂</div>
        <h1 className="text-2xl font-bold text-gray-900">
          {step === 'phone' ? 'Enter your phone number' : 'Enter the code'}
        </h1>
        <p className="text-gray-500 mt-1">
          {step === 'phone'
            ? "We'll send you a verification code"
            : `Sent to +86 ${phone}`}
        </p>
      </div>

      {step === 'phone' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-teal-500 transition-colors">
            <span className="px-4 py-4 text-gray-500 font-medium bg-gray-50 border-r-2 border-gray-200 text-sm">
              +86
            </span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="138 0013 8000"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && sendOtp()}
              className="flex-1 px-4 py-4 text-lg outline-none bg-white"
              autoFocus
              maxLength={11}
            />
          </div>
        </div>
      )}

      {step === 'otp' && (
        <div className="flex flex-col gap-6">
          <div className="flex gap-2 justify-between">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { otpRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpInput(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-teal-500 outline-none transition-colors"
              />
            ))}
          </div>
          <button
            onClick={() => { setStep('phone'); setOtp(['','','','','','']); setError('') }}
            className="text-sm text-gray-400 text-left"
          >
            ← Change number
          </button>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      )}

      <div className="mt-auto pt-6 flex flex-col gap-3">
        {step === 'otp' && countdown > 0 && (
          <p className="text-center text-sm text-gray-400">
            Resend code in {countdown}s
          </p>
        )}
        {step === 'otp' && countdown === 0 && (
          <button
            onClick={sendOtp}
            className="text-center text-sm text-teal-600 font-medium"
          >
            Resend code
          </button>
        )}
        <button
          onClick={step === 'phone' ? sendOtp : verifyOtp}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-teal-500 text-white font-semibold text-lg disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {loading ? '…' : step === 'phone' ? 'Send code' : 'Verify'}
        </button>
      </div>
    </div>
  )
}

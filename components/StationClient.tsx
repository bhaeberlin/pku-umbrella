'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import MapSheetLayout from './MapSheetLayout'
import ReturnStationsList from './ReturnStationsList'
import UsageCost from './UsageCost'
import { useBottomSheet } from '@/hooks/useBottomSheet'
import { usageFee, usageMinutes, formatYuan, PRICING_LABEL } from '@/lib/pricing'
import type { Station, RentalWithDetails } from '@/lib/types'

interface Props {
  station: Station
  userId: string | null
  activeRental: RentalWithDetails | null
  depositOnFile: boolean
  allStations: Station[]
}

type View =
  | 'borrow'
  | 'deposit'
  | 'borrowing'
  | 'borrow-success'
  | 'return-fee'
  | 'return-choice'
  | 'returning'
  | 'return-success'

interface BorrowResult {
  rentalId: string
  umbrellaShort: string
}

interface ReturnResult {
  keptDeposit: boolean
  fee: number
}

export default function StationClient({
  station,
  userId,
  activeRental,
  depositOnFile,
  allStations,
}: Props) {
  const router = useRouter()
  const sheet = useBottomSheet()
  // Pending state for in-app navigations (View rental, Back to home) so taps
  // give instant feedback while the next route streams in.
  const [isPending, startTransition] = useTransition()

  const [view, setView]                   = useState<View>('borrow')
  const [borrowResult, setBorrowResult]   = useState<BorrowResult | null>(null)
  const [returnResult, setReturnResult]   = useState<ReturnResult | null>(null)
  const [feeCharged, setFeeCharged]       = useState(0)
  const [error, setError]                 = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const hasActiveRental = !!activeRental
  const hasUmbrellas    = station.available > 0
  // A return needs a free dock: available counts umbrellas present, so the
  // station is full for returns when available has reached capacity.
  const stationFull     = station.available >= station.capacity

  async function borrow() {
    if (!userId) {
      router.push(`/login?redirect=/station/${station.id}`)
      return
    }
    setError('')
    if (!depositOnFile) {
      setView('deposit')
      return
    }
    setActionLoading(true)
    await executeBorrow()
  }

  async function executeBorrow() {
    setActionLoading(true)
    setView('borrowing')
    try {
      const res = await fetch('/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId: station.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to borrow')
      setBorrowResult(data)
      setView('borrow-success')
      setActionLoading(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setView('borrow')
      setActionLoading(false)
    }
  }

  // Tap "Return umbrella here" → mock-pay the usage fee (if any), then choose
  // what to do with the deposit.
  function startReturn() {
    if (!activeRental) return
    setError('')
    const fee = usageFee(activeRental.borrowed_at)
    setFeeCharged(fee)
    setView(fee > 0 ? 'return-fee' : 'return-choice')
  }

  async function returnUmbrella(keepDeposit: boolean) {
    if (!activeRental) return
    setActionLoading(true)
    setView('returning')
    setError('')
    try {
      const res = await fetch('/api/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentalId: activeRental.id, stationId: station.id, keepDeposit }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.error === 'station_full'
          ? 'This station is full — please return at another station.'
          : (data.error ?? 'Failed to return')
        throw new Error(msg)
      }
      setReturnResult({ keptDeposit: keepDeposit, fee: feeCharged })
      setView('return-success')
      setActionLoading(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setView('return-choice')
      setActionLoading(false)
    }
  }

  // ── RETURN SUCCESS ──────────────────────────────────────────────────────────
  if (view === 'return-success' && returnResult) {
    return (
      <div className="flex flex-col min-h-dvh px-6 pt-20 pb-10 items-center text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <span className="text-4xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Umbrella returned!</h1>
        {returnResult.fee > 0 && (
          <p className="text-gray-700 font-medium mb-1">Usage fee {formatYuan(returnResult.fee)} paid</p>
        )}
        {returnResult.keptDeposit ? (
          <p className="text-gray-500 mb-8">¥99 deposit kept on file — next borrow is instant.</p>
        ) : (
          <p className="text-gray-500 mb-8">¥99 deposit refunded. Thank you!</p>
        )}
        <p className="text-sm text-gray-400">Thank you for using Husan 护伞</p>
        <button
          onClick={() => startTransition(() => router.push('/'))}
          disabled={isPending}
          className="mt-8 text-blue-600 font-medium text-sm disabled:opacity-50 active:scale-95 transition-transform"
        >
          {isPending ? 'Loading…' : 'Back to home →'}
        </button>
      </div>
    )
  }

  // ── BORROW SUCCESS ──────────────────────────────────────────────────────────
  if (view === 'borrow-success' && borrowResult) {
    return (
      <div className="flex flex-col min-h-dvh px-6 pt-20 pb-10 items-center text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <span className="text-4xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Umbrella borrowed!</h1>
        <p className="font-semibold text-gray-700 mb-1">Umbrella #{borrowResult.umbrellaShort}</p>
        <p className="text-gray-500 text-sm mb-2">{station.name}</p>
        <p className="text-gray-400 text-sm mb-8">Return to any station within 24 hours</p>
        <button
          onClick={() => startTransition(() => router.push(`/rental/${borrowResult.rentalId}`))}
          disabled={isPending}
          className="w-full py-4 rounded-2xl bg-blue-600 text-white font-semibold text-lg disabled:opacity-70 active:scale-[0.98] transition-transform"
        >
          {isPending
            ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Loading…</span>
            : 'View my rental'}
        </button>
      </div>
    )
  }

  // ── LOADING SPINNERS ────────────────────────────────────────────────────────
  if (view === 'borrowing' || view === 'returning') {
    return (
      <div className="flex flex-col min-h-dvh items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500">{view === 'borrowing' ? 'Confirming borrow…' : 'Processing return…'}</p>
      </div>
    )
  }

  // ── DEPOSIT OVERLAY ─────────────────────────────────────────────────────────
  if (view === 'deposit') {
    return (
      <div className="flex flex-col min-h-dvh px-6 pt-12 pb-8">
        <button onClick={() => setView('borrow')} className="text-gray-400 text-sm mb-8 text-left">
          ← Back
        </button>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <div className="text-5xl mb-2">☂</div>
          <p className="text-gray-500 text-sm">{station.name}</p>
          <div className="w-full bg-gray-50 rounded-2xl p-5 mt-2">
            <p className="text-3xl font-bold text-gray-900">¥99</p>
            <p className="text-gray-500 text-sm mt-1">Deposit — returned when you return the umbrella</p>
            <p className="text-gray-600 text-sm mt-3 font-medium">Usage: {PRICING_LABEL}</p>
            <p className="text-gray-400 text-xs mt-3">No real payment — this is a prototype demo</p>
          </div>
        </div>
        <button
          onClick={executeBorrow}
          disabled={actionLoading}
          className="w-full py-4 rounded-2xl bg-blue-600 text-white font-semibold text-lg active:scale-[0.98] transition-transform disabled:opacity-70"
        >
          {actionLoading
            ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing…</span>
            : 'Pay deposit & rent now'}
        </button>
      </div>
    )
  }

  // ── USAGE-FEE MOCK PAYMENT (return step 1) ──────────────────────────────────
  if (view === 'return-fee' && activeRental) {
    const mins = usageMinutes(activeRental.borrowed_at)
    return (
      <div className="flex flex-col min-h-dvh px-6 pt-12 pb-8">
        <button onClick={() => setView('borrow')} className="text-gray-400 text-sm mb-8 text-left">
          ← Back
        </button>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <div className="text-5xl mb-2">☂</div>
          <p className="text-gray-500 text-sm">Umbrella #{activeRental.umbrella_id.slice(-4).toUpperCase()}</p>
          <div className="w-full bg-gray-50 rounded-2xl p-5 mt-2">
            <p className="text-3xl font-bold text-gray-900">{formatYuan(feeCharged)}</p>
            <p className="text-gray-500 text-sm mt-1">Usage fee · {mins} min ({PRICING_LABEL})</p>
            <p className="text-gray-400 text-xs mt-3">No real payment — this is a prototype demo</p>
          </div>
        </div>
        <button
          onClick={() => setView('return-choice')}
          className="w-full py-4 rounded-2xl bg-blue-600 text-white font-semibold text-lg active:scale-[0.98] transition-transform"
        >
          Pay {formatYuan(feeCharged)}
        </button>
      </div>
    )
  }

  // ── DEPOSIT CHOICE (return step 2) ──────────────────────────────────────────
  if (view === 'return-choice' && activeRental) {
    return (
      <div className="flex flex-col min-h-dvh px-6 pt-12 pb-8">
        <button onClick={() => setView('borrow')} className="text-gray-400 text-sm mb-8 text-left">
          ← Back
        </button>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
            <span className="text-3xl">☂</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Returning here</h1>
          <p className="text-gray-500 text-sm">{station.name}</p>
          {feeCharged > 0 && (
            <p className="text-sm text-green-600 font-medium">Usage fee {formatYuan(feeCharged)} paid ✓</p>
          )}
          <p className="text-sm font-medium text-gray-600 mt-3">What about your ¥99 deposit?</p>
        </div>
        {error && <p className="mb-3 text-sm text-red-500 text-center">{error}</p>}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => returnUmbrella(true)}
            disabled={actionLoading}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-semibold text-base active:scale-[0.98] transition-transform disabled:opacity-70"
          >
            {actionLoading
              ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing…</span>
              : <><span>Keep ¥99 deposit on file</span><span className="block text-xs font-normal opacity-80 mt-0.5">Instant next borrow — no payment needed</span></>}
          </button>
          <button
            onClick={() => returnUmbrella(false)}
            disabled={actionLoading}
            className="w-full py-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold text-base active:scale-[0.98] transition-transform disabled:opacity-70"
          >
            {actionLoading ? '…' : 'Refund ¥99 deposit'}
          </button>
        </div>
      </div>
    )
  }

  // Shared sticky header for both borrow and return map views
  const stationHeader = (
    <div className="px-6 pt-1 pb-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Husan 护伞 — Umbrellas @ PKU</p>
        <h1 className="text-xl font-bold text-gray-900">{station.name}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{station.description}</p>
      </div>
      <img src="/logo.png?v=3" alt="Husan 护伞" className="w-11 h-11 rounded-xl flex-shrink-0" />
    </div>
  )

  // ── RETURN VIEW ─────────────────────────────────────────────────────────────
  if (hasActiveRental && activeRental) {
    const elapsed = Math.floor((Date.now() - new Date(activeRental.borrowed_at).getTime()) / 60000)
    const elapsedText = elapsed < 60 ? `${elapsed}m ago` : `${Math.floor(elapsed / 60)}h ${elapsed % 60}m ago`
    const umbrellaShort = activeRental.umbrella_id.slice(-4).toUpperCase()

    const otherStations = allStations.filter(s => s.id !== station.id)

    return (
      <MapSheetLayout
        stationId={station.id}
        otherStationIds={otherStations.map(s => s.id)}
        sheet={sheet}
        stickyHeader={stationHeader}
        footer={
          stationFull ? (
            <p className="text-center text-sm text-red-600 font-medium py-2">
              This station is full — return at another station below.
            </p>
          ) : (
            <button
              onClick={startReturn}
              className="w-full py-4 rounded-2xl bg-blue-600 text-white font-semibold text-lg active:scale-[0.98] transition-transform"
            >
              Return umbrella here
            </button>
          )
        }
      >
        <div className="px-6 pt-2 pb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
            <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider mb-2">Active rental</p>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">Umbrella #{umbrellaShort}</span>
              <span className="text-gray-400 text-sm ml-auto">{elapsedText}</span>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-200/70">
              <span className="text-sm text-gray-500">Usage so far</span>
              <UsageCost borrowedAt={activeRental.borrowed_at} className="ml-auto font-semibold text-gray-800" />
            </div>
            <p className="text-xs text-gray-400 mt-1">{PRICING_LABEL}</p>
          </div>

          {stationFull ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Station full</h2>
              <p className="text-gray-500 text-sm mb-4">
                No free docks at {station.name}. Return at a nearby station instead:
              </p>
              <ReturnStationsList stations={otherStations} />
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Return here?</h2>
              <p className="text-gray-500 text-sm mb-4">{station.name} · {station.description}</p>
              <p className="text-sm text-gray-500">
                {station.capacity - station.available} free dock{station.capacity - station.available !== 1 ? 's' : ''} available.
              </p>
            </>
          )}
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>
      </MapSheetLayout>
    )
  }

  // ── BORROW VIEW ─────────────────────────────────────────────────────────────
  return (
    <MapSheetLayout
      stationId={station.id}
      otherStationIds={allStations.filter(s => s.id !== station.id).map(s => s.id)}
      sheet={sheet}
      stickyHeader={stationHeader}
      footer={
        <button
          onClick={borrow}
          disabled={!hasUmbrellas || actionLoading}
          className="w-full py-4 rounded-2xl bg-blue-600 text-white font-semibold text-lg disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {actionLoading
            ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing…</span>
            : (!userId ? 'Log in to borrow' : 'Borrow umbrella')}
        </button>
      }
    >
      <div className="px-6 pt-2 pb-6">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium mb-6 ${
          hasUmbrellas ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
        }`}>
          <span className={`w-2 h-2 rounded-full ${hasUmbrellas ? 'bg-green-500' : 'bg-red-500'}`} />
          {hasUmbrellas ? `${station.available} umbrella${station.available !== 1 ? 's' : ''} available` : 'No umbrellas here'}
        </div>

        <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600 mb-2">
          <span className="font-medium text-gray-800">Pricing</span> · {PRICING_LABEL}
        </div>

        {depositOnFile && userId && (
          <div className="mt-6 bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-700">
            ✓ Deposit on file — borrow instantly with one tap
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {!hasUmbrellas && (
          <div className="mt-4">
            <p className="text-gray-500 text-sm mb-4">Try a nearby station:</p>
            {allStations.filter(s => s.id !== station.id && s.available > 0).map(s => (
              <Link
                key={s.id}
                href={`/station/${s.id}`}
                prefetch
                className="block w-full text-left px-4 py-3 rounded-xl border border-gray-200 mb-2 active:bg-gray-50"
              >
                <span className="font-medium text-gray-800">{s.name}</span>
                <span className="ml-2 text-xs text-green-600">{s.available} available</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MapSheetLayout>
  )
}

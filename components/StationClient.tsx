'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ColorPicker from './ColorPicker'
import MapSheetLayout from './MapSheetLayout'
import { COLORS } from '@/lib/colors'
import { useBottomSheet } from '@/hooks/useBottomSheet'
import type { Station, Umbrella, UmbrellaColor, RentalWithDetails } from '@/lib/types'

interface Props {
  station: Station
  umbrellas: Umbrella[]
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
  | 'returning'
  | 'return-success'

interface BorrowResult {
  rentalId: string
  color: UmbrellaColor
  umbrellaShort: string
}

interface ReturnResult {
  keptDeposit: boolean
}

export default function StationClient({
  station,
  umbrellas,
  userId,
  activeRental,
  depositOnFile,
  allStations,
}: Props) {
  const router = useRouter()
  const sheet = useBottomSheet()

  const available: Record<string, number> = {}
  for (const u of umbrellas) {
    if (u.status === 'available') {
      available[u.color] = (available[u.color] ?? 0) + 1
    }
  }

  const [selectedColor, setSelectedColor] = useState<UmbrellaColor | null>(null)
  const [view, setView]                   = useState<View>('borrow')
  const [borrowResult, setBorrowResult]   = useState<BorrowResult | null>(null)
  const [returnResult, setReturnResult]   = useState<ReturnResult | null>(null)
  const [error, setError]                 = useState('')

  const hasActiveRental = !!activeRental
  const hasUmbrellas    = station.available > 0

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
    await executeBorrow()
  }

  async function executeBorrow() {
    setView('borrowing')
    try {
      const res = await fetch('/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId: station.id, color: selectedColor }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to borrow')
      setBorrowResult(data)
      setView('borrow-success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setView('borrow')
    }
  }

  async function returnUmbrella(keepDeposit: boolean) {
    if (!activeRental) return
    setView('returning')
    setError('')
    try {
      const res = await fetch('/api/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentalId: activeRental.id, stationId: station.id, keepDeposit }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to return')
      setReturnResult({ keptDeposit: keepDeposit })
      setView('return-success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      router.refresh()
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
        {returnResult.keptDeposit ? (
          <p className="text-gray-500 mb-8">¥30 deposit kept on file — next borrow is instant.</p>
        ) : (
          <p className="text-gray-500 mb-8">¥30 deposit refunded. Thank you!</p>
        )}
        <p className="text-sm text-gray-400">Thank you for using ShadeShare</p>
        <button
          onClick={() => { window.location.href = `/station/${station.id}` }}
          className="mt-8 text-blue-600 font-medium text-sm"
        >
          Borrow again →
        </button>
      </div>
    )
  }

  // ── BORROW SUCCESS ──────────────────────────────────────────────────────────
  if (view === 'borrow-success' && borrowResult) {
    const colorInfo = COLORS[borrowResult.color] ?? COLORS.black
    return (
      <div className="flex flex-col min-h-dvh px-6 pt-20 pb-10 items-center text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <span className="text-4xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Umbrella borrowed!</h1>
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-4 h-4 rounded-full ${colorInfo.bg}`} />
          <span className="font-semibold text-gray-700">
            #{borrowResult.umbrellaShort} · {colorInfo.label}
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-2">{station.name}</p>
        <p className="text-gray-400 text-sm mb-8">Return to any station within 24 hours</p>
        <button
          onClick={() => router.push(`/rental/${borrowResult.rentalId}`)}
          className="w-full py-4 rounded-2xl bg-blue-600 text-white font-semibold text-lg"
        >
          View my rental
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
    const colorInfo = selectedColor ? COLORS[selectedColor] : COLORS.black
    return (
      <div className="flex flex-col min-h-dvh px-6 pt-12 pb-8">
        <button onClick={() => setView('borrow')} className="text-gray-400 text-sm mb-8 text-left">
          ← Back
        </button>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <div className="text-5xl mb-2">☂</div>
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full ${colorInfo.bg}`} />
            <span className="font-semibold text-gray-700">{colorInfo.label}</span>
          </div>
          <p className="text-gray-500 text-sm">{station.name}</p>
          <div className="w-full bg-gray-50 rounded-2xl p-5 mt-2">
            <p className="text-3xl font-bold text-gray-900">¥30</p>
            <p className="text-gray-500 text-sm mt-1">Deposit — returned when you return the umbrella</p>
            <p className="text-gray-400 text-xs mt-3">No real payment — this is a prototype demo</p>
          </div>
        </div>
        <button
          onClick={executeBorrow}
          className="w-full py-4 rounded-2xl bg-blue-600 text-white font-semibold text-lg active:scale-[0.98] transition-transform"
        >
          Pay deposit & rent now
        </button>
      </div>
    )
  }

  // Shared sticky header for both borrow and return map views
  const stationHeader = (
    <div className="px-6 pt-1 pb-4">
      <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">ShadeShare — Umbrellas @ PKU</p>
      <h1 className="text-xl font-bold text-gray-900">{station.name}</h1>
      <p className="text-sm text-gray-500 mt-0.5">{station.description}</p>
    </div>
  )

  // ── RETURN VIEW ─────────────────────────────────────────────────────────────
  if (hasActiveRental && activeRental) {
    const elapsed = Math.floor((Date.now() - new Date(activeRental.borrowed_at).getTime()) / 60000)
    const elapsedText = elapsed < 60 ? `${elapsed}m ago` : `${Math.floor(elapsed / 60)}h ${elapsed % 60}m ago`
    const colorInfo = COLORS[activeRental.umbrella.color] ?? COLORS.black
    const umbrellaShort = activeRental.umbrella_id.slice(-4).toUpperCase()

    return (
      <MapSheetLayout
        stationId={station.id}
        sheet={sheet}
        stickyHeader={stationHeader}
        footer={
          <div className="flex flex-col gap-3">
            <button
              onClick={() => returnUmbrella(true)}
              className="w-full py-4 rounded-2xl bg-blue-600 text-white font-semibold text-base active:scale-[0.98] transition-transform"
            >
              Return & keep deposit
              <span className="block text-xs font-normal opacity-80 mt-0.5">Instant next borrow — no payment needed</span>
            </button>
            <button
              onClick={() => returnUmbrella(false)}
              className="w-full py-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold text-base active:scale-[0.98] transition-transform"
            >
              Return & refund ¥30
            </button>
          </div>
        }
      >
        <div className="px-6 pt-2 pb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
            <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider mb-2">Active rental</p>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${colorInfo.bg}`} />
              <span className="font-semibold text-gray-800">#{umbrellaShort} · {colorInfo.label}</span>
              <span className="text-gray-400 text-sm ml-auto">{elapsedText}</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Return here?</h2>
          <p className="text-gray-500 text-sm mb-4">{station.name} · {station.description}</p>
          <p className="text-sm font-medium text-gray-600">What would you like to do with your ¥30 deposit?</p>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>
      </MapSheetLayout>
    )
  }

  // ── BORROW VIEW ─────────────────────────────────────────────────────────────
  return (
    <MapSheetLayout
      stationId={station.id}
      sheet={sheet}
      stickyHeader={stationHeader}
      footer={
        <button
          onClick={borrow}
          disabled={!hasUmbrellas}
          className="w-full py-4 rounded-2xl bg-blue-600 text-white font-semibold text-lg disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {!userId ? 'Log in to borrow' : 'Borrow umbrella'}
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

        {hasUmbrellas && (
          <>
            <p className="text-sm font-medium text-gray-600 mb-4">Choose a color</p>
            <ColorPicker available={available} selected={selectedColor} onSelect={setSelectedColor} />
            <p className="text-center text-sm text-gray-400 mt-3">
              {selectedColor ? `${COLORS[selectedColor].label} selected` : 'Choose for me'}
            </p>
          </>
        )}

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
              <button
                key={s.id}
                onClick={() => router.push(`/station/${s.id}`)}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 mb-2 active:bg-gray-50"
              >
                <span className="font-medium text-gray-800">{s.name}</span>
                <span className="ml-2 text-xs text-green-600">{s.available} available</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </MapSheetLayout>
  )
}

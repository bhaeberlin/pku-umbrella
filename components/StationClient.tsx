'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import ColorPicker from './ColorPicker'
import { COLORS } from '@/lib/colors'
import { stationMapUrl } from '@/lib/stationCoords'
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

// ── Layout constants ──────────────────────────────────────────────────────────
const SNAP_HIGH = 160   // px from top: collapsed (small map strip)
const IMAGE_W   = 430   // Mapbox image CSS width — matches viewport, no horizontal overflow
const IMAGE_H   = 900   // Mapbox image CSS height — tall enough for any phone
const HANDLE_H  = 28    // handle pill area (pt-3 + pill + pb-2)
const PAN_X_MAX = 40    // horizontal pan limit — image overhangs 40px each side
const PAN_Y_MAX = 40    // max vertical pan

const EASING     = 'cubic-bezier(0.32,0.72,0,1)'
const TRANSITION = `280ms ${EASING}`

function ChevronDownIcon() {
  return (
    <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

function ChevronUpIcon() {
  return (
    <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  )
}

// ── Bottom-sheet hook ─────────────────────────────────────────────────────────
function useBottomSheet() {
  const [sheetY,   setSheetY]   = useState(SNAP_HIGH)
  const [snapLow,  setSnapLow]  = useState(460)     // updated on mount by MapSheetLayout
  const [dragging, setDragging] = useState(false)
  const [mapPanX,  setMapPanX]  = useState(0)
  const [mapPanY,  setMapPanY]  = useState(0)

  const dragStartY       = useRef(0)
  const dragStartSheet   = useRef(0)
  const isDraggingSheet  = useRef(false)
  const scrollRef        = useRef<HTMLDivElement>(null)
  const mapPanStartX     = useRef(0)
  const mapPanStartY     = useRef(0)
  const mapPanStartPX    = useRef(0)
  const mapPanStartPY    = useRef(0)
  const isScrollLocked   = useRef(false)

  // Non-passive touchmove on scroll container → preventDefault when sheet-dragging,
  // which stops Safari from triggering pull-to-refresh mid-gesture.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onMove = (e: TouchEvent) => {
      if (isDraggingSheet.current) e.preventDefault()
    }
    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, [])

  const isExpanded = sheetY >= snapLow

  // Reset pan when sheet collapses so it's clean next time
  useEffect(() => {
    if (!isExpanded) {
      setMapPanX(0)
      setMapPanY(0)
    }
  }, [isExpanded])

  function snap(y: number) {
    const mid = (SNAP_HIGH + snapLow) / 2
    setSheetY(y < mid ? SNAP_HIGH : snapLow)
  }

  // ── Handle-area drag ────────────────────────────────────────────────────────
  const handleHandlers = {
    onTouchStart(e: React.TouchEvent) {
      setDragging(true)
      dragStartY.current     = e.touches[0].clientY
      dragStartSheet.current = sheetY
    },
    onTouchMove(e: React.TouchEvent) {
      const delta = e.touches[0].clientY - dragStartY.current
      setSheetY(Math.max(SNAP_HIGH, Math.min(snapLow, dragStartSheet.current + delta)))
    },
    onTouchEnd() {
      setDragging(false)
      snap(sheetY)
    },
  }

  // ── Scrollable-content drag (scroll-aware) ──────────────────────────────────
  const contentHandlers = {
    onTouchStart(e: React.TouchEvent) {
      dragStartY.current      = e.touches[0].clientY
      dragStartSheet.current  = sheetY
      isDraggingSheet.current = false
      isScrollLocked.current  = false
    },
    onTouchMove(e: React.TouchEvent) {
      const delta     = e.touches[0].clientY - dragStartY.current
      const scrollTop = scrollRef.current?.scrollTop ?? 0
      if (!isDraggingSheet.current && !isScrollLocked.current) {
        if (delta > 6 && scrollTop === 0) {
          isDraggingSheet.current = true
          setDragging(true)
        } else if (delta < -6) {
          isScrollLocked.current = true
        }
      }
      if (isDraggingSheet.current) {
        setSheetY(Math.max(SNAP_HIGH, Math.min(snapLow, dragStartSheet.current + delta)))
      }
    },
    onTouchEnd() {
      if (isDraggingSheet.current) {
        snap(sheetY)
        isDraggingSheet.current = false
        setDragging(false)
      }
    },
  }

  // ── Map pan (only active when expanded) ─────────────────────────────────────
  const mapPanHandlers = isExpanded ? {
    onTouchStart(e: React.TouchEvent) {
      mapPanStartX.current  = e.touches[0].clientX
      mapPanStartY.current  = e.touches[0].clientY
      mapPanStartPX.current = mapPanX
      mapPanStartPY.current = mapPanY
    },
    onTouchMove(e: React.TouchEvent) {
      const dx = e.touches[0].clientX - mapPanStartX.current
      const dy = e.touches[0].clientY - mapPanStartY.current
      setMapPanX(Math.max(-PAN_X_MAX, Math.min(PAN_X_MAX, mapPanStartPX.current + dx)))
      setMapPanY(Math.max(-PAN_Y_MAX, Math.min(PAN_Y_MAX, mapPanStartPY.current + dy)))
    },
    onTouchEnd() {},
  } : {}

  function toggleSnap() {
    setSheetY(prev => prev <= SNAP_HIGH ? snapLow : SNAP_HIGH)
  }

  const progress   = Math.max(0, Math.min(1, (sheetY - SNAP_HIGH) / Math.max(1, snapLow - SNAP_HIGH)))
  const imageScale = 1.12 - 0.12 * progress   // 1.12 (collapsed) → 1.0 (expanded), never < 1
  const imageTop   = sheetY / 2 - IMAGE_H / 2  // keeps pin centered in visible strip

  return {
    sheetY, snapLow, setSnapLow, dragging,
    imageTop, imageScale, mapPanX, mapPanY,
    isExpanded, toggleSnap,
    handleHandlers, contentHandlers, mapPanHandlers, scrollRef,
  }
}

// ── Map + bottom sheet layout ─────────────────────────────────────────────────
function MapSheetLayout({
  stationId, sheet, stickyHeader, children, footer,
}: {
  stationId: string
  sheet: ReturnType<typeof useBottomSheet>
  stickyHeader: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  const mapUrl = stationMapUrl(stationId)
  const {
    sheetY, dragging, imageTop, imageScale, mapPanX, mapPanY,
    isExpanded, toggleSnap, handleHandlers, contentHandlers, mapPanHandlers, scrollRef,
    setSnapLow,
  } = sheet

  const tr = dragging ? 'none' : TRANSITION
  const stickyHeaderRef = useRef<HTMLDivElement>(null)

  // Measure header height → set dynamic SNAP_LOW so only header stays visible
  useLayoutEffect(() => {
    if (!stickyHeaderRef.current) return
    const headerH = stickyHeaderRef.current.offsetHeight
    setSnapLow(window.innerHeight - HANDLE_H - headerH - 8)
  }, [setSnapLow])

  return (
    <div className="relative h-dvh overflow-hidden bg-gray-200">

      {/* Map image — centered horizontally (overhangs sides), pin-centered vertically */}
      {mapUrl && (
        <img
          src={mapUrl}
          alt="" aria-hidden="true"
          draggable={false}
          style={{
            position: 'absolute',
            top: `${imageTop}px`,
            left: '-40px',
            width: 'calc(100% + 80px)',
            height: `${IMAGE_H}px`,
            pointerEvents: 'none',
            userSelect: 'none',
            transform: `translate(${mapPanX}px, ${mapPanY}px) scale(${imageScale.toFixed(4)})`,
            transformOrigin: '50% 50%',
            transition: dragging ? 'none' : `top ${TRANSITION}, transform ${TRANSITION}`,
          }}
        />
      )}

      {/* Map touch area — pan when expanded; toggle button always visible */}
      <div
        className={isExpanded ? 'cursor-grab active:cursor-grabbing' : ''}
        style={{
          position: 'absolute', inset: '0 0 auto 0',
          height: `${sheetY}px`,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
          paddingBottom: '12px', paddingRight: '16px',
          transition: dragging ? 'none' : `height ${TRANSITION}`,
        }}
        {...mapPanHandlers}
      >
        <button
          onClick={toggleSnap}
          onTouchStart={e => e.stopPropagation()}
          className="w-9 h-9 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center shadow active:scale-95 transition-transform"
          style={{ touchAction: 'none' }}
          aria-label={isExpanded ? 'Collapse map' : 'Expand map'}
        >
          {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>
      </div>

      {/* Bottom sheet */}
      <div
        className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl flex flex-col"
        style={{ top: `${sheetY}px`, transition: tr ? `top ${tr}` : 'none' }}
      >
        {/* Drag handle pill */}
        <div
          className="flex-shrink-0 pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
          {...handleHandlers}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />
        </div>

        {/* Sticky header — always visible, measured to compute SNAP_LOW */}
        <div
          ref={stickyHeaderRef}
          className="flex-shrink-0 select-none"
          {...handleHandlers}
        >
          {stickyHeader}
        </div>

        {/* Scrollable body — whole-content drag enabled */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto min-h-0"
          style={{ overscrollBehavior: 'contain' }}
          {...contentHandlers}
        >
          {children}
        </div>

        {/* Footer — action buttons, never a drag target */}
        {footer && (
          <div className="flex-shrink-0 px-6 pb-8 pt-4 bg-white border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
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
        <p className="text-sm text-gray-400">Thank you for using PKU Umbrella Sharing</p>
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
      <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">PKU Umbrella</p>
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

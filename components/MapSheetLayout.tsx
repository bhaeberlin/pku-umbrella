'use client'

import { useRef, useLayoutEffect } from 'react'
import { stationMapUrl } from '@/lib/stationCoords'
import { useBottomSheet, IMAGE_W, IMAGE_H, HANDLE_H, TRANSITION } from '@/hooks/useBottomSheet'

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

export default function MapSheetLayout({
  stationId, otherStationIds = [], sheet, stickyHeader, children, footer,
}: {
  stationId: string
  otherStationIds?: string[]
  sheet: ReturnType<typeof useBottomSheet>
  stickyHeader: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  const mapUrl = stationMapUrl(stationId, otherStationIds)
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

      {/* Map image — 600px wide centered in viewport (~105px overhang each side on 390px phone) */}
      {mapUrl && (
        <img
          src={mapUrl}
          alt="" aria-hidden="true"
          draggable={false}
          style={{
            position: 'absolute',
            top: `${imageTop}px`,
            left: `calc(50% - ${IMAGE_W / 2}px)`,
            width: `${IMAGE_W}px`,
            maxWidth: 'none',
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

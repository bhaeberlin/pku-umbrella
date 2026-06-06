import { useState, useRef, useEffect } from 'react'

// ── Layout constants ──────────────────────────────────────────────────────────
export const SNAP_HIGH  = 160   // px from top: collapsed (small map strip)
export const IMAGE_W    = 600   // Mapbox image CSS width — wider than any phone, centered for safety margin
export const IMAGE_H    = 1000  // Mapbox image CSS height — tall enough for any phone
export const HANDLE_H   = 28    // handle pill area (pt-3 + pill + pb-2)
export const PAN_X_MAX  = 80    // horizontal pan — image overhangs ~105px each side on 390px phone
export const PAN_Y_MAX  = 40    // max vertical pan

export const EASING     = 'cubic-bezier(0.32,0.72,0,1)'
export const TRANSITION = `280ms ${EASING}`

export function useBottomSheet() {
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

  // ── rAF-coalesced drag updates ──────────────────────────────────────────────
  // Touch events can fire faster than the display refreshes (e.g. 120Hz
  // ProMotion). Batch the per-touch state writes so at most one render happens
  // per frame instead of one per touch event.
  const rafId          = useRef<number | null>(null)
  const pendingSheetY  = useRef<number | null>(null)
  const pendingPanX    = useRef<number | null>(null)
  const pendingPanY    = useRef<number | null>(null)
  const sheetYRef      = useRef(SNAP_HIGH)   // always holds the latest target

  const flush = () => {
    rafId.current = null
    if (pendingSheetY.current !== null) { setSheetY(pendingSheetY.current); pendingSheetY.current = null }
    if (pendingPanX.current   !== null) { setMapPanX(pendingPanX.current);  pendingPanX.current   = null }
    if (pendingPanY.current   !== null) { setMapPanY(pendingPanY.current);  pendingPanY.current   = null }
  }
  const schedule = () => {
    if (rafId.current === null) rafId.current = requestAnimationFrame(flush)
  }
  const cancelFrame = () => {
    if (rafId.current !== null) { cancelAnimationFrame(rafId.current); rafId.current = null }
    pendingSheetY.current = null
    pendingPanX.current   = null
    pendingPanY.current   = null
  }
  const queueSheetY = (y: number) => { pendingSheetY.current = y; sheetYRef.current = y; schedule() }
  const queuePan    = (x: number, y: number) => { pendingPanX.current = x; pendingPanY.current = y; schedule() }

  // Keep sheetYRef in sync after any non-drag state change (snap, toggle, reset)
  useEffect(() => { sheetYRef.current = sheetY }, [sheetY])
  // Cancel any in-flight frame on unmount
  useEffect(() => cancelFrame, [])

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
      queueSheetY(Math.max(SNAP_HIGH, Math.min(snapLow, dragStartSheet.current + delta)))
    },
    onTouchEnd() {
      cancelFrame()
      setDragging(false)
      snap(sheetYRef.current)
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
        queueSheetY(Math.max(SNAP_HIGH, Math.min(snapLow, dragStartSheet.current + delta)))
      }
    },
    onTouchEnd() {
      if (isDraggingSheet.current) {
        cancelFrame()
        snap(sheetYRef.current)
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
      queuePan(
        Math.max(-PAN_X_MAX, Math.min(PAN_X_MAX, mapPanStartPX.current + dx)),
        Math.max(-PAN_Y_MAX, Math.min(PAN_Y_MAX, mapPanStartPY.current + dy)),
      )
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

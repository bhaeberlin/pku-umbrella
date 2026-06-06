'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import jsQR from 'jsqr'
import { STATION_COORDS } from '@/lib/stationCoords'

// Extract a known station id from a scanned QR payload.
// Accepts a full URL (…/station/PKU-…), a bare path, or a bare id.
function parseStationId(text: string): string | null {
  let candidate = text.trim()
  const fromPath = candidate.match(/\/station\/([\w-]+)/i)
  if (fromPath) {
    candidate = fromPath[1]
  } else {
    try {
      const u = new URL(candidate)
      const m = u.pathname.match(/\/station\/([\w-]+)/i)
      if (m) candidate = m[1]
    } catch {
      // not a URL — treat the whole string as a candidate id
    }
  }
  candidate = candidate.toUpperCase()
  return candidate in STATION_COORDS ? candidate : null
}

export default function QrScanner({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)   // bump to retry after an error

  useEffect(() => {
    setError(null)
    let raf = 0
    let stream: MediaStream | null = null
    let handled = false
    const video = videoRef.current
    const canvas = canvasRef.current

    const cleanup = () => {
      if (raf) cancelAnimationFrame(raf)
      stream?.getTracks().forEach(t => t.stop())
      if (video) video.srcObject = null
    }

    const tick = () => {
      if (handled || !video || !canvas) return
      if (video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth) {
        // Downscale to ~640px max for cheaper decoding; plenty for QR.
        const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight))
        const w = Math.round(video.videoWidth * scale)
        const h = Math.round(video.videoHeight * scale)
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h)
          const { data } = ctx.getImageData(0, 0, w, h)
          const code = jsQR(data, w, h, { inversionAttempts: 'dontInvert' })
          if (code?.data) {
            const id = parseStationId(code.data)
            if (id) {
              handled = true
              cleanup()
              router.push(`/station/${id}`)
              return
            }
            setHint("That code isn't a PKU station — keep pointing at a station QR.")
          }
        }
      }
      raf = requestAnimationFrame(tick)
    }

    ;(async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Camera is not supported on this browser.')
          return
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (!video) { stream.getTracks().forEach(t => t.stop()); return }
        video.srcObject = stream
        await video.play()
        raf = requestAnimationFrame(tick)
      } catch (e) {
        const name = (e as DOMException)?.name
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setError('Camera permission denied. Enable camera access in your browser settings, then try again.')
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          setError('No camera found on this device.')
        } else {
          setError('Could not start the camera. Please try again.')
        }
      }
    })()

    return cleanup
  }, [attempt, router])

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between p-4 pt-6">
        <span className="text-white/90 text-sm font-medium drop-shadow">Scan a station QR</span>
        <button
          onClick={onClose}
          aria-label="Close scanner"
          className="w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center active:scale-95 transition-transform"
        >
          ✕
        </button>
      </div>

      {/* Scan reticle */}
      {!error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-60 h-60 rounded-3xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
        </div>
      )}
      {!error && (
        <p className="absolute bottom-16 inset-x-0 text-center text-white/90 text-sm px-8 drop-shadow">
          {hint ?? 'Point your camera at the QR code on a station'}
        </p>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center px-8 gap-5">
          <p className="text-white text-base leading-relaxed">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => { setHint(null); setAttempt(a => a + 1) }}
              className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-semibold active:scale-95 transition-transform"
            >
              Try again
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-white/40 text-white font-semibold active:scale-95 transition-transform"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

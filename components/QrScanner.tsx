'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import jsQR from 'jsqr'
import { STATION_COORDS } from '@/lib/stationCoords'
import { useDict } from './I18nProvider'

// Extract a known station id from a scanned QR payload.
// Only this program's own QR codes count: the payload must be a URL on the
// app's own origin pointing at /station/<id>, with <id> a known station.
// Anything else (other domains, random QR codes) is ignored.
function parseStationId(text: string): string | null {
  let url: URL
  try {
    // Resolve against our origin so relative paths ("/station/…") are accepted,
    // and absolute URLs are checked for an exact origin match below.
    url = new URL(text.trim(), window.location.origin)
  } catch {
    return null
  }
  if (url.origin !== window.location.origin) return null

  const m = url.pathname.match(/^\/station\/([\w-]+)\/?$/i)
  if (!m) return null

  const id = m[1].toUpperCase()
  return id in STATION_COORDS ? id : null
}

export default function QrScanner({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const d = useDict()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Stored as stable codes (not translated text) so the language can switch
  // without re-running the camera effect — translation happens at render.
  const [error, setError] = useState<'notSupported' | 'denied' | 'noCamera' | 'failed' | null>(null)
  const [notStation, setNotStation] = useState(false)
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
            setNotStation(true)
          }
        }
      }
      raf = requestAnimationFrame(tick)
    }

    ;(async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('notSupported')
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
          setError('denied')
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          setError('noCamera')
        } else {
          setError('failed')
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
        <span className="text-white/90 text-sm font-medium drop-shadow">{d.qr.scanTitle}</span>
        <button
          onClick={onClose}
          aria-label={d.qr.closeAria}
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
          {notStation ? d.qr.notStation : d.qr.hint}
        </p>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center px-8 gap-5">
          <p className="text-white text-base leading-relaxed">{error && d.qr[error]}</p>
          <div className="flex gap-3">
            <button
              onClick={() => { setNotStation(false); setAttempt(a => a + 1) }}
              className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-semibold active:scale-95 transition-transform"
            >
              {d.qr.tryAgain}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-white/40 text-white font-semibold active:scale-95 transition-transform"
            >
              {d.qr.close}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

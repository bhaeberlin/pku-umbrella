'use client'

import { useState } from 'react'
import QrScanner from './QrScanner'
import { useDict } from './I18nProvider'

function CameraIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}

export default function ScanStationButton({
  className,
  label,
}: {
  className?: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const d = useDict()
  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        <CameraIcon />
        {label ?? d.home.scanToRent}
      </button>
      {open && <QrScanner onClose={() => setOpen(false)} />}
    </>
  )
}

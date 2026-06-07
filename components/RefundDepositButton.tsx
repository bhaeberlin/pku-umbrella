'use client'

import { useState } from 'react'
import { useDict } from './I18nProvider'

export default function RefundDepositButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const d = useDict()

  async function handleRefund() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/refund-deposit', { method: 'POST' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? d.common.somethingWrong)
      setLoading(false)
      return
    }
    window.location.reload()
  }

  return (
    <div className="mb-8">
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">{d.deposit.onFile}</p>
        <p className="font-semibold text-gray-800 mb-1">{d.deposit.keptOnFile}</p>
        <p className="text-sm text-gray-500 mb-4">{d.deposit.reclaimAnytime}</p>
        <button
          onClick={handleRefund}
          disabled={loading}
          className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {loading
            ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />{d.common.processing}</span>
            : d.deposit.refund}
        </button>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  )
}

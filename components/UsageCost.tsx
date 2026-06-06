'use client'

import { useEffect, useState } from 'react'
import { usageFee, formatYuan } from '@/lib/pricing'

// Live-ticking accrued usage cost for an active rental.
export default function UsageCost({
  borrowedAt,
  className,
}: {
  borrowedAt: string
  className?: string
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  return <span className={className}>{formatYuan(usageFee(borrowedAt, now))}</span>
}

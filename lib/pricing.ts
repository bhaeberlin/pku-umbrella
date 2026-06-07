// Umbrella usage pricing: the first FREE_MINUTES are free, then RATE_PER_MIN per
// started minute. The ¥99 deposit is separate and unaffected by this.

// The human-readable pricing label lives in the i18n dictionaries
// (`d.pricing.label`) so it translates; the numbers below are language-neutral.
export const FREE_MINUTES = 10
export const RATE_PER_MIN = 0.2

/** Whole minutes used, rounding partial minutes up. */
export function usageMinutes(borrowedAt: string, now: number = Date.now()): number {
  const ms = now - new Date(borrowedAt).getTime()
  return Math.max(0, Math.ceil(ms / 60000))
}

/** Accrued usage fee in yuan. 0 for the first FREE_MINUTES. */
export function usageFee(borrowedAt: string, now: number = Date.now()): number {
  const billable = Math.max(0, usageMinutes(borrowedAt, now) - FREE_MINUTES)
  return Math.round(billable * RATE_PER_MIN * 100) / 100
}

export function formatYuan(n: number): string {
  return `¥${n.toFixed(2)}`
}

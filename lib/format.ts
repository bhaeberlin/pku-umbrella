// Small display helpers.

/** Mask the middle of a phone number: +8618514242801 → +86 185****2801 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return 'Unknown number'
  const digits = phone.replace('+86', '').replace(/\D/g, '')
  if (digits.length !== 11) return phone
  return `+86 ${digits.slice(0, 3)}****${digits.slice(7)}`
}

/** Compact duration from minutes: 8 → "8 min", 95 → "1h 35m". */
export function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/** Short calendar date: "7 Jun 2026". */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

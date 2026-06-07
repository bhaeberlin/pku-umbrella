// Small display helpers. Locale-aware where text/format differs by language.

import { intlLocale, type Lang } from './i18n/config'
import { getDict } from './i18n/dictionaries'

/** Mask the middle of a phone number: +8618514242801 → +86 185****2801 */
export function maskPhone(phone: string | null | undefined, unknownLabel = 'Unknown number'): string {
  if (!phone) return unknownLabel
  const digits = phone.replace('+86', '').replace(/\D/g, '')
  if (digits.length !== 11) return phone
  return `+86 ${digits.slice(0, 3)}****${digits.slice(7)}`
}

/** Compact duration from minutes: 8 → "8 min" / "8 分钟", 95 → "1h 35m" / "1 小时 35 分". */
export function formatDuration(mins: number, lang: Lang): string {
  const d = getDict(lang).duration
  if (mins < 60) return d.min(mins)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? d.hm(h, m) : d.h(h)
}

/** Short calendar date in the active locale: "7 Jun 2026" / "2026年6月7日". */
export function formatDate(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleDateString(intlLocale(lang), {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// Language config for the English ⇄ Chinese switcher.
// Kept dependency-free and importable from both server and client code.

export type Lang = 'en' | 'zh'

export const LANGS: Lang[] = ['en', 'zh']
export const DEFAULT_LANG: Lang = 'en'
export const LANG_COOKIE = 'lang'
// 1 year — remember the user's choice across visits.
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/** Value for the <html lang> attribute. */
export function htmlLang(lang: Lang): string {
  return lang === 'zh' ? 'zh-CN' : 'en'
}

/** BCP-47 locale for Intl date/number formatting. */
export function intlLocale(lang: Lang): string {
  return lang === 'zh' ? 'zh-CN' : 'en-GB'
}

export function isLang(v: unknown): v is Lang {
  return v === 'en' || v === 'zh'
}

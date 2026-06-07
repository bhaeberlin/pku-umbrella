// Server-only language helpers. Reads the `lang` cookie so server components
// render in the user's chosen language. Client components use the I18nProvider
// hooks instead (they can't read cookies during render).

import { cookies } from 'next/headers'
import { DEFAULT_LANG, LANG_COOKIE, isLang, type Lang } from './config'
import { getDict, type Dict } from './dictionaries'

export async function getLang(): Promise<Lang> {
  const store = await cookies()
  const value = store.get(LANG_COOKIE)?.value
  return isLang(value) ? value : DEFAULT_LANG
}

/** `{ lang, d }` for a server component: the active language + its dictionary. */
export async function getDictServer(): Promise<{ lang: Lang; d: Dict }> {
  const lang = await getLang()
  return { lang, d: getDict(lang) }
}

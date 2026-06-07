'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LANG_COOKIE, LANG_COOKIE_MAX_AGE, type Lang } from '@/lib/i18n/config'
import { getDict, type Dict } from '@/lib/i18n/dictionaries'

interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
}

const I18nContext = createContext<I18nValue | null>(null)

export default function I18nProvider({
  initialLang,
  children,
}: {
  initialLang: Lang
  children: React.ReactNode
}) {
  const router = useRouter()
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = useCallback(
    (next: Lang) => {
      if (next === lang) return
      // Persist the choice; server components read this cookie on the refresh.
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; samesite=lax`
      // Flip client components instantly…
      setLangState(next)
      // …and re-render server components from the new cookie (fast soft refresh).
      router.refresh()
    },
    [lang, router],
  )

  const value = useMemo<I18nValue>(() => ({ lang, setLang }), [lang, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

/** Current language in a client component. */
export function useLang(): Lang {
  return useI18n().lang
}

/** `setLang` for the language toggle. */
export function useSetLang(): (lang: Lang) => void {
  return useI18n().setLang
}

/** The active dictionary in a client component. */
export function useDict(): Dict {
  return getDict(useI18n().lang)
}

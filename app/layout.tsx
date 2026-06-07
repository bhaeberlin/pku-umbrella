import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import I18nProvider from '@/components/I18nProvider'
import LanguageToggle from '@/components/LanguageToggle'
import { getLang } from '@/lib/i18n/server'
import { htmlLang } from '@/lib/i18n/config'

export const metadata: Metadata = {
  title: 'Husan 护伞 · Umbrellas @ PKU',
  description: 'Borrow and return umbrellas across the PKU campus with Husan 护伞',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang()
  return (
    <html lang={htmlLang(lang)} className="h-full">
      <body className="min-h-dvh flex flex-col bg-white text-gray-900">
        <I18nProvider initialLang={lang}>
          {children}
          <LanguageToggle />
          <BottomNav />
        </I18nProvider>
      </body>
    </html>
  )
}

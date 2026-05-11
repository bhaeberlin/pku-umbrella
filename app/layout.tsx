import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Líng Sǎn 灵伞 · Umbrellas @ PKU',
  description: 'Borrow and return umbrellas across the PKU campus with Líng Sǎn 灵伞',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-dvh flex flex-col bg-white text-gray-900">
        {children}
      </body>
    </html>
  )
}

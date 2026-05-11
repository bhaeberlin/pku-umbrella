import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PKU 雨伞共享 · Umbrella Share',
  description: 'Borrow and return umbrellas across the PKU campus',
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

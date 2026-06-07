import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-dvh flex flex-col bg-white text-gray-900">
        {children}
        <BottomNav />
      </body>
    </html>
  )
}

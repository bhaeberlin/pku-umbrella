'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDict } from './I18nProvider'

function UmbrellaIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v2" />
      <path d="M3 12a9 9 0 0 1 18 0Z" />
      <path d="M12 12v7a2 2 0 0 0 4 0" />
    </svg>
  )
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  )
}

export default function BottomNav() {
  const pathname = usePathname()
  const d = useDict()

  // Immersive routes own the whole viewport — no bar there.
  if (pathname.startsWith('/station/') || pathname.startsWith('/login')) return null

  const rentActive = !pathname.startsWith('/profile')
  const profileActive = pathname.startsWith('/profile')

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 bg-white/95 backdrop-blur border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
      <div className="flex">
        <Tab href="/" label={d.nav.rent} active={rentActive} icon={<UmbrellaIcon active={rentActive} />} />
        <Tab href="/profile" label={d.nav.profile} active={profileActive} icon={<UserIcon active={profileActive} />} />
      </div>
    </nav>
  )
}

function Tab({ href, label, active, icon }: { href: string; label: string; active: boolean; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 ${
        active ? 'text-blue-600' : 'text-gray-400'
      } active:scale-95 transition-transform`}
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </Link>
  )
}

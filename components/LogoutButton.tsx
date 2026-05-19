'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 py-2 disabled:opacity-60 transition-opacity"
    >
      {loading && <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />}
      {loading ? 'Logging out…' : 'Log out'}
    </button>
  )
}

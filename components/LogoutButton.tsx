'use client'

import { createBrowserClient } from '@supabase/ssr'

export default function LogoutButton() {
  async function handleLogout() {
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
      className="w-full text-center text-xs text-gray-400 py-2 active:text-gray-600 transition-colors"
    >
      Log out
    </button>
  )
}

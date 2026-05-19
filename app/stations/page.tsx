import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function StationsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: stations } = await supabase
    .from('stations')
    .select('*')
    .order('name')

  return (
    <div className="flex flex-col min-h-dvh">

      {/* Header */}
      <div className="px-6 pt-12 pb-5 border-b border-gray-100">
        <Link href="/" className="text-sm text-gray-400 mb-3 block active:opacity-60">← Back</Link>
        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Líng Sǎn 灵伞</p>
        <h1 className="text-xl font-bold text-gray-900">All stations</h1>
      </div>

      <div className="flex-1 px-6 pt-6 pb-10">
        {(stations ?? []).length === 0 ? (
          <p className="text-gray-400 text-sm text-center mt-12">No stations found.</p>
        ) : (
          <div className="space-y-2">
            {(stations ?? []).map(s => (
              <Link
                key={s.id}
                href={`/station/${s.id}`}
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-gray-200 active:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 pr-3">
                  <p className="font-medium text-gray-800 text-sm">{s.name}</p>
                  {s.description && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{s.description}</p>
                  )}
                </div>
                <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  s.available > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {s.available > 0 ? `${s.available} free` : 'Empty'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import Link from 'next/link'
import { getDictServer } from '@/lib/i18n/server'

export default async function HelpPage() {
  const { d } = await getDictServer()
  return (
    <div className="flex flex-col min-h-dvh pb-28">
      <div className="px-6 pt-12 pb-5 border-b border-gray-100">
        <Link href="/profile" className="text-sm text-gray-400 mb-3 block active:opacity-60">{d.common.backToProfile}</Link>
        <h1 className="text-xl font-bold text-gray-900">{d.help.title}</h1>
      </div>

      <div className="flex-1 px-6 pt-6 space-y-6">
        <div className="space-y-3">
          {d.help.faqs.map(f => (
            <div key={f.q} className="bg-gray-50 rounded-2xl p-4">
              <p className="font-semibold text-gray-900 text-sm mb-1">{f.q}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-3">{d.help.contact}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{d.help.wechat}</span>
              <span className="font-medium text-gray-800">husan-support</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{d.help.email}</span>
              <span className="font-medium text-gray-800">support@husan.pku</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">{d.help.demoNote}</p>
        </div>
      </div>
    </div>
  )
}

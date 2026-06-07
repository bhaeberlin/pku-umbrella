import Link from 'next/link'
import { getDictServer } from '@/lib/i18n/server'

export default async function AboutPage() {
  const { d } = await getDictServer()
  return (
    <div className="flex flex-col min-h-dvh pb-28">
      <div className="px-6 pt-12 pb-5 border-b border-gray-100">
        <Link href="/profile" className="text-sm text-gray-400 mb-3 block active:opacity-60">{d.common.backToProfile}</Link>
        <h1 className="text-xl font-bold text-gray-900">{d.about.title}</h1>
      </div>

      <div className="flex-1 px-6 pt-6 space-y-6">
        <div className="flex items-center gap-4">
          <img src="/logo.png?v=3" alt="Husan 护伞" className="w-14 h-14 rounded-2xl flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900">{d.about.tagline}</p>
            <p className="text-sm text-gray-400">{d.about.subtitle}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          {d.about.body}
        </p>

        <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">{d.about.usageRate}</span>
            <span className="font-medium text-gray-800">{d.about.usageRateValue}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{d.about.deposit}</span>
            <span className="font-medium text-gray-800">{d.about.depositValue}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{d.about.return}</span>
            <span className="font-medium text-gray-800">{d.about.returnValue}</span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider mb-1">{d.about.prototypeNotice}</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            {d.about.prototypeBody}
          </p>
        </div>
      </div>
    </div>
  )
}

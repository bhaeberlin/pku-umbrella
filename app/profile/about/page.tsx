import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-dvh pb-28">
      <div className="px-6 pt-12 pb-5 border-b border-gray-100">
        <Link href="/profile" className="text-sm text-gray-400 mb-3 block active:opacity-60">← Profile</Link>
        <h1 className="text-xl font-bold text-gray-900">About Husan 护伞</h1>
      </div>

      <div className="flex-1 px-6 pt-6 space-y-6">
        <div className="flex items-center gap-4">
          <img src="/logo.png?v=3" alt="Husan 护伞" className="w-14 h-14 rounded-2xl flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900">Husan 护伞 · Umbrellas @ PKU</p>
            <p className="text-sm text-gray-400">Borrow · Use · Return anywhere</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          Husan is a compact umbrella-sharing network designed for the Peking University
          campus. Borrow a foldable rain/UV umbrella at any station, carry it across
          campus, and return it to any other station.
        </p>

        <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Usage rate</span>
            <span className="font-medium text-gray-800">10 min free, then ¥0.2/min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Deposit</span>
            <span className="font-medium text-gray-800">¥99 · refundable</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Return</span>
            <span className="font-medium text-gray-800">Any station with a free dock</span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider mb-1">Prototype notice</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            This app is a student prototype built for a Peking University design-thinking
            course. Payments and deposits are simulated — no real charges are made.
          </p>
        </div>
      </div>
    </div>
  )
}

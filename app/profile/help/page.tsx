import Link from 'next/link'

const FAQS = [
  {
    q: 'How do I borrow an umbrella?',
    a: 'Scan a station QR code (or open a station from the app), tap “Borrow umbrella”, and confirm. The umbrella unlocks and you’re ready to go.',
  },
  {
    q: 'What does it cost?',
    a: 'The first 10 minutes are free, then ¥0.2 per minute. You also place a refundable ¥99 deposit on your first borrow.',
  },
  {
    q: 'How does the deposit work?',
    a: 'A one-time ¥99 deposit is held while you’re a member. You can keep it on file for instant re-borrows, or refund it any time you have no active rental.',
  },
  {
    q: 'Where can I return it?',
    a: 'Any Husan station on campus — not just where you borrowed it. If a station is full (no free dock), return at a nearby one; the app shows which stations have space.',
  },
  {
    q: 'My umbrella is lost or broken — what do I do?',
    a: 'Contact support below with your phone number and the umbrella number (shown on your rental screen) and we’ll help sort it out.',
  },
]

export default function HelpPage() {
  return (
    <div className="flex flex-col min-h-dvh pb-28">
      <div className="px-6 pt-12 pb-5 border-b border-gray-100">
        <Link href="/profile" className="text-sm text-gray-400 mb-3 block active:opacity-60">← Profile</Link>
        <h1 className="text-xl font-bold text-gray-900">Help &amp; support</h1>
      </div>

      <div className="flex-1 px-6 pt-6 space-y-6">
        <div className="space-y-3">
          {FAQS.map(f => (
            <div key={f.q} className="bg-gray-50 rounded-2xl p-4">
              <p className="font-semibold text-gray-900 text-sm mb-1">{f.q}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-3">Contact support</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">WeChat</span>
              <span className="font-medium text-gray-800">husan-support</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-800">support@husan.pku</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Demo contact details — this is a prototype.</p>
        </div>
      </div>
    </div>
  )
}

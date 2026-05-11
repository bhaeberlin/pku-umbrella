'use client'

import { COLORS, COLOR_ORDER } from '@/lib/colors'
import type { UmbrellaColor } from '@/lib/types'

interface Props {
  available: Record<string, number>
  selected: UmbrellaColor | null  // null = random
  onSelect: (color: UmbrellaColor | null) => void
}

function ShuffleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8"/>
      <line x1="4" y1="20" x2="21" y2="3"/>
      <polyline points="21 16 21 21 16 21"/>
      <line x1="15" y1="15" x2="21" y2="21"/>
    </svg>
  )
}

export default function ColorPicker({ available, selected, onSelect }: Props) {
  const isRandom = selected === null

  return (
    <div className="flex gap-3 justify-center">
      {/* Random option */}
      <button
        onClick={() => onSelect(null)}
        aria-label="Random color"
        className={[
          'w-12 h-12 rounded-full transition-all active:scale-95 flex items-center justify-center',
          'bg-gray-200 text-gray-600',
          isRandom ? 'ring-4 ring-offset-2 ring-blue-600 scale-110' : '',
        ].join(' ')}
      >
        <ShuffleIcon />
      </button>

      {/* Color options */}
      {COLOR_ORDER.map(color => {
        const count = available[color] ?? 0
        const isAvailable = count > 0
        const isSelected = selected === color
        const { bg, label } = COLORS[color]

        return (
          <button
            key={color}
            disabled={!isAvailable}
            onClick={() => onSelect(color)}
            aria-label={`${label}${isAvailable ? ` (${count} available)` : ' (unavailable)'}`}
            className={[
              'w-12 h-12 rounded-full transition-all active:scale-95',
              bg,
              isSelected ? 'ring-4 ring-offset-2 ring-blue-600 scale-110' : '',
              !isAvailable ? 'opacity-25' : 'opacity-100',
            ].join(' ')}
          />
        )
      })}
    </div>
  )
}

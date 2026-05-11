'use client'

import { COLORS, COLOR_ORDER } from '@/lib/colors'
import type { UmbrellaColor } from '@/lib/types'

interface Props {
  available: Record<string, number>
  selected: UmbrellaColor | null  // null = random
  onSelect: (color: UmbrellaColor | null) => void
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
        <span className="text-xl">🎲</span>
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

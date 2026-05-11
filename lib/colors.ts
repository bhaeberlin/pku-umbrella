import type { UmbrellaColor } from './types'

export const COLORS: Record<UmbrellaColor, { label: string; bg: string; hex: string }> = {
  red:    { label: 'Red',    bg: 'bg-red-500',    hex: '#ef4444' },
  blue:   { label: 'Blue',   bg: 'bg-blue-500',   hex: '#3b82f6' },
  yellow: { label: 'Yellow', bg: 'bg-yellow-400', hex: '#facc15' },
  green:  { label: 'Green',  bg: 'bg-green-500',  hex: '#22c55e' },
  black:  { label: 'Black',  bg: 'bg-gray-900',   hex: '#111827' },
}

export const COLOR_ORDER: UmbrellaColor[] = ['red', 'blue', 'yellow', 'green', 'black']

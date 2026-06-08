'use client'

import { useLang, useSetLang } from './I18nProvider'

// A 5-point star centered at (0,0), outer radius 10, point-up.
const STAR =
  'M0,-10 L2.245,-3.09 L9.511,-3.09 L3.633,1.18 L5.878,8.09 L0,3.82 ' +
  'L-5.878,8.09 L-3.633,1.18 L-9.511,-3.09 L-2.245,-3.09 Z'

function Star({ x, y, scale, rotate = 0 }: { x: number; y: number; scale: number; rotate?: number }) {
  return <path d={STAR} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} />
}

// Simplified PRC flag — recognizable at chip size.
function ChinaFlag() {
  return (
    <svg viewBox="0 0 30 20" className="block w-[28px] h-[19px]" aria-hidden="true">
      <rect width="30" height="20" fill="#DE2910" />
      <g fill="#FFDE00">
        <Star x={6} y={6} scale={0.42} />
        <Star x={12} y={2.4} scale={0.14} rotate={20} />
        <Star x={14.2} y={5} scale={0.14} rotate={45} />
        <Star x={14.2} y={8.2} scale={0.14} rotate={70} />
        <Star x={12} y={10.6} scale={0.14} rotate={95} />
      </g>
    </svg>
  )
}

// Simplified Union Jack — recognizable at chip size.
function UKFlag() {
  return (
    <svg viewBox="0 0 60 30" className="block w-[28px] h-[19px]" aria-hidden="true">
      <rect width="60" height="30" fill="#012169" />
      <g stroke="#fff" strokeWidth="6">
        <path d="M0,0 L60,30" />
        <path d="M60,0 L0,30" />
      </g>
      <g stroke="#C8102E" strokeWidth="3">
        <path d="M0,0 L60,30" />
        <path d="M60,0 L0,30" />
      </g>
      <rect x="25" width="10" height="30" fill="#fff" />
      <rect y="10" width="60" height="10" fill="#fff" />
      <rect x="27" width="6" height="30" fill="#C8102E" />
      <rect y="12" width="60" height="6" fill="#C8102E" />
    </svg>
  )
}

export default function LanguageToggle() {
  const lang = useLang()
  const setLang = useSetLang()
  const target = lang === 'en' ? 'zh' : 'en'

  return (
    <button
      onClick={() => setLang(target)}
      aria-label={target === 'zh' ? '切换到中文' : 'Switch to English'}
      className="absolute z-40 active:scale-90 transition-transform"
      style={{
        top: 'calc(env(safe-area-inset-top) + 10px)',
        right: 'calc(env(safe-area-inset-right) + 12px)',
      }}
    >
      <span className="block rounded-[4px] overflow-hidden shadow-md ring-1 ring-black/15">
        {target === 'zh' ? <ChinaFlag /> : <UKFlag />}
      </span>
    </button>
  )
}

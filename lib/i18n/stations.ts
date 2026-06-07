// Chinese names/descriptions for the fixed set of campus stations, keyed by id.
// English always comes straight from the DB row (source of truth); we only map
// the Chinese side here, falling back to the DB value for any unknown id so a
// newly added station never renders blank.
//
// Bundled in the client too, so station names flip instantly on language switch
// with no server round-trip.

import type { Lang } from './config'

interface StationLike {
  id: string
  name: string
  description?: string | null
}

interface ZhStation {
  name: string
  description: string
}

const STATION_ZH: Record<string, ZhStation> = {
  'PKU-GUA1-01':   { name: '光华1号楼', description: '正门，左侧' },
  'PKU-SEGATE-01': { name: '东南门', description: '门内，右侧' },
  'PKU-GV3-01':    { name: '全球村3号楼', description: '正门，右侧' },
  'PKU-GV4-01':    { name: '全球村4号楼', description: '正门，前台旁' },
  'PKU-GV1-01':    { name: '全球村1号楼', description: '正门，右侧' },
  'PKU-3WC-01':    { name: '3W 咖啡', description: '室外入口，左侧' },
  'PKU-YNC-01':    { name: '燕南食堂', description: '正门，右侧' },
  'PKU-NYC-01':    { name: '农园食堂', description: '正门外' },
}

/** Localized station name + description; English falls back to the DB row. */
export function localizeStation(
  station: StationLike,
  lang: Lang,
): { name: string; description: string } {
  const dbDescription = station.description ?? ''
  if (lang === 'zh') {
    const zh = STATION_ZH[station.id]
    if (zh) return { name: zh.name, description: zh.description }
  }
  return { name: station.name, description: dbDescription }
}

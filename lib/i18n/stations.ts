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
  'PKU-GV3-01':    { name: '中关新园3号楼', description: '正门，右侧' },
  'PKU-GV4-01':    { name: '中关新园4号楼', description: '正门，前台旁' },
  'PKU-GV1-01':    { name: '中关新园1号楼', description: '正门，右侧' },
  'PKU-3WC-01':    { name: '3W 咖啡', description: '室外入口，左侧' },
  'PKU-YNC-01':    { name: '燕南食堂', description: '正门，右侧' },
  'PKU-NYC-01':    { name: '农园食堂', description: '正门外' },
  'PKU-WGATE-01':  { name: '西校门', description: '门内，左侧' },
  'PKU-SWGATE-01': { name: '西南门', description: '门内，左侧' },
  'PKU-4FC-01':    { name: '四层食堂', description: '一层，扶梯旁' },
  'PKU-FMART-01':  { name: '宿舍全家便利店', description: '收银台旁' },
  'PKU-FACH-01':   { name: '教师之家', description: '室内，收银台旁' },
  'PKU-GUA2-01':   { name: '光华2号楼', description: '正门旁' },
  'PKU-SGATE-01':  { name: '南门', description: '门内，右侧' },
  'PKU-DORM35-01': { name: '学生宿舍35号楼', description: '正门外' },
  'PKU-HOLLY-01':  { name: '原好莱坞咖啡', description: '一层，入口旁' },
  'PKU-LUCKIN-01': { name: '瑞幸咖啡', description: '入口旁' },
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

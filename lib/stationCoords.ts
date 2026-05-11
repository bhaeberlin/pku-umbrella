// [lon, lat] for each PKU station — used to generate Mapbox static map images
export const STATION_COORDS: Record<string, [number, number]> = {
  'PKU-LIB-01':  [116.3047, 39.9985],
  'PKU-CAN-01':  [116.3054, 39.9976],
  'PKU-GATE-01': [116.3120, 39.9937],
  'PKU-DORM-01': [116.3020, 39.9997],
  'PKU-GYM-01':  [116.3068, 39.9950],
}

export function stationMapUrl(stationId: string): string {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const coords = STATION_COORDS[stationId]
  if (!token || !coords) return ''
  const [lon, lat] = coords
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+1d4ed8(${lon},${lat})/${lon},${lat},17/430x400@2x?access_token=${token}`
}

// [lon, lat] for each PKU station — used to generate Mapbox static map images
// TODO: replace placeholder coords with real ones measured on campus
export const STATION_COORDS: Record<string, [number, number]> = {
  'PKU-GUA1-01':   [116.3108, 39.9924],  // Guanghua Building 1
  'PKU-SEGATE-01': [116.3108, 39.9924],  // Southeast Gate
  'PKU-GV3-01':    [116.3108, 39.9924],  // Global Village Building 3
  'PKU-GV4-01':    [116.3108, 39.9924],  // Global Village Building 4
  'PKU-GV1-01':    [116.3108, 39.9924],  // Global Village Building 1
  'PKU-3WC-01':    [116.3108, 39.9924],  // 3W Cafe
  'PKU-YNC-01':    [116.3108, 39.9924],  // Yannan Cantine
  'PKU-NYC-01':    [116.3108, 39.9924],  // Nongyuan Cantine
}

export function stationMapUrl(stationId: string): string {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const coords = STATION_COORDS[stationId]
  if (!token || !coords) return ''
  const [lon, lat] = coords
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+1d4ed8(${lon},${lat})/${lon},${lat},17/600x1000@2x?access_token=${token}`
}

// [lon, lat] for each PKU station — used to generate Mapbox static map images
export const STATION_COORDS: Record<string, [number, number]> = {
  'PKU-GUA1-01':   [116.30623, 39.98926],  // Guanghua Building 1
  'PKU-SEGATE-01': [116.30967, 39.98883],  // Southeast Gate
  'PKU-GV3-01':    [116.31198, 39.98805],  // Global Village Building 3
  'PKU-GV4-01':    [116.31287, 39.98890],  // Global Village Building 4
  'PKU-GV1-01':    [116.31163, 39.98838],  // Global Village Building 1
  'PKU-3WC-01':    [116.30763, 39.98837],  // 3W Cafe
  'PKU-YNC-01':    [116.30429, 39.98926],  // Yannan Cantine
  'PKU-NYC-01':    [116.30601, 39.98797],  // Nongyuan Cantine
}

export function stationMapUrl(stationId: string, otherIds: string[] = []): string {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const coords = STATION_COORDS[stationId]
  if (!token || !coords) return ''
  const [lon, lat] = coords

  const greyPins = otherIds
    .filter(id => id !== stationId && STATION_COORDS[id])
    .map(id => {
      const [oLon, oLat] = STATION_COORDS[id]
      return `pin-s+9ca3af(${oLon},${oLat})`
    })
    .join(',')

  const selectedPin = `pin-s+1d4ed8(${lon},${lat})`
  const overlays = greyPins ? `${greyPins},${selectedPin}` : selectedPin

  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlays}/${lon},${lat},16/600x1000@2x?access_token=${token}`
}

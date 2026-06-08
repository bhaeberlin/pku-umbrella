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
  'PKU-WGATE-01':  [116.29863, 39.99335],  // Historic West Gate
  'PKU-SWGATE-01': [116.29938, 39.98642],  // Southwest Gate
  'PKU-4FC-01':    [116.30213, 39.98696],  // Four-storey cantine
  'PKU-FMART-01':  [116.30303, 39.98743],  // Family Mart at the dorms
  'PKU-FACH-01':   [116.30653, 39.99294],  // Faculty House
  'PKU-GUA2-01':   [116.30725, 39.99472],  // Guanghua Building 2
  'PKU-SGATE-01':  [116.30546, 39.98522],  // South Gate
  'PKU-DORM35-01': [116.30330, 39.98651],  // Student Dorms Building 35
  'PKU-HOLLY-01':  [116.30085, 39.98764],  // Former Cafe Hollywood
  'PKU-LUCKIN-01': [116.30666, 39.99111],  // Luckin Coffee
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

  // @2x (1200×2000 source) for crisp retina rendering — the CSS box is 600×1000,
  // so retina phones need the 2× slot. next/image still re-encodes to WebP and
  // CDN-caches it, so the byte cost is paid once per device size.
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlays}/${lon},${lat},16/600x1000@2x?access_token=${token}`
}

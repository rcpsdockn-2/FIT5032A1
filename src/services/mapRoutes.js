export function validCoordinates(place) {
  return Number.isFinite(place?.lat) && Math.abs(place.lat) <= 90
    && Number.isFinite(place?.lng) && Math.abs(place.lng) <= 180
}

export function routeInstruction(step) {
  const type = step.maneuver?.type
  const direction = step.maneuver?.modifier || ''
  const road = step.name ? ` on ${step.name}` : ''
  if (type === 'depart') return `Start${road}.`
  if (type === 'arrive') return 'Arrive at the sample destination.'
  if (direction === 'uturn') return `Make a U-turn${road}.`
  if (type === 'roundabout' || type === 'rotary') return `At the roundabout, take exit ${step.maneuver.exit || '?'}${road}.`
  if (type === 'turn' || type === 'end of road') return `Turn ${direction || 'as indicated'}${road}.`
  if (type === 'merge') return `Merge ${direction}${road}.`
  return `Continue ${direction}${road}.`
}

export async function getDrivingRoute(origin, destination, { fetcher = fetch, signal } = {}) {
  if (!validCoordinates(origin) || !validCoordinates(destination)) throw new Error('Choose a valid starting suburb and destination.')
  if (origin.lat === destination.lat && origin.lng === destination.lng) throw new Error('The start and destination are the same. Choose another starting suburb.')
  const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`
  let response
  try {
    response = await fetcher(`https://routing.openstreetmap.de/routed-car/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true&alternatives=false`, {
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
    })
  } catch { throw new Error('Cannot reach the route service. Check your connection and try again later.') }
  let result
  try { result = await response.json() } catch { throw new Error('The route service returned an invalid response.') }
  if (result?.code === 'NoRoute' || result?.code === 'NoSegment') throw new Error('No driving route is available for these points. Choose another start or destination.')
  if (!response.ok || result?.code !== 'Ok') throw new Error('The route service could not complete this request. Try again later.')
  const route = result.routes?.[0]
  const line = route?.geometry?.coordinates
  if (!Number.isFinite(route?.distance) || route.distance < 0 || !Number.isFinite(route?.duration) || route.duration < 0
    || route.geometry?.type !== 'LineString' || !Array.isArray(line) || line.length < 2 || line.length > 20000
    || !line.every((point) => Array.isArray(point) && point.length === 2 && validCoordinates({ lng: point[0], lat: point[1] }))
    || !Array.isArray(route.legs) || !route.legs.every((leg) => Array.isArray(leg.steps))) {
    throw new Error('The route service returned incomplete route data.')
  }
  const steps = route.legs.flatMap((leg) => leg.steps)
  if (!steps.length || steps.some((step) => !step || typeof step.name !== 'string' || !Number.isFinite(step.distance) || step.distance < 0 || typeof step.maneuver?.type !== 'string')) {
    throw new Error('The route service returned incomplete directions.')
  }
  return { distance: route.distance, duration: route.duration, line: line.map(([lng, lat]) => [lat, lng]),
    steps: steps.map((step) => ({ instruction: routeInstruction(step), distance: Math.round(step.distance) })) }
}

import { validCoordinates } from './mapRoutes.js'

export function placeSearchEndpoint(environment) {
  if (environment.DEV) return '/functions/searchPlaces'
  const endpoint = environment.VITE_PLACES_FUNCTION_URL?.trim()
  if (!endpoint) throw new Error('Place search has not been configured for this website. You can still browse the tables below.')
  if (endpoint.startsWith('/') && !endpoint.startsWith('//')) return endpoint
  const url = new URL(endpoint)
  if (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.username || url.password) {
    throw new Error('Place search needs a production HTTPS endpoint or same-origin path.')
  }
  return endpoint
}

export async function searchPlaces(category, suburb, { environment = import.meta.env || {}, fetcher = fetch } = {}) {
  const endpoint = placeSearchEndpoint(environment)
  const params = new URLSearchParams({ category, suburb })
  let response
  try {
    response = await fetcher(`${endpoint}?${params}`, { signal: AbortSignal.timeout(10000) })
  } catch { throw new Error('Cannot reach place search. Check your connection and try again later.') }
  let result
  try { result = await response.json() } catch { throw new Error('Place search returned an invalid response. Check its configuration.') }
  if (!response.ok) throw new Error('Place search could not complete the request. Check your filters and try again.')
  if (!Array.isArray(result?.places) || result.count !== result.places.length || !result.places.every((place) =>
    place && validCoordinates(place) && ['id', 'name', 'suburb', 'category', 'hours'].every((key) => typeof place[key] === 'string'))) {
    throw new Error('Place search returned an invalid response. Please try again later.')
  }
  return result.places
}

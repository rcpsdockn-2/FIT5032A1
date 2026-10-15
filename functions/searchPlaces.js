import { placeCategories, recyclingPlaces } from './data/places.js'

export function validatePlaceQuery(query) {
  if (!query || Object.keys(query).some((key) => !['category', 'suburb'].includes(key))) throw new Error('Use only category and suburb parameters.')
  const category = query.category ?? 'All'
  const suburb = query.suburb ?? ''
  if (typeof category !== 'string' || !placeCategories.includes(category.trim())) throw new Error('Choose All, E-waste, Repair or Container return.')
  if (typeof suburb !== 'string' || suburb.length > 60 || /[\x00-\x1f\x7f]/.test(suburb)) throw new Error('Enter a suburb of up to 60 characters on one line.')
  return { category: category.trim(), suburb: suburb.trim().toLowerCase() }
}

export function findPlaces(query, places = recyclingPlaces) {
  const { category, suburb } = validatePlaceQuery(query)
  return places.filter((place) => (category === 'All' || place.category === category)
    && place.suburb.toLowerCase().includes(suburb))
}

// Separate the HTTP handler so tests can inject a failing data source.
export function createPlaceSearchHandler(search = findPlaces) {
  return function handlePlaceSearch(request, response) {
    response.set('Cache-Control', 'no-store')
    if (request.method !== 'GET') {
      response.set('Allow', 'GET')
      return response.status(405).json({ message: 'Use GET to search places.' })
    }
    try { validatePlaceQuery(request.query) } catch (issue) {
      return response.status(400).json({ message: issue.message })
    }
    try {
      const places = search(request.query)
      return response.status(200).json({ places, count: places.length })
    } catch {
      return response.status(500).json({ message: 'Place search is unavailable. Please try again later.' })
    }
  }
}

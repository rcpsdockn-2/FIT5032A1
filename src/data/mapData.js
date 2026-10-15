import { recyclingPlaces } from '../../functions/data/places.js'

// Public approximate suburb centres, not personal locations or service addresses.
export const routeOrigins = [
  { id: 'melbourne-cbd', name: 'Melbourne CBD', lat: -37.8136, lng: 144.9631 },
  ...recyclingPlaces.map((place) => ({ id: place.id, name: place.suburb, lat: place.lat, lng: place.lng })),
]

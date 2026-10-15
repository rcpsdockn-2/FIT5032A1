import { onRequest } from 'firebase-functions/v2/https'
import { createPlaceSearchHandler } from './searchPlaces.js'

// Public, read-only sample data. Use a same-origin proxy, not broad CORS access.
export const searchPlaces = onRequest({
  region: 'australia-southeast1', cors: false, maxInstances: 1,
  timeoutSeconds: 10, memory: '256MiB',
}, createPlaceSearchHandler())

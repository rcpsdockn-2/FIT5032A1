import test from 'node:test'
import assert from 'node:assert/strict'
import { recyclingPlaces } from '../functions/data/places.js'
import { routeOrigins } from '../src/data/mapData.js'
import { validCoordinates, getDrivingRoute, routeInstruction } from '../src/services/mapRoutes.js'
import { searchPlaces } from '../src/services/placeSearch.js'

const origin = routeOrigins[0]
const destination = recyclingPlaces[0]
function providerResult() {
  return { code: 'Ok', routes: [{ distance: 8000, duration: 900,
    geometry: { type: 'LineString', coordinates: [[144.9631, -37.8136], [144.899, -37.8005]] },
    legs: [{ steps: [
      { name: 'Example Road', distance: 120, maneuver: { type: 'depart' } },
      { name: 'Sample Street', distance: 7880, maneuver: { type: 'turn', modifier: 'left' } },
      { name: '', distance: 0, maneuver: { type: 'arrive' } },
    ] }],
  }] }
}
const reply = (data) => async () => ({ ok: true, json: async () => data })

test('all directory markers and starting suburbs have unique IDs and valid Melbourne coordinates', () => {
  for (const places of [recyclingPlaces, routeOrigins]) {
    assert.equal(new Set(places.map((place) => place.id)).size, places.length)
    assert.ok(places.every((place) => validCoordinates(place) && place.lat > -38 && place.lat < -37 && place.lng > 144 && place.lng < 146))
  }
})
test('coordinate validation rejects missing, nonnumeric, infinite and out-of-range points', () => {
  for (const point of [null, {}, { lat: '1', lng: 2 }, { lat: 91, lng: 0 }, { lat: 0, lng: 181 }, { lat: NaN, lng: Infinity }]) assert.equal(validCoordinates(point), false)
})
test('route request rejects missing or identical points before making a network request', async () => {
  const fetcher = async () => { assert.fail('must not call provider') }
  await assert.rejects(() => getDrivingRoute(null, destination, { fetcher }), /valid starting suburb/)
  await assert.rejects(() => getDrivingRoute(origin, origin, { fetcher }), /same/)
})
test('route request sends public points in longitude/latitude order with steps and a timeout, no credentials', async () => {
  const result = await getDrivingRoute(origin, destination, { fetcher: async (url, options) => {
    assert.ok(url.startsWith('https://routing.openstreetmap.de/routed-car/route/v1/driving/144.9631,-37.8136;144.899,-37.8005?'))
    assert.ok(url.includes('geometries=geojson&steps=true'))
    assert.equal(options.headers, undefined)
    assert.equal(options.signal.aborted, false)
    return { ok: true, json: async () => providerResult() }
  } })
  assert.equal(result.distance, 8000)
  assert.equal(result.duration, 900)
  assert.deepEqual(result.line[0], [-37.8136, 144.9631])
  assert.match(result.steps[1].instruction, /Turn left on Sample Street/)
})
test('route instructions explain departure, arrival, roundabouts and continuing with text', () => {
  assert.equal(routeInstruction({ name: '', maneuver: { type: 'arrive' } }), 'Arrive at the sample destination.')
  assert.match(routeInstruction({ name: 'Road', maneuver: { type: 'roundabout', exit: 2 } }), /exit 2/)
  assert.match(routeInstruction({ name: 'Road', maneuver: { type: 'merge', modifier: 'left' } }), /Merge left/)
  assert.match(routeInstruction({ name: 'Road', maneuver: { type: 'continue', modifier: 'uturn' } }), /Make a U-turn/)
  assert.match(routeInstruction({ name: '<img src=x>', maneuver: { type: 'continue' } }), /<img src=x>/)
})
test('no-route and no-road responses do not become a straight-line fake route', async () => {
  for (const code of ['NoRoute', 'NoSegment']) await assert.rejects(() => getDrivingRoute(origin, destination, { fetcher: reply({ code }) }), /No driving route/)
})
test('network, HTTP and malformed JSON errors remain clear and never use dummy directions', async () => {
  for (const fetcher of [
    async () => { throw new Error('offline') },
    async () => ({ ok: false, json: async () => ({ code: 'Error' }) }),
    async () => ({ ok: true, json: async () => { throw new Error('bad JSON') } }),
  ]) await assert.rejects(() => getDrivingRoute(origin, destination, { fetcher }), /route service/)
})
test('malformed routes, geometry, distance and directions cannot reach the map', async () => {
  const cases = [null, { code: 'Ok', routes: [] }]
  for (const change of [
    (route) => { route.distance = -1 },
    (route) => { route.duration = '12' },
    (route) => { route.geometry.coordinates = [[999, 0], [1, 2]] },
    (route) => { route.geometry.coordinates = [] },
    (route) => { route.geometry.type = 'Polygon' },
    (route) => { route.legs = [] },
    (route) => { route.legs = [null] },
    (route) => { route.legs[0].steps[0].distance = -3 },
  ]) {
    const data = providerResult()
    change(data.routes[0])
    cases.push(data)
  }
  for (const data of cases) await assert.rejects(() => getDrivingRoute(origin, destination, { fetcher: reply(data) }), /route service/)
})
test('map function response rejects invalid coordinates rather than creating broken markers', async () => {
  await assert.rejects(() => searchPlaces('All', '', { environment: { DEV: true },
    fetcher: async () => ({ ok: true, json: async () => ({ count: 1, places: [{ ...destination, lat: 'bad' }] }) }),
  }), /invalid response/)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { findPlaces, validatePlaceQuery, createPlaceSearchHandler } from '../functions/searchPlaces.js'
import { recyclingPlaces } from '../src/data/directoryData.js'
import { recyclingPlaces as functionPlaces } from '../functions/data/places.js'
import { searchPlaces, placeSearchEndpoint } from '../src/services/placeSearch.js'

test('function and original table share the same 12 unchanged sample places', () => {
  assert.equal(recyclingPlaces, functionPlaces)
  assert.equal(findPlaces({}).length, 12)
  assert.notEqual(findPlaces({}), recyclingPlaces)
})
test('server combines category and case-insensitive trimmed suburb without modifying data', () => {
  const before = JSON.stringify(recyclingPlaces)
  assert.equal(findPlaces({ category: 'Repair' }).length, 4)
  assert.equal(findPlaces({ category: ' E-waste ', suburb: ' FOOT ' })[0].id, 'place-01')
  assert.deepEqual(findPlaces({ category: 'Repair', suburb: 'Footscray' }), [])
  assert.equal(JSON.stringify(recyclingPlaces), before)
})
test('function rejects invalid categories, repeated parameters, control characters and oversized queries', () => {
  for (const query of [null, { category: 'Unknown' }, { category: ['All', 'Repair'] }, { suburb: ['x'] }, { suburb: 'a'.repeat(61) }, { suburb: '\n' }, { extra: 'x' }]) {
    assert.throws(() => validatePlaceQuery(query))
  }
})
function callHandler(method, query, search) {
  const result = { headers: {} }
  const response = {
    set(key, value) { result.headers[key] = value; return this },
    status(value) { result.status = value; return this },
    json(value) { result.body = value; return this },
  }
  createPlaceSearchHandler(search)({ method, query }, response)
  return result
}
test('HTTP function returns JSON data/count and method or validation errors', () => {
  assert.equal(callHandler('GET', {}).body.count, 12)
  assert.equal(callHandler('GET', {}).headers['Cache-Control'], 'no-store')
  const method = callHandler('POST', {})
  assert.equal(method.status, 405)
  assert.equal(method.headers.Allow, 'GET')
  assert.equal(callHandler('GET', { category: 'Unknown' }).status, 400)
})
test('unexpected server failure returns 500 without internal information', () => {
  const result = callHandler('GET', {}, () => { throw new Error('secret connection details') })
  assert.equal(result.status, 500)
  assert.ok(!result.body.message.includes('secret'))
})
test('development uses emulator proxy but production does not silently fall back to localhost', () => {
  assert.equal(placeSearchEndpoint({ DEV: true }), '/functions/searchPlaces')
  assert.throws(() => placeSearchEndpoint({ DEV: false }), /not been configured/)
  assert.equal(placeSearchEndpoint({ VITE_PLACES_FUNCTION_URL: '/directory-function' }), '/directory-function')
  for (const url of ['http://example.com/function', 'http://127.0.0.1:5001/function', 'https://localhost/function', 'https://user:pass@example.com/function', '//localhost/function']) {
    assert.throws(() => placeSearchEndpoint({ VITE_PLACES_FUNCTION_URL: url }))
  }
})
test('client sends encoded public filters and no account token to the function', async () => {
  const result = await searchPlaces('E-waste', 'Foot scray', {
    environment: { DEV: true },
    fetcher: async (url, options) => {
      assert.equal(url, '/functions/searchPlaces?category=E-waste&suburb=Foot+scray')
      assert.equal(options.headers, undefined)
      return { ok: true, json: async () => ({ places: [recyclingPlaces[0]], count: 1 }) }
    },
  })
  assert.deepEqual(result, [recyclingPlaces[0]])
})
test('client reports network/HTTP/JSON and malformed data failures, not local fake results', async () => {
  for (const fetcher of [
    async () => { throw new Error('offline') },
    async () => ({ ok: false, json: async () => ({ message: 'private error' }) }),
    async () => ({ ok: true, json: async () => { throw new Error('not JSON') } }),
    async () => ({ ok: true, json: async () => ({ count: 2, places: [] }) }),
    async () => ({ ok: true, json: async () => ({ count: 1, places: [{}] }) }),
    async () => ({ ok: true, json: async () => null }),
  ]) {
    await assert.rejects(() => searchPlaces('All', '', { environment: { DEV: true }, fetcher }), /place search|Place search/)
  }
})

import assert from 'node:assert/strict'

const endpoint = 'http://127.0.0.1:5001/demo-cyclewise/australia-southeast1/searchPlaces'
async function get(query = '') {
  const response = await fetch(endpoint + query, { signal: AbortSignal.timeout(10000) })
  return { status: response.status, body: await response.json() }
}
const all = await get()
assert.equal(all.status, 200)
assert.equal(all.body.count, 12)
const category = await get('?category=Repair')
assert.equal(category.status, 200)
assert.equal(category.body.count, 4)
assert.ok(category.body.places.every((place) => place.category === 'Repair'))
const suburb = await get('?category=E-waste&suburb=%20FOOT%20')
assert.equal(suburb.status, 200)
assert.equal(suburb.body.count, 1)
assert.equal(suburb.body.places[0].id, 'place-01')
assert.equal(typeof suburb.body.places[0].lat, 'number')
assert.equal(typeof suburb.body.places[0].lng, 'number')
const empty = await get('?category=Repair&suburb=Footscray')
assert.equal(empty.status, 200)
assert.deepEqual(empty.body.places, [])
for (const query of ['?category=Invalid', '?suburb=' + 'a'.repeat(61), '?category=Repair&category=E-waste', '?other=value']) {
  assert.equal((await get(query)).status, 400)
}
assert.equal((await fetch(endpoint, { method: 'POST' })).status, 405)
const mailEndpoint = endpoint.replace(/searchPlaces$/, 'sendEmail')
assert.equal((await fetch(mailEndpoint)).status, 405)
assert.equal((await fetch(mailEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401)
console.log('Functions emulator: all places, category/suburb search, no results, invalid parameters and method checks passed.')

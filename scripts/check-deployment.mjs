import assert from 'node:assert/strict'

const site = new URL(process.argv[2] || 'https://cyclewise-ef0fe.web.app')
assert.equal(site.protocol, 'https:')
async function request(path, options) {
  return fetch(new URL(path, site), { ...options, signal: AbortSignal.timeout(30000) })
}
const home = await request('/')
assert.equal(home.status, 200)
assert.match(home.headers.get('content-type'), /text\/html/)
const html = await home.text()
assert.match(html, /id="app"/)
const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map((match) => match[1])
assert.ok(assets.length >= 2)
for (const path of assets) assert.equal((await request(path)).status, 200)

const all = await request('/functions/searchPlaces')
assert.equal(all.status, 200)
assert.equal((await all.json()).count, 12)
const filtered = await request('/functions/searchPlaces?category=E-waste&suburb=Footscray')
assert.equal(filtered.status, 200)
assert.equal((await filtered.json()).places[0].id, 'place-01')
assert.equal((await request('/functions/searchPlaces?category=Invalid')).status, 400)
assert.equal((await request('/functions/searchPlaces', { method: 'POST' })).status, 405)

// These checks cannot send mail: no user token or valid payload is supplied.
assert.equal((await request('/api/send-email')).status, 405)
const unsigned = await request('/api/send-email', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
})
assert.equal(unsigned.status, 401)
assert.match((await unsigned.json()).message, /sign in/i)
for (const path of ['/.env.local', '/.agent/permissions.md', '/functions/index.js']) {
  assert.equal((await request(path)).status, 404)
}
console.log('Online checks passed: website/assets, function filtering and errors, unsigned email rejection, private/source files not hosted. No email sent.')

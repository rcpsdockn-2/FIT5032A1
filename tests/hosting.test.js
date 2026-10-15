import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createEmailHttpHandler } from '../functions/emailHttp.js'
import { createServer } from 'node:http'
import { searchPlaces, sendEmail } from '../functions/index.js'

const firebase = JSON.parse(readFileSync(new URL('../firebase.json', import.meta.url)))

test('both cloud functions scale to zero and only mail binds the sending secret', () => {
  for (const fn of [searchPlaces, sendEmail]) {
    assert.equal(fn.__endpoint.minInstances, 0)
    assert.equal(fn.__endpoint.maxInstances, 1)
    assert.deepEqual(fn.__endpoint.region, ['australia-southeast1'])
    assert.equal(fn.__endpoint.availableMemoryMb, 256)
  }
  assert.equal(searchPlaces.__endpoint.secretEnvironmentVariables, undefined)
  assert.deepEqual(sendEmail.__endpoint.secretEnvironmentVariables.map((secret) => secret.key), ['RESEND_API_KEY'])
})

test('Hosting publishes only dist and rewrites both APIs before static fallback', () => {
  assert.equal(firebase.hosting.public, 'dist')
  assert.deepEqual(firebase.hosting.rewrites.map((rule) => [rule.source, rule.function.functionId, rule.function.region]), [
    ['/functions/searchPlaces', 'searchPlaces', 'australia-southeast1'],
    ['/api/send-email', 'sendEmail', 'australia-southeast1'],
  ])
  assert.ok(firebase.functions[0].ignore.includes('.env.*'))
  assert.equal(firebase.functions[0].runtime, 'nodejs22')
})

test('production defaults to the same-origin function, not a development server', () => {
  const production = readFileSync(new URL('../.env.production', import.meta.url), 'utf8')
  assert.match(production, /^VITE_PLACES_FUNCTION_URL=\/functions\/searchPlaces$/m)
  assert.doesNotMatch(production, /RESEND_API_KEY|localhost|127\.0\.0\.1/)
})

test('cloud-compatible email adapter accepts parsed JSON but blocks unsigned sends', async (t) => {
  const handler = createEmailHttpHandler({ apiKey: 'fake', projectId: 'demo-cyclewise', from: 'test@example.com', allowedRecipients: ['member@example.com'] })
  const server = createServer(async (request, response) => {
    request.body = { subject: 'Test', message: 'Test note', requestId: '12345678-1234-1234-1234-123456789012' }
    await handler(request, response)
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise((resolve) => server.close(resolve)))
  const response = await fetch(`http://127.0.0.1:${server.address().port}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  assert.equal(response.status, 401)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.match((await response.json()).message, /sign in/i)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { createServer } from 'node:http'
import apiHandler from '../api/send-email.js'
import { createEmailHandler, readEmailBody, MAX_BODY_BYTES } from '../server/emailHandler.js'
import { validateEmailFields, validateAttachment, MAX_ATTACHMENT_BYTES } from '../src/services/emailValidation.js'
import { canAccessPage } from '../src/services/auth.js'

const body = { subject: ' Recycling note ', message: ' Clean and separate glass. ', requestId: '12345678-1234-1234-1234-123456789012' }
const request = { method: 'POST', authorization: 'Bearer test-token', body }
const config = { apiKey: 'fake-test-key', projectId: 'demo-test', from: 'test@example.com', allowedRecipients: ['member@example.com'] }
const attachment = { filename: 'guide.txt', content: Buffer.from('Keep glass separate.').toString('base64') }
function setup(options = {}) {
  const sent = []
  const handler = createEmailHandler({
    config,
    verifyToken: async (token) => { assert.equal(token, 'test-token'); return { uid: 'member-1', email: 'member@example.com' } },
    sendEmail: async (...args) => { sent.push(args); return { id: 'test-message' } },
    ...options,
  })
  return { handler, sent }
}

test('email page requires sign-in without granting administrator access', () => {
  assert.equal(canAccessPage('email', null), false)
  assert.equal(canAccessPage('email', { role: 'member' }), true)
  assert.equal(canAccessPage('admin', { role: 'member' }), false)
})

test('subject and message reject missing, oversized and header-injection input', () => {
  for (const subject of ['', ' ', null, 'a'.repeat(121), 'hello\nBcc: x@example.com']) assert.throws(() => validateEmailFields(subject, 'note'))
  for (const message of ['', ' ', null, 'a'.repeat(3001)]) assert.throws(() => validateEmailFields('Note', message))
  assert.doesNotThrow(() => validateEmailFields('a'.repeat(120), 'a'.repeat(3000)))
})

test('attachments restrict filename, file type and size on both ends', () => {
  for (const name of ['app.exe', '../note.txt', 'a..txt', 'note\n.txt', 'a/'.repeat(3) + 'x.pdf']) assert.throws(() => validateAttachment(name, 10))
  for (const size of [0, -1, 1.5, MAX_ATTACHMENT_BYTES + 1]) assert.throws(() => validateAttachment('note.txt', size))
  assert.doesNotThrow(() => validateAttachment('My-guide.PDF', MAX_ATTACHMENT_BYTES))
})

test('missing configuration and wrong method cannot send mail', async () => {
  const { handler, sent } = setup({ config: {} })
  assert.equal((await handler({ ...request, method: 'GET' })).status, 405)
  assert.equal((await handler(request)).status, 503)
  assert.equal(sent.length, 0)
})

test('missing or invalid Firebase tokens cannot send mail', async () => {
  const { handler, sent } = setup({ verifyToken: async () => { throw new Error('private credential details') } })
  assert.equal((await handler({ ...request, authorization: '' })).status, 401)
  const result = await handler(request)
  assert.equal(result.status, 401)
  assert.ok(!result.message.includes('private'))
  assert.equal(sent.length, 0)
})

test('server allowlist blocks unapproved recipients even with valid login', async () => {
  const { handler, sent } = setup({ verifyToken: async () => ({ uid: 'other', email: 'other@example.com' }) })
  assert.equal((await handler(request)).status, 403)
  assert.equal(sent.length, 0)
})

test('server sends plain text only to token email and forwards the exact attachment', async () => {
  const { handler, sent } = setup()
  const result = await handler({ ...request, body: { ...body, attachment, to: 'attacker@example.com', from: 'spoof@example.com', html: '<script>x</script>' } })
  assert.equal(result.status, 200)
  assert.deepEqual(sent[0][0], { from: config.from, to: ['member@example.com'], subject: 'Recycling note', text: 'Clean and separate glass.', attachments: [attachment] })
  assert.equal(sent[0][1], `member-1/${body.requestId}`)
})

test('missing attachment is supported without adding an empty attachment', async () => {
  const { handler, sent } = setup()
  assert.equal((await handler(request)).status, 200)
  assert.equal(sent[0][0].attachments, undefined)
})

test('malformed requests do not reach the provider', async () => {
  const { handler, sent } = setup()
  for (const invalid of [null, [], {}, { ...body, requestId: 'bad' }, { ...body, subject: '\r\n' }]) {
    assert.equal((await handler({ ...request, body: invalid })).status, 400)
  }
  assert.equal(sent.length, 0)
})

test('server rejects malformed base64, fake PDFs, binary text and oversized files', async () => {
  const { handler, sent } = setup()
  const invalid = [
    { filename: 'x.txt', content: '***' },
    { filename: 'x.txt', content: 'YQ' },
    { filename: 'x.pdf', content: attachment.content },
    { filename: 'x.txt', content: Buffer.from([0, 1, 2]).toString('base64') },
    { filename: 'x.txt', content: Buffer.from([255]).toString('base64') },
    { filename: 'x.txt', content: Buffer.alloc(MAX_ATTACHMENT_BYTES + 1, 65).toString('base64') },
  ]
  for (const file of invalid) assert.equal((await handler({ ...request, body: { ...body, attachment: file } })).status, 400)
  assert.equal(sent.length, 0)
})

test('PDF header and base64 are checked before forwarding', async () => {
  const { handler, sent } = setup()
  const pdf = { filename: 'guide.pdf', content: Buffer.from('%PDF-1.4\nTest fixture').toString('base64') }
  assert.equal((await handler({ ...request, body: { ...body, attachment: pdf } })).status, 200)
  assert.deepEqual(sent[0][0].attachments, [pdf])
})

test('cooldown blocks rapid sends and permits a later request', async () => {
  let time = 100000
  const { handler, sent } = setup({ now: () => time })
  assert.equal((await handler(request)).status, 200)
  assert.equal((await handler(request)).status, 429)
  time += 60000
  assert.equal((await handler(request)).status, 200)
  assert.equal(sent.length, 2)
})

test('provider failure or absent confirmation never reports success and retains cooldown', async () => {
  for (const sendEmail of [async () => { throw new Error('secret provider details') }, async () => ({})]) {
    const { handler } = setup({ sendEmail })
    const result = await handler(request)
    assert.equal(result.status, 502)
    assert.ok(!result.message.includes('secret'))
    assert.equal((await handler(request)).status, 429)
  }
})

test('request parser accepts JSON and rejects malformed or oversized bodies', async () => {
  assert.deepEqual(await readEmailBody(Readable.from([Buffer.from(JSON.stringify(body))])), body)
  assert.deepEqual(await readEmailBody({ body }), body)
  await assert.rejects(() => readEmailBody({ body: '{bad' }))
  await assert.rejects(() => readEmailBody(Readable.from([Buffer.alloc(MAX_BODY_BYTES + 1)])))
  await assert.rejects(() => readEmailBody({ body: 'a'.repeat(MAX_BODY_BYTES + 1) }))
})

test('real HTTP adapter returns JSON, method/content-type errors and rejects bad JSON', async (t) => {
  const server = createServer(apiHandler)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise((resolve) => server.close(resolve)))
  const url = `http://127.0.0.1:${server.address().port}/api/send-email`
  const method = await fetch(url)
  assert.equal(method.status, 405)
  assert.equal(method.headers.get('allow'), 'POST')
  assert.equal(method.headers.get('cache-control'), 'no-store')
  assert.equal(typeof (await method.json()).message, 'string')
  const type = await fetch(url, { method: 'POST', body: 'text' })
  assert.equal(type.status, 415)
  const malformed = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' })
  assert.equal(malformed.status, 400)
})

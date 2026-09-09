import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { register, signIn, signOut, getCurrentUser } from '../src/services/auth.js'

// In-memory browser storage keeps test accounts away from real browser data.
function createStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: createStorage(), configurable: true })
  Object.defineProperty(globalThis, 'sessionStorage', { value: createStorage(), configurable: true })
})

test('registration validates name, email, password length and confirmation', async () => {
  await assert.rejects(register(' ', 'a@example.com', 'testpass123', 'testpass123'), /name/)
  await assert.rejects(register('Test', 'invalid', 'testpass123', 'testpass123'), /email/)
  await assert.rejects(register('Test', 'a@example.com', 'short', 'short'), /password/)
  await assert.rejects(register('Test', 'a@example.com', 'testpass123', 'different'), /match/)
  assert.equal(localStorage.getItem('cyclewise-users'), null)
})

test('multiple accounts are normalised, hashed and independently signed in', async () => {
  const first = await register(' Test One ', ' FIRST@example.com ', 'testpass123', 'testpass123')
  const second = await register('Test Two', 'second@example.com', 'testpass123', 'testpass123')
  assert.equal(first.name, 'Test One')
  assert.equal(first.email, 'first@example.com')
  const stored = JSON.parse(localStorage.getItem('cyclewise-users'))
  assert.equal(stored.length, 2)
  assert.ok(!localStorage.getItem('cyclewise-users').includes('testpass123'))
  assert.notEqual(stored[0].passwordHash, stored[1].passwordHash)
  assert.notEqual(stored[0].salt, stored[1].salt)
  assert.equal(getCurrentUser(), null)
  assert.deepEqual(await signIn(' FIRST@example.com ', 'testpass123'), first)
  assert.deepEqual(getCurrentUser(), first)
  signOut()
  assert.equal(getCurrentUser(), null)
  assert.deepEqual(await signIn('second@example.com', 'testpass123'), second)
  assert.equal('passwordHash' in getCurrentUser(), false)
})

test('duplicate emails and incorrect credentials do not create a session', async () => {
  await register('Test', 'a@example.com', 'testpass123', 'testpass123')
  await assert.rejects(register('Other', 'A@example.com', 'anotherpass', 'anotherpass'), /already exists/)
  await assert.rejects(signIn('a@example.com', 'wrongpass'), /incorrect/)
  await assert.rejects(signIn('missing@example.com', 'testpass123'), /incorrect/)
  await assert.rejects(signIn('', ''), /enter/)
  assert.equal(getCurrentUser(), null)
})

test('corrupt account data is reported without being overwritten', async () => {
  for (const value of ['broken JSON', '{}', '[null]']) {
    localStorage.setItem('cyclewise-users', value)
    await assert.rejects(register('Test', 'a@example.com', 'testpass123', 'testpass123'), /Cannot read/)
    assert.equal(localStorage.getItem('cyclewise-users'), value)
  }
})

test('storage write failure is reported and stale sessions are not treated as users', async () => {
  sessionStorage.setItem('cyclewise-current-user', 'missing-id')
  assert.equal(getCurrentUser(), null)
  localStorage.setItem = () => { throw new Error('Storage blocked') }
  await assert.rejects(register('Test', 'a@example.com', 'testpass123', 'testpass123'), /Could not save/)
})

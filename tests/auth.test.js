import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { register, signIn, signOut, getCurrentUser, canAccessPage, listAccounts } from '../src/services/auth.js'
import { getSavedItems, toggleSavedItem } from '../src/services/savedItems.js'

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

test('guests cannot access protected data and members cannot read admin accounts', async () => {
  assert.equal(canAccessPage('saved', null), false)
  assert.equal(canAccessPage('admin', null), false)
  assert.equal(canAccessPage('unknown', null), false)
  assert.throws(listAccounts, /administrator/)
  assert.throws(getSavedItems, /sign in/)
  assert.throws(() => toggleSavedItem('guides', 'glass'), /sign in/)
  const user = await register('Member', 'member@example.com', 'testpass123', 'testpass123')
  assert.equal(user.role, 'member')
  await signIn(user.email, 'testpass123')
  assert.equal(canAccessPage('saved', getCurrentUser()), true)
  assert.equal(canAccessPage('admin', getCurrentUser()), false)
  assert.throws(listAccounts, /administrator/)
})

test('demo admin can read safe account details, but its email cannot be registered', async () => {
  await assert.rejects(register('Imposter', 'admin@cyclewise.example', 'testpass123', 'testpass123'), /already exists/)
  await register('Member', 'member@example.com', 'testpass123', 'testpass123')
  const admin = await signIn('admin@cyclewise.example', 'CycleWiseDemo123!')
  assert.equal(admin.role, 'admin')
  assert.equal(canAccessPage('admin', admin), true)
  const accounts = listAccounts()
  assert.equal(accounts.length, 2)
  assert.ok(accounts.every((user) => !('passwordHash' in user) && !('salt' in user)))
  signOut()
  assert.throws(listAccounts, /administrator/)
})

test('round 1 accounts without a role remain members', async () => {
  await register('Old Member', 'old@example.com', 'testpass123', 'testpass123')
  const accounts = JSON.parse(localStorage.getItem('cyclewise-users'))
  delete accounts[0].role
  localStorage.setItem('cyclewise-users', JSON.stringify(accounts))
  assert.equal((await signIn('old@example.com', 'testpass123')).role, 'member')
})

test('saved guides and events are isolated, restored, and removable per account', async () => {
  localStorage.setItem('cyclewise-saved-guides', '["glass"]')
  await register('First', 'first@example.com', 'testpass123', 'testpass123')
  await register('Second', 'second@example.com', 'testpass123', 'testpass123')
  await signIn('first@example.com', 'testpass123')
  assert.deepEqual(getSavedItems(), { guides: [], events: [] })
  toggleSavedItem('guides', 'glass')
  toggleSavedItem('events', 'repair-cafe')
  assert.deepEqual(getSavedItems(), { guides: ['glass'], events: ['repair-cafe'] })
  await signIn('second@example.com', 'testpass123')
  assert.deepEqual(getSavedItems(), { guides: [], events: [] })
  toggleSavedItem('guides', 'batteries')
  await signIn('first@example.com', 'testpass123')
  assert.deepEqual(getSavedItems(), { guides: ['glass'], events: ['repair-cafe'] })
  toggleSavedItem('guides', 'glass')
  assert.deepEqual(getSavedItems(), { guides: [], events: ['repair-cafe'] })
  assert.equal(localStorage.getItem('cyclewise-saved-guides'), '["glass"]')
})

test('invalid items and corrupt saved data are rejected without overwriting', async () => {
  const user = await register('Member', 'member@example.com', 'testpass123', 'testpass123')
  await signIn(user.email, 'testpass123')
  assert.throws(() => toggleSavedItem('guides', 'missing'), /not available/)
  assert.throws(() => toggleSavedItem('unknown', 'glass'), /not available/)
  const key = `cyclewise-saved-${user.id}`
  localStorage.setItem(key, 'broken JSON')
  assert.throws(getSavedItems, /Cannot read/)
  assert.throws(() => toggleSavedItem('guides', 'glass'), /Cannot read/)
  assert.equal(localStorage.getItem(key), 'broken JSON')
  localStorage.removeItem(key)
  localStorage.setItem = () => { throw new Error('Storage full') }
  assert.throws(() => toggleSavedItem('guides', 'glass'), /Could not save/)
})

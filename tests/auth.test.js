import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { connectAuth, register, signIn, signOut, getCurrentUser, canAccessPage, listAccounts } from '../src/services/auth.js'
import { getSavedItems, toggleSavedItem } from '../src/services/savedItems.js'
import { getGuideRating, rateGuide } from '../src/services/ratings.js'

function createStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
}

// A small fake SDK tests our integration without creating cloud users or sending requests.
function fakeFirebase() {
  const auth = { currentUser: null }
  const users = new Map()
  let listener = () => {}
  const api = {
    browserLocalPersistence: 'local',
    async setPersistence(client, persistence) { assert.equal(persistence, 'local') },
    onAuthStateChanged(client, changed) {
      listener = changed
      changed(client.currentUser)
      return () => { listener = () => {} }
    },
    async getIdTokenResult(user) { return { claims: user.claims || {} } },
    async createUserWithEmailAndPassword(client, email, password) {
      if (users.has(email)) throw { code: 'auth/email-already-in-use' }
      const user = { uid: `uid-${users.size + 1}`, email, displayName: null }
      users.set(email, { user, password })
      client.currentUser = user
      await listener(user)
      return { user }
    },
    async updateProfile(user, profile) { user.displayName = profile.displayName },
    async signInWithEmailAndPassword(client, email, password) {
      const record = users.get(email)
      if (!record || record.password !== password) throw { code: 'auth/invalid-credential' }
      client.currentUser = record.user
      await listener(record.user)
      return { user: record.user }
    },
    async signOut(client) { client.currentUser = null; await listener(null) },
  }
  return { auth, api, changeUser(user) { auth.currentUser = user; return listener(user) } }
}

let provider
beforeEach(async () => {
  Object.defineProperty(globalThis, 'localStorage', { value: createStorage(), configurable: true })
  Object.defineProperty(globalThis, 'sessionStorage', { value: createStorage(), configurable: true })
  provider = fakeFirebase()
  await connectAuth(provider.auth, provider.api, () => {}, () => {})
})

test('registration validates name, email, password and confirmation before calling Firebase', async () => {
  let calls = 0
  provider.api.createUserWithEmailAndPassword = async () => { calls++ }
  await assert.rejects(register(' ', 'a@example.com', 'testpass123', 'testpass123'), /name/)
  await assert.rejects(register('Test', 'invalid', 'testpass123', 'testpass123'), /email/)
  await assert.rejects(register('Test', 'a@example.com', 'short', 'short'), /password/)
  await assert.rejects(register('Test', 'a@example.com', 'testpass123', 'different'), /match/)
  assert.equal(calls, 0)
})

test('Firebase registration normalises inputs, saves the profile and signs in automatically', async () => {
  const user = await register(' First Member ', ' FIRST@example.com ', 'testpass123', 'testpass123')
  assert.deepEqual(user, { id: 'firebase:uid-1', name: 'First Member', email: 'first@example.com', role: 'member' })
  assert.deepEqual(getCurrentUser(), user)
  assert.equal(localStorage.getItem('cyclewise-users'), null)
  assert.equal(sessionStorage.getItem('cyclewise-current-user'), null)
  assert.ok(!JSON.stringify(user).includes('testpass123'))
})

test('duplicate email and incorrect credentials show clear errors', async () => {
  await register('First', 'first@example.com', 'testpass123', 'testpass123')
  await signOut()
  await assert.rejects(register('Other', 'FIRST@example.com', 'testpass123', 'testpass123'), /already exists/)
  await assert.rejects(signIn('first@example.com', 'wrong'), /incorrect/)
  await assert.rejects(signIn('missing@example.com', 'testpass123'), /incorrect/)
  assert.equal(getCurrentUser(), null)
  assert.equal((await signIn(' FIRST@example.com ', 'testpass123')).name, 'First')
})

test('empty and oversized login input is rejected before SDK requests', async () => {
  let calls = 0
  provider.api.signInWithEmailAndPassword = async () => { calls++ }
  await assert.rejects(signIn('', ''), /enter/)
  await assert.rejects(signIn('x'.repeat(255), 'testpass123'), /too long/)
  await assert.rejects(signIn('a@example.com', 'x'.repeat(129)), /too long/)
  assert.equal(calls, 0)
})

test('Firebase persistence restores the same identity on a new subscription', async () => {
  const user = await register('First', 'first@example.com', 'testpass123', 'testpass123')
  let notifications = 0
  const unsubscribe = await connectAuth(provider.auth, provider.api, () => { notifications++ }, () => {})
  await new Promise((resolve) => setImmediate(resolve))
  assert.deepEqual(getCurrentUser(), user)
  assert.equal(notifications, 1)
  unsubscribe()
})

test('old browser sessions and edited local roles cannot impersonate cloud users', () => {
  localStorage.setItem('cyclewise-users', '[{"id":"demo-admin","name":"Admin","email":"admin@cyclewise.example","role":"admin"}]')
  sessionStorage.setItem('cyclewise-current-user', 'demo-admin')
  assert.equal(getCurrentUser(), null)
  assert.throws(listAccounts, /administrator/)
  assert.equal(canAccessPage('saved', null), false)
  assert.equal(canAccessPage('admin', null), false)
})

test('normal registration never self-assigns an administrator role', async () => {
  const user = await register('Admin', 'admin@cyclewise.example', 'testpass123', 'testpass123')
  provider.auth.currentUser.role = 'admin'
  assert.equal(user.role, 'member')
  assert.equal(getCurrentUser().role, 'member')
  assert.throws(listAccounts, /administrator/)
})

test('a string admin claim is not treated as administrator permission', async () => {
  await register('Member', 'member@example.com', 'testpass123', 'testpass123')
  provider.auth.currentUser.claims = { admin: 'true' }
  await connectAuth(provider.auth, provider.api, () => {}, () => {})
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(getCurrentUser().role, 'member')
})

test('an old token response cannot restore privileges after a user signs out', async () => {
  await register('Member', 'member@example.com', 'testpass123', 'testpass123')
  let resolveToken
  provider.api.getIdTokenResult = () => new Promise((resolve) => { resolveToken = resolve })
  await connectAuth(provider.auth, provider.api, () => {}, () => {})
  await signOut()
  resolveToken({ claims: { admin: true } })
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(getCurrentUser(), null)
  assert.throws(listAccounts, /administrator/)
})

test('switching accounts immediately clears the old identity and admin UI', async () => {
  const first = { uid: 'first', email: 'first@example.com', displayName: 'First', claims: { admin: true } }
  let visibleUser
  await connectAuth(provider.auth, provider.api, () => { visibleUser = getCurrentUser() }, () => {})
  await provider.changeUser(first)
  assert.equal(visibleUser.role, 'admin')
  let resolveToken
  provider.api.getIdTokenResult = () => new Promise((resolve) => { resolveToken = resolve })
  const pending = provider.changeUser({ uid: 'second', email: 'second@example.com', displayName: 'Second' })
  assert.equal(visibleUser.id, 'firebase:second')
  assert.equal(visibleUser.role, 'member')
  resolveToken({ claims: {} })
  await pending
})

test('old permission results cannot grant admin after the same account logs in again', async () => {
  const resolvers = []
  provider.api.getIdTokenResult = () => new Promise((resolve) => { resolvers.push(resolve) })
  const user = { uid: 'repeat', email: 'repeat@example.com' }
  const oldLogin = provider.changeUser(user)
  await provider.changeUser(null)
  const newLogin = provider.changeUser({ ...user })
  resolvers[1]({ claims: {} })
  await newLogin
  assert.equal(getCurrentUser().role, 'member')
  resolvers[0]({ claims: { admin: true } })
  await oldLogin
  assert.equal(getCurrentUser().role, 'member')
})

test('unsubscribing ignores an in-flight permission result', async () => {
  let resolveToken
  let changes = 0
  provider.api.getIdTokenResult = () => new Promise((resolve) => { resolveToken = resolve })
  const unsubscribe = await connectAuth(provider.auth, provider.api, () => { changes++ }, () => {})
  const pending = provider.changeUser({ uid: 'leaving', email: 'leaving@example.com' })
  const before = changes
  unsubscribe()
  resolveToken({ claims: { admin: true } })
  await pending
  assert.equal(changes, before)
  assert.equal(getCurrentUser().role, 'member')
})

test('only a boolean admin custom claim enables the legacy read-only account view', async () => {
  await register('Admin', 'admin@example.com', 'testpass123', 'testpass123')
  provider.auth.currentUser.claims = { admin: true }
  await connectAuth(provider.auth, provider.api, () => {}, () => {})
  await new Promise((resolve) => setImmediate(resolve))
  localStorage.setItem('cyclewise-users', '[{"id":"old","name":"Old","email":"old@example.com","role":"admin","passwordHash":"secret"}]')
  assert.equal(getCurrentUser().role, 'admin')
  assert.deepEqual(listAccounts(), [{ id: 'old', name: 'Old', email: 'old@example.com', role: 'member' }])
  await signOut()
  assert.throws(listAccounts, /administrator/)
})

test('a failed permissions check does not grant admin and reports an error', async () => {
  await register('Member', 'member@example.com', 'testpass123', 'testpass123')
  provider.api.getIdTokenResult = async () => { throw new Error('Network failure') }
  let error = ''
  await connectAuth(provider.auth, provider.api, () => {}, (issue) => { error = issue.message })
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(getCurrentUser().role, 'member')
  assert.match(error, /permissions/)
})

test('persistence failure prevents authentication and is not replaced by local login', async () => {
  provider.api.setPersistence = async () => { throw new Error('Storage unavailable') }
  await assert.rejects(connectAuth(provider.auth, provider.api, () => {}, () => {}), /Storage unavailable/)
  assert.equal(getCurrentUser(), null)
  await assert.rejects(signIn('a@example.com', 'testpass123'), /unavailable/)
})

test('SDK network errors and unknown errors do not disclose raw service messages', async () => {
  provider.api.signInWithEmailAndPassword = async () => { throw { code: 'auth/network-request-failed' } }
  await assert.rejects(signIn('a@example.com', 'testpass123'), /connection/)
  provider.api.signInWithEmailAndPassword = async () => { throw new Error('private-provider-diagnostic') }
  await assert.rejects(signIn('a@example.com', 'testpass123'), /could not be completed/)
})

test('profile failure after registration reports partial success instead of asking for another registration', async () => {
  provider.api.updateProfile = async () => { throw new Error('Network failure') }
  await assert.rejects(register('Member', 'member@example.com', 'testpass123', 'testpass123'), /account was created/)
  assert.equal(getCurrentUser().email, 'member@example.com')
})

test('saved items stay isolated by Firebase UID and do not overwrite old local saved data', async () => {
  localStorage.setItem('cyclewise-saved-old-id', '{"guides":["glass"],"events":[]}')
  const first = await register('First', 'first@example.com', 'testpass123', 'testpass123')
  assert.deepEqual(getSavedItems(), { guides: [], events: [] })
  toggleSavedItem('guides', 'glass')
  toggleSavedItem('events', 'repair-cafe')
  await register('Second', 'second@example.com', 'testpass123', 'testpass123')
  assert.deepEqual(getSavedItems(), { guides: [], events: [] })
  toggleSavedItem('guides', 'batteries')
  await signIn('first@example.com', 'testpass123')
  assert.deepEqual(getSavedItems(), { guides: ['glass'], events: ['repair-cafe'] })
  toggleSavedItem('guides', 'glass')
  assert.deepEqual(getSavedItems(), { guides: [], events: ['repair-cafe'] })
  assert.ok(localStorage.getItem(`cyclewise-saved-${first.id}`))
  assert.equal(localStorage.getItem('cyclewise-saved-old-id'), '{"guides":["glass"],"events":[]}')
})

test('invalid saved items, corrupt data and failed writes are rejected without data loss', async () => {
  const user = await register('Member', 'member@example.com', 'testpass123', 'testpass123')
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

test('ratings reject invalid scores and guides and require authentication', async () => {
  assert.deepEqual(getGuideRating('glass'), { count: 0, average: null, ownScore: '' })
  assert.throws(() => rateGuide('glass', 5), /sign in/)
  await register('Rater', 'rater@example.com', 'testpass123', 'testpass123')
  for (const score of [0, 6, 2.5, NaN, '5', '<script>']) assert.throws(() => rateGuide('glass', score), /whole number/)
  assert.throws(() => rateGuide('missing', 5), /not found/)
})

test('ratings aggregate Firebase identities and replace the same account vote', async () => {
  const first = await register('First', 'first@example.com', 'testpass123', 'testpass123')
  rateGuide('glass', 5)
  const second = await register('Second', 'second@example.com', 'testpass123', 'testpass123')
  rateGuide('glass', 3)
  assert.deepEqual(getGuideRating('glass', second.id), { count: 2, average: '4.0', ownScore: 3 })
  rateGuide('glass', 1)
  assert.deepEqual(getGuideRating('glass', first.id), { count: 2, average: '3.0', ownScore: 5 })
  await signOut()
  assert.deepEqual(getGuideRating('glass'), { count: 2, average: '3.0', ownScore: '' })
})

test('damaged ratings, duplicate votes and failed writes are not silently overwritten', async () => {
  const user = await register('Rater', 'rater@example.com', 'testpass123', 'testpass123')
  const rating = { userId: user.id, guideId: 'glass', score: 3 }
  for (const value of ['broken', '{}', '[null]', '[{"userId":"x","guideId":"glass","score":9}]', JSON.stringify([rating, rating])]) {
    localStorage.setItem('cyclewise-ratings', value)
    assert.throws(() => getGuideRating('glass'), /Cannot read/)
    assert.throws(() => rateGuide('glass', 5), /Cannot read/)
    assert.equal(localStorage.getItem('cyclewise-ratings'), value)
  }
  localStorage.removeItem('cyclewise-ratings')
  rateGuide('glass', 3)
  const saved = localStorage.getItem('cyclewise-ratings')
  localStorage.setItem = () => { throw new Error('Storage full') }
  assert.throws(() => rateGuide('glass', 5), /Could not save/)
  assert.equal(localStorage.getItem('cyclewise-ratings'), saved)
})

test('signing out blocks protected pages, saved-item writes and rating writes', async () => {
  await register('Member', 'member@example.com', 'testpass123', 'testpass123')
  rateGuide('glass', 5)
  const original = localStorage.getItem('cyclewise-ratings')
  await signOut()
  assert.equal(getCurrentUser(), null)
  assert.equal(canAccessPage('saved', getCurrentUser()), false)
  assert.throws(() => toggleSavedItem('guides', 'glass'), /sign in/)
  assert.throws(() => rateGuide('glass', 1), /sign in/)
  assert.equal(localStorage.getItem('cyclewise-ratings'), original)
})

test('failed sign-out keeps the actual provider identity rather than reporting a fake logout', async () => {
  await register('Member', 'member@example.com', 'testpass123', 'testpass123')
  provider.api.signOut = async () => { throw { code: 'auth/network-request-failed' } }
  await assert.rejects(signOut(), /connection/)
  assert.ok(getCurrentUser())
})

test('corrupt legacy account data does not prevent cloud registration or get deleted', async () => {
  localStorage.setItem('cyclewise-users', 'broken JSON')
  await register('Member', 'member@example.com', 'testpass123', 'testpass123')
  assert.equal(getCurrentUser().name, 'Member')
  assert.equal(localStorage.getItem('cyclewise-users'), 'broken JSON')
})

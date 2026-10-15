import { getFirebaseServices } from './firebase.js'

let authClient = null
let authApi = null
let adminUid = null
let sessionVersion = 0
let sessionChanged = () => {}

function authMessage(issue) {
  const messages = {
    'auth/email-already-in-use': 'An account with this email already exists. Please sign in.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/invalid-login-credentials': 'Email or password is incorrect.',
    'auth/user-not-found': 'Email or password is incorrect.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Please use a stronger password with at least 8 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/network-request-failed': 'Cannot reach Firebase. Check your connection and try again.',
    'auth/operation-not-allowed': 'Email and password sign-in is not enabled in Firebase.',
  }
  return messages[issue.code] || 'Authentication could not be completed. Please try again.'
}

function requireAuth() {
  if (!authClient || !authApi) throw new Error('Cloud sign-in is unavailable. Check the Firebase configuration and reload.')
}

// The SDK supplies identity; old browser account data cannot grant a session or role.
export function getCurrentUser() {
  const user = authClient?.currentUser
  if (!user) return null
  return {
    id: `firebase:${user.uid}`,
    name: user.displayName || user.email?.split('@')[0] || 'Member',
    email: user.email,
    role: adminUid === user.uid ? 'admin' : 'member',
  }
}

// Accept an SDK client here so account tests can use isolated in-memory identities.
export async function connectAuth(client, api, onChange, onError) {
  sessionVersion++
  authClient = null
  authApi = null
  adminUid = null
  await api.setPersistence(client, api.browserLocalPersistence)
  authClient = client
  authApi = api
  sessionChanged = onChange
  let active = true
  const unsubscribe = api.onAuthStateChanged(client, async (user) => {
    if (!active) return
    const version = ++sessionVersion
    adminUid = null
    // Show the new identity immediately. A late permissions result cannot update a newer session.
    onChange()
    if (!user) return
    try {
      const token = await api.getIdTokenResult(user)
      if (!active || version !== sessionVersion || client.currentUser?.uid !== user.uid) return
      if (token.claims.admin === true) {
        adminUid = user.uid
        onChange()
      }
    } catch {
      if (!active || version !== sessionVersion || client.currentUser?.uid !== user.uid) return
      onError(new Error('Could not check account permissions. Administrator access is unavailable.'))
    }
  }, () => {
    if (!active) return
    sessionVersion++
    adminUid = null
    authClient = null
    onChange()
    onError(new Error('Could not restore your cloud session. Reload the page and try again.'))
  })
  return () => { active = false; unsubscribe() }
}

export async function startAuth(onChange, onError) {
  const { auth } = await getFirebaseServices()
  const api = await import('firebase/auth')
  return connectAuth(auth, api, onChange, onError)
}

export async function register(name, email, password, confirmation) {
  name = name.trim()
  email = email.trim().toLowerCase()
  if (name.length < 2 || name.length > 50) throw new Error('Please enter a name between 2 and 50 characters.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Please enter a valid email address.')
  if (password.trim().length < 8 || password.length > 128) throw new Error('Please use a password between 8 and 128 characters.')
  if (password !== confirmation) throw new Error('The passwords do not match.')
  requireAuth()
  let created = false
  try {
    const result = await authApi.createUserWithEmailAndPassword(authClient, email, password)
    created = true
    await authApi.updateProfile(result.user, { displayName: name })
    sessionChanged()
    return getCurrentUser()
  } catch (issue) {
    if (created) throw new Error('Your account was created, but the name could not be saved. Do not register again; you can sign in with your email.')
    throw new Error(authMessage(issue))
  }
}

export async function signIn(email, password) {
  if (!email.trim() || !password) throw new Error('Please enter your email and password.')
  if (email.length > 254 || password.length > 128) throw new Error('Email or password is too long.')
  requireAuth()
  try {
    await authApi.signInWithEmailAndPassword(authClient, email.trim().toLowerCase(), password)
    sessionChanged()
    return getCurrentUser()
  } catch (issue) {
    throw new Error(authMessage(issue))
  }
}

export async function signOut() {
  requireAuth()
  try {
    await authApi.signOut(authClient)
    adminUid = null
    sessionChanged()
  } catch (issue) {
    throw new Error(authMessage(issue))
  }
}

export function canAccessPage(page, user) {
  if (page === 'learn' || page === 'account' || page === 'directory') return true
  if (page === 'saved' || page === 'email') return Boolean(user)
  if (page === 'admin') return user?.role === 'admin'
  return false
}

export function requireUser() {
  const user = getCurrentUser()
  if (!user) throw new Error('Please sign in to use this feature.')
  return user
}

// Read-only old browser data, not a list of Firebase users.
export function listAccounts() {
  if (!canAccessPage('admin', getCurrentUser())) throw new Error('Only an administrator can view local accounts.')
  try {
    const users = JSON.parse(localStorage.getItem('cyclewise-users') || '[]')
    if (!Array.isArray(users) || !users.every((user) => user &&
      typeof user.id === 'string' && typeof user.name === 'string' && typeof user.email === 'string')) throw new Error('Invalid data')
    return users.map((user) => ({ id: user.id, name: user.name, email: user.email, role: 'member' }))
  } catch {
    throw new Error('Cannot read legacy browser accounts. Existing data has not been changed.')
  }
}

// Local coursework accounts only. Browser storage is not a trusted server.
const usersKey = 'cyclewise-users'
const sessionKey = 'cyclewise-current-user'

function readUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(usersKey) || '[]')
    if (!Array.isArray(users) || !users.every((user) =>
      user && typeof user.id === 'string' && typeof user.name === 'string' &&
      typeof user.email === 'string' && typeof user.salt === 'string' &&
      typeof user.passwordHash === 'string')) {
      throw new Error('Invalid accounts')
    }
    return users
  } catch {
    throw new Error('Cannot read local accounts. Check that browser storage is available and account data is valid.')
  }
}

// PBKDF2 derives a password hash; a different random salt is used for each account.
// Reference: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveBits
async function hashPassword(password, salt) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 600000, hash: 'SHA-256' },
    key, 256,
  )
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function accountDetails(user) {
  return { id: user.id, name: user.name, email: user.email }
}

export async function register(name, email, password, confirmation) {
  name = name.trim()
  email = email.trim().toLowerCase()
  if (name.length < 2 || name.length > 50) {
    throw new Error('Please enter a name between 2 and 50 characters.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error('Please enter a valid email address.')
  }
  if (password.trim().length < 8 || password.length > 128) {
    throw new Error('Please use a password between 8 and 128 characters.')
  }
  if (password !== confirmation) {
    throw new Error('The passwords do not match.')
  }
  const users = readUsers()
  if (users.some((user) => user.email === email)) {
    throw new Error('An account with this email already exists. Please sign in.')
  }
  const salt = crypto.randomUUID()
  const passwordHash = await hashPassword(password, salt)
  // Read again after the asynchronous hash so another registration is not overwritten.
  const latestUsers = readUsers()
  if (latestUsers.some((user) => user.email === email)) {
    throw new Error('An account with this email already exists. Please sign in.')
  }
  const user = { id: crypto.randomUUID(), name, email, salt, passwordHash }
  try {
    localStorage.setItem(usersKey, JSON.stringify([...latestUsers, user]))
  } catch {
    throw new Error('Could not save your account. Check browser storage and try again.')
  }
  return accountDetails(user)
}

export async function signIn(email, password) {
  if (!email.trim() || !password) {
    throw new Error('Please enter your email and password.')
  }
  const user = readUsers().find((item) => item.email === email.trim().toLowerCase())
  if (!user || await hashPassword(password, user.salt) !== user.passwordHash) {
    throw new Error('Email or password is incorrect.')
  }
  try {
    sessionStorage.setItem(sessionKey, user.id)
  } catch {
    throw new Error('Could not start a session. Please enable browser storage.')
  }
  return accountDetails(user)
}

export function getCurrentUser() {
  const id = sessionStorage.getItem(sessionKey)
  if (!id) return null
  const user = readUsers().find((item) => item.id === id)
  return user ? accountDetails(user) : null
}

export function signOut() {
  sessionStorage.removeItem(sessionKey)
}

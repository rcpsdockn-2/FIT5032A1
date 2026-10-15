import { readFirebaseConfig } from './firebaseConfig.js'

export const firebaseSetup = readFirebaseConfig(import.meta.env)

// Create SDK clients only when requested; missing configuration cannot break other pages.
export async function getFirebaseServices() {
  if (firebaseSetup.missingFields.length) {
    throw new Error('Firebase is not configured. Fill in .env.local and restart the development server.')
  }
  const { getApps, initializeApp } = await import('firebase/app')
  const { getAuth } = await import('firebase/auth')
  const { getFirestore } = await import('firebase/firestore')
  const app = getApps().find((item) => item.name === 'cyclewise')
    || initializeApp(firebaseSetup.config, 'cyclewise')
  return { auth: getAuth(app), db: getFirestore(app) }
}

const configFields = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
}

export function readFirebaseConfig(environment) {
  const config = {}
  const missingFields = []
  for (const [field, variable] of Object.entries(configFields)) {
    const value = typeof environment[variable] === 'string' ? environment[variable].trim() : ''
    if (!value || value === 'replace-me' || value.startsWith('your-')) {
      missingFields.push(variable)
    }
    config[field] = value
  }
  return { config, missingFields }
}

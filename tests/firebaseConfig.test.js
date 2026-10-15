import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFirebaseConfig } from '../src/services/firebaseConfig.js'

const exampleEnvironment = {
  VITE_FIREBASE_API_KEY: 'example-web-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'example.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'example',
  VITE_FIREBASE_STORAGE_BUCKET: 'example.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: '1:123456789:web:example',
}

test('complete Firebase configuration maps environment names to SDK options', () => {
  const result = readFirebaseConfig(exampleEnvironment)
  assert.deepEqual(result.missingFields, [])
  assert.deepEqual(result.config, {
    apiKey: 'example-web-api-key', authDomain: 'example.firebaseapp.com',
    projectId: 'example', storageBucket: 'example.firebasestorage.app',
    messagingSenderId: '123456789', appId: '1:123456789:web:example',
  })
})

test('missing configuration is returned as data rather than throwing', () => {
  const result = readFirebaseConfig({})
  assert.equal(result.missingFields.length, 6)
  assert.ok(result.missingFields.includes('VITE_FIREBASE_PROJECT_ID'))
})

test('whitespace is trimmed without changing the source environment', () => {
  const environment = { ...exampleEnvironment, VITE_FIREBASE_PROJECT_ID: ' example ' }
  assert.equal(readFirebaseConfig(environment).config.projectId, 'example')
  assert.equal(environment.VITE_FIREBASE_PROJECT_ID, ' example ')
})

test('empty, non-string and placeholder settings are reported by variable name only', () => {
  for (const value of ['', '   ', undefined, null, 123, 'replace-me', 'your-project-id']) {
    const result = readFirebaseConfig({ ...exampleEnvironment, VITE_FIREBASE_PROJECT_ID: value })
    assert.deepEqual(result.missingFields, ['VITE_FIREBASE_PROJECT_ID'])
  }
})

test('unrelated server settings are not copied into Firebase client configuration', () => {
  const result = readFirebaseConfig({ ...exampleEnvironment, SERVER_SECRET: 'never-copy-this' })
  assert.equal(Object.keys(result.config).length, 6)
  assert.equal(JSON.stringify(result).includes('never-copy-this'), false)
})

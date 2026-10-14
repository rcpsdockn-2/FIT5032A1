import { test } from 'node:test'
import assert from 'node:assert/strict'
import { recyclingPlaces, communityEvents } from '../src/data/directoryData.js'
import { canAccessPage } from '../src/services/auth.js'

test('directory is public without opening protected pages', () => {
  for (const user of [null, { role: 'member' }, { role: 'admin' }]) {
    assert.equal(canAccessPage('directory', user), true)
  }
  assert.equal(canAccessPage('saved', null), false)
  assert.equal(canAccessPage('admin', { role: 'member' }), false)
  assert.equal(canAccessPage('missing', null), false)
})

test('both directory datasets have unique IDs and enough rows for later pagination', () => {
  for (const rows of [recyclingPlaces, communityEvents]) {
    assert.ok(rows.length > 10)
    assert.equal(new Set(rows.map((row) => row.id)).size, rows.length)
    assert.ok(rows.every((row) => typeof row.id === 'string' && row.id.length > 0))
  }
})

test('every place supplies the four displayed columns', () => {
  for (const place of recyclingPlaces) {
    for (const key of ['name', 'suburb', 'category', 'hours']) {
      assert.equal(typeof place[key], 'string')
      assert.ok(place[key].trim().length > 0)
    }
    assert.ok(['E-waste', 'Repair', 'Container return'].includes(place.category))
  }
})

test('every event supplies valid display data and a calendar date', () => {
  for (const event of communityEvents) {
    for (const key of ['title', 'suburb', 'type', 'date']) {
      assert.equal(typeof event[key], 'string')
      assert.ok(event[key].trim().length > 0)
    }
    assert.match(event.date, /^\d{4}-\d{2}-\d{2}$/)
    assert.equal(new Date(event.date).toISOString().slice(0, 10), event.date)
    assert.ok(['Repair', 'Swap', 'Workshop'].includes(event.type))
  }
})

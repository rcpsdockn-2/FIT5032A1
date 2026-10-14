import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterAndSortRows, paginateRows } from '../src/services/tableData.js'
import { recyclingPlaces, communityEvents } from '../src/data/directoryData.js'

test('column filters trim spaces, ignore case and combine conditions', () => {
  assert.equal(filterAndSortRows(recyclingPlaces, { suburb: ' FOOTSCRAY ', category: 'e-WASTE' }, '', '').length, 1)
  assert.equal(filterAndSortRows(recyclingPlaces, { suburb: 'Footscray', category: 'Repair' }, '', '').length, 0)
  assert.equal(filterAndSortRows(recyclingPlaces, { name: '', hours: ' ' }, '', '').length, 12)
})

test('every displayed column can be searched in both datasets', () => {
  for (const [rows, keys] of [
    [recyclingPlaces, ['name', 'suburb', 'category', 'hours']],
    [communityEvents, ['title', 'suburb', 'type', 'date']],
  ]) {
    for (const key of keys) {
      const result = filterAndSortRows(rows, { [key]: rows[0][key] }, '', '')
      assert.ok(result.some((row) => row.id === rows[0].id))
    }
  }
})

test('sorting works in both directions without modifying source data', () => {
  const original = structuredClone(recyclingPlaces)
  const ascending = filterAndSortRows(recyclingPlaces, {}, 'name', 'ascending')
  const descending = filterAndSortRows(recyclingPlaces, {}, 'name', 'descending')
  assert.deepEqual(descending.map((row) => row.id), ascending.map((row) => row.id).reverse())
  assert.equal(ascending[0].name, 'Community Cable Collection')
  assert.deepEqual(recyclingPlaces, original)
  assert.notEqual(ascending, recyclingPlaces)
})

test('event date sorting orders the calendar dates', () => {
  assert.equal(filterAndSortRows(communityEvents, {}, 'date', 'ascending')[0].date, '2026-11-01')
  assert.equal(filterAndSortRows(communityEvents, {}, 'date', 'descending')[0].date, '2026-11-12')
})

test('pagination limits each page to ten rows and keeps the remaining rows', () => {
  for (const rows of [recyclingPlaces, communityEvents]) {
    const first = paginateRows(rows, 1)
    const second = paginateRows(rows, 2)
    assert.equal(first.rows.length, 10)
    assert.equal(second.rows.length, 2)
    assert.equal(first.totalPages, 2)
    assert.equal(first.total, 12)
    assert.deepEqual([...first.rows, ...second.rows], rows)
  }
})

test('empty results and out-of-range pages have safe boundaries', () => {
  assert.deepEqual(paginateRows([], 2), { rows: [], page: 1, totalPages: 1, total: 0 })
  assert.equal(paginateRows(recyclingPlaces, 99).page, 2)
  assert.equal(paginateRows(recyclingPlaces, 0).page, 1)
  const filtered = filterAndSortRows(recyclingPlaces, { category: 'Repair' }, '', '')
  assert.equal(paginateRows(filtered, 2).page, 1)
  assert.equal(paginateRows(filtered, 2).rows.length, 4)
})

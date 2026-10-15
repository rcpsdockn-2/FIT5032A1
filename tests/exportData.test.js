import test from 'node:test'
import assert from 'node:assert/strict'
import { createCsv, createPrintReport } from '../src/services/exportData.js'
import { filterAndSortRows } from '../src/services/tableData.js'
import { recyclingPlaces, communityEvents } from '../src/data/directoryData.js'

const columns = [{ key: 'name', label: 'Name' }, { key: 'note', label: 'Note' }]

test('CSV has UTF-8 BOM, CRLF, column order and escaped cells', () => {
  assert.equal(createCsv([{ name: '墨尔本', note: 'a,"b"\nc' }], columns),
    '\uFEFF"Name","Note"\r\n"墨尔本","a,""b""\nc"\r\n')
})
test('CSV neutralises spreadsheet formulas including leading whitespace', () => {
  for (const name of ['=1+1', '+SUM(A1)', '-1+2', '@CMD', ' \t=1']) {
    assert.ok(createCsv([{ name }], columns).includes(`"'${name}"`))
  }
})
test('missing values and no matches still produce valid CSV headers', () => {
  assert.equal(createCsv([], columns), '\uFEFF"Name","Note"\r\n')
  assert.equal(createCsv([{}], columns), '\uFEFF"Name","Note"\r\n"",""\r\n')
})
test('exports include all twelve entries, not just one page, for both datasets', () => {
  for (const rows of [recyclingPlaces, communityEvents]) {
    const csv = createCsv(rows, [{ key: 'id', label: 'ID' }])
    assert.equal(csv.split('\r\n').length - 2, 12)
    for (const row of rows) assert.ok(csv.includes(`"${row.id}"`))
  }
})
test('export preserves filtered order without changing the original rows', () => {
  const rows = [{ name: 'Beta', note: 'yes' }, { name: 'Alpha', note: 'yes' }, { name: 'Other', note: 'no' }]
  const filtered = filterAndSortRows(rows, { note: 'yes' }, 'name', 'ascending')
  assert.equal(createCsv(filtered, columns), '\uFEFF"Name","Note"\r\n"Alpha","yes"\r\n"Beta","yes"\r\n')
  assert.equal(rows[0].name, 'Beta')
})
test('print report escapes all dynamic HTML and includes accessible table and PDF instructions', () => {
  const html = createPrintReport('<script>alert(1)</script>', [{ name: '<img src=x onerror=alert(1)>', note: '" & \' ' }], columns)
  assert.doesNotMatch(html, /<script>|<img/)
  assert.match(html, /&lt;script&gt;/)
  assert.match(html, /&quot; &amp; &#39;/)
  assert.match(html, /<html lang="en">/)
  assert.match(html, /scope="row"/)
  assert.match(html, /scope="col"/)
  assert.match(html, /@media print/)
  assert.match(html, /window.print\(\)/)
  assert.match(html, /1 matching entries/)
})

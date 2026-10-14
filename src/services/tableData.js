export function filterAndSortRows(rows, filters, sortKey, sortDirection) {
  const filtered = rows.filter((row) => {
    return Object.entries(filters).every(([key, value]) => {
      const search = value.trim().toLowerCase()
      return String(row[key] ?? '').toLowerCase().includes(search)
    })
  })

  if (!sortKey) return filtered

  return filtered.sort((first, second) => {
    const comparison = String(first[sortKey] ?? '').localeCompare(
      String(second[sortKey] ?? ''), 'en', { sensitivity: 'base', numeric: true },
    )
    return sortDirection === 'descending' ? -comparison : comparison
  })
}

export function paginateRows(rows, requestedPage) {
  const totalPages = Math.max(1, Math.ceil(rows.length / 10))
  const page = Math.max(1, Math.min(requestedPage, totalPages))
  const start = (page - 1) * 10
  return { rows: rows.slice(start, start + 10), page, totalPages, total: rows.length }
}

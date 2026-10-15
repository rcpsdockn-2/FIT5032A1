// Quote every cell so commas, quotes and newlines remain in one spreadsheet cell.
export function createCsv(rows, columns) {
  function cell(value) {
    let text = String(value ?? '')
    // Prevent a spreadsheet from treating untrusted text as a formula.
    if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) text = `'${text}`
    return `"${text.replaceAll('"', '""')}"`
  }
  const lines = [columns.map((column) => cell(column.label)).join(',')]
  for (const row of rows) lines.push(columns.map((column) => cell(row[column.key])).join(','))
  return '\uFEFF' + lines.join('\r\n') + '\r\n'
}

export function createPrintReport(title, rows, columns) {
  function escape(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character])
  }
  const headings = columns.map((column) => `<th scope="col">${escape(column.label)}</th>`).join('')
  const body = rows.map((row) => '<tr>' + columns.map((column, index) =>
    index === 0 ? `<th scope="row">${escape(row[column.key])}</th>` : `<td>${escape(row[column.key])}</td>`,
  ).join('') + '</tr>').join('')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escape(title)} - CycleWise report</title>
    <style>body{font:16px/1.5 system-ui,sans-serif;color:#17344b;margin:24px}
    table{border-collapse:collapse;width:100%}th,td{border:1px solid #61717c;padding:8px;text-align:left;overflow-wrap:anywhere}
    tbody th{font-weight:normal}button{font:inherit;padding:12px;color:white;background:#235d8d;border:0}
    button:focus-visible{outline:3px solid #17344b;outline-offset:3px}
    @media print{button,.print-help{display:none}thead{display:table-header-group}tr{break-inside:avoid}body{margin:0;font-size:11pt}}
    @page{size:A4;margin:15mm}</style></head><body><main>
    <h1>${escape(title)}</h1><p>CycleWise Melbourne · Fictional demonstration data, not confirmed services or bookings.</p>
    <p>${rows.length} matching entries. Includes all filtered results in the selected sort order, not just the current page.</p>
    <p class="print-help">Use Print / Save as PDF, then choose Save as PDF in your browser. You can also cancel and return to the directory tab.</p>
    <button type="button" onclick="window.print()">Print / Save as PDF</button>
    <table><caption>${escape(title)}: ${rows.length} entries</caption><thead><tr>${headings}</tr></thead><tbody>${body}</tbody></table>
    </main></body></html>`
}

export function downloadCsv(filename, content) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function openPrintReport(content) {
  const report = window.open('', '_blank')
  if (!report) throw new Error('Allow the report popup for this site and try again.')
  report.opener = null
  report.document.write(content)
  report.document.close()
}

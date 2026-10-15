# Accessibility and data export

## E.3: accessibility

The app uses native links, buttons, labels, tables, selects and disclosure controls.
There are no custom keyboard widgets, media players, CAPTCHA, drag-only actions,
automatic redirects or timed forms. The document language is English.

| WCAG 2.1 A/AA area | Implementation |
| --- | --- |
| 1.1.1, 1.3.1 | Decorative symbols are hidden from assistive technology. Tables have captions, row/column headers and sort state. The map has a labelled region, destination buttons and equivalent text directions. |
| 1.3.2, 1.3.5 | DOM reading order follows the visible page. Account fields have appropriate autocomplete values. |
| 1.4.1, 1.4.3, 1.4.11 | Error and selection messages are not colour-only. Text, form borders and focus indicators use contrasting colours; palette contrast has regression tests. |
| 1.4.4, 1.4.10, 1.4.12 | Flexible layouts support enlarged text and spacing. Long navigation links wrap. Data tables scroll in their own labelled, focusable region instead of widening the whole page. |
| 2.1.1, 2.1.2, 2.5.1 | Controls work with the keyboard. A list is an alternative to map markers; route selection never requires a dragging gesture. No keyboard trap is introduced. |
| 2.4.1–2.4.7 | Skip link, page-specific document titles, visible focus, descriptive control names, main landmark, headings, main navigation and a footer site map. SPA navigation moves focus to main content. |
| 3.1.1, 3.2.1–3.2.4 | English language, consistent navigation and explicit submit buttons; selecting or focusing a field does not unexpectedly navigate away. |
| 3.3.1–3.3.3, 4.1.2, 4.1.3 | Required fields and instructions, descriptive validation messages, associated feedback, focus on form feedback, and status/alert announcements. Errors preserve user input. |

The decorative map is supplemented by the full destination list and road-route
steps. OpenStreetMap/OSRM are external services, not a substitute for textual
controls. Generated PDF accessibility varies by the browser's print-to-PDF engine;
the HTML report and CSV remain available alternatives.

### Checks

1. Run `npm test` for palette contrast and export regression tests.
2. Run `npm run dev`, open `/tests/accessibility.html` on that local server,
   choose each page and click **Check WCAG 2.1 A/AA**. This uses the development
   dependency `axe-core`; it is not part of the production bundle. Account-only
   pages require an existing test login on the same origin. Never send a real
   email just to run accessibility checks.
3. Test sign-in, registration validation, saved items, email validation, directory
   tables, map results and directions. Re-run after loading results or errors.
4. Use only Tab, Shift+Tab, Enter, Space and arrow keys. Check the skip link,
   navigation, forms, table sort/pagination, map alternative buttons and site map.
5. Try a narrow frame and **Toggle enlarged text and spacing**. It applies 200%
   font size plus the WCAG text-spacing values; restore by clicking again. Also
   check real browser zoom and forced-colour/reduced-motion preferences.

Automated checks do not prove full WCAG conformance. Review reported incomplete
items manually (for example decorative symbols or clipped table cells), and
check the actual visual layout. A full screen-reader/browser combination audit
has not been performed; do not describe the app as independently certified.

## E.4: export

Both directory tables provide **CSV** and **Print / PDF** controls. Exports use
`matchingRows`: every matching row in the selected sort order, not the ten-row
page slice. No-result exports are disabled. Each table's filters remain independent.

- CSV: `createCsv` quotes cells, escapes quotes, preserves commas/newlines, adds
  an Excel-friendly UTF-8 BOM and prevents spreadsheet formula interpretation.
  `downloadCsv` uses a browser Blob, then releases the temporary URL.
- PDF: `createPrintReport` builds an escaped HTML report in a new tab with table
  headings and print styles. Click **Print / Save as PDF**, then select the
  browser's **Save as PDF** destination. This is browser printing, not an automatic
  PDF file download. Popup blockers receive a visible error and retry instruction.
- Only public fictional directory fields are exported, not account information,
  authentication tokens, saved-item storage or server configuration.

Try all 12 entries, a four-result category filter, ascending/descending sorting,
no results, and the second table separately. Open the downloaded CSV and compare
its row count and order. Cancel printing if you do not want a PDF file.

References:
- https://www.w3.org/TR/WCAG21/
- https://www.w3.org/WAI/WCAG21/quickref/
- https://github.com/dequelabs/axe-core

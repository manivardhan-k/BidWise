# Dedicated PDF report - October 26, 2026

## Result

The user requested better PDF formatting instead of printing the HTML page. Download PDF now creates a separate native document using pinned MIT-licensed `@react-pdf/renderer` 4.9.0. Open the downloaded file to print it. The renderer loads on demand, captures the current report at the click and makes no source or AI request. Confirmation tokens and full pasted pages are excluded. Busy/error feedback, retries and object-URL cleanup are implemented.

The US Letter layout includes an overview, grouped public records, flood/history/copied claims, renovation, rental, Base/Downside resale and sensitivity, AI review, next checks and linked evidence notes. Resale results and assumptions have separate pages. Long repair tables repeat headings in bounded blocks and keep rows intact. Every page includes a property header, export time and page number. Unknown/invalid inputs, source conflicts, retained earlier records and outdated AI commentary remain explicit. Source caveats, raw deed-date values, publication/retrieval dates and original versus edited starting values remain traceable.

## Scope

- `src/lib/reports/snapshot.ts`: report data contract and portable filename.
- `src/lib/reports/property-pdf.tsx`: document layout and native PDF generation.
- `src/components/research/ReportPdfButton.tsx`: click-time capture, lazy loading, download and recovery.
- Scoped navigation/workspace/CSS wiring, pinned dependency/lockfile, README/design/notices updates.
- `tests/reports/`: fictional fixture, PDF text inspection and four export tests.
- `tests/e2e/pdf-report.spec.ts`: two browser controls. No live provider calls.

Existing unrelated staged and unstaged UI/provider/analysis changes were preserved. No commit, push, deployment, paid service or credential change was performed for PDF work.

## Verification

- **139 current unit tests passed**, including four PDF tests generating actual bytes. These check financial results, all 40 long repair descriptions, negative cash/profit, missing/invalid inputs, conflict/source/AI warnings, original dates, copied claims, edited estimate basis and filenames.
- **38 browser regressions passed** in Chrome against an isolated production build. The new PDF controls verify a real download, private-token exclusion, unchanged source/AI call counts, retry after a blocked renderer download and preservation of edits. A delayed renderer load proves that editing tax from 7,777 to 8,888 after the click leaves 7,777 in the downloaded snapshot and 8,888 on screen.
- Typecheck, lint and isolated/main Webpack production builds passed. The current main unit/type/lint gate includes concurrent provider validation edits; the full browser run uses the isolated snapshot. The canonical preview was rebuilt after confirming its process belonged to this app.
- Both PDF browser controls passed again on the canonical port 3100 preview. The actual downloaded PDF also passed page-bound and footer/page-number checks.
- Pypdf/Poppler/pdfplumber inspected fictional normal (14 pages), 40-row/negative (17 pages) and pending/conflicted/invalid (11 pages) PDFs. Every page has a visible footer/page count and zero text outside its page bounds. All internal destinations resolve. Normal/long documents each include 80 links and 50 named destinations.
- Every page of the normal PDF was visually reviewed, plus affected long-table and pending/conflict pages. No clipped text, overlapping rows or misplaced footers were found in these cases. PDF content remains selectable; source URLs remain clickable.

Artifacts are local verification examples, not actual property research:

- `/private/tmp/bidwise-pdf-review/output/pdf/BidWise-example.pdf`
- `/private/tmp/bidwise-pdf-review/output/pdf/BidWise-long.pdf`
- `/private/tmp/bidwise-pdf-review/output/pdf/BidWise-pending.pdf`
- Rendered pages: `/private/tmp/bidwise-pdf-review/final-*.png`, `long-*.png`, `pending-*.png`.
- Isolated browser outputs: `/private/tmp/bidwise-pdf-final-browser-check/`.
- Canonical preview download controls: `/private/tmp/bidwise-pdf-canonical-check/`.

## Preview and limits

Canonical local preview: `http://127.0.0.1:3100`. Reload the page to get Download PDF. A server restart expires process-local confirmations; confirm the property again if necessary. Reload also clears in-page scenario drafts, as before.

The earlier 95% usage stop checkpoint is superseded by the user's continuation and a fresh available usage reading. Source/AI live semantic acceptance, learner review, manual assistive-technology review and general release readiness remain the separate gates recorded in the build handoff. The PDF preserves available evidence; exporting does not validate source truth or the accuracy of assumptions/AI prose. The reviewed examples are representative controls, not exhaustive coverage of every possible long quotation or unusual glyph.

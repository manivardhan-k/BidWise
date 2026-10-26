# BidWise interface refresh — October 26, 2026

## User direction

Modernize the existing app with vibrant colors, pill controls and better fonts. Follow-up: reduce visible copy and add icons. This supersedes the older muted pine styling in the PRD/spec.

## Implemented

- Coral actions (`#d73f2b`), deep ink (`#252438`), violet links (`#6944ce`), lilac and mint supporting surfaces, warm light background.
- Pill navigation, input tabs, search field, buttons and status labels; rounded 24 px cards. Financial fields keep readable rounded rectangles.
- Self-hosted Latin variable DM Sans body and Manrope heading fonts through `next/font/local`. Pinned Fontsource 5.3.0 packages; no font CDN requests at build/runtime.
- Lucide React 1.61.0 icons for search, location, records, flood, finance, source details and due diligence. Decorative icons are hidden from assistive technology; labels remain. Existing house artwork and Mapbox attribution are retained, with the marker/favicon recolored.
- Shorter hero, empty-state and report copy. Detailed report coverage remains available in an expandable disclosure. Identity conflicts, missing source data, financial uncertainty and failure warnings stay visible.
- Responsive search/report/scenario cards, clear focus indicators, a keyboard skip link and reduced-motion support. Match-review status uses an information icon rather than a confirmation check.

## Verification

- 25 existing browser regressions passed against development and again against an isolated production build. Includes autocomplete geometry/scrolling, keyboard/touch selection, parcel conflicts, map/AI failures, source popovers/Escape, pasted text, scenario recalculation and mobile overflow.
- The only regression-test behavior update expands the new coverage disclosure before checking its detailed limitation text. No new tests mirror decorative styling.
- Production build passed with Webpack and TypeScript in `/private/tmp/bidwise-ui-production-check`, copied without credentials or raw evidence and using the installed dependencies. This avoids interrupting the older preview or rebuilding its active output.
- Typecheck and lint passed in the shared checkout. The final shared-checkout unit run passed 108 tests across 18 files, including the concurrently added provider tests.
- Visually inspected desktop (1440 px), tablet (768 px), mobile (390 px) and narrow copied-text mode (320 px) in the in-app browser. No horizontal overflow in those checks. Report/scenario and starting-value screenshots from the regression suite were also reviewed.
- Main white-on-coral action text and placeholder color were darkened during review for readable contrast.
- UI checks used fictional, intercepted provider fixtures. They do not establish live AI acceptance or release readiness.

## Preview and artifacts

- Live editable local preview: `http://127.0.0.1:3101`, started with Webpack development mode. The older port 3100 preview was left running.
- Built reference screenshot: `/private/tmp/bidwise-ui-desktop.jpg`.
- Mobile full-page reference: `/private/tmp/bidwise-ui-mobile.jpg`.
- Source styles: `src/app/globals.css`; fonts: `src/app/layout.tsx`.
- Third-party notices and the PRD/spec now reflect the visual direction.

Separate provider/API/environment/test edits were appearing concurrently in this shared checkout. They were preserved and not included in the UI scope or modified for this refresh. The production verification covers the copied snapshot, not later changes made by another task. No push or deployment was performed.

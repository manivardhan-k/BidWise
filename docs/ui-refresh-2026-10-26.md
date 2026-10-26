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

## Heading and browser-tab polish

Follow-up user review requested subtext on a separate line above section titles. Kicker/title rows now use block flex layout with a shared 6 px gap, replacing the inline layouts and the AI panel's one-off spacing. Icons stay on the title row. The browser icon now uses the same rounded tile proportions and Lucide house as the website header.

The rebuilt canonical preview on port 3100 serves the changes. Production build, lint and 12 existing desktop/mobile finance/report regressions passed. The updated desktop/mobile heading screenshots were reviewed at `/private/tmp/bidwise-heading-after-desktop.png` and `/private/tmp/bidwise-heading-after-mobile.png`; the icon preview is `/private/tmp/bidwise-rounded-tab-icon.png`. Interactive browser control was unavailable in Work settings, so visual review used existing regression screenshots and the served icon asset. No live provider calls were needed.

## Quieter source controls

The user found repeated Source buttons distracting. Each field now uses a muted, icon-only info trigger with a hover hint and the existing descriptive accessible name. Its invisible hit area remains 44 × 44 px; hover/open states add subtle violet emphasis, and keyboard focus, Escape dismissal, source details and print metadata remain intact.

The canonical port 3100 preview was rebuilt and restarted. Build/TypeScript, lint and all 16 existing report/usability browser regressions passed, including mobile hit areas, source dialogs/Escape/focus return, printable sources, narrow reflow and automated accessibility checks. Reviewed the fixture screenshot at `/private/tmp/bidwise-source-icons.png`; no live provider calls were made.

## Readable facts and less section copy

The user requested fewer section subtitles, only useful guidance, readable tax-record labels, Zillow as an inspiration source, and use of the Sites skill. Reviewed Zillow's public homepage and product-release material as reference; no listing data or assets were copied. Sites' existing-project, bounded-edit, readability and portable local-preview guidance was applied to this existing Next.js app. Hosting/runtime migration is outside this UI request.

- Removed decorative eyebrows, repeated report introductions and redundant section captions. Use direct titles: Property records, Starting estimates, Renovation budget and Before you buy.
- Property and financial labels increased from 11–12 px to 15 px. Record values use 18 px; tax-record labels retain their source meaning and the quieter source icons.
- Facts use two columns on wide screens and a single readable column on phones. Larger repair labels reserve matching vertical space on mobile.
- Field explanations appear on input focus. Calculation/privacy details remain in the expandable scenario guide. Source warnings, missing values, input errors, estimate origins, stale AI states and record dates remain available.
- The first full production browser run passed all 34 cases, including automated mobile accessibility checks. Desktop/mobile record and scenario screenshots were inspected. Existing report regressions now also save record screenshots; no new decorative tests were added. Final shortened headings/mobile spacing were checked with affected browser cases after the last build.

Reference pages: https://www.zillow.com/ and https://www.zillow.com/product-releases/. Browser control was disabled in Work settings; the review used accessible public-page content and the project's regression screenshots, not an interactive Zillow inspection or a claim of an exact visual clone. The Sites local-only path keeps the canonical preview on port 3100 and does not register or publish a separate Site.

Record screenshots: `/private/tmp/bidwise-records-readable-desktop.png`, `/private/tmp/bidwise-records-readable-mobile.png`; compact example: `/private/tmp/bidwise-clean-records-preview.png`. UI validation uses fictional records and intercepted services, with no live provider calls.

Final cleanup verification: the last production build/TypeScript passed, and all 17 affected finance, starting-estimate and usability browser cases passed after the final heading/spacing changes. The full earlier run passed 34 cases. The local preview returned HTTP 200 and was queued for display through `open_in_codex` per Sites' portable-preview guidance. The final mobile scenario image was inspected at `/private/tmp/bidwise-clean-scenarios-mobile-final.png`. The canonical local service remains available for the learner's review; no Site was registered or deployed.

## Selected Property records layout: option 2

The learner selected the second displayed Product Design mock: four grouped cards for Address & parcel, Building & use, Land, and Assessment & tax. Implemented that choice only in Property records: category icons/headings, fine row dividers, aligned label/value columns, and info icons immediately beside their labels. Cards stack on phones. All existing fields, source dialogs, missing values and printed source information remain available; the application's other sections were preserved.

The selected visual and the final browser-rendered desktop/mobile state were compared in combined full-view and focused-row images. The initial excess row padding and weak heading scale were corrected before the final comparison. `design-qa.md` records `final result: passed`, evidence paths, accepted production differences and the comparison history.

Production build/TypeScript and lint passed. All 17 existing property-report/usability regressions passed; the three affected expanded-record, mobile-target and automated-accessibility cases passed again after final spacing adjustments. The live in-app preview returned no captured error-level console messages. Fixtures intercepted model/map/data requests, and no live provider calls were made. Preview remains `http://127.0.0.1:3100/`; final desktop artifact is `/private/tmp/bidwise-records-cards-final.png`.

## Record row alignment follow-up

The user's screenshot exposed an info glyph offset within its round hover target. Centered each glyph, shortened the native hover hint to "View source", and aligned record labels and values on their first text baseline so wrapped content stays aligned. The 44 px targets and descriptive accessible names remain.

Production build/TypeScript, lint and four focused browser checks passed, including icon-center geometry, source dialogs/keyboard, mobile reflow/targets and automated accessibility. Reviewed the updated desktop/mobile captures and `/private/tmp/bidwise-alignment-comparison.png`; the after crop is `/private/tmp/bidwise-alignment-fixed.png`. The rebuilt preview remains `http://127.0.0.1:3100/`. Browser verification used intercepted fictional fixtures without live provider calls.

## Scenario section order

Moved the rental section ahead of resale so the page follows its navigation: Renovation, Rental, then Resale. This also aligns the reading and keyboard order with the displayed links. Production build/TypeScript, lint and five existing finance/navigation browser checks passed with intercepted fixtures. The rebuilt canonical preview remains `http://127.0.0.1:3100/`.

Follow-up: renamed the resale heading anchor to `#resale-title`, including the scenario link, accessible section label reference and AI evidence links. Production build/TypeScript, lint and the two affected existing finance/navigation browser checks passed.

## Scenario tabs

Replaced the three stacked scenario sections with coral/lilac pill tabs and Lucide icons, ordered Renovation, Rental, Resale. One panel is visible at a time; mounted inputs preserve edits, clears and repair rows while switching. Arrow keys, Home/End, initial fragment links and AI evidence links select the correct panel. Printing reveals all three panels; rental context links to the shared purchase assumptions in Resale.

All 19 finance, starting-estimate and usability browser checks passed against the development preview, using intercepted fictional fixtures without live provider calls. This includes saved/cleared inputs, calculations, direct links, keyboard switching, 320 px reflow, all three mobile tab states, automated WCAG A/AA scans and print content. Scoped ESLint and diff checks passed. Desktop/mobile captures were reviewed; the mobile comparison is `/private/tmp/bidwise-scenario-tabs-mobile-comparison.png`, and the compact desktop preview is `/private/tmp/bidwise-scenario-tabs-preview.png`.

Concurrent PDF work initially blocked the production build and whole-project lint; those separate files were preserved. The final production build/TypeScript and production tab-switching/printing smoke checks passed after that module's type fix. Whole-project lint last reported separate PDF issues; the changed tab/test files passed scoped lint. The rebuilt production preview is available at `http://127.0.0.1:3100/`.

## Compact notice spacing

Removed inherited top/bottom margins from the first/last children of notice boxes. This removes the extra 20 px above “Needs review” while preserving its 14 px vertical padding and all review text. Production build/TypeScript, whole-project lint and three affected analysis/mobile accessibility browser checks passed. A fictional, intercepted-data capture confirmed a 15 px heading inset including the border, with no mobile overflow. Reviewed `/private/tmp/bidwise-review-spacing-desktop.png` and `/private/tmp/bidwise-review-spacing-mobile.png`; the rebuilt production preview remains on port 3100.

## Field info without page jumps

Replaced the repeated “review basis” links with the existing muted info-icon pattern beside financial field labels. One local popover contains field guidance, estimate origin, original starting value, ranges, source/date and edited-state context. Short origin labels remain below the inputs in muted text. Input focus no longer expands helper text. Repair fields explain their unit costs and distinguish the shared renovation allowance from the individual quantity/cost fields.

Production build/TypeScript, lint and all 20 finance, starting-estimate and usability browser checks passed. The new interaction check verifies unchanged page position/hash, preserved edits, source links, range details, Escape/Close and focus return on desktop/mobile. After adding mobile popup gutters, the affected interaction and accessibility cases passed again. Desktop/mobile captures were reviewed at `/private/tmp/bidwise-field-info-desktop.png` and `/private/tmp/bidwise-field-info-mobile.png`. Fixtures intercepted external services; preview remains `http://127.0.0.1:3100/`.

# BidWise design system

## Existing direction

A beginner investigates property records in a calm, light interface on a laptop or phone. Preserve the completed UI's warm paper background, white surfaces, coral primary actions, violet links and muted mint information accents.

## Typography and layout

DM Sans body with Manrope headings, locally served. Use a consistent label and input vocabulary, generous spacing and readable line lengths. Keep the map left and basic summary right on wide screens; stack them on narrow screens. Detail sections and scenarios follow below.

Scenarios use icon-and-label pill tabs in this order: Renovation, Rental, then Resale. Show one panel at a time and preserve inputs when switching. Support arrow keys, Home/End and direct scenario links. Printed reports include all three panels.

Prefer a direct section title over decorative subtitles. Keep a short note only when it changes how the information should be interpreted. When subtext is needed, place it on its own line above the title with a consistent 6 px gap. Title icons share the title row. The browser-tab icon matches the website's coral tile, rounded corners and Lucide house mark.

Property and financial field labels use 15 px text in the main ink color; record values use 18 px text. Property records follow the user-selected grouped-cards concept: Address & parcel, Building & use, Land, and Assessment & tax. Use a two-by-two grid on wide screens and stack the cards on narrower screens. Each card has a violet category icon, a clear heading, aligned label/value rows and thin row dividers. Keep each record's info icon immediately beside its label, with the full 44 px hit area. Zillow's public site remains a reference for clear hierarchy; retain BidWise's own palette, typography and source distinctions.

## Interaction

Pill actions, clearly marked active input mode, native number fields and disclosures, source popovers with Escape support and a keyboard skip link. Error and loading states need action text and accessible announcements. No decorative motion; honor reduced motion.

Source triggers use a quiet, muted info icon without repeated visible "Source" text. Center the glyph within its 44 px hit area and use a compact hover hint with a descriptive accessible name. Emphasize the control only on hover, keyboard focus or while its popover is open. Record labels and values share their first text baseline, including when either wraps.

## Usability refinements

Maintain current visual identity while increasing small control targets and fine-print readability. Add lightweight section navigation, meaningful field errors and source labels. Keep report uncertainty and identity disagreements visible. Use the existing CSS variables as the source of color tokens.

Avoid repeating section names, introductory slogans and generic disclaimers. Put calculation/privacy details in the scenario guide. Field info icons open guidance and estimate source details beside their labels without scrolling; input focus does not expand helper text. Keep the short estimate origin and edited state below each field. Keep invalid-input messages, source conflicts, missing data and actionable caveats visible.

## PDF reports

Download PDF uses a dedicated US Letter document, with coral section labels, violet source links, aligned numeric tables and restrained shaded totals. Keep a consistent property header, retrieval/export dates, page numbers and linked record/estimate notes. Put resale results and sensitivity together; place purchase and stress assumptions on their own page. Long repair tables repeat column headings and keep rows intact. Export all scenarios regardless of the selected screen tab. Capture edits at the click and preserve unknown inputs, identity disagreements, source failures and outdated AI labels. Keep source caveats and original versus edited starting values traceable in the appendix.

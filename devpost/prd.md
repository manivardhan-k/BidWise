---
doc: prd
status: approved
---

# BidWise — Product Requirements

An approachable NJ property-research website for beginners investigating a property to renovate, rent out or sell.

Source: `scope.md > Who It's For`, `The Unique Kernel`, and `The POC Boundary`. Approved by the learner on October 19, 2026, with "looks good" after the Markdown product review, including copied-page-text fallback and the financial input/result organization. Implementation still waits for approved technical specification and the official build stage.

## The Core Journey

Source: `scope.md > The Core Loop` and `What "Working" Looks Like`.

1. Open the property-research workspace and enter an NJ address or paste public listing/notice text, including the visible text copied from a whole property page within the disclosed input limit. If a supplied URL cannot be imported, ask the user to copy the page text they are permitted to supply or enter the address. Do not claim the linked page was read.
2. Submit the input and see actual processing progress.
3. Review the identified property or candidates and confirm the correct one before merging records.
4. See the property located on the map, with basic facts to its right and detailed research below.
5. Read sourced facts, available hazards/recorded history, seller-claim checks, explanations and unknowns.
6. Edit renovation and financial assumptions and see cash resale/basic cash rental results update.
7. Understand what the evidence supports and which checks remain before pursuing the property.

## Screens and Layout

Source: `scope.md > The Core Loop` and `Inspiration & Identity`; learner's explicit PRD layout answer; master plan v3 §8.

- A prominent text box invites house details, an NJ address or pasted property-page/notice text. An unsupported URL receives a clear copy-page-text/address fallback rather than an automatic-import promise.
- The map occupies the left/background area on desktop. It points to the identified location or candidate locations during confirmation.
- Basic property details appear to the right.
- Detailed research and analysis appear below the map/summary area.
- Carry forward v3's responsive stacked mobile layout, restrained house marker and accessible information explanations. No extra account, browse or onboarding screens are introduced.
- Before a property is identified, show an honest initial state without fabricated property facts or a marker implying a verified match.

## Look and Feel

Source: `scope.md > Inspiration & Identity`; learner's explicit PRD styling answer; v3 §8.

Basic but modern, minimalist, light themed and not flashy. Smooth, restrained transitions support changes in state. Honor reduced-motion preferences. Carry forward v3's muted neutrals/pine accent, readable typography, clear spacing, flat 2D map and subtly dimensional house marker. Explain unfamiliar terms without requiring investment knowledge.

## Features and Behavior

### Property Input and Identity

Source: `scope.md > The Core Loop` and `The POC Boundary`.

- Process an NJ address or public property/listing/notice text. Do not imply that a narrative description establishes an exact parcel by itself.
- Show enough identity information for confirmation; offer candidate selection where ambiguous.
- Reject or request correction for unusable or non-NJ input rather than merge guessed properties.
- The learner accepted an address/permitted-text fallback for unsupported URLs, then specified copying the visible page text from the browser. Automatic site import remains outside this proof of concept.
- Accept manually pasted visible property-page text, not just a neatly edited description. Extract useful property facts and exact supporting snippets; ignore navigation, advertisements, unrelated links and boilerplate.
- The user may copy a page's text themselves and paste it into BidWise, subject to their right to supply it and the disclosed size limit. Standard paste is user initiated; BidWise does not read browser sessions or automatically collect clipboard contents. The app does not promise to recreate the website, layout or media.
- A pasted page can mention several properties or prices. Do not merge them silently: show the target identity/candidates and label each supported price by kind. Ask only for missing identification or clarification required to continue. Missing optional attributes stay unknown.
- For an unsupported link, explain that direct import is unavailable and invite the copied text or address. Preserve supplied input and optional source reference; do not fetch the page or say it was analyzed.
- Do not fetch Zillow or Auction.com listing content by scraping. Any later automatic import needs a permitted access path and verified display/use rights; a scraping service alone does not establish that permission.

Observable criteria: a real valid input reaches a confirmable property; copied-page clutter does not become property evidence; ambiguous/multiple-property text requires selection; an unsupported link leads to the paste/address fallback; oversized input receives a clear size message without silent truncation.

### Property Summary and Map

Source: `scope.md > The Unique Kernel` and `What "Working" Looks Like`.

- Show the confirmed property's available basic details and distinct price types, together with evidence status.
- Locate the property on the flat map. Preserve textual identity/location if map display fails.
- Unsupported bedrooms/bathrooms/interior area remain absent or explicitly seller claims; they are not presented as official records.

Observable criteria: map and summary refer to the same confirmed property, sources and dates are accessible, and different price types are clearly labeled.

### Detailed Evidence and Analysis

Source: `scope.md > The Unique Kernel` and `The POC Boundary`.

- Show available official facts, flood screening, recorded history where returned, and claim-versus-record checks.
- Distinguish matching, differing, unverifiable and non-comparable claims. Missing history does not mean the property has no history or issues.
- Explain findings in plain language, connecting each interpretation to its supporting evidence or entered assumptions.
- Learner clarification during technical planning: Gemini performs this property/scenario analysis as well as copied-text extraction. It reviews the assembled evidence and deterministic results, explains them and flags possible inconsistencies. AI interpretations remain visibly separate from official facts; model agreement is not verification of correctness.
- Each AI analysis refers to the evidence and scenario inputs it actually reviewed. If those inputs change, keep immediate code-calculated results current and identify outdated AI commentary until refreshed. The exact refresh interaction belongs in the technical specification; Gemini analysis must not be silently replaced with templates to save usage.
- Separate facts, estimates/assumptions and unanswered questions. Explain remaining inspection, title and specialist checks.

Observable criteria: a beginner can inspect the source behind a material fact; analysis never claims a check was completed without evidence; missing/unavailable information remains visible.

### Renovation and Cash Scenarios

Source: `scope.md > The Core Loop`, `What "Working" Looks Like`, and `The POC Boundary`.

- Share the confirmed property and editable renovation assumptions between resale and basic rental scenarios.
- Carry forward v3's renovation line items, contingency and separate unknowns reserve; costs are assumptions, not contractor quotes.
- Resale shows Base/Downside results, break-even price and scenario maximum bid using an entered resale-price assumption.
- Beneath the shared renovation section, clearly label separate rental and resale groups, with editable inputs next to their relevant results. This organization of the financial detail below the main report was accepted with PRD approval.
- Basic rental uses entered expected monthly rent and operating-cost assumptions. Explain recurring expenses, vacancy/lost-rent assumptions and maintenance/reserve allowances with short help text. Clearly distinguish a user-entered zero from an unanswered required cost. Show understandable monthly and annual income-after-modeled-expenses results; do not label them guaranteed take-home income.
- October22 learner refinement: prefill editable financial starting assumptions with the best supported estimates for the confirmed property. Identify the source/basis, date, uncertainty and estimated status; preserve human edits. Unknown market rent/resale prices need defensible evidence; disclose missing support rather than inventing a reliable-looking value. Retain the rest of the research report and explain what evidence would improve the estimate. An incomplete rental scenario does not hide complete resale results, or vice versa.
- Explicitly model a cash purchase. Do not silently interpret the output as supporting a mortgage-funded purchase.
- Label one-time resale profit and recurring rental results as different measures. No automatic strategy selection.
- Missing assumptions leave the affected scenario incomplete; invalid values prompt correction. Changing shared costs updates the relevant scenarios without reclassifying estimates as facts.

Observable criteria: meaningful edits change results immediately, incomplete scenarios request the missing inputs, and negative/impossible results remain understandable rather than becoming misleading recommendations.

## States and Boundaries

Source: `scope.md > The POC Boundary` and `Explicitly Cut`; v3 §8.

- **First use:** the input and research layout are visible; no invented analysis or sample property presented as live.
- **Processing:** stage messages represent actual progress.
- **Ambiguous identity:** user confirms a candidate before record merge.
- **No match / invalid input:** explain the issue and allow correction.
- **Partial data / source unavailable:** preserve available evidence and name missing/skipped checks.
- **Map unavailable:** keep the textual report usable.
- **Incomplete scenario:** request missing assumptions without inventing market values.
- **Unsupported URL:** explain unavailable direct import and request copied visible page text the user may supply, or an address. Preserve input; never imply the linked page was read.
- **Noisy/long pasted page:** ignore page clutter, enforce a disclosed size limit and request clarification for multiple target properties. Do not silently truncate text or combine unrelated properties.
- **Accessibility:** visible keyboard focus, keyboard/touch explanations, non-color evidence labels and reduced motion.

## Product Decisions

- Learner approved one NJ property report with cash resale and basic cash rental scenarios.
- Learner wants input for house details or a property URL, followed by processing. After source-access research, accepted the unsupported-link address/text fallback with "ok"; this does not approve the entire PRD.
- Learner then clarified the fallback: copy the whole visible property-page text from the browser into BidWise for processing. Prefer this to making the user answer a long questionnaire. Optional source URL is a reference, not evidence that BidWise fetched its content.
- Zillow and auction sites were tentative discovery suggestions, not approved automated integrations.
- Learner reaffirmed the layout already present in v3: map left/background, basic details right, detailed view below.
- Learner selected modern, minimal, light styling with smooth animations and no flashy presentation.
- Learner chose Markdown for planning reviews. No repeated format selection is needed.
- Learner approved the complete displayed product definition on October 19 with "looks good". No second PRD sign-off is required.
- Learner subsequently clarified that Gemini is required for both text processing and analysis, including supplementary checking. This restores v3's intended AI role; usage optimization does not authorize cutting approved functionality.

## What We're Building

The approved single-property research flow, manual address or copied-page-text input with unsupported-link fallback, evidence-backed report, accessible explanations, editable renovation assumptions and cash resale/basic rental scenarios.

## Deferred From the POC

Source: `scope.md > Later`.

Broad listing browsing/auction aggregation, automated valuations/rent estimates, richer history integrations, mortgages, first-home affordability, accounts, saved properties and richer rental analysis. Automatic website import stays deferred; the accepted first-version fallback is user-supplied visible page text or an address. Recreating websites or importing their photos/layout is outside the text-input workflow.

## Possible Later Enhancements

Preserve the wider roadmap in v3 Appendix A. Licensed comparable sales/rent evidence and deeper official-source coverage can improve the same report after the reliable core works.

## Non-Goals

Source: `scope.md > Explicitly Cut`.

No complete-record guarantee, physical-condition/title certification, universal investment score, guaranteed return or automatic rent-versus-sell instruction. No fabricated records, prices or renovation quotes. No unrestricted fetching of arbitrary websites implied by an input box.

## Listing-Source Research

Read-only source/terms review on October 19, 2026; no listing integration or live property-data feasibility test performed.

- **Ordinary listings:** Zillow and Realtor.com are candidate places for users to discover homes. [Zillow's 2026 traffic report](https://investors.zillowgroup.com/news-and-events/news/news-details/2026/Zillow-Group-Reports-Second-Quarter-2026-Financial-Results/default.aspx) describes substantial audience reach; [Realtor.com](https://www.realtor.com/about/) describes its for-sale search offering. These are discovery references, not approved BidWise data feeds.
- **Auctions:** [Auction.com offers NJ listings](https://www.auction.com/residential/foreclosures_at/nj/). Official county sources are also relevant: [Middlesex County's foreclosure page](https://www.middlesexcountynj.gov/government/departments/department-of-public-safety-and-health/office-of-the-county-sheriff/foreclosures) points to its current sale-listings portal. A public page does not by itself establish automated import or republication rights.
- **Access boundary:** [Zillow terms §§4–5](https://www.zillow.com/corporate/terms-of-use/) and [Auction.com terms §5](https://www.auction.com/lp/legal/terms/) prohibit automated scraping. No authorization or licensed access has been established for BidWise. Preserve addresses/permitted user-supplied text as the functional core; automatic URL import remains deferred unless an authorized source is established.
- For the demo, prefer investigating an official NJ county notice with identifiable parcel information during the build-stage spike. Exact notice, permission/attribution and repeatable data coverage remain unverified.

## Open Questions

- **Resolved:** learner approved the Markdown PRD, including the financial-group/input organization. No additional product sign-off or survey of investment metrics is required.
- **During technical specification:** define the disclosed text-size limit, schema validation, exact rental/resale formulas and acceptance fixtures. Missing values must remain distinct from explicit zero.
- **During build-stage feasibility checks:** confirm exact source coverage, a suitable real demo property and rights to demo text. Public website visibility or a manual paste is not blanket permission to republish source content. No access bypass or automatic listing import is approved.

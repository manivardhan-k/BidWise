---
doc: scope
status: approved
---

# BidWise

An approachable New Jersey property-research website that explains a home's details, prices, available hazard/history evidence and possible costs so a beginner can decide what is worth investigating.

Approved by the learner on October 19, 2026, with "looks good" after the Markdown scope review. Includes the basic cash rental scenario alongside cash resale. This approves scope; substantial implementation still waits for the official PRD/spec/build workflow.

## The Unique Kernel

Explain what matters about a property to someone who does not already know what to look for. Bring source-backed facts, meaningful claim comparisons, possible costs and unanswered questions into one understandable report, with reasons behind its analysis.

## Who It's For

The learner named two audiences: people investing in houses to earn income, and first-time buyers with limited budgets looking for a decent home. Both want an easy, reliable way to make informed decisions and avoid being misled.

The first journey centers on a beginner investigating an affordable NJ property to renovate and potentially rent out or sell. The learner says they do not know what to look for and would rely on BidWise's property details, prices, hazard/history information and analysis. A first-home buyer can use the shared research; a separate mortgage-affordability workflow is outside this proof of concept.

## The Core Loop

Enter an NJ address or paste a public listing/notice, confirm the property, inspect sourced details and available hazard/history evidence, then explore renovation costs and clearly conditional financial scenarios. Read a plain-English explanation of what is known, what could change the outcome and what still needs checking.

The user returns with another property or revised assumptions. They do not need investment terminology or a checklist of their own to start. Technical terms are explained in context.

Approved financial boundary: retain v3's cash renovation/resale scenario and add a small cash-purchase rental scenario using entered rent and operating-cost assumptions. Compare an estimated one-time resale outcome with recurring rental income after modeled expenses, explicitly labeled as different measures. Explain assumptions and missing inputs; do not automatically declare which strategy is better. Financing, automatic rent estimates and broader investment advice stay outside this slice.

Material approved change from v3: basic cash rental economics moves from later to a minimal part of the first report, following scope review and learner approval. Richer rental features remain deferred. The master reference now records this amendment; PRD/spec will define detailed behavior and calculations.

## Inspiration & Identity

Learner priorities: as easy to use and reliable as possible; gather as much useful information as can actually be supported. The existing v3 reference proposes restrained styling, a flat map, clear explanations and evidence labels. Detailed design belongs in the PRD.

## Why This Matters to the Learner

Make useful property research accessible to people who have limited money and want to avoid being misled into a poor purchase.

## What "Working" Looks Like

One real NJ property produces a correctly matched report showing supported details, distinct price types, available flood/recorded-history information, sources and unknowns. A beginner can understand the reasons behind the analysis and identify what to check next.

For the financial slice, changing a renovation, rent or resale assumption visibly changes the relevant results. Missing assumptions leave that scenario incomplete. This creates a demonstrable input-to-report-to-edited-scenario flow for the required short video and runnable public repository. Nothing depends on invented property records or market forecasts.

## The POC Boundary

One NJ property at a time; address or pasted public text; confirmed identity; understandable available parcel and flood records; recorded history only where returned; source/date/status labels; comparable seller-claim checks; editable renovation assumptions; and explanation grounded in actual evidence and deterministic calculations. Exact sources remain subject to the approved specification and build-stage feasibility checks.

The learner's aspiration is to consolidate enough research that only a lawyer would remain to consult. That is an aspiration to reduce fragmented research, not a supportable completeness guarantee. The product must identify outstanding physical inspection, title and other specialist checks rather than imply that online records replace them.

The rental/resale scenarios share the same property and renovation inputs. Both are cash-purchase scenarios; a mortgage-funded purchase remains outside the model and must be visibly identified as unsupported. No assumed market rent, resale value, professional renovation quote or complete history. Detailed calculations and interaction design belong in PRD/spec.

## Later

Preserve master plan v3 Appendix A. Broader browsing/auction aggregation, automated valuations/comps/rent estimates, deeper permits/title/history integrations, financed scenarios, first-home affordability, accounts and saved properties remain later. Only basic cash rental economics is promoted alongside the existing resale model; all richer rental features remain deferred. No feature is represented as implemented.

## Explicitly Cut

- Claims that the site guarantees a safe purchase, prevents every scam, certifies condition/title, or supplies every relevant fact: the evidence cannot establish those promises.
- Treating unavailable information as a clean record or invented result: contradicts the requested reliability.
- A universal investment score or automatic rent-versus-sell instruction: cannot establish suitability from partial records and entered forecasts.
- Full financed/rental/homeownership products: keep the first slice to one research report and a bounded set of transparent calculations.

## Review Notes

The distinctive part is understandable, evidence-grounded guidance for a beginner. The main delivery risk is reliable real-property data; confirm it at the build-stage spike before polishing unsupported fields. Markdown review completed and approved on October 19, including the deliberately limited cash rental scenario. No second scope sign-off is required.

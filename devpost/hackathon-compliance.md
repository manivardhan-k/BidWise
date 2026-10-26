# BidWise hackathon compliance

Latest source-publication check: October 26, 2026 (America/New_York).
Submission target: October 25; official deadline: October 26, 2026, 5:00 PM EDT.

## October 26 source-publication checkpoint

The entrant explicitly authorized saving and pushing the complete project on October 26 and will record the video and submit on Devpost. This supersedes earlier no-push instructions. The working source includes the UI refresh, tabbed finance controls, PDF export, copied-page recovery, approved planning documents and demo draft.

All 150 unit tests, typecheck and lint passed again in the source-publication check. The completed build chat separately recorded a successful production build and all 39 production browser regressions; the recording preview was left running. Candidate files and all 325 reachable historical blobs were checked for configured private keys and common token/private-key patterns, with no findings. The personal learner profile, environment files, raw source evidence and local caches remain ignored and excluded.

Publishing source does not establish a completed video, a Devpost submission receipt, personal eligibility/survey completion, or previously unrecorded learning/semantic/accessibility acceptance. No project-wide license has been selected; the rules recommend one. Preserve the factual unfinished items rather than marking them passed without evidence.

The tables below preserve the **October 19 setup baseline**. They are historical; consult the current README and build-handoff notes for later implementation and verification, and this checkpoint for source-publication authorization.

Statuses: **Complete / In progress / Blocked / Needs user action**. Complete requires evidence. This file supplements the official workflow; it is not the skill-generated build checklist or an approved plan.

## Authority and sources

1. [Official rules](https://learn-ai-basics.devpost.com/rules).
2. [Challenge overview](https://learn-ai-basics.devpost.com/).
3. [Official skill pack](https://github.com/challengepost/learn-ai-basics), installed in `.agents/skills/`; source hashes in `skills-lock.json`.
4. Approved skill-generated `devpost/scope.md`, `devpost/prd.md`, `devpost/spec.md` once available.
5. `../BidWise_NJ_Final_Project_Plan_v3.md`; v1/v2 remain historical.

Resolve conflicts in favor of the rules, then official skill instructions and approved plans. Recheck the live rules before submission.

## Setup evidence

| Check | Status | Evidence / next action |
|---|---|---|
| Read master plan v3 completely | Complete | Includes schemas, cash formulas, UI, acceptance criteria and deferred register; preserved without edits. |
| Review official rules, overview and pack | Complete | Reviewed October 19, including eligibility, deliverables and judging. |
| Node.js and Git available | Complete | Node v26.10.0; npm 11.19.1; Git 2.56.0. Runtime compatibility remains a build check. |
| Fresh project folder during submission period | Complete | Created `app/` on October 19; empty before skill installation. Parent contained only three plans, no Git repo/application. Initialized local `main`; no imported application code. |
| Official six-skill installation | Complete | Requested `npx skills add challengepost/learn-ai-basics --all -y` succeeded; six skill sources and hashes verified locally. |
| Profile/credential ignores | Complete | `.gitignore` excludes learner profile, `.env` and `.env.*`, permits secret-free `.env.example`. |
| Hackathon registration | Complete | Learner explicitly confirmed registration in chat on October 19; not independently inspected in Devpost. |
| Entry survey and entrant eligibility | Needs user action | Entry-survey completion not separately established; personally check age, residency and exclusions in rules §3. Team representation if applicable. |
| Originality and permitted materials | In progress | Fresh application; disclose any incorporated pre-existing work, including reference plans. Verify licenses for each dependency, dataset and asset before use/publication. |
| Listing URL access review | In progress | October 19 review found Zillow/Auction.com scraping restrictions; no import/license permission established. Learner accepted unsupported-link fallback, clarified as copying visible page text into BidWise. Demo-text rights and official county notice suitability still need build-stage verification; no automatic import is approved. |

## Official learner workflow

| Stage | Status | Completion evidence required |
|---|---|---|
| `1-start` | Complete | Fresh-folder check and essential learner interview complete; substantive `devpost/learner-profile.md` saved and verified ignored. Personal responses stay out of this public checklist. |
| `2-scope` | Complete | Learner approved displayed Markdown scope with "looks good" on October 19; `devpost/scope.md` marked approved. Basic cash rental plus resale included; v3 amended without deleting deferred register. |
| `3-prd` | Complete | Learner approved displayed product definition with "looks good" on October 19; `devpost/prd.md` marked approved. Copied-page-text fallback, financial layout and checkable product behavior included. |
| `4-spec` | Complete | Learner approved displayed technical plan with "looks good"; spec marked approved. URL Context researched and added as a permitted-source feasibility investigation. Account settings, actual coverage and model quality remain unverified. |
| `5-build` | In progress | Official skill/template read; learner approved the six-slice checklist with "okay good" on October 19, and its status is approved. Fast mode selected; stop at 5% remaining in the five-hour allowance. Slice 1 partially built: three civic-control public-data joins succeeded; seven tests/typecheck/lint and initial build/smoke passed. Gemini account/live quality, residential sample, rights and tooling gates remain pending; slice unchecked. Remote README/history preserved; profile and raw evidence ignored. |
| `6-ship` | Blocked | Build completion, publication checks, real video, learner-authored submission and exit survey. |

No substantial implementation or live property/Gemini integration spike until `5-build`. Existing v3 choices are context, not substitutes for learner answers. Silence never approves a plan. Do not create placeholder plans that imply progress.

## Product and repository gates

| Requirement | Status | Evidence still needed |
|---|---|---|
| Working proof of concept | Blocked | Approved build followed by a real NJ input → confirmed parcel → sourced evidence → editable cash-flip results. |
| Actual data feasibility | Blocked | At build stage test 2–3 public property candidates, exact parcel/flood fields and authentic Gemini extraction; record coverage, failures and demo selection. |
| Truthful evidence and finance | Blocked | Source/date/status, typed comparisons, unknowns, manual ARV, Base/Downside, max-bid guards and meaningful tests per approved spec. |
| Functional, mobile and accessibility QA | Blocked | Verify real core flow, errors/partial failures, malicious input, keyboard/touch, responsive layout, calculation fixtures and max-bid round trip. |
| Public repository and contents | Blocked | Complete source/assets, approved scope/PRD/spec, safe checklist/app map, README, env example, visible open-source license and third-party notices. |
| Secrets/privacy audit | Blocked | Inspect intended files AND Git history before publication; ignored profile must remain unpublished. No private/protected records or unlicensed payloads. |
| Install/run reproducibility | Blocked | Document exact commands and prove fresh install/core flow. Keep judge access free through October 30, 2026, 5 PM EDT. |

## Submission gates

| Requirement | Status | Evidence still needed |
|---|---|---|
| Real demo recording | Blocked | Working software on screen; under 3 minutes (target ~2:30); rights cleared; truthful live/fixture/unknown labels. |
| Public demo URL | Needs user action | Publish to YouTube/Vimeo; verify playback without authentication. |
| Public repository URL | Complete | Learner supplied [manivardhan-k/BidWise](https://github.com/manivardhan-k/BidWise). GitHub reports public, created October 19, 2026, default branch `main`; unauthenticated page request returned HTTP 200. Existing tree contains `README.md` only. Local `origin` configured; nothing fetched, merged or pushed. Complete source and required documents remain separate unfinished gates. |
| Learner-authored copy | Needs user action | Learner writes project name, description, all submission answers and exit survey. Agent may identify gaps and correct spelling/grammar only; no drafting, rewriting or narration. |
| Submission receipt | Needs user action | Complete actual Devpost fields and links, submit before deadline, verify receipt. No claim of submission without evidence. |
| English materials | Blocked | All text/video/testing instructions in English or translated. |
| Judging readiness | Blocked | First pass eligibility/skills viability, then equally weighted Design, Potential Impact, Innovation/Idea and Presentation. |

## Clarifications and optional work

- Overview says reviewers will not run code and lists only three scoring criteria. Rules §§4/6 control: judges may test, and all four criteria above count equally.
- Rules phrase the license and sub-three-minute video as recommendations; our stricter submission gates retain both per the project brief.
- Deployment, Discord, peer reviews and community events are optional; they do not replace repo/video or block submission. Overview lists Will It Ship on October 22 at 3 PM ET.
- Preserve Appendix A. No P1 provider or feature before reliable P0; no unexpected paid API calls. Credentials must be configured locally, never pasted into chat.
- Existing GitHub README must be inspected and preserved when integrating repository history before the first code publication. A supplied repo URL and registration do not establish entrant eligibility or a completed submission.

## Recheck cadence

Revisit at setup, after each approved plan, after each build milestone, and during `6-ship` before publication/submission. Setup, all three planning approvals and build-order approval are recorded; deferred register preserved. Fast mode is selected. Slice 1 has partial implementation and measured public-data evidence; see `../docs/data-feasibility.md`. No slice is complete and nothing was pushed. Current state: **build in progress; live Gemini/account and residential/rights checks pending; not submission-ready**.

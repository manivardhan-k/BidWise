"use client";
import { useRef, useState } from "react";
import PropertyMap from "../map/PropertyMap";
import { Fact } from "../research/Fact";
import { AddressInput } from "./AddressInput";
import { ListingClaims } from "../research/ListingClaims";
import type { ParsedProperty } from "@/lib/analysis/validate";
import { RecordDetails } from "../research/RecordDetails";
import type { AnalysisResult, FloodScreen, PropertyChoice, PropertyRecords, SourceResult } from "@/lib/property/types";
type AnalysisState = { status: "idle" | "loading" | "unavailable"; message?: string } | AnalysisResult;
async function post<T>(path: string, body: unknown, signal: AbortSignal): Promise<T> {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "This source could not be reached. Try again later.");
  return data;
}
const remainingChecks = [
  ["Physical condition", "Arrange an inspection and contractor estimates; records cannot establish repair needs."],
  ["Title, liens and ownership", "Have a qualified professional review title, liens and transaction documents."],
  ["Occupancy and possession", "Confirm occupancy and the rules and costs of obtaining possession."],
  ["Current taxes and insurance", "Check the actual tax bill, balances due and insurability."],
  ["Sale or auction terms", "Review deposits, deadlines, access, contingencies and buyer obligations."],
  ["Use and permits", "Confirm permitted use, zoning, open permits and local requirements."],
];
export default function PropertyWorkspace() {
  const [input, setInput] = useState("");
  const [inputMode, setInputMode] = useState<"address" | "page">("address");
  const [pageText, setPageText] = useState("");
  const [parsedChoices, setParsedChoices] = useState<ParsedProperty[]>([]);
  const [parsedListing, setParsedListing] = useState<ParsedProperty | null>(null);
  const listingContext = useRef<ParsedProperty | null>(null);
  const [findingStage, setFindingStage] = useState<"parsing" | "matching">("matching");
  const [finding, setFinding] = useState(false);
  const [error, setError] = useState("");
  const [choices, setChoices] = useState<PropertyChoice[]>([]);
  const [selected, setSelected] = useState<PropertyChoice | null>(null);
  const [records, setRecords] = useState<SourceResult<PropertyRecords> | null>(null);
  const [flood, setFlood] = useState<SourceResult<FloodScreen> | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: "idle" });
  const [sourceStale, setSourceStale] = useState(false);
  const sourceState = useRef<{ records: SourceResult<PropertyRecords> | null; flood: SourceResult<FloodScreen> | null }>({ records: null, flood: null });
  const controller = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const analysisSerial = useRef(0);
  function beginResearch() {
    controller.current?.abort(); controller.current = new AbortController();
    const current = ++revision.current;
    setFinding(false); setError(""); setSelected(null); setChoices([]); setRecords(null); setFlood(null); setAnalysis({ status: "idle" });
    setParsedChoices([]); setParsedListing(null); listingContext.current = null;
    sourceState.current = { records: null, flood: null }; setSourceStale(false);
    return { current, signal: controller.current.signal };
  }
  async function findAddress(address: string, listing: ParsedProperty | null, current: number, signal: AbortSignal) {
    setFindingStage("matching");
    const result = await post<{ choices: PropertyChoice[]; sourceFailures: number; addressMatches?: number }>("/api/identify", { address, ...(listing ? { listing } : {}) }, signal);
    if (revision.current !== current) return;
    listingContext.current = listing; setParsedListing(listing); setChoices(result.choices);
    if (!result.choices.length) setError(result.sourceFailures ? "Parcel matching is unavailable. Try again later; no guessed match was used." : result.addressMatches === 0 ? "NJ’s address index returned no match. This may be a coverage gap, especially for apartment/unit addresses. Try the building’s street address and municipality or an address suggestion. This does not mean the property does not exist." : "The address was located, but no parcel could be confirmed from the returned identifiers. Check the street number, municipality and any unit, then try again.");
  }
  async function researchParsed(listing: ParsedProperty) {
    const { current, signal } = beginResearch(); setFinding(true);
    try { await findAddress(listing.candidate.address, listing, current, signal); }
    catch (error) { if (revision.current === current) setError(error instanceof Error ? error.message : "Address matching failed."); }
    finally { if (revision.current === current) setFinding(false); }
  }
  async function search(event: React.FormEvent) {
    event.preventDefault(); const { current, signal } = beginResearch();
    const supplied = inputMode === "page" ? pageText : input;
    if (inputMode === "page" && pageText.length > 50_000) { setError("Copied text exceeds the 50,000-character limit. Shorten it and try again; nothing was truncated or submitted."); return; }
    if (/^https?:\/\/\S+\s*$/i.test(supplied.trim())) { setError("Direct link import is unavailable. Enter the NJ address from the page or choose Copied page text and paste its visible text."); return; }
    if (inputMode === "address" && supplied.length > 200) { setError("Choose Copied page text to process a page, or enter just the NJ address."); return; }
    setFinding(true); setFindingStage(inputMode === "page" ? "parsing" : "matching");
    try {
      if (inputMode === "page") {
        const result = await post<{ candidates: ParsedProperty[] }>("/api/parse", { text: pageText }, signal);
        if (revision.current !== current) return;
        if (!result.candidates.length) { setError("No supported property address was extracted. Keep your text, check that its NJ address is included, or search the address directly."); return; }
        if (result.candidates.length > 1) { setParsedChoices(result.candidates); return; }
        await findAddress(result.candidates[0].candidate.address, result.candidates[0], current, signal);
      } else await findAddress(input.trim().replace(/\s+/g, " "), null, current, signal);
    } catch (error) { if (revision.current === current) setError(error instanceof Error ? error.message : "Property research failed."); }
    finally { if (revision.current === current) setFinding(false); }
  }
  async function requestAnalysis(choice: PropertyChoice, current: number, signal: AbortSignal) {
    const serial = ++analysisSerial.current;
    setAnalysis({ status: "loading" });
    try {
      const result = await post<AnalysisResult | { status: "unavailable"; message: string; revision: number; records: SourceResult<PropertyRecords>; flood: SourceResult<FloodScreen> }>("/api/analysis", { token: choice.token, revision: current, ...(listingContext.current ? { listing: listingContext.current } : {}) }, signal);
      if (revision.current !== current || result.revision !== current || analysisSerial.current !== serial) return;
      if ((result.records.status === "unavailable" && sourceState.current.records?.status === "available")
        || (result.flood.status === "unavailable" && sourceState.current.flood?.status === "available")) {
        setSourceStale(true);
        setAnalysis({ status: "unavailable", message: "A source refresh failed. Previous source results are still shown with their original retrieval times. No refreshed AI explanation was accepted." });
        return;
      }
      sourceState.current = { records: result.records, flood: result.flood }; setSourceStale(false);
      setRecords(result.records); setFlood(result.flood); setAnalysis(result);
    } catch { if (revision.current === current && analysisSerial.current === serial) setAnalysis({ status: "unavailable", message: "AI analysis could not be completed. Your source records remain available." }); }
  }
  async function confirm(choice: PropertyChoice) {
    controller.current?.abort(); controller.current = new AbortController();
    const signal = controller.current.signal; const current = ++revision.current;
    setSelected(choice); setChoices([]); setRecords(null); setFlood(null); setError(""); setAnalysis({ status: "idle" });
    sourceState.current = { records: null, flood: null }; setSourceStale(false);
    const load = async <T,>(path: string, setter: (result: SourceResult<T>) => void) => {
      try { const result = await post<SourceResult<T>>(path, { token: choice.token }, signal); if (revision.current === current) setter(result); }
      catch { if (revision.current === current) setter({ status: "unavailable", message: "This source could not be retrieved. Search again if your confirmation has expired." }); }
    };
    await Promise.all([
      load<PropertyRecords>("/api/records", result => { sourceState.current.records = result; setRecords(result); }),
      load<FloodScreen>("/api/hazards", result => { sourceState.current.flood = result; setFlood(result); }),
    ]);
    if (revision.current === current) void requestAnalysis(choice, current, signal);
  }
  const facts = records?.status === "available" ? records.data.facts : [];
  const fact = (id: string) => facts.find(f => f.id === id);
  const floodData = flood?.status === "available" ? flood.data : null;
  return <>
    <header className="site-header"><a className="brand" href="#top"><span className="brand-mark" aria-hidden="true">⌂</span>BidWise</a><nav aria-label="Page navigation"><a href="#research">Property research</a><a href="#remaining-checks">Before you buy</a></nav><span className="region-label">New Jersey</span></header>
    <main id="top" className="workspace">
      <div className="workspace-heading"><div><p className="section-kicker">A clearer view before you buy</p><h1>Get to know the property.</h1><p>Start with an address. Follow the evidence, understand the gaps, and decide what to investigate next.</p></div><div className="scope-note">One property.<br />Sources in plain sight.</div></div>
      <form className="search-form" onSubmit={search}>
        <div className="input-modes" role="group" aria-label="Property input type"><button type="button" aria-pressed={inputMode === "address"} disabled={finding} onClick={() => setInputMode("address")}>Address</button><button type="button" aria-pressed={inputMode === "page"} disabled={finding} onClick={() => setInputMode("page")}>Copied page text</button></div>
        <label htmlFor="property-input">{inputMode === "page" ? "Copied property page" : "NJ address"}</label>
        {inputMode === "address" ? <AddressInput value={input} onChange={setInput} disabled={finding}><button type="submit" className="primary-button" disabled={finding}>{finding ? "Finding parcel…" : "Find property"}<span aria-hidden="true">↗</span></button></AddressInput> : <div className="page-input"><textarea id="property-input" value={pageText} onChange={event => setPageText(event.target.value)} rows={7} required aria-describedby="input-help" placeholder="Paste the visible property page, including its NJ address and the details you want to investigate." /><div className="page-input-footer"><small>{pageText.length.toLocaleString()} / 50,000 characters</small><button type="submit" className="primary-button" disabled={finding}>{finding ? findingStage === "parsing" ? "Reading page…" : "Finding parcel…" : "Process copied text"}<span aria-hidden="true">↗</span></button></div></div>}
        <div className="input-help" id="input-help"><span>{inputMode === "page" ? "Paste text you have the right to supply. Gemini processes it; no website is fetched. Text is not saved by BidWise." : "Choose an address suggestion or enter the full NJ address."}</span><button type="button" className="text-button" disabled={finding} onClick={() => { setInputMode("address"); setInput("75 Richardson St, New Brunswick, NJ"); }}>Use a source example</button></div>
        {finding && <button type="button" className="text-button cancel-search" onClick={() => beginResearch()}>Cancel research</button>}
      </form>
      {parsedChoices.length > 1 && <section className="confirmation-panel" aria-labelledby="listing-selection-title"><h2 id="listing-selection-title">Which property are you researching?</h2><p>The copied text mentions multiple properties. Claims stay attached to their extracted target; check the quoted address before continuing.</p>{parsedChoices.map((listing, index) => <article className="choice" key={index}><div><h3>{listing.candidate.address}</h3><blockquote>{listing.candidate.addressSnippet}</blockquote><small>{listing.candidate.claims.length} quoted claims</small></div><button className="primary-button" onClick={() => void researchParsed(listing)}>Research this property</button></article>)}</section>}
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      {finding && <div className="notice" role="status">{findingStage === "parsing" ? "Gemini is extracting addresses and supported claims from the pasted text. No property has been confirmed yet." : "Looking for matching NJ addresses and parcel identifiers. No property has been confirmed yet."}</div>}
      {sourceStale && <div className="notice" role="status">Earlier source results are shown because a refresh failed. Check the original retrieval times in Source details.</div>}
      {choices.length > 0 && <section className="confirmation-panel" aria-labelledby="confirmation-title"><div className="section-heading"><h2 id="confirmation-title">Confirm the property</h2><span>{choices.length} {choices.length === 1 ? "parcel" : "parcels"} found</span></div><p>Check the address and parcel identifiers first. The example does not imply a property is for sale.</p>{choices.map(choice => <article className="choice" key={choice.identity.pin}><div><h3>{choice.identity.address}</h3><p>Block {choice.identity.block} · Lot {choice.identity.lot}{choice.identity.qualifier ? ` · Qualifier ${choice.identity.qualifier}` : ""}</p><p className="muted">{choice.note}</p>{parsedListing && <p className="muted">Copied-page target: {parsedListing.candidate.address}. Confirm that the parcel represents this same property.</p>}<small>Parcel {choice.identity.pin} · Match score {choice.identity.score} · {choice.identity.precision}</small></div><button className="primary-button" onClick={() => void confirm(choice)}>Confirm this property</button></article>)}</section>}
      <div className="research-grid" id="research"><PropertyMap property={selected?.identity ?? null} /><section className="property-summary" aria-labelledby="summary-title"><div className="section-heading"><span className="section-kicker">Property overview</span>{selected && <span className="status-label">Parcel confirmed</span>}</div><h2 id="summary-title">{selected ? selected.identity.address.split(",")[0] : "Your property starts here."}</h2><p className="summary-address">{selected ? selected.identity.address.split(",").slice(1).join(",").trim() : "Confirm an NJ parcel to bring its available records into view."}</p>{selected && <p className="parcel-line">Parcel {selected.identity.pin} · Block {selected.identity.block} / Lot {selected.identity.lot}{selected.identity.qualifier ? ` / ${selected.identity.qualifier}` : ""}</p>}
        {!selected ? <div className="empty-summary"><p>Available records can help you understand:</p><ul><li>Assessment and historical tax</li><li>Recorded sale and construction year</li><li>Flood screening and source limitations</li></ul><p className="muted">No property facts or investment results have been loaded.</p></div> : !records ? <p role="status" className="loading-message">Retrieving NJ parcel records…</p> : records.status === "unavailable" ? <div className="notice">{records.message}</div> : <>{fact("assessment") && <Fact fact={fact("assessment")!} prominent />}<div className="summary-facts">{["historical_tax", "year_built", "class", "qualifier"].map(id => fact(id) && <Fact key={id} fact={fact(id)!} />)}</div><p className="summary-caveat">An assessment is not a market valuation. Historical tax is not a current bill.</p></>}
      </section></div>
      {selected && <>{parsedListing && <ListingClaims candidate={parsedListing.candidate} records={records} />}<div className="report-heading"><div><p className="section-kicker">The evidence behind the address</p><h2>A little more clarity.</h2></div><p>Source-matched records describe what was returned.<br />They do not certify condition or title.</p></div><div className="evidence-grid">
        <section className="research-section"><div className="section-heading"><h3>Flood screening</h3><span className="small-label">NJDEP / FEMA</span></div>{!flood ? <p role="status">Checking the mapped flood layer…</p> : flood.status === "unavailable" ? <p className="notice">{flood.message}</p> : <>{floodData?.status === "zones_returned" ? <div className="zones">{floodData.zones.map(zone => <div key={`${zone.zone}:${zone.subtype}`}><span className="zone-code">Zone {zone.zone}</span><p>{zone.subtype.toLowerCase()}</p>{zone.sourceMatches > 1 && <small>{zone.sourceMatches} matching source polygons, grouped for readability</small>}</div>)}</div> : <p>{floodData?.status === "location_uncertain" ? "Location is too approximate to screen." : "No flood polygon was returned."}</p>}<p className="muted">{floodData?.caveat}</p><a className="source-link" href={floodData?.sourceUrl} target="_blank" rel="noopener noreferrer">Open flood source</a></>}</section>
        <section className="research-section"><div className="section-heading"><h3>Recorded history</h3><span className="small-label">NJGIN / MOD-IV</span></div>{records?.status === "available" ? <><div className="history-facts">{["recorded_sale", "deed_date", "deed_book", "deed_page", "sale_code"].map(id => fact(id) && <Fact key={id} fact={fact(id)!} />)}</div><p className="muted">Only the returned record is shown. This is not a complete transaction, permit or title history.</p><p className="source-dates">Record published {records.data.publicationDate ?? "date not supplied"}<br />Parcel geometry updated {records.data.geometryDate ?? "date not supplied"}</p></> : <p>{records ? "History is unavailable with the parcel source." : "Waiting for parcel records…"}</p>}</section></div>
        {records?.status === "available" && <RecordDetails facts={records.data.facts} />}
        <section className="coverage-section" aria-labelledby="coverage-title"><div className="section-heading"><h3 id="coverage-title">What this report covers</h3><span className="small-label">Availability is not a safety rating</span></div><dl className="coverage-list"><div><dt>Parcel and tax record</dt><dd>{records?.status === "available" ? "Retrieved from NJGIN / MOD-IV. Publication and retrieval dates appear in Source details; the assessment and tax year are not supplied." : records ? "Source unavailable. No substitute record was used." : "Retrieving the source record…"}</dd></div><div><dt>Flood mapping</dt><dd>{flood?.status === "available" ? flood.data.status === "location_uncertain" ? "Withheld because the location is too approximate." : "Mapped layer queried. This does not establish a property’s actual flood risk or insurance requirements." : flood ? "Source unavailable." : "Checking the mapped layer…"}</dd></div><div><dt>Listing and interior details</dt><dd>Asking price, bedrooms, bathrooms, interior floor area, photos and advertised condition are not supplied by this parcel source. Listing claims appear only when you supply copied page text and confirm its property.</dd></div><div><dt>Investment scenarios</dt><dd>Renovation, cash resale and cash rental tools are still being built. No return, rent forecast or market valuation is supplied yet.</dd></div><div><dt>Other hazards and local restrictions</dt><dd>Environmental contamination, structural hazards, zoning, permits and rental licensing have not been checked. Flood mapping covers only one part of due diligence.</dd></div><div><dt>Title and transaction checks</dt><dd>Liens, ownership, occupancy, current tax balances, complete sale history and auction terms have not been verified. A deed reference does not establish clear title.</dd></div></dl></section>
        <section className="analysis-section" aria-labelledby="analysis-title"><div className="section-heading"><div><span className="section-kicker">Separate from official records</span><h3 id="analysis-title">AI property analysis</h3></div><button className="secondary-button" disabled={analysis.status === "loading" || !records || !flood} onClick={() => { if (controller.current) void requestAnalysis(selected, revision.current, controller.current.signal); }}>{analysis.status === "loading" ? "Analysis requested…" : "Refresh AI analysis"}</button></div>{analysis.status === "available" ? <><p>{analysis.summary}</p>{analysis.findings.map((finding, i) => <div className="analysis-finding" key={i}><p>{finding.explanation}</p><small>Evidence: {finding.evidenceIds.join(", ")}</small></div>)}{analysis.unansweredQuestions.length > 0 && <><h4>Questions to investigate</h4><ul>{analysis.unansweredQuestions.map((q, i) => <li key={i}>{q}</li>)}</ul></>}{analysis.consistencyFlags.length > 0 && <div className="notice"><h4>Needs review</h4><ul>{analysis.consistencyFlags.map((q, i) => <li key={i}>{q}</li>)}</ul></div>}<small>AI interpretation · {analysis.model} · Snapshot {analysis.snapshotId.slice(0, 12)} · {new Date(analysis.generatedAt).toLocaleString()}</small></> : <p role="status">{analysis.status === "loading" ? "Gemini is reviewing the available evidence. You can use the source records while it runs." : analysis.status === "unavailable" ? analysis.message : "Analysis will be requested when source checks finish. Missing financial assumptions do not prevent a property review."}</p>}</section>
      </>}
      <section id="remaining-checks" className="remaining-section"><div className="section-heading"><div><p className="section-kicker">Before you buy</p><h2>Keep these on your list.</h2></div><span className="small-label">Not checked by BidWise</span></div><p className="section-intro">Public records are a starting point. These questions still need direct evidence and the right professional.</p><div className="checks-grid">{remainingChecks.map(([title, detail]) => <article className="check-item" key={title}><span className="unchecked" aria-hidden="true" /><div><h3>{title}</h3><p>{detail}</p></div></article>)}</div></section>
      <footer className="site-footer"><span>BidWise</span><p>Evidence for your research. No promise of a complete record or a safe purchase.</p><a href="#top">Back to search</a></footer>
    </main>
  </>;
}

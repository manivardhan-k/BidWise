"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Calculator, Check, ChevronDown, ClipboardCheck, FileCheck2, Files, FileText, Gavel, House, Info, KeyRound, MapPin, ReceiptText, Search, ShieldCheck, Sparkles, Waves, Wrench } from "lucide-react";
import PropertyMap from "../map/PropertyMap";
import { Fact } from "../research/Fact";
import { AddressInput } from "./AddressInput";
import { StartingEstimates, type StartingState, type StartingResponse } from "../finance/StartingEstimates";
import { applyStartingEstimates, changedFinanceFields, recordEvidenceKey } from "@/lib/finance/starting-estimates";
import { FinanceWorkspace } from "../finance/FinanceWorkspace";
import { emptyFinance, financeInputKey, financeSchema, type FinanceInputs } from "@/lib/finance/engines";
import { ListingClaims } from "../research/ListingClaims";
import type { ParsedProperty } from "@/lib/analysis/validate";
import { RecordDetails } from "../research/RecordDetails";
import { AIAnalysis, type AnalysisState } from "../research/AIAnalysis";
import { ReportNavigation } from "../research/ReportNavigation";
import type { AnalysisResult, FloodScreen, PropertyChoice, PropertyRecords, SourceResult } from "@/lib/property/types";
import { matchReviewMessage } from "@/lib/property/match-review";
async function post<T>(path: string, body: unknown, signal: AbortSignal): Promise<T> {
  let response: Response;
  try { response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal }); }
  catch (error) { if (signal.aborted) throw error; throw new Error("BidWise could not be reached. Check your connection and try again. Your entered text is still here."); }
  let data;
  try { data = await response.json(); } catch { throw new Error("BidWise returned an incomplete response. Please try again; your entered text is still here."); }
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "This source could not be reached. Try again later.");
  return data;
}
const remainingChecks = [
  { title: "Physical condition", detail: "Get an inspection and contractor quotes.", icon: Wrench, tone: "coral" },
  { title: "Title, liens and ownership", detail: "Have a professional review title and liens.", icon: ShieldCheck, tone: "violet" },
  { title: "Occupancy and possession", detail: "Verify occupancy, access and possession costs.", icon: KeyRound, tone: "mint" },
  { title: "Current taxes and insurance", detail: "Confirm the current bill and insurance options.", icon: ReceiptText, tone: "mint" },
  { title: "Sale or auction terms", detail: "Review deposits, deadlines and obligations.", icon: Gavel, tone: "coral" },
  { title: "Use and permits", detail: "Check zoning, open permits and local rules.", icon: FileCheck2, tone: "violet" },
];
export default function PropertyWorkspace() {
  const [input, setInput] = useState("");
  const [finance, setFinance] = useState(emptyFinance);
  const financeRef = useRef(finance);
  const [reviewedFinanceKey, setReviewedFinanceKey] = useState<string | null>(null);
  const currentFinanceKey = financeSchema.safeParse(finance).success ? financeInputKey(finance) : null;
  const [starting, setStarting] = useState<StartingState>({ status: "idle" });
  const startingRef = useRef<StartingResponse | null>(null);
  const [touchedFields, setTouchedFields] = useState<ReadonlySet<string>>(new Set());
  const touched = useRef(new Set<string>());
  const estimateSerial = useRef(0);
  function updateFinance(next: FinanceInputs, automatic = false) {
    if (!automatic) {
      changedFinanceFields(financeRef.current, next).forEach(field => touched.current.add(field));
      setTouchedFields(new Set(touched.current));
    }
    financeRef.current = next; setFinance(next); ++analysisSerial.current;
    setAnalysis(previous => previous.status === "loading" ? { status: "unavailable", message: "Assumptions changed while AI was reviewing. Refresh analysis for the current numbers." } : previous);
  }
  const [inputMode, setInputMode] = useState<"address" | "page">("address");
  const [pageText, setPageText] = useState("");
  const [parsedChoices, setParsedChoices] = useState<ParsedProperty[]>([]);
  const [extractionModel, setExtractionModel] = useState<{ model: string; fallbackFrom?: string } | null>(null);
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
  const drafts = useRef(new Map<string, { finance: FinanceInputs; touched: Set<string> }>());
  const [draftRestored, setDraftRestored] = useState(false);
  const confirmationHeading = useRef<HTMLHeadingElement>(null);
  const summaryHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (choices.length) confirmationHeading.current?.focus(); }, [choices]);
  useEffect(() => { if (selected) summaryHeading.current?.focus(); }, [selected]);
  function beginResearch() {
    if (selected && touched.current.size) {
      if (drafts.current.size >= 10 && !drafts.current.has(selected.identity.pin)) drafts.current.delete(drafts.current.keys().next().value!);
      drafts.current.set(selected.identity.pin, { finance: financeRef.current, touched: new Set(touched.current) });
    }
    setDraftRestored(false);
    controller.current?.abort(); controller.current = new AbortController();
    const current = ++revision.current;
    setFinding(false); setError(""); setSelected(null); setChoices([]); setRecords(null); setFlood(null); setAnalysis({ status: "idle" });
    setParsedChoices([]); setParsedListing(null); setExtractionModel(null); listingContext.current = null;
    ++estimateSerial.current; startingRef.current = null; setStarting({ status: "idle" }); touched.current = new Set(); setTouchedFields(new Set());
    const blankFinance = emptyFinance(); financeRef.current = blankFinance; setFinance(blankFinance); setReviewedFinanceKey(null);
    sourceState.current = { records: null, flood: null }; setSourceStale(false);
    return { current, signal: controller.current.signal };
  }
  async function findAddress(address: string, listing: ParsedProperty | null, current: number, signal: AbortSignal) {
    setFindingStage("matching");
    const result = await post<{ choices: PropertyChoice[]; sourceFailures: number; addressMatches?: number; identifierConflicts?: number }>("/api/identify", { address, ...(listing ? { listing } : {}) }, signal);
    if (revision.current !== current) return;
    listingContext.current = listing; setParsedListing(listing); setChoices(result.choices);
    if (!result.choices.length) setError(result.sourceFailures ? "Parcel matching is unavailable. Try again later; no guessed match was used." : result.addressMatches === 0 ? "NJ’s address index returned no match. This may be a coverage gap, especially for apartment/unit addresses. Try the building’s street address and municipality or an address suggestion. This does not mean the property does not exist." : result.identifierConflicts ? "NJ’s address and parcel sources returned conflicting identifiers, so BidWise could not safely join them. Compare the block, lot and unit with the current municipal tax record or deed. This source disagreement does not mean your address is wrong." : "NJ’s address index located the address, but the parcel layer returned no confirmable match. This may be a parcel coverage gap. Check the street number, municipality and any unit against an official record; a repeated search may return the same gap.");
  }
  async function researchParsed(listing: ParsedProperty) {
    const processedBy = extractionModel;
    const { current, signal } = beginResearch(); setFinding(true); setExtractionModel(processedBy);
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
        const result = await post<{ candidates: ParsedProperty[]; model?: string; fallbackFrom?: string }>("/api/parse", { text: pageText }, signal);
        if (revision.current !== current) return;
        if (result.model) setExtractionModel({ model: result.model, fallbackFrom: result.fallbackFrom });
        if (!result.candidates.length) { setError("No supported property address was extracted. Keep your text, check that its NJ address is included, or search the address directly."); return; }
        if (result.candidates.length > 1) { setParsedChoices(result.candidates); return; }
        await findAddress(result.candidates[0].candidate.address, result.candidates[0], current, signal);
      } else await findAddress(input.trim().replace(/\s+/g, " "), null, current, signal);
    } catch (error) { if (revision.current === current) setError(error instanceof Error ? error.message : "Property research failed."); }
    finally { if (revision.current === current) setFinding(false); }
  }
  async function requestAnalysis(choice: PropertyChoice, current: number, signal: AbortSignal) {
    const suppliedFinance = financeRef.current;
    if (!financeSchema.safeParse(suppliedFinance).success) { setAnalysis({ status: "unavailable", message: "Correct invalid financial assumptions before refreshing AI analysis. Source records remain available." }); return; }
    const requestedFinanceKey = financeInputKey(suppliedFinance);
    const serial = ++analysisSerial.current;
    setAnalysis({ status: "loading" });
    try {
      const result = await post<AnalysisResult | { status: "unavailable"; message: string; revision: number; records: SourceResult<PropertyRecords>; flood: SourceResult<FloodScreen>; financeInputKey: string }>("/api/analysis", { token: choice.token, revision: current, finance: suppliedFinance, financeContext: JSON.stringify((startingRef.current?.estimates ?? []).map(item => ({ field: item.field, edited: touched.current.has(item.field === "renovation.allowance" ? "renovation.items" : item.field), kind: item.kind, originalStartingValue: item.value, basis: item.explanation, sourceDate: item.sourceDate }))), ...(listingContext.current ? { listing: listingContext.current } : {}) }, signal);
      if (revision.current !== current || result.revision !== current || analysisSerial.current !== serial) return;
      if (result.financeInputKey !== requestedFinanceKey) { setAnalysis({ status: "unavailable", message: "The analysis response did not match the current assumptions. No explanation or refreshed records were accepted." }); return; }
      if ((result.records.status === "unavailable" && sourceState.current.records?.status === "available")
        || (result.flood.status === "unavailable" && sourceState.current.flood?.status === "available")) {
        setSourceStale(true);
        setAnalysis({ status: "unavailable", message: "A source refresh failed. Previous source results are still shown with their original retrieval times. No refreshed AI explanation was accepted." });
        return;
      }
      sourceState.current = { records: result.records, flood: result.flood }; setSourceStale(false);
      setRecords(result.records); setFlood(result.flood); setReviewedFinanceKey(requestedFinanceKey); setAnalysis(result);
    } catch { if (revision.current === current && analysisSerial.current === serial) setAnalysis({ status: "unavailable", message: "AI analysis could not be completed. Your source records remain available." }); }
  }
  async function requestStarting(choice: PropertyChoice, current: number, signal: AbortSignal) {
    const serial = ++estimateSerial.current;
    setStarting({ status: "sources", ...(startingRef.current ? { data: startingRef.current } : {}) });
    const apply = (result: StartingResponse) => {
      if (revision.current !== current || estimateSerial.current !== serial) return false;
      if (result.revision !== current || result.pin !== choice.identity.pin) {
        setStarting({ status: "unavailable", message: "The starting-value response did not match the confirmed property. No values were applied." });
        setAnalysis({ status: "unavailable", message: "Starting-value identity check failed. Refresh the property before requesting analysis." }); return false;
      }
      if (!sourceState.current.records || result.recordKey !== recordEvidenceKey(sourceState.current.records)) {
        setStarting({ status: "unavailable", ...(startingRef.current ? { data: startingRef.current } : {}), message: "Source records changed while starting values were prepared. No new values were applied. Review the earlier basis, then refresh starting values after the current property analysis finishes." });
        void requestAnalysis(choice, current, signal); return false;
      }
      startingRef.current = result;
      updateFinance(applyStartingEstimates(financeRef.current, result.estimates, touched.current), true);
      return true;
    };
    try {
      for (const stage of ["sources", "model"] as const) {
        const result = await post<StartingResponse>("/api/estimates", { token: choice.token, revision: current, stage, ...(listingContext.current ? { listing: listingContext.current } : {}) }, signal);
        if (!apply(result)) return;
        const saved = stage === "sources" && result.modelStatus === "available";
        setStarting({ status: stage === "sources" && !saved ? "model" : "done", data: result });
        if (saved) break;
      }
    } catch {
      if (revision.current !== current || estimateSerial.current !== serial) return;
      const latest = startingRef.current;
      setStarting(latest ? { status: "done", data: { ...latest, modelStatus: "unavailable", message: "Additional estimates are unavailable. Existing starting values remain; your edits were preserved." } } : { status: "unavailable", message: "Starting values could not be prepared. You can still enter assumptions and use the property records." });
    }
    if (revision.current === current && estimateSerial.current === serial) void requestAnalysis(choice, current, signal);
  }
  function restoreStarting() {
    const data = startingRef.current; if (!data) return;
    for (const item of data.estimates) touched.current.delete(item.field === "renovation.allowance" ? "renovation.items" : item.field);
    setTouchedFields(new Set(touched.current));
    updateFinance(applyStartingEstimates(financeRef.current, data.estimates, touched.current, true), true);
  }
  async function confirm(choice: PropertyChoice) {
    controller.current?.abort(); controller.current = new AbortController();
    const signal = controller.current.signal; const current = ++revision.current;
    const draft = drafts.current.get(choice.identity.pin);
    if (draft) {
      financeRef.current = draft.finance; setFinance(draft.finance);
      touched.current = new Set(draft.touched); setTouchedFields(new Set(draft.touched)); setDraftRestored(true);
    }
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
    if (revision.current === current) void requestStarting(choice, current, signal);
  }
  const facts = records?.status === "available" ? records.data.facts : [];
  const fact = (id: string) => facts.find(f => f.id === id);
  const taxDetailsMissing = ["property_address", "class", "assessment", "historical_tax"].every(id => fact(id)?.value === null);
  const floodData = flood?.status === "available" ? flood.data : null;
  return <>
    <a className="skip-link" href="#top">Skip to property search</a>
    <header className="site-header"><a className="brand" href="#top"><span className="brand-mark"><House size={24} aria-hidden="true" /></span>BidWise<span className="brand-dot">.</span></a><nav aria-label="Page navigation"><a href="#research"><Search size={16} aria-hidden="true" />Research</a><a href="#remaining-checks"><ClipboardCheck size={16} aria-hidden="true" />Before you buy</a></nav><span className="region-label"><MapPin size={14} aria-hidden="true" />New Jersey</span></header>
    <main id="top" className="workspace">
      <div className="workspace-heading"><div><p className="hero-kicker"><Sparkles size={14} aria-hidden="true" />A little research. A lot more clarity.</p><h1>Big decisions.<br /><span>Clearer details.</span></h1><p>Find a property. Check the facts. Run your numbers.</p></div><div className="research-steps" aria-label="Research steps"><div><span className="step-icon coral"><Search size={20} aria-hidden="true" /></span><span>Find it</span></div><span className="step-connector" aria-hidden="true" /><div><span className="step-icon violet"><Files size={20} aria-hidden="true" /></span><span>Check it</span></div><span className="step-connector" aria-hidden="true" /><div><span className="step-icon mint"><Calculator size={20} aria-hidden="true" /></span><span>Explore it</span></div></div></div>
      <form className="search-form" onSubmit={search}>
        <div className="search-form-heading"><div className="input-modes" role="group" aria-label="Property input type"><button type="button" aria-pressed={inputMode === "address"} disabled={finding} onClick={() => setInputMode("address")}><MapPin size={16} aria-hidden="true" />Address</button><button type="button" aria-pressed={inputMode === "page"} disabled={finding} onClick={() => setInputMode("page")}><FileText size={16} aria-hidden="true" />Copied page text</button></div><span className="search-scope">One address. The bigger picture.</span></div>
        <label htmlFor="property-input">{inputMode === "page" ? "Copied property page" : "NJ address"}</label>
        {inputMode === "address" ? <AddressInput error={error} value={input} onChange={setInput} disabled={finding}><button type="submit" className="primary-button" disabled={finding}>{finding ? "Finding parcel…" : "Find property"}<ArrowRight size={18} aria-hidden="true" /></button></AddressInput> : <div className="page-input"><textarea id="property-input" disabled={finding} aria-invalid={Boolean(error)} value={pageText} onChange={event => setPageText(event.target.value)} rows={5} required aria-describedby="input-help" placeholder="Paste property page text, including the NJ address." /><div className="page-input-footer"><small>{pageText.length.toLocaleString()} / 50,000 characters</small><button type="submit" className="primary-button" disabled={finding}>{finding ? findingStage === "parsing" ? "Reading page…" : "Finding parcel…" : "Process copied text"}<ArrowRight size={18} aria-hidden="true" /></button></div></div>}
        <div className="input-help" id="input-help"><span>{inputMode === "page" ? "Use text you have the right to share. Processed by the configured AI provider. No website is fetched; pasted text is not saved by BidWise." : "New Jersey only. Choose a suggestion or enter the full address."}</span><button type="button" className="text-button example-button" disabled={finding} onClick={() => { setInputMode("address"); setInput("75 Richardson St, New Brunswick, NJ"); }}>Use a source example<ArrowUpRight size={13} aria-hidden="true" /></button></div>
        {finding && <button type="button" className="text-button cancel-search" onClick={() => beginResearch()}>Cancel research</button>}
      </form>
      {parsedChoices.length > 1 && <section className="confirmation-panel" aria-labelledby="listing-selection-title"><h2 id="listing-selection-title">Which property are you researching?</h2><p>The copied text mentions multiple properties. Claims stay attached to their extracted target; check the quoted address before continuing.</p>{parsedChoices.map((listing, index) => <article className="choice" key={index}><div><h3>{listing.candidate.address}</h3><blockquote>{listing.candidate.addressSnippet}</blockquote><small>{listing.candidate.claims.length} quoted claims</small></div><button className="primary-button" onClick={() => void researchParsed(listing)}>Research this property</button></article>)}</section>}
      {extractionModel?.fallbackFrom && <div className="notice" role="status">Copied text processed by {extractionModel.model} after {extractionModel.fallbackFrom} returned temporary service failures. The same quotation and property checks apply.</div>}
      {error && <div id="research-error" className="notice notice-error" role="alert">{error}</div>}
      {finding && <div className="notice" role="status">{findingStage === "parsing" ? "AI is extracting addresses and supported claims from the pasted text. No property has been confirmed yet." : "Looking for matching NJ addresses and parcel identifiers. No property has been confirmed yet."}</div>}
      {sourceStale && <div className="notice" role="status">Earlier source results are shown because a refresh failed. Check the original retrieval times in Source details.</div>}
      {choices.length > 0 && <section className="confirmation-panel" aria-labelledby="confirmation-title"><div className="section-heading"><h2 id="confirmation-title" ref={confirmationHeading} tabIndex={-1}>Confirm the property</h2><span>{choices.length} {choices.length === 1 ? "parcel" : "parcels"} found</span></div><p>Check the address, block and lot. A match does not mean it’s for sale.</p>{choices.map(choice => <article className="choice" key={choice.identity.pin}><div><h3>{choice.identity.address}</h3><p>Block {choice.identity.block} · Lot {choice.identity.lot}{choice.identity.qualifier ? ` · Qualifier ${choice.identity.qualifier}` : ""}</p><p className={choice.identity.matchReview ? "notice" : "muted"}>{choice.note}</p>{parsedListing && <p className="muted">Copied-page target: {parsedListing.candidate.address}. Confirm that the parcel represents this same property.</p>}<small>Parcel {choice.identity.pin} · Match score {choice.identity.score} · {choice.identity.precision}</small></div><button className="primary-button" onClick={() => void confirm(choice)}>{choice.identity.matchReview ? "Use this parcel for research" : "Confirm this property"}</button></article>)}</section>}
      {selected && <ReportNavigation records={records} />}
      {draftRestored && <p className="notice" role="status">Your scenario edits for this parcel were restored. Drafts last only while this page is open; a reload clears them.</p>}
      <div className="research-grid" id="research"><PropertyMap property={selected?.identity ?? null} /><section className="property-summary" aria-labelledby="summary-title"><div className="section-heading"><span className="section-kicker"><House size={14} aria-hidden="true" />Property overview</span>{selected && <span className={`status-label${selected.identity.matchReview ? " status-review" : ""}`}>{selected.identity.matchReview ? <Info size={12} aria-hidden="true" /> : <Check size={12} aria-hidden="true" />}{selected.identity.matchReview ? "Match needs review" : "Parcel confirmed"}</span>}</div><h2 id="summary-title" ref={summaryHeading} tabIndex={-1}>{selected ? selected.identity.address.split(",")[0] : "Meet your next maybe."}</h2><p className="summary-address">{selected ? selected.identity.address.split(",").slice(1).join(",").trim() : "Your property’s bigger picture starts here."}</p>{selected && <p className="parcel-line">Parcel {selected.identity.pin} · Block {selected.identity.block} / Lot {selected.identity.lot}{selected.identity.qualifier ? ` / ${selected.identity.qualifier}` : ""}</p>}
        {selected?.identity.matchReview && <p className="notice" role="note">{matchReviewMessage(selected.identity)}</p>}
        {selected && taxDetailsMissing && <p className="notice">The parcel was located, but its address, property class, assessment and tax details are missing from this state record. Check the municipal tax record; retrying this search cannot fill those gaps.</p>}
        {!selected ? <div className="empty-summary"><div className="preview-feature"><span className="feature-icon coral"><Files size={19} aria-hidden="true" /></span><div><h3>Property records</h3><p>Assessment, tax & recorded history</p></div></div><div className="preview-feature"><span className="feature-icon violet"><Waves size={19} aria-hidden="true" /></span><div><h3>Flood screening</h3><p>Mapped zones & source details</p></div></div><div className="preview-feature"><span className="feature-icon mint"><Calculator size={19} aria-hidden="true" /></span><div><h3>Cash scenarios</h3><p>Renovation, resale & rental</p></div></div><p className="empty-state-note">Search and confirm a parcel to load records.</p></div> : !records ? <p role="status" className="loading-message">Retrieving NJ parcel records…</p> : records.status === "unavailable" ? <div className="notice">{records.message}</div> : <>{fact("assessment") && <Fact fact={fact("assessment")!} prominent />}<div className="summary-facts">{["historical_tax", "year_built", "class", "qualifier"].map(id => fact(id) && <Fact key={id} fact={fact(id)!} />)}</div><p className="summary-caveat">Assessment ≠ market value. Historical tax ≠ current bill.</p></>}
      </section></div>
      {selected && <>{parsedListing && <ListingClaims candidate={parsedListing.candidate} records={records} />}<div className="report-heading"><div><p className="section-kicker">The evidence behind the address</p><h2>A little more clarity.</h2></div><p>Source records, with the gaps left visible.</p></div><div className="evidence-grid">
        <section className="research-section"><div className="section-heading"><h3 id="flood-screen" className="section-title"><Waves size={20} aria-hidden="true" />Flood screening</h3><span className="small-label">NJDEP / FEMA</span></div>{!flood ? <p role="status">Checking the mapped flood layer…</p> : flood.status === "unavailable" ? <p className="notice">{flood.message}</p> : <>{floodData?.status === "zones_returned" ? <div className="zones">{floodData.zones.map(zone => <div key={`${zone.zone}:${zone.subtype}`}><span className="zone-code">Zone {zone.zone}</span><p>{zone.subtype.toLowerCase()}</p>{zone.sourceMatches > 1 && <small>{zone.sourceMatches} matching source polygons, grouped for readability</small>}</div>)}</div> : <p>{floodData?.status === "location_uncertain" ? "Location is too approximate to screen." : "No flood polygon was returned."}</p>}<p className="muted">{floodData?.caveat}</p><a className="source-link" href={floodData?.sourceUrl} target="_blank" rel="noopener noreferrer">Open flood source</a></>}</section>
        <section className="research-section"><div className="section-heading"><h3 id="recorded-history" className="section-title"><ReceiptText size={20} aria-hidden="true" />Recorded history</h3><span className="small-label">NJGIN / MOD-IV</span></div>{records?.status === "available" ? <><div className="history-facts">{["recorded_sale", "deed_date", "deed_book", "deed_page", "sale_code"].map(id => fact(id) && <Fact key={id} fact={fact(id)!} />)}</div><p className="muted">Returned records only; history may be incomplete.</p><p className="source-dates">Record published {records.data.publicationDate ?? "date not supplied"}<br />Parcel geometry updated {records.data.geometryDate ?? "date not supplied"}</p></> : <p>{records ? "History is unavailable with the parcel source." : "Waiting for parcel records…"}</p>}</section></div>
        {records?.status === "available" && <RecordDetails facts={records.data.facts} />}
        <FinanceWorkspace value={finance} onChange={next => updateFinance(next)} estimates={starting.data?.estimates} touched={touchedFields} startingPanel={<StartingEstimates state={starting} touched={touchedFields} onRetry={() => { if (controller.current) void requestStarting(selected, revision.current, controller.current.signal); }} onRestore={restoreStarting} />} />
        <section className="coverage-section" aria-labelledby="coverage-title"><div className="section-heading"><h3 id="coverage-title" className="section-title"><ShieldCheck size={20} aria-hidden="true" />What this report covers</h3><span className="small-label">Availability is not a safety rating</span></div><details className="coverage-details"><summary>Sources, coverage & limitations<ChevronDown size={16} aria-hidden="true" /></summary><dl className="coverage-list"><div><dt>Parcel and tax record</dt><dd>{records?.status === "available" ? "Retrieved from NJGIN / MOD-IV. Publication and retrieval dates appear in Source details; the assessment and tax year are not supplied." : records ? "Source unavailable. No substitute record was used." : "Retrieving the source record…"}</dd></div><div><dt>Flood mapping</dt><dd>{flood?.status === "available" ? flood.data.status === "location_uncertain" ? "Withheld because the location is too approximate." : "Mapped layer queried. This does not establish a property’s actual flood risk or insurance requirements." : flood ? "Source unavailable." : "Checking the mapped layer…"}</dd></div><div><dt>Listing and interior details</dt><dd>Asking price, bedrooms, bathrooms, interior floor area, photos and advertised condition are not supplied by this parcel source. Listing claims appear only when you supply copied page text and confirm its property.</dd></div><div><dt>Investment scenarios</dt><dd>Renovation, cash resale and cash rental scenarios use your entered assumptions. Missing costs stay unknown. No rent forecast, market valuation or promised return is supplied.</dd></div><div><dt>Other hazards and local restrictions</dt><dd>Environmental contamination, structural hazards, zoning, permits and rental licensing have not been checked. Flood mapping covers only one part of due diligence.</dd></div><div><dt>Title and transaction checks</dt><dd>Liens, ownership, occupancy, current tax balances, complete sale history and auction terms have not been verified. A deed reference does not establish clear title.</dd></div></dl></details></section>
        <AIAnalysis analysis={analysis} outdated={reviewedFinanceKey !== currentFinanceKey} waiting={starting.status === "sources" || starting.status === "model"} canRefresh={Boolean(records && flood)} onRefresh={() => { if (analysis.status === "available" && analysis.financeInputKey === currentFinanceKey && !sourceStale && Date.now() - Date.parse(analysis.generatedAt) < 60_000) return; if (controller.current) void requestAnalysis(selected, revision.current, controller.current.signal); }} />
      </>}
      <section id="remaining-checks" className="remaining-section"><div className="section-heading"><div><p className="section-kicker"><ClipboardCheck size={14} aria-hidden="true" />Before you buy</p><h2>A few things to double-check.</h2></div><span className="small-label">Not checked by BidWise</span></div><div className="checks-grid">{remainingChecks.map(({ title, detail, icon: Icon, tone }) => <article className="check-item" key={title}><span className={`feature-icon ${tone}`}><Icon size={20} aria-hidden="true" /></span><div><h3>{title}</h3><p>{detail}</p></div></article>)}</div></section>
      <footer className="site-footer"><span>BidWise<span className="brand-dot">.</span></span><p>A starting point for research. No purchase guarantees.</p><a href="#top">Back to search<ArrowUpRight size={14} aria-hidden="true" /></a></footer>
    </main>
  </>;
}

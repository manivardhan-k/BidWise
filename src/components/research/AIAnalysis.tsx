"use client";
import { Sparkles } from "lucide-react";
import { formatValue } from "./Fact";
import type { AnalysisResult, PropertyRecords, SourceResult } from "@/lib/property/types";
type Unavailable = { status: "idle" | "loading" | "unavailable"; message?: string; category?: string; failedModel?: string; attempts?: number; validationFailure?: string };
export type AnalysisState = Unavailable | AnalysisResult;
const evidenceNames: Record<string, [string, string]> = {
  address: ["Confirmed address", "#research"], parcel: ["Parcel identity", "#research"], flood: ["Flood screening", "#flood-screen"],
  limits: ["Report limits", "#remaining-checks"], finance_limits: ["Scenario limits", "#scenarios"],
  identity_match_review: ["Unresolved property match", "#research"], finance_assumption_context: ["Starting-value basis", "#starting-title"],
};
function evidenceLink(id: string, records: SourceResult<PropertyRecords> | null) {
  const factId = id.replace(/_caveat$/, "");
  const fact = records?.status === "available" ? records.data.facts.find(item => item.id === factId) : undefined;
  if (fact) return { label: id.endsWith("_caveat") ? `${fact.label}: limitations` : `${fact.label}: ${formatValue(fact)}`, href: ["recorded_sale", "deed_date", "deed_book", "deed_page", "sale_code"].includes(factId) ? "#recorded-history" : "#property-records" };
  const known = evidenceNames[id];
  if (known) return { label: known[0], href: known[1] };
  if (id.startsWith("renovation")) return { label: "Renovation assumptions and calculation", href: "#renovation-title" };
  if (id.startsWith("rent_")) return { label: "Rental assumptions and calculation", href: "#rent-title" };
  if (id.startsWith("flip_")) return { label: "Resale assumptions and calculation", href: "#resale-title" };
  if (id.startsWith("listing_")) return { label: "Copied-page claim and comparison", href: "#listing-title" };
  return { label: "Source context and limitations", href: "#remaining-checks" };
}
export function AIAnalysis({ analysis, outdated, waiting, canRefresh, onRefresh }: { analysis: AnalysisState; outdated: boolean; waiting: boolean; canRefresh: boolean; onRefresh: () => void }) {
  return <section className="analysis-section" aria-labelledby="analysis-title">
    <div className="section-heading"><h3 id="analysis-title" className="section-title"><Sparkles size={20} aria-hidden="true" />AI property analysis</h3><button className="secondary-button" disabled={analysis.status === "loading" || !canRefresh} onClick={onRefresh}>{analysis.status === "loading" ? "Analysis requested…" : "Refresh AI analysis"}</button></div>
    <p className="analysis-limit">AI can be wrong. Check its linked records and assumptions.</p>
    {analysis.status === "available" ? <>
      {outdated && <div className="notice notice-error" role="status">AI analysis is outdated. Financial assumptions have changed since this explanation was generated. Refresh AI analysis for the current numbers.</div>}
      <h4>BidWise’s take</h4><p className="analysis-summary">{analysis.summary}</p>
      {analysis.findings.length > 0 && <h4>What drives this view</h4>}
      {analysis.findings.map((finding, i) => <div className="analysis-finding" key={i}><p>{finding.explanation}</p><div className="analysis-evidence" aria-label="Referenced report sections">{[...new Map(finding.evidenceIds.map(id => { const link = evidenceLink(id, analysis.records); return [link.label, link] as const; })).values()].map(link => <a key={link.label} href={link.href}>{link.label}</a>)}</div></div>)}
      {analysis.unansweredQuestions.length > 0 && <><h4>Recommended next steps</h4><ol>{analysis.unansweredQuestions.map((question, i) => <li key={i}>{question}</li>)}</ol></>}
      {analysis.consistencyFlags.length > 0 && <div className="notice"><h4>Needs review</h4><ul>{analysis.consistencyFlags.map((flag, i) => <li key={i}>{flag}</li>)}</ul></div>}
      <small className="analysis-provenance">AI interpretation · {analysis.provider === "groq" ? "Groq · " : ""}{analysis.model}{analysis.fallbackFrom ? ` · Free fallback after ${analysis.fallbackFrom} service failures` : ""} · {new Date(analysis.generatedAt).toLocaleString()}</small>
    </> : <>
      <p role="status">{analysis.status === "loading" ? "AI is reviewing the available evidence. You can use the source records and edit your numbers while it runs." : analysis.status === "unavailable" ? analysis.message : waiting ? "Analysis will review the current inputs when starting values finish. You can also request it now; later edits will mark it outdated." : "Analysis will be requested when source checks finish. Missing financial assumptions do not prevent a property review."}</p>
      {analysis.status === "unavailable" && analysis.category && <details className="analysis-diagnostics"><summary>Request details</summary><p>Model: {analysis.failedModel ?? "Not selected"} · Attempts: {analysis.attempts ?? 0} · Reason: {analysis.category}{analysis.validationFailure ? ` / ${analysis.validationFailure}` : ""}</p></details>}
    </>}
  </section>;
}

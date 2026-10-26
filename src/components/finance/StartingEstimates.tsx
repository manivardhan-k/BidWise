"use client";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { estimateLabels, type StartingEstimate, type EstimateBundle } from "@/lib/finance/starting-estimates";
import type { AreaBenchmarks } from "@/lib/providers/census";
import type { SourceResult } from "@/lib/property/types";
export type StartingResponse = EstimateBundle & { pin: string; revision: number; recordKey: string; checkedAt: string; area: SourceResult<AreaBenchmarks>; modelStatus: "not_requested" | "available" | "unavailable"; model?: string; fallbackFrom?: string; message?: string };
export type StartingState = { status: "idle" | "sources" | "model" | "done" | "unavailable"; data?: StartingResponse; message?: string };
const labels: Record<StartingEstimate["kind"], string> = { historical_record: "Historical record used", copied_claim: "Copied asking price", area_benchmark: "Older area benchmark", illustrative: "Illustrative assumption", model_allowance: "Provisional AI allowance" };
export const estimateKindLabel = (item: StartingEstimate) => item.kind === "copied_claim" && item.field === "rent.monthlyRent" ? "Copied asking rent" : labels[item.kind];
const fractionFields = new Set(["renovation.contingency", "flip.buyerFraction", "flip.commissionFraction", "flip.sellerFraction", "flip.resaleDrop", "flip.extraSellerFraction", "rent.vacancy", "rent.management"]);
export function estimateValue(item: StartingEstimate, value = item.value) {
  if (fractionFields.has(item.field)) return `${Number((value * 100).toFixed(2))}%`;
  if (["flip.holdMonths", "flip.extraMonths"].includes(item.field)) return `${value} months`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
export function StartingEstimates({ state, touched, onRetry, onRestore }: { state: StartingState; touched: ReadonlySet<string>; onRetry: () => void; onRestore: () => void }) {
  const pending = state.status === "sources" || state.status === "model";
  return <section className="starting-estimates" aria-labelledby="starting-title"><div className="section-heading"><h3 id="starting-title" className="section-title"><SlidersHorizontal size={20} aria-hidden="true" />Starting values for this property</h3><span className="small-label">Editable · low confidence until checked</span></div>
    <p>Labeled starting points, ready to edit. Older area medians are not property valuations or renovation forecasts; review each source below.</p>
    <p role="status">{state.status === "sources" ? "Matching this property to dated local housing benchmarks… You can edit any field while it runs." : state.status === "model" ? "Source-based starting values are ready. AI is preparing broad cost allowances; your edits will be preserved." : state.status === "unavailable" ? state.message : state.data ? `${state.data.estimates.length} starting values supplied. ${state.data.modelStatus === "unavailable" ? state.data.message ?? "AI allowances are unavailable; the other starting values remain." : state.data.modelStatus === "available" ? `${state.data.estimates.some(item => item.kind === "model_allowance") ? "Cost allowances prepared" : "No supported cost allowances returned"} by ${state.data.model}${state.data.fallbackFrom ? ` after ${state.data.fallbackFrom} service failures` : ""}.` : ""}` : "Starting values will be prepared after the source checks."}</p>
    {state.data && <details className="estimate-basis"><summary>Review starting values, sources and uncertainty</summary><p>Survey ranges below describe uncertainty in the area median. They are not prediction intervals for this property. Planning ranges are provisional assumptions, not statistical confidence intervals. Your edited fields are retained.</p>
      {state.data.area.status === "available" && <p>Matched geography: {state.data.area.data.name} · ACS {state.data.area.data.period}. <a href={state.data.area.data.geographyUrl} target="_blank" rel="noopener noreferrer">Check Census geography</a>. Census Reporter is an independent mirror of US Census data.</p>}
      <dl className="estimate-basis-list">{state.data.estimates.map(item => <div key={item.field}><dt>{estimateLabels[item.field]}<span>{estimateKindLabel(item)} · low confidence{touched.has(item.field === "renovation.allowance" ? "renovation.items" : item.field) ? " · You edited this field" : ""}</span></dt><dd><strong>{estimateValue(item)}</strong>{item.rangeKind !== "none" && <small>{item.rangeKind === "survey_moe" ? "Survey median ± margin of error" : "Planning range"}: {estimateValue(item, item.low)} to {estimateValue(item, item.high)}</small>}<p>{item.explanation}</p><small>{item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.sourceLabel}</a> : item.sourceLabel} · Data date: {item.sourceDate ?? "not supplied"} · Checked {new Date(item.checkedAt).toLocaleDateString()}</small></dd></div>)}</dl>
      <h4>Still needs evidence or your choice</h4><ul>{state.data.gaps.map((gap, index) => <li key={index}>{gap}</li>)}</ul>
    </details>}
    <div className="estimate-actions"><button type="button" className="secondary-button" disabled={pending} onClick={onRetry}><RotateCcw size={14} aria-hidden="true" />{pending ? "Preparing starting values…" : "Refresh starting values"}</button>{state.data && <button type="button" className="text-button" disabled={pending} onClick={onRestore}>Restore supplied starting values</button>}</div>
    <small className="estimate-reset-note">Refresh preserves edits, including values you cleared. Restore replaces edited fields only where a starting value exists. Document-backed records stay visible above.</small>
  </section>;
}

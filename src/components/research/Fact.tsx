"use client";
import * as Popover from "@radix-ui/react-popover";
import { Info } from "lucide-react";
import type { FactEvidence } from "@/lib/property/types";
export function formatValue(fact: FactEvidence) {
  if (fact.value === null) return "Not available";
  return fact.format === "money" && typeof fact.value === "number"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(fact.value)
    : String(fact.value);
}
export function Fact({ fact, prominent = false }: { fact: FactEvidence; prominent?: boolean }) {
  return <div className={`fact ${prominent ? "fact-prominent" : ""}`}>
    <div className="fact-heading"><span>{fact.label}</span><Popover.Root>
      <Popover.Trigger asChild><button type="button" className="source-button" aria-label={`Source for ${fact.label}`} title="View source"><Info size={15} aria-hidden="true" /></button></Popover.Trigger>
      <Popover.Portal><Popover.Content className="source-popover" sideOffset={8} aria-label={`${fact.label} source details`}>
        <strong>{fact.label}</strong><p>{fact.value === null ? "Not available in the returned record." : "Matched to an NJGIN record. This is not a physical inspection or certification."}</p>
        <p>{fact.caveat}</p>{fact.rawValue && <p>Original source value: <code>{fact.rawValue}</code></p>}<dl><dt>Record publication</dt><dd>{fact.sourceDate ?? "Not supplied"}</dd><dt>Retrieved</dt><dd>{new Date(fact.fetchedAt).toLocaleString()}</dd></dl>
        <p className="muted">Publication date does not establish the assessment or tax year.</p>
        <a href={fact.sourceUrl} target="_blank" rel="noopener noreferrer">Open official source</a>
        <Popover.Close className="secondary-button popover-close">Close</Popover.Close><Popover.Arrow className="popover-arrow" />
      </Popover.Content></Popover.Portal>
    </Popover.Root></div>
    <div className={`fact-value ${fact.value === null ? "muted" : ""}`}>{formatValue(fact)}</div>
    {fact.id === "deed_date" && fact.value !== null && <small className="fact-note">Year interpreted from source</small>}
    <div className="print-source"><p>{fact.caveat}</p>{fact.rawValue && <p>Original source value: {fact.rawValue}</p>}<p>Record published: {fact.sourceDate ?? "Not supplied"} · Retrieved: {new Date(fact.fetchedAt).toLocaleString()}</p><a href={fact.sourceUrl}>NJGIN / MOD-IV source record</a></div>
  </div>;
}

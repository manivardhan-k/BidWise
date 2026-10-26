"use client";
import * as Popover from "@radix-ui/react-popover";
import { Info } from "lucide-react";
import { estimateKindLabel, estimateValue } from "./StartingEstimates";
import type { StartingEstimate } from "@/lib/finance/starting-estimates";

export function FieldInfo({ label, help, estimate, edited }: { label: string; help?: string; estimate?: StartingEstimate; edited?: boolean }) {
  return <Popover.Root>
    <Popover.Trigger asChild><button type="button" className="source-button" aria-label={`About ${label}`} title="View details"><Info size={15} aria-hidden="true" /></button></Popover.Trigger>
    <Popover.Portal><Popover.Content className="source-popover" sideOffset={8} collisionPadding={16} aria-label={`${label} details`}>
      <strong>{label}</strong>
      {help && <p>{help}</p>}
      {estimate && <>
        <p>{estimateKindLabel(estimate)} · Low confidence{edited ? " · Edited by you" : ""}</p>
        {edited && <p>These details describe the original starting estimate. Your current entry is kept.</p>}
        <dl><dt>{estimate.field === "renovation.allowance" ? "Starting renovation allowance" : "Starting value"}</dt><dd>{estimateValue(estimate)}</dd>
          {estimate.rangeKind !== "none" && <><dt>{estimate.rangeKind === "survey_moe" ? "Survey median ± margin of error" : "Planning range"}</dt><dd>{estimateValue(estimate, estimate.low)} to {estimateValue(estimate, estimate.high)}</dd></>}
        </dl>
        {estimate.field === "renovation.allowance" && <p>This allowance seeds the first repair line. Adjust its quantity and unit costs to match your repair plan.</p>}
        <p>{estimate.explanation}</p>
        <dl><dt>Source</dt><dd>{estimate.sourceUrl ? <a href={estimate.sourceUrl} target="_blank" rel="noopener noreferrer">{estimate.sourceLabel}</a> : estimate.sourceLabel}</dd><dt>Data date</dt><dd>{estimate.sourceDate ?? "Not supplied"}</dd><dt>Checked</dt><dd>{new Date(estimate.checkedAt).toLocaleDateString()}</dd></dl>
      </>}
      <Popover.Close className="secondary-button popover-close">Close</Popover.Close><Popover.Arrow className="popover-arrow" />
    </Popover.Content></Popover.Portal>
  </Popover.Root>;
}

"use client";
import { Printer } from "lucide-react";
import type { PropertyRecords, SourceResult } from "@/lib/property/types";
export function ReportNavigation({ records }: { records: SourceResult<PropertyRecords> | null }) {
  const supplied = records?.status === "available" ? records.data.facts.filter(item => item.value !== null).length : 0;
  return <div className="report-tools">
    <nav aria-label="Report sections" className="report-navigation">
      <a href="#research">Overview</a><a href={records?.status === "available" ? "#property-records" : "#research"}>Property records</a><a href="#scenarios">Run the numbers</a><a href="#analysis-title">AI explanation</a><a href="#remaining-checks">Next checks</a>
      <button type="button" onClick={() => window.print()} className="text-button print-report"><Printer size={16} aria-hidden="true" />Print report</button>
    </nav>
    <p className="report-availability" role="status">{!records ? "Retrieving the property record…" : records.status === "available" ? `${supplied} of ${records.data.facts.length} record fields supplied. Missing entries remain unknown; more fields do not certify accuracy.` : "The property-record source is unavailable. Other checks can still finish independently."}</p>
  </div>;
}

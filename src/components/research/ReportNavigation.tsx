"use client";
import { ReportPdfButton } from "./ReportPdfButton";
import type { ReportSnapshot } from "@/lib/reports/snapshot";
export function ReportNavigation({ report }: { report: ReportSnapshot }) {
  const { records } = report;
  const supplied = records?.status === "available" ? records.data.facts.filter(item => item.value !== null).length : 0;
  return <div className="report-tools">
    <nav aria-label="Report sections" className="report-navigation">
      <a href="#research">Overview</a><a href={records?.status === "available" ? "#property-records" : "#research"}>Property records</a><a href="#scenarios">Run the numbers</a><a href="#analysis-title">AI explanation</a><a href="#remaining-checks">Next checks</a>
      <ReportPdfButton report={report} />
    </nav>
    <p className="report-availability" role="status">{!records ? "Retrieving the property record…" : records.status === "available" ? `${supplied} of ${records.data.facts.length} record fields supplied. Missing fields stay unknown.` : "The property-record source is unavailable. Other checks can still finish independently."}</p>
  </div>;
}

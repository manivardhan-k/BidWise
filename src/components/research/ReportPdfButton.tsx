"use client";
import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { reportFilename, type ReportSnapshot } from "@/lib/reports/snapshot";

export function ReportPdfButton({ report }: { report: ReportSnapshot }) {
  const [state, setState] = useState<"idle" | "generating" | "done" | "error">("idle");
  const inFlight = useRef(false);
  const active = useRef(true);
  const downloadUrl = useRef<string | null>(null);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current); };
  }, []);

  async function download() {
    if (inFlight.current) return;
    inFlight.current = true;
    setState("generating");
    // Capture at the click, before loading the renderer. Later edits belong to
    // the next export, even when the first download needs time to prepare.
    const snapshot = structuredClone(report);
    const exportedAt = new Date().toISOString();
    try {
      const { generatePropertyPdf } = await import("@/lib/reports/property-pdf");
      const blob = await generatePropertyPdf(snapshot, exportedAt);
      if (!active.current) return;
      if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
      const url = URL.createObjectURL(blob);
      downloadUrl.current = url;
      const link = document.createElement("a");
      link.href = url;
      link.download = reportFilename(snapshot.identity, exportedAt);
      document.body.appendChild(link);
      link.click(); link.remove();
      setState("done");
      setTimeout(() => { URL.revokeObjectURL(url); if (downloadUrl.current === url) downloadUrl.current = null; }, 60_000);
    } catch { if (active.current) setState("error"); }
    finally { inFlight.current = false; }
  }

  return <div className="report-pdf-action">
    <button type="button" onClick={() => void download()} disabled={state === "generating"} aria-busy={state === "generating"} className="text-button print-report"><Download size={16} aria-hidden="true" />{state === "generating" ? "Preparing PDF…" : "Download PDF"}</button>
    <span className="sr-only" role="status">{state === "done" ? "PDF prepared. Your download is ready to save or print." : ""}</span>
    {state === "error" && <p className="pdf-export-error" role="alert">The PDF could not be prepared. Try Download PDF again; your report and edits are still here.</p>}
  </div>;
}

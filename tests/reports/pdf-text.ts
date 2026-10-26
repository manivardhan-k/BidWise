import { inflateSync } from "node:zlib";

// Inspect the actual text operators emitted by our standard-font renderer.
// This is intentionally scoped to these PDFs; visual QA uses Poppler as well.
export function exportedPdfText(buffer: Buffer) {
  const content: string[] = [];
  const source = buffer.toString("latin1");
  for (const stream of source.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    let decoded: string;
    try { decoded = inflateSync(Buffer.from(stream[1], "latin1")).toString("latin1"); } catch { continue; }
    for (const line of decoded.matchAll(/\[([^\]]*)\]\s*TJ/g)) {
      content.push([...line[1].matchAll(/<([a-f\d]+)>/gi)].map(token => Buffer.from(token[1], "hex").toString("latin1")).join(""));
    }
  }
  // Browser and Node renderers can split a visual line across different TJ
  // operators. Normalize whitespace without changing the actual field values.
  return content.join(" ").replace(/\s+/g, " ");
}

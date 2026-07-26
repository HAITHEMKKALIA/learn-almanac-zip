// Extracts text from a PDF file using pdfjs-dist (already in deps).
// Returns trimmed concatenated text (capped to ~30KB to keep prompts small).
export async function extractPdfText(file: File, maxChars = 30000): Promise<string> {
  const pdfjs: any = await import("pdfjs-dist");
  // Worker setup (CDN to avoid bundling issues)
  if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const parts: string[] = [];
  let total = 0;
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it: any) => ("str" in it ? it.str : "")).join(" ");
    parts.push(text);
    total += text.length;
    if (total >= maxChars) break;
  }
  return parts.join("\n\n").slice(0, maxChars).trim();
}

/**
 * Client-side PDF → text with pdfjs-dist. The library and its worker load only
 * when the first PDF is dropped, so the page's first download stays small.
 */
import { LIMITS } from './schema';

type PdfJs = typeof import('pdfjs-dist');
let pdfjs: Promise<PdfJs> | null = null;

function load(): Promise<PdfJs> {
  pdfjs ??= import('pdfjs-dist').then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
    return lib;
  });
  return pdfjs;
}

export interface Extracted {
  text: string;
  pages: number;
}

export async function extractPdfText(file: File): Promise<Extracted> {
  const lib = await load();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await lib.getDocument({ data, isEvalSupported: false }).promise;
  try {
    const pages: string[] = [];
    let total = 0;
    for (let n = 1; n <= doc.numPages && total < LIMITS.resumeChars; n += 1) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      let line = '';
      const lines: string[] = [];
      let lastEnd: number | null = null;
      let lastY: number | null = null;
      for (const item of content.items) {
        if (!('str' in item)) continue;
        const x = item.transform[4] as number;
        const y = item.transform[5] as number;
        const size = Math.hypot(item.transform[0] as number, item.transform[1] as number) || 10;
        if (lastY !== null && Math.abs(y - lastY) > size * 0.5 && line.trim() !== '') {
          // Moved to another line without an end-of-line marker.
          lines.push(line);
          line = '';
        } else if (lastEnd !== null && x - lastEnd > size * 0.15 && !line.endsWith(' ') && !item.str.startsWith(' ')) {
          // A real gap between runs. Runs that touch (ligatures like "fi") are joined as they are.
          line += ' ';
        }
        line += item.str;
        lastEnd = x + item.width;
        lastY = y;
        if (item.hasEOL) {
          lines.push(line);
          line = '';
          lastEnd = null;
        }
      }
      if (line.trim() !== '') lines.push(line);
      const text = lines.map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
      pages.push(text);
      total += text.length;
      page.cleanup();
    }
    return { text: pages.join('\n\n').slice(0, LIMITS.resumeChars), pages: doc.numPages };
  } finally {
    await doc.destroy();
  }
}

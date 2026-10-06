/**
 * Page ranges as people type them: "1-3, 5, 8-10". Kept apart from the PDF code so the
 * parsing can be tested: an off-by-one here silently drops or repeats a page of someone's
 * contract. Pages are 1-based in and out; the PDF library is 0-based and converts at the edge.
 */
export interface PageRange { from: number; to: number }
export type RangeError = "empty" | "syntax" | "out-of-range";
export type RangeParse = { ok: true; ranges: PageRange[] } | { ok: false; error: RangeError; part?: string };

export function parsePageRanges(text: string, pageCount: number): RangeParse {
  const parts = text.split(/[,\s]+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return { ok: false, error: "empty" };
  const ranges: PageRange[] = [];
  for (const part of parts) {
    const match = /^(\d+)(?:\s*[-~]\s*(\d+))?$/.exec(part);
    if (!match) return { ok: false, error: "syntax", part };
    const a = Number(match[1]);
    const b = match[2] === undefined ? a : Number(match[2]);
    const from = Math.min(a, b);
    const to = Math.max(a, b);
    if (from < 1 || to > pageCount) return { ok: false, error: "out-of-range", part };
    ranges.push({ from, to });
  }
  return { ok: true, ranges };
}

/** Every page of one range, 1-based. */
export const pagesOf = (range: PageRange): number[] => Array.from({ length: range.to - range.from + 1 }, (_, i) => range.from + i);

/** One range per page: "split into single pages". */
export const everyPage = (pageCount: number): PageRange[] => Array.from({ length: pageCount }, (_, i) => ({ from: i + 1, to: i + 1 }));

/** Chunks of n pages: "split every 5 pages". The last chunk takes what is left. */
export function everyN(pageCount: number, n: number): PageRange[] {
  const size = Math.max(1, Math.floor(n));
  const ranges: PageRange[] = [];
  for (let from = 1; from <= pageCount; from += size) ranges.push({ from, to: Math.min(pageCount, from + size - 1) });
  return ranges;
}

export const rangeLabel = (range: PageRange) => (range.from === range.to ? String(range.from) : `${range.from}-${range.to}`);
export const baseName = (name: string) => name.replace(/\.pdf$/i, "") || "document";

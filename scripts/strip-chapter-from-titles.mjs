#!/usr/bin/env node
/**
 * Take the chapter number out of `title:` across the content collections.
 *
 * The chapter is already structured data — `chapter:` in frontmatter, and the
 * slug's own `-chN` suffix, which is what BlogList reads to draw its `#N` badge.
 * Carrying it a third time inside the title means a reader sees it twice on the
 * article page (breadcrumb "챕터 2" plus a "Ch2." in the sidebar) and once more
 * in the course list.
 *
 * The article route already hid the leading form at render time, in
 * src/pages/[...lang]/[...slug].astro, with a regex replace on post.data.title
 * that matched a leading "Ch<n>." and dropped it.
 *
 * That patched one surface and only one shape. The sidebar and the list still
 * showed the raw string, and titles carrying the marker mid- or end-string
 * ("論理推論Ch6：…", "… (Chapter 2-01)") leaked everywhere. Fixing the data
 * instead lets that line go, so what is stored is what is shown.
 *
 * Usage: node scripts/strip-chapter-from-titles.mjs [--apply] [--root <dir>]
 * Default is a dry run that prints every rewrite it would make.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const rootArg = args.indexOf("--root");
const roots = rootArg >= 0 ? [args[rootArg + 1]] : ["src/content"];

// Ordered: the leading form first, so "Ch2. Ch3 things" cannot be mangled by a
// looser rule. Each returns the title with only the chapter marker removed.
// Separators seen in the corpus include the full-width period and colon that the
// Japanese titles use ("経済学院論Ch22。 …"), so they are matched explicitly.
const SEP = "[.:：。・\\-–—]";
// \b matters more than it looks: without it "Mar(ch 21)" in "(March 21 – April
// 19)" parses as chapter 21 and the title loses a month. CJK characters are
// non-word to JS regex, so "経済学院論Ch22" still matches at the boundary.
const MARK = "\\b(?:Chapter|Ch)\\.?\\s*\\d+(?:-\\d+)?";
const RULES = [
  // "Ch6. Title" | "Chapter 3: Title" | "CH6 - Title" — marker opens the title
  [new RegExp(`^${MARK}\\s*${SEP}?\\s*`, "i"), ""],
  // "株式基礎 Ch5. Title" | "PTG Chapter 9. Title" | "経済学院論Ch22。 Title"
  // The series name stays — it is the only thing left identifying the course —
  // and the marker becomes the dash that was already doing the separating.
  [new RegExp(`\\s*${MARK}\\s*${SEP}\\s*`, "i"), " — "],
  // "Title (Chapter 2-01)" | "Title (Ch 4)"
  [new RegExp(`\\s*[（(]${MARK}[）)]\\s*$`, "i"), ""],
];

const TITLE_RE = /^(title:\s*)(.*)$/m;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.mdx?$/.test(name)) out.push(p);
  }
  return out;
}

function unquote(raw) {
  const t = raw.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    // Unescape on the way in, because the writer escapes on the way out. Miss
    // this and a title holding \"모든\" comes back as \\"모든\\", which YAML
    // then refuses to parse at all.
    return { value: t.slice(1, -1).replace(/\\"/g, '"'), quote: t[0] };
  }
  return { value: t, quote: "" };
}

// A handful of pages are part indexes whose title states the span they cover —
// "Parts 8-9: … (Ch25~Ch29)". There the chapter numbers are the content, not a
// label duplicated from frontmatter, and the mid-string rule would eat the
// opening bound and leave "( — Ch29)". Leave ranges alone.
const RANGE = /\bCh\.?\s*\d+\s*[~～\-–—]\s*Ch\.?\s*\d+/i;

// Only titles that actually carry a marker are rewritten. An earlier version
// tidied whitespace on every title it read, which silently trimmed a zh title
// that was clearing the schema's 10-character minimum only because of a
// trailing space — a rewrite nobody asked for, breaking a check nobody expected
// to be load-bearing.
const HAS_MARK = new RegExp(`(?:^|[\\s（(])(?:Chapter|Ch)\\.?\\s*\\d`, "i");

function strip(title) {
  if (RANGE.test(title) || !HAS_MARK.test(title)) return title;
  let out = title;
  for (const [re, to] of RULES) out = out.replace(re, to);
  return out.replace(/\s+/g, " ").replace(/^[\s.:\-–—]+/, "").trim();
}

let scanned = 0, changed = 0;
const samples = [];

for (const root of roots) {
  for (const file of walk(root)) {
    const src = readFileSync(file, "utf8");
    const m = src.match(TITLE_RE);
    if (!m) continue;
    scanned++;
    const { value, quote } = unquote(m[2]);
    const next = strip(value);
    if (next === value) continue;
    if (!next) {
      console.error(`SKIP would empty the title: ${file}`);
      continue;
    }
    changed++;
    if (samples.length < 12) samples.push(`${value}\n    -> ${next}`);
    if (apply) {
      const q = quote || '"';
      writeFileSync(file, src.replace(TITLE_RE, `$1${q}${next.replace(/"/g, '\\"')}${q}`));
    }
  }
}

console.log(samples.map((s) => "  " + s).join("\n"));
console.log(`\n${apply ? "rewrote" : "would rewrite"} ${changed} of ${scanned} title(s)`);

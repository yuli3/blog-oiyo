// Locks two page-structure contracts that kept regressing across repos.
//
// 1) Only the layout may open <main>. Pages that opened their own produced a
//    nested landmark (invalid HTML, ambiguous for screen readers). Fixed in
//    game 2026-07-27, found still broken in blog/wiki/oiyo 2026-07-29 — the
//    same drift that let the CJK emphasis bug live on after wiki fixed it.
// 2) Every indexed page needs an <h1>. Tool pages mount a client:load island,
//    so without the layout's opt-in `heading` prop the crawler sees nothing.
//
// Source-level check only — it runs without a build. The dist-level equivalent
// lives in audit-seo-output.mjs.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const PAGES = "src/pages";

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith(".astro")) out.push(p);
  }
  return out;
}

const offenders = walk(PAGES).filter((f) => /<main\b/.test(readFileSync(f, "utf8")));

if (offenders.length > 0) {
  console.error(
    `page structure audit FAIL: ${offenders.length} page(s) open their own <main>.\n` +
      `The layout already opens one — use <div> instead.\n` +
      offenders.map((f) => `  ${f}`).join("\n"),
  );
  process.exit(1);
}

console.log(`page structure audit PASS: ${walk(PAGES).length} pages, 0 nested <main>`);

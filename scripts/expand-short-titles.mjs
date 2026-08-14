#!/usr/bin/env node
/**
 * Give bare chapter labels enough title to stand on their own.
 *
 * Removing the "ChN." prefix left a set of titles that are just the topic word:
 * "뇌와 행동", "지지와 저항", "価格の言語". They read as fragments, they say
 * nothing to a searcher who has not already found the course, and they fall
 * under the content schema's 10-character minimum — which the chapter number
 * had been quietly satisfying on their behalf.
 *
 * The series name is the missing half and it is already in frontmatter, so
 * "뇌와 행동" becomes "뇌와 행동 — 심리학 입문". That is a real title: it says
 * what the page is and what it belongs to, which the chapter number never did.
 *
 * Usage: node scripts/expand-short-titles.mjs [--apply] [--root <dir>]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const rootArg = args.indexOf("--root");
const root = rootArg >= 0 ? args[rootArg + 1] : "src/content";
const MIN = 10;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.mdx?$/.test(name)) out.push(p);
  }
  return out;
}

const field = (src, key) => {
  const m = src.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  if (!m) return null;
  let v = m[1].trim();
  // A block scalar ("|" or ">-") means the value is on the following lines;
  // those titles are long by construction, so they are not our problem.
  if (v.startsWith(">") || v.startsWith("|")) return null;
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v;
};

let changed = 0;
const rows = [];
for (const file of walk(root)) {
  const src = readFileSync(file, "utf8");
  const title = field(src, "title");
  if (title === null || title.length >= MIN) continue;
  const series = field(src, "series");
  if (!series) {
    console.error(`SKIP no series to borrow from: ${file} (${title})`);
    continue;
  }
  const next = `${title} — ${series}`;
  if (next.length < MIN) {
    console.error(`SKIP still too short: ${file} (${next})`);
    continue;
  }
  changed++;
  rows.push(`${title}  ->  ${next}`);
  if (apply) {
    writeFileSync(file, src.replace(/^title:\s*.*$/m, `title: "${next.replace(/"/g, '\\"')}"`));
  }
}

console.log(rows.map((r) => "  " + r).join("\n"));
console.log(`\n${apply ? "rewrote" : "would rewrite"} ${changed} title(s) under ${MIN} chars`);

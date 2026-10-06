#!/usr/bin/env node
/**
 * Two promises the tool pages make, checked against the source.
 *
 * 1. WebApplication markup appears exactly once per tool page. Pages listed in
 *    src/config/tool-webapp-slugs.json get it from BaseLayout; a listed page
 *    must exist and must not also emit its own, and an interactive page that
 *    is neither listed nor emitting its own is reported so a new tool does not
 *    ship without it.
 * 2. A page that shows LocalOnlyNote ("nothing leaves your browser") mounts
 *    only components that make no network request. The note is a factual
 *    claim, so a later fetch() added to one of those components must fail here.
 *
 * 2026-10-06
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pagesDir = join(root, "src/pages/[...lang]");
const listed = JSON.parse(readFileSync(join(root, "src/config/tool-webapp-slugs.json"), "utf8"));
const OWN_WEBAPP = /webApplication: true|ToolShell|"WebApplication"/;
const NETWORK = /\bfetch\s*\(|XMLHttpRequest|sendBeacon|new WebSocket|EventSource|\baxios\b/;
const errors = [];

const pages = readdirSync(pagesDir).filter((name) => name.endsWith(".astro"));
const source = new Map(pages.map((name) => [name.slice(0, -6), readFileSync(join(pagesDir, name), "utf8")]));

if (new Set(listed).size !== listed.length) errors.push("tool-webapp-slugs.json has a repeated slug");
for (const slug of listed) {
  const text = source.get(slug);
  if (!text) errors.push(`${slug}: listed in tool-webapp-slugs.json but the page does not exist`);
  else if (OWN_WEBAPP.test(text)) errors.push(`${slug}: emits its own WebApplication and is also listed, so the page would carry two`);
}
const listedSet = new Set(listed);
for (const [slug, text] of source) {
  if (!text.includes("client:") || listedSet.has(slug) || OWN_WEBAPP.test(text)) continue;
  errors.push(`${slug}: interactive page without WebApplication markup (use toolStructuredData, or add the slug to tool-webapp-slugs.json)`);
}

/** A component file and every relative module it pulls in. */
function reach(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)) {
    const base = resolve(dirname(file), match[1]);
    const hit = ["", ".tsx", ".ts", ".astro", "/index.tsx", "/index.ts"].map((ext) => base + ext).find((path) => existsSync(path) && !path.endsWith("/"));
    if (hit && /\.(tsx?|astro)$/.test(hit)) reach(hit, seen);
  }
  return seen;
}

let noted = 0;
for (const [slug, text] of source) {
  if (!text.includes("LocalOnlyNote")) continue;
  noted += 1;
  for (const match of text.matchAll(/^import\s+\w+\s+from\s+"(\.\.\/\.\.\/components\/[^"]+)";/gm)) {
    if (/LocalOnlyNote|RelatedToolLinks/.test(match[1])) continue;
    const base = resolve(pagesDir, match[1]);
    const entry = ["", ".tsx", ".ts", ".astro"].map((ext) => base + ext).find((path) => existsSync(path));
    if (!entry) { errors.push(`${slug}: cannot resolve ${match[1]}`); continue; }
    for (const file of reach(entry)) {
      if (NETWORK.test(readFileSync(file, "utf8"))) errors.push(`${slug}: shows LocalOnlyNote but ${file.slice(root.length + 1)} makes a network request`);
    }
  }
}

if (errors.length) {
  console.error(`tool page audit failed (${errors.length})`);
  for (const line of errors) console.error(`  - ${line}`);
  process.exit(1);
}
console.log(`tool page audit passed (${listed.length} pages get WebApplication from the layout, ${noted} pages show the local-only note)`);

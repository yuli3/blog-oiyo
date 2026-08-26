import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentRoot = path.join(root, "src/content/blog");
const inventoryPath = path.join(root, "data/catalog/content-inventory.master.csv");

const hardFailures = [];
const languageWarnings = [];
const proseMinViolations = [];
const proseMinBaselinePath = path.join(root, "config/prose-min-baseline.json");
const categoryCounts = new Map();
const duplicateBodies = new Map();
const quarantinedDuplicateWarnings = [];

const forbiddenTitlePatterns = [
  /강목체/,
  /서브노트/,
  /정리본/,
  /요약자료/,
  /^매거진:/,
  /^\[[^\]]*매거진[^\]]*\]/,
  /^\[생활\s*점검리스트\]/,
];

const categoryRegistry = fs.readFileSync(
  path.join(root, "data/catalog/category-registry.yaml"),
  "utf8",
);
const registeredCategories = new Set();
for (const match of categoryRegistry.matchAll(/^\s+- slug: ([^\n]+)$/gm)) {
  registeredCategories.add(match[1].trim());
}
for (const match of categoryRegistry.matchAll(/^\s+label: ([^\n]+)$/gm)) {
  registeredCategories.add(match[1].trim());
}

function listMdxFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listMdxFiles(full);
    return entry.isFile() && entry.name.endsWith(".mdx") ? [full] : [];
  });
}

function frontmatterOf(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  return match?.[1] ?? "";
}

function field(frontmatter, name) {
  const match = frontmatter.match(new RegExp(`^${name}:\\s*['"]?([^'"\\n]+)['"]?\\s*$`, "m"));
  return match?.[1]?.trim() ?? "";
}

function normalizedBody(text) {
  return text
    .replace(/^---\n[\s\S]*?\n---\s*/, "")
    .replace(/^import\s.+;?$/gm, "")
    .replace(/\b(?:chapter|domain)\s+\d+\b/gi, "numbered-section")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

for (const file of listMdxFiles(contentRoot)) {
  const rel = path.relative(root, file);
  const text = fs.readFileSync(file, "utf8");
  const frontmatter = frontmatterOf(text);
  const locale = path.relative(contentRoot, file).split(path.sep)[0];
  const title = field(frontmatter, "title");
  const category = field(frontmatter, "category");
  const noindex = field(frontmatter, "noindex") === "true";
  const redirectOnly = Boolean(field(frontmatter, "redirectTo") || field(frontmatter, "redirectToBlog"));

  if (text.includes("file:///")) {
    hardFailures.push(`${rel}: contains file:/// link`);
  }

  // Prose-minimum gate for track: interactive (AGENTS.md content rule 6: "any
  // track: interactive article must contain >= 400 Korean characters of prose
  // before the first component. Tool-dump articles without context paragraphs
  // will be rejected."). This rule existed only as prose in AGENTS.md until
  // 2026-08-26 -- 55 of 62 non-redirect interactive articles (89%) violated it
  // with nothing catching them. Source: company-brain/projects/oiyo-ecosystem/
  // low-quality-content-full-audit-2026-08-26.md P1-3.
  if (locale === "ko" && field(frontmatter, "track") === "interactive" && !redirectOnly) {
    const body = text.replace(/^---\n[\s\S]*?\n---\s*/, "");
    const firstComponentIdx = body.search(/^<[A-Z][A-Za-z0-9]*[\s/>]/m);
    const proseSection = firstComponentIdx === -1 ? body : body.slice(0, firstComponentIdx);
    const koreanChars = (proseSection.match(/[가-힣]/g) ?? []).length;
    if (koreanChars < 400) {
      proseMinViolations.push(`${rel}: ${koreanChars} Korean chars before first component (need >= 400)`);
    }
  }

  for (const pattern of forbiddenTitlePatterns) {
    if (pattern.test(title)) {
      hardFailures.push(`${rel}: forbidden title wording: ${title}`);
      break;
    }
  }

  if (category && !registeredCategories.has(category)) {
    const count = categoryCounts.get(category) ?? 0;
    categoryCounts.set(category, count + 1);
  }

  if (locale === "ja" && /[가-힣]/.test(title)) {
    languageWarnings.push(`${rel}: Japanese title contains Hangul: ${title}`);
  }

  if (!redirectOnly) {
    const body = normalizedBody(text);
    if (body.length >= 200) {
      const group = duplicateBodies.get(body) ?? [];
      group.push({ rel, noindex });
      duplicateBodies.set(body, group);
    }
  }
}

for (const group of duplicateBodies.values()) {
  if (group.length < 2) continue;
  const indexable = group.filter((item) => !item.noindex);
  const files = group.map((item) => item.rel).join(", ");
  if (indexable.length > 1) {
    hardFailures.push(`exact duplicate body is indexable: ${files}`);
  } else {
    quarantinedDuplicateWarnings.push(`exact duplicate body quarantined: ${files}`);
  }
}

if (fs.existsSync(inventoryPath)) {
  const inventory = fs.readFileSync(inventoryPath, "utf8");
  if (inventory.includes("file:///")) {
    hardFailures.push("data/catalog/content-inventory.master.csv: contains file:/// link");
  }
  for (const line of inventory.split(/\r?\n/).slice(1)) {
    if (!line) continue;
    const [contentId] = line.split(",");
    for (const pattern of forbiddenTitlePatterns) {
      if (pattern.test(line)) {
        hardFailures.push(`data/catalog/content-inventory.master.csv: forbidden title wording for ${contentId}`);
        break;
      }
    }
  }
}

const categoryWarningCount = Array.from(categoryCounts.values()).reduce(
  (sum, count) => sum + count,
  0,
);
const categorySummary = Array.from(categoryCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .map(([category, count]) => `${category} (${count})`);

if (categoryWarningCount) {
  console.warn(
    `warning: ${categoryWarningCount} content item(s) use categories outside the registry`,
  );
  console.warn(`warning: top unregistered categories: ${categorySummary.join(", ")}`);
}

for (const warning of languageWarnings.slice(0, 40)) {
  console.warn(`warning: ${warning}`);
}
for (const warning of quarantinedDuplicateWarnings) {
  console.warn(`warning: ${warning}`);
}
if (languageWarnings.length > 40) {
  console.warn(`warning: ${languageWarnings.length - 40} more language warnings omitted`);
}

// Prose-min is baseline-gated, not zero-tolerance: 55 of 62 existing
// track: interactive articles already violate it (2026-08-26 measurement).
// Bulk-rewriting 55 articles is a content batch, not a gate-addition batch --
// this only stops the count from growing past today's number.
const proseMinBaseline = fs.existsSync(proseMinBaselinePath)
  ? JSON.parse(fs.readFileSync(proseMinBaselinePath, "utf8"))
  : null;
if (!proseMinBaseline) {
  console.warn(
    `warning: no baseline at config/prose-min-baseline.json. Current violations: ${proseMinViolations.length}. ` +
      `Create the baseline file to enable the gate:\n` +
      JSON.stringify({ maxViolations: proseMinViolations.length, recordedOn: new Date().toISOString().slice(0, 10) }, null, 2),
  );
} else if (proseMinViolations.length > proseMinBaseline.maxViolations) {
  hardFailures.push(
    `prose-min regrowth: ${proseMinViolations.length} track:interactive articles now violate the >=400-char rule, ` +
      `baseline ceiling is ${proseMinBaseline.maxViolations} (recorded ${proseMinBaseline.recordedOn}). New violations:\n` +
      proseMinViolations.slice(0, 15).map((v) => `    ${v}`).join("\n"),
  );
}

if (hardFailures.length) {
  for (const failure of hardFailures) {
    console.error(`error: ${failure}`);
  }
  console.error(`content quality audit failed: ${hardFailures.length} blocking issue(s)`);
  process.exit(1);
}

const warningCount = categoryWarningCount + languageWarnings.length + quarantinedDuplicateWarnings.length;
console.log(
  `content quality audit passed (${warningCount} warning(s)); prose-min violations: ${proseMinViolations.length}` +
    (proseMinBaseline ? ` (ceiling ${proseMinBaseline.maxViolations})` : " (gate not yet enabled)"),
);

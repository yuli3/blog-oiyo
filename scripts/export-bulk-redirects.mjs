#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const HOST = "blog.oiyo.net";
const DEFAULT_LIMIT = 10_000;
const root = process.cwd();
const inputPath = path.join(root, "data/redirects/canonical-redirects.txt");
const pagesRedirectsPath = path.join(root, "public/_redirects");
const outputDir = path.join(root, "reports/cloudflare-bulk-redirects");
const checkOnly = process.argv.includes("--check");
const syncPages = process.argv.includes("--sync-pages");

function isDynamic(value) {
  return value.includes("*") || /(^|\/):[A-Za-z][A-Za-z0-9_]*/.test(value);
}

function absoluteTarget(value) {
  return value.startsWith("/") ? `https://${HOST}${value}` : value;
}

function csvCell(value) {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function parseRedirects(source) {
  const rules = [];
  const malformed = [];

  source.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const fields = line.split(/\s+/);
    if (fields.length !== 3 || !/^\d{3}$/.test(fields[2])) {
      malformed.push({ line: index + 1, raw });
      return;
    }
    rules.push({
      line: index + 1,
      raw,
      source: fields[0],
      target: fields[1],
      status: Number(fields[2]),
    });
  });

  return { rules, malformed };
}

function validateUrl(value, label, line, errors) {
  try {
    const parsed = new URL(value.includes("://") ? value : `https://${value}`);
    if (!parsed.hostname) throw new Error("missing hostname");
  } catch (error) {
    errors.push(`${label} URL at line ${line}: ${value} (${error.message})`);
  }
}

const sourceText = await readFile(inputPath, "utf8");
const { rules, malformed } = parseRedirects(sourceText);
const errors = malformed.map(({ line, raw }) => `Malformed rule at line ${line}: ${raw}`);
const inputSources = new Map();
const conflicts = [];
const duplicates = [];

for (const rule of rules) {
  const signature = `${rule.target}\t${rule.status}`;
  const previous = inputSources.get(rule.source);
  if (previous && previous.signature !== signature) {
    conflicts.push({ source: rule.source, firstLine: previous.line, secondLine: rule.line });
  } else if (previous) {
    duplicates.push({ source: rule.source, firstLine: previous.line, secondLine: rule.line });
  } else {
    inputSources.set(rule.source, { signature, line: rule.line });
  }
}

const exportable = [];
const residual = [];

for (const rule of rules) {
  const reason =
    rule.status === 200
      ? "Pages rewrite (Bulk Redirects only supports redirect status codes)"
      : rule.status !== 301
        ? `non-301 status ${rule.status}`
        : isDynamic(rule.source) || isDynamic(rule.target)
          ? "dynamic placeholder or wildcard"
          : null;

  if (reason) {
    residual.push({ ...rule, reason });
    continue;
  }

  const sourceUrl = `${HOST}${rule.source}`;
  const targetUrl = absoluteTarget(rule.target);
  validateUrl(sourceUrl, "source", rule.line, errors);
  validateUrl(targetUrl, "target", rule.line, errors);
  if (rule.source.includes("?") || rule.source.includes("#")) {
    errors.push(`Bulk source cannot contain query or fragment at line ${rule.line}: ${rule.source}`);
  }
  if (targetUrl.includes("?")) {
    errors.push(
      `Target query conflicts with preserve_query_string=true at line ${rule.line}: ${targetUrl}`,
    );
  }
  exportable.push({
    redirect: {
      source_url: sourceUrl,
      target_url: targetUrl,
      status_code: 301,
      include_subdomains: false,
      subpath_matching: false,
      preserve_query_string: true,
      preserve_path_suffix: false,
    },
    source_line: rule.line,
  });
}

const bulkSources = new Map();
for (const item of exportable) {
  const sourceUrl = item.redirect.source_url;
  if (bulkSources.has(sourceUrl)) {
    errors.push(`Duplicate Bulk source URL: ${sourceUrl}`);
  }
  bulkSources.set(sourceUrl, item.redirect.target_url);
}

for (const conflict of conflicts) {
  errors.push(
    `Conflicting source ${conflict.source} at lines ${conflict.firstLine} and ${conflict.secondLine}`,
  );
}
for (const duplicate of duplicates) {
  errors.push(
    `Duplicate source ${duplicate.source} at lines ${duplicate.firstLine} and ${duplicate.secondLine}`,
  );
}
if (exportable.length > DEFAULT_LIMIT) {
  errors.push(`Bulk item count ${exportable.length} exceeds Free-plan quota ${DEFAULT_LIMIT}`);
}

const chainSources = new Set(exportable.map((item) => `https://${item.redirect.source_url}`));
const chains = exportable
  .filter((item) => chainSources.has(item.redirect.target_url))
  .map((item) => ({ source: item.redirect.source_url, target: item.redirect.target_url }));
const loops = exportable
  .filter((item) => `https://${item.redirect.source_url}` === item.redirect.target_url)
  .map((item) => item.redirect.source_url);
if (loops.length) errors.push(`Self-redirect loops: ${loops.join(", ")}`);

const apiItems = exportable.map(({ redirect }) => ({ redirect }));
const csv = apiItems
  .map(({ redirect }) =>
    [
      redirect.source_url,
      redirect.target_url,
      redirect.status_code,
      redirect.preserve_query_string,
      redirect.include_subdomains,
      redirect.subpath_matching,
      redirect.preserve_path_suffix,
    ]
      .map(csvCell)
      .join(","),
  )
  .join("\n");
const residualText = [
  "# Generated by scripts/export-bulk-redirects.mjs.",
  "# Keep these rules in Cloudflare Pages after Bulk Redirects is activated.",
  ...residual.map((rule) => `# ${rule.reason}\n${rule.raw}`),
  "",
].join("\n");
const manifest = {
  generated_at: new Date().toISOString(),
  source: "data/redirects/canonical-redirects.txt",
  source_sha256: createHash("sha256").update(sourceText).digest("hex"),
  hostname: HOST,
  input_rules: rules.length,
  bulk_items: apiItems.length,
  residual_rules: residual.length,
  free_plan_limit: DEFAULT_LIMIT,
  remaining_capacity: DEFAULT_LIMIT - apiItems.length,
  conflicts: conflicts.length,
  duplicates: duplicates.length,
  redirect_chains: chains.length,
  redirect_chain_details: chains,
  self_redirect_loops: loops.length,
  residual_by_reason: Object.fromEntries(
    [...new Set(residual.map((rule) => rule.reason))].map((reason) => [
      reason,
      residual.filter((rule) => rule.reason === reason).length,
    ]),
  ),
};

if (checkOnly) {
  let deployedResidual = "";
  try {
    deployedResidual = await readFile(pagesRedirectsPath, "utf8");
  } catch (error) {
    errors.push(`Cannot read generated Pages redirects: ${error.message}`);
  }
  if (deployedResidual && deployedResidual !== residualText) {
    errors.push(
      "public/_redirects is stale; run npm run redirects:bulk-sync after changing the canonical source",
    );
  }
}

if (errors.length) {
  console.error(errors.map((error) => `ERROR: ${error}`).join("\n"));
  process.exit(1);
}

if (!checkOnly) {
  await mkdir(outputDir, { recursive: true });
  const writes = [
    writeFile(path.join(outputDir, "bulk-redirect-items.json"), `${JSON.stringify(apiItems, null, 2)}\n`),
    writeFile(path.join(outputDir, "bulk-redirect-items.csv"), `${csv}\n`),
    writeFile(path.join(outputDir, "pages-residual-redirects.txt"), residualText),
    writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
  ];
  if (syncPages) writes.push(writeFile(pagesRedirectsPath, residualText));
  await Promise.all(writes);
}

console.log(
  [
    `Bulk Redirect export ${checkOnly ? "check" : "written"}`,
    `input=${manifest.input_rules}`,
    `bulk=${manifest.bulk_items}`,
    `residual=${manifest.residual_rules}`,
    `conflicts=${manifest.conflicts}`,
    `duplicates=${manifest.duplicates}`,
    `chains=${manifest.redirect_chains}`,
    `capacity=${manifest.remaining_capacity}`,
  ].join(" | "),
);

#!/usr/bin/env node
/**
 * Intermediate academic bar for Blog learning series.
 * Reader: a graduate reviewing the subject for jobs, not a first-time beginner.
 * --check fails only config.enforcedSeries. Other listed series are reported.
 */
import fs from "node:fs";
import path from "node:path";
import {
  bodyOf,
  field,
  frontmatterOf,
  isHomepageUrl,
  withoutFences,
} from "./lib/editorial-quality.mjs";

const root = process.cwd();
const check = process.argv.includes("--check");
const config = JSON.parse(
  fs.readFileSync(path.join(root, "config/intermediate-academy.json"), "utf8"),
);
const contentRoot = path.join(root, "src/content/blog");
const tracked = new Set([...config.enforcedSeries, ...config.reportSeries]);

function listMdx(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listMdx(full);
    return entry.isFile() && entry.name.endsWith(".mdx") ? [full] : [];
  });
}

function inspect(file) {
  const text = fs.readFileSync(file, "utf8");
  const fm = frontmatterOf(text);
  if (field(fm, "redirectTo") || field(fm, "redirectToBlog")) return null;
  const series = field(fm, "series");
  if (!tracked.has(series)) return null;
  const locale = path.relative(contentRoot, file).split(path.sep)[0];
  if (locale !== "ko") return null;
  const body = withoutFences(bodyOf(text));
  const failures = [];
  if (/암기\s*포인트/.test(body)) {
    failures.push("flashcard spine (암기 포인트)");
  }
  if (/^##[^\n]*공식\s*출처\s*확인/m.test(body)) {
    failures.push("exam-template official-source heading on a theory page");
  }
  if (!/FormulaBox/.test(text) && !/\$\$/.test(body)) {
    failures.push("no formula derivation (FormulaBox or $$)");
  }
  if (!/^##[^\n]*(참고\s*자료|참고문헌|읽을거리)/m.test(body)) {
    failures.push("missing 참고 자료");
  }
  if (!/^##[^\n]*(확인문제|실전 퀴즈)/m.test(body)) {
    failures.push("missing 확인문제");
  }
  if (!/Callout/.test(text) && !/(반례|한계|가정이 깨|적용 범위)/.test(body)) {
    failures.push("missing limits/counterexample");
  }
  if (!/\d[\d,]*(?:\.\d+)?\s*(?:만\s*원|억원|조\s*원|원|%|배|개|시간)/.test(body)) {
    failures.push("missing worked numeric example");
  }
  const sourceHeading = body.match(/^##[^\n]*(참고\s*자료|참고문헌|공식\s*출처\s*확인)[^\n]*$/m);
  if (sourceHeading) {
    const idx = body.indexOf(sourceHeading[0]);
    const rest = body.slice(idx);
    const next = rest.search(/\n##\s/);
    const block = next === -1 ? rest : rest.slice(0, next);
    const urls = [...block.matchAll(/\]\((https?:[^)\s]+)\)/g)].map((m) => m[1]);
    if (urls.length && urls.every((url) => isHomepageUrl(url))) {
      failures.push("homepage-only sources");
    }
  }
  return {
    rel: path.relative(root, file),
    series,
    title: field(fm, "title"),
    enforced: config.enforcedSeries.includes(series),
    failures,
  };
}

const rows = listMdx(contentRoot).map(inspect).filter(Boolean);
const failing = rows.filter((row) => row.failures.length);
const enforcedFail = failing.filter((row) => row.enforced);
const reportFail = failing.filter((row) => !row.enforced);

console.log(
  `intermediate academy: ${rows.length} pages; enforced fail ${enforcedFail.length}; reported fail ${reportFail.length}`,
);
for (const row of failing) {
  const tag = row.enforced ? "FAIL" : "report";
  console.log(`- [${tag}] ${row.series} ${row.rel}: ${row.failures.join("; ")}`);
}

if (check && enforcedFail.length) {
  console.error(
    `intermediate bar failed for ${enforcedFail.length} enforced page(s). Reader: ${config.reader}`,
  );
  process.exitCode = 1;
}

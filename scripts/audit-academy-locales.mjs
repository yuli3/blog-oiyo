#!/usr/bin/env node
/**
 * Read-only academy locale inventory. A file at the same slug is evidence of
 * presence, not proof that its teaching content matches the current Korean
 * chapter. KR/local metadata is a review candidate, never an automatic waiver.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

export const LOCALES = ["en", "ja", "zh", "fr", "es"];

function dateValue(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.valueOf();
}

export function isActiveAcademy(data) {
  return data.track === "academy" && data.noindex !== true && !data.redirectTo && !data.redirectToBlog && data.localizationMode !== "redirect-only";
}

export function inspectChapter(slug, source, targets) {
  const s = matter(source);
  if (!isActiveAcademy(s.data)) return null;
  const sourceDate = dateValue(s.data.updatedDate);
  const byLocale = {};
  for (const locale of LOCALES) {
    const raw = targets[locale];
    if (!raw) {
      byLocale[locale] = { status: "missing", signals: [] };
      continue;
    }
    const t = matter(raw);
    if (t.data.noindex === true || t.data.redirectTo || t.data.redirectToBlog || t.data.localizationMode === "redirect-only") {
      byLocale[locale] = { status: "placeholder", signals: [] };
      continue;
    }
    const signals = [];
    if (t.data.locale !== locale) signals.push("locale-metadata");
    if (s.data.series && t.data.series !== s.data.series) signals.push("series-key");
    if (s.data.chapter != null && t.data.chapter !== s.data.chapter) signals.push("chapter-number");
    if (s.data.contentStage === "review" && t.data.contentStage !== "review") signals.push("stage-lag");
    if (sourceDate && (!dateValue(t.data.updatedDate) || dateValue(t.data.updatedDate) < sourceDate)) signals.push("source-newer");
    byLocale[locale] = { status: "present", signals };
  }
  return {
    slug,
    category: String(s.data.category ?? "Uncategorized"),
    series: String(s.data.series ?? ""),
    chapter: s.data.chapter ?? null,
    market: String(s.data.market ?? ""),
    contentScope: String(s.data.contentScope ?? ""),
    // A local course can still be useful in translation (e.g. TOPIK). Only
    // editorial judgment can decide whether a destination locale should exist.
    localCandidate: Boolean(s.data.contentScope === "local" && s.data.market && s.data.market !== "GLOBAL"),
    byLocale,
  };
}

export function inventory(contentRoot) {
  const rows = [];
  const koDir = path.join(contentRoot, "ko");
  for (const slug of fs.readdirSync(koDir).filter((name) => name.endsWith(".mdx")).sort()) {
    const source = fs.readFileSync(path.join(koDir, slug), "utf8");
    const targets = Object.fromEntries(LOCALES.map((locale) => {
      const file = path.join(contentRoot, locale, slug);
      return [locale, fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null];
    }));
    const row = inspectChapter(slug, source, targets);
    if (row) rows.push(row);
  }
  const summary = {
    activeKo: rows.length,
    allFivePresent: rows.filter((row) => LOCALES.every((locale) => row.byLocale[locale].status === "present")).length,
    localCandidates: rows.filter((row) => row.localCandidate).length,
    unknownScope: rows.filter((row) => !row.contentScope).length,
    byLocale: Object.fromEntries(LOCALES.map((locale) => [locale, {
      present: rows.filter((row) => row.byLocale[locale].status === "present").length,
      missing: rows.filter((row) => row.byLocale[locale].status === "missing").length,
      placeholder: rows.filter((row) => row.byLocale[locale].status === "placeholder").length,
      reviewSignals: rows.filter((row) => row.byLocale[locale].signals.length > 0).length,
    }])),
  };
  return { summary, rows };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = inventory(path.resolve("src/content/blog"));
  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    console.log("academy locale inventory — file presence and metadata signals only");
    console.log(JSON.stringify(report.summary, null, 2));
    for (const row of report.rows.filter((item) => LOCALES.some((locale) => item.byLocale[locale].signals.length)).slice(0, 10)) {
      const flags = LOCALES.flatMap((locale) => row.byLocale[locale].signals.map((signal) => `${locale}:${signal}`));
      console.log(`review ${row.slug}: ${flags.join(", ")}`);
    }
    console.log("No exception is auto-excluded. Review localCandidates and unknownScope before prioritizing translation.");
  }
}

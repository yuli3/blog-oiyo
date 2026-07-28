#!/usr/bin/env node
/**
 * Checks translated chapters against their Korean source.
 *
 * A translation batch fails silently in ways a build never catches: a chapter
 * gets summarised, a heading is dropped, or zh comes back in Traditional
 * characters. This compares structure against the source so those show up as
 * failures rather than as something noticed months later.
 *
 * Two modes:
 *
 *   batch — structure of a freshly translated range against its Korean source
 *     node scripts/verify-translation-batch.mjs ja education-psychology-ch 7 8
 *
 *   scan  — every non-ko file in the corpus, checked for one thing the batch
 *           mode cannot see: a page that declares a locale but still serves
 *           Korean. Batch mode only ever looked at files someone just wrote, so
 *           the 2026-07-27 audit found 346 such pages indexed and untouched.
 *     node scripts/verify-translation-batch.mjs --scan
 *
 * Scan mode is a ratchet, not a wall. Known offenders live in
 * untranslated-baseline.json; the run fails when a *new* one appears, or when a
 * baseline entry has been fixed but not removed. That keeps CI honest about the
 * backlog without blocking every build until all 346 are done.
 */
import { readFileSync, existsSync, readdirSync, writeFileSync } from "node:fs";

const CONTENT = "src/content/blog";
const BASELINE = "scripts/untranslated-baseline.json";

/**
 * Body-length ratio against the Korean source, per target locale. The floor
 * catches a chapter that was quietly abridged; the ceiling catches padding.
 * Bands are widened to the ranges actually observed in the repo, except that the
 * floor stays tight enough to still catch abridgement.
 */
const RATIO_BANDS = {
  ja: [0.55, 1.5],
  zh: [0.5, 1.3],
  en: [0.7, 2.6],
  fr: [0.75, 2.8],
  es: [0.75, 2.8],
};

/** Traditional-only characters that Simplified Chinese should never contain. */
const TRADITIONAL_ONLY = /[說證體個們這來時對點術實現學會與從個為據當發後區醫級術輕靜願龍]/g;

function headings(text) {
  return (text.match(/^#{2,6} .+$/gm) ?? []).length;
}

/** Fenced code blocks carry the structured summaries; losing one loses content. */
function fences(text) {
  return (text.match(/^```/gm) ?? []).length / 2;
}

function tables(text) {
  return (text.match(/^\|.+\|$/gm) ?? []).length;
}

function body(text) {
  const end = text.indexOf("\n---", 4);
  return end === -1 ? text : text.slice(text.indexOf("\n---", end) + 4);
}

function frontmatter(text) {
  const match = /^---\n([\s\S]*?)\n---/.exec(text);
  return match ? match[1] : "";
}

/**
 * Hangul is the one script no target locale shares with Korean — ja has kana,
 * zh has han, but 가-힣 appears nowhere else. So its share of the body is a
 * clean language signal for every locale at once.
 *
 * `import`/JSX lines are dropped first: a component name is not prose, and a
 * file that is 90% JSX would otherwise read as "translated".
 */
const HANGUL = /[가-힣]/g;

function hangulRatio(text) {
  const prose = body(text)
    .replace(/^import .*$/gm, "")
    .replace(/<[^>]*>/g, "");
  const chars = prose.replace(/\s/g, "");
  if (chars.length < 200) return 0;
  return (prose.match(HANGUL) ?? []).length / chars.length;
}

/** Above this share of Hangul the page is serving Korean, whatever it declares. */
const HANGUL_LIMIT = 0.15;

function runScan(write) {
  const locales = readdirSync(CONTENT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "ko")
    .map((entry) => entry.name);

  const found = [];
  for (const loc of locales) {
    for (const file of readdirSync(`${CONTENT}/${loc}`)) {
      if (!file.endsWith(".mdx")) continue;
      const ratio = hangulRatio(readFileSync(`${CONTENT}/${loc}/${file}`, "utf8"));
      if (ratio > HANGUL_LIMIT) found.push({ id: `${loc}/${file}`, hangul: Number(ratio.toFixed(2)) });
    }
  }
  found.sort((a, b) => (a.id < b.id ? -1 : 1));

  if (write) {
    writeFileSync(BASELINE, `${JSON.stringify({ limit: HANGUL_LIMIT, files: found }, null, 2)}\n`);
    console.log(`베이스라인 기록: ${BASELINE} — ${found.length}건`);
    return 0;
  }

  const baseline = existsSync(BASELINE)
    ? new Set(JSON.parse(readFileSync(BASELINE, "utf8")).files.map((f) => f.id))
    : new Set();
  const foundIds = new Set(found.map((f) => f.id));
  const added = found.filter((f) => !baseline.has(f.id));
  const fixed = [...baseline].filter((id) => !foundIds.has(id)).sort();

  console.log(`\n로케일 선언과 본문 언어 대조 — ${found.length}건이 한국어 본문 (기준 ${HANGUL_LIMIT})`);
  const byLocale = {};
  for (const f of found) {
    const loc = f.id.split("/")[0];
    byLocale[loc] = (byLocale[loc] ?? 0) + 1;
  }
  for (const [loc, count] of Object.entries(byLocale).sort()) console.log(`  ${loc}: ${count}`);

  if (added.length) {
    console.error(`\nFAIL — 베이스라인에 없는 신규 ${added.length}건`);
    for (const f of added) console.error(`  + ${f.id} (한글 ${Math.round(f.hangul * 100)}%)`);
  }
  if (fixed.length) {
    console.error(`\nFAIL — 고쳐졌는데 베이스라인에 남아 있는 ${fixed.length}건 (목록에서 지울 것)`);
    for (const id of fixed) console.error(`  - ${id}`);
  }
  if (added.length || fixed.length) return 1;
  console.log(`\nPASS — 신규 유입 0건 · 베이스라인 ${baseline.size}건 잔존`);
  return 0;
}

const args = process.argv.slice(2);
if (args[0] === "--scan") {
  process.exit(runScan(args.includes("--write-baseline")));
}

const [locale, prefix, fromArg, toArg] = args;
if (!locale || !prefix || !fromArg || !toArg) {
  console.error("사용법: node scripts/verify-translation-batch.mjs <locale> <slugPrefix> <from> <to>");
  console.error("        node scripts/verify-translation-batch.mjs --scan [--write-baseline]");
  process.exit(2);
}
const from = Number(fromArg);
const to = Number(toArg);

const failures = [];
const rows = [];

for (let chapter = from; chapter <= to; chapter += 1) {
  const slug = `${prefix}${chapter}`;
  const sourcePath = `${CONTENT}/ko/${slug}.mdx`;
  const targetPath = `${CONTENT}/${locale}/${slug}.mdx`;

  if (!existsSync(sourcePath)) {
    failures.push(`${slug}: 원본 ${sourcePath} 이 없다`);
    continue;
  }
  if (!existsSync(targetPath)) {
    failures.push(`${slug}: **파일이 생성되지 않았다** (${targetPath})`);
    rows.push({ slug, status: "MISSING" });
    continue;
  }

  const source = readFileSync(sourcePath, "utf8");
  const target = readFileSync(targetPath, "utf8");
  const meta = frontmatter(target);

  const sourceHeadings = headings(body(source));
  const targetHeadings = headings(body(target));
  const ratio = body(target).length / body(source).length;

  const problems = [];
  if (sourceHeadings !== targetHeadings) {
    problems.push(`헤딩 ${targetHeadings}≠${sourceHeadings}`);
  }
  if (fences(source) !== fences(target)) {
    problems.push(`코드블록 ${fences(target)}≠${fences(source)}`);
  }
  if (tables(source) !== tables(target)) {
    problems.push(`표행 ${tables(target)}≠${tables(source)}`);
  }
  // Calibrated from the 18 ko→en / ko→ja pairs already in the repo, not guessed:
  // ko→en measured 0.73–2.44 (mean 1.42), ko→ja 0.38–1.06 (mean 0.85). Korean is
  // far more compact than English or the Romance languages, so one band for every
  // locale flags healthy translations as failures.
  const [floor, ceiling] = RATIO_BANDS[locale] ?? [0.6, 2.6];
  if (ratio < floor || ratio > ceiling) {
    problems.push(`분량비 ${ratio.toFixed(2)} (${locale} 기대 ${floor}~${ceiling})`);
  }
  if (!new RegExp(`^locale: ${locale}$`, "m").test(meta)) {
    problems.push("frontmatter locale 불일치");
  }
  if (!new RegExp(`^chapter: ${chapter}$`, "m").test(meta)) {
    problems.push("frontmatter chapter 불일치");
  }
  // The series key stays Korean across every locale — it is an identifier.
  if (!/^series: /m.test(meta)) {
    problems.push("series 누락");
  }
  // MDX parses `{...}` as a JSX expression and dies at build time.
  if (/\{#/.test(target)) {
    problems.push("MDX 함정: {#anchor}");
  }
  if (locale === "zh") {
    const traditional = target.match(TRADITIONAL_ONLY);
    if (traditional) {
      problems.push(`번체 ${[...new Set(traditional)].slice(0, 6).join("")}`);
    }
  }

  rows.push({
    slug,
    status: problems.length ? "FAIL" : "OK",
    headings: `${targetHeadings}/${sourceHeadings}`,
    ratio: ratio.toFixed(2),
    problems,
  });
  if (problems.length) failures.push(`${slug}: ${problems.join(" · ")}`);
}

console.log(`\n${locale} ${prefix}${from}~${to}`);
for (const row of rows) {
  const detail = row.status === "OK"
    ? `헤딩 ${row.headings} · 분량비 ${row.ratio}`
    : (row.problems ?? []).join(" · ");
  console.log(`  ${row.status === "OK" ? "✓" : "✗"} ${row.slug.padEnd(30)} ${detail}`);
}

if (failures.length) {
  console.error(`\nFAIL — ${failures.length}건\n${failures.map((f) => `  - ${f}`).join("\n")}`);
  process.exit(1);
}
console.log(`\nPASS — ${rows.length}개 전부 구조 일치`);

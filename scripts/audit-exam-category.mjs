import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src/content/blog");
const fix = process.argv.includes("--fix");

const SERIES_SIGNAL = /(시험|기사|기능사|산업기사|지도사|자격|준비|법학적성시험|공인회계사|세무사|감정평가사|노무사|법무사|행정사|변리사|Exam|Study Guide|Certification|Chartered Accountant|Professional|Prep)/i;
const SLUG_SIGNAL = /(?:-exam-|-engineer-|-industrial-|-leet-prep-|-gmat-prep-|-gre-prep-|-ielts-prep-|-toefl-prep-|-aws-sa-|-cissp-|-pmp-|-acca-basics-|-cfa-basics-|-frm-basics-|-us-cpa-|-at-cert-|-big-?data-)/i;

function filesUnder(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(target) : entry.name.endsWith(".mdx") ? [target] : [];
  });
}

function field(frontmatter, key) {
  return frontmatter.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, "m"))?.[1]?.replace(/["']$/, "") ?? "";
}

function isExamContent(file, source) {
  const frontmatter = source.split("---")[1] ?? "";
  if (field(frontmatter, "track") !== "academy") return false;
  const slug = path.basename(file, ".mdx");
  return SERIES_SIGNAL.test(field(frontmatter, "series")) || SLUG_SIGNAL.test(slug);
}

const wrong = [];
const examSlugs = new Set();
for (const file of filesUnder(ROOT)) {
  const source = fs.readFileSync(file, "utf8");
  if (!isExamContent(file, source)) continue;
  const slug = path.basename(file, ".mdx");
  examSlugs.add(slug);
  const frontmatter = source.split("---")[1] ?? "";
  if (field(frontmatter, "category") === "Exam") continue;
  wrong.push(path.relative(process.cwd(), file));
  if (fix) {
    fs.writeFileSync(file, source.replace(/^(category:\s*)["']?.+?["']?\s*$/m, '$1"Exam"'));
  }
}

const legacyLinks = [];
for (const file of filesUnder(ROOT)) {
  const source = fs.readFileSync(file, "utf8");
  if (!/https:\/\/oiyo\.net\/(?:ko|en|ja|zh|fr|es)\/financial-ratios/.test(source)) continue;
  legacyLinks.push(path.relative(process.cwd(), file));
  if (fix) {
    fs.writeFileSync(file, source.replaceAll(/https:\/\/oiyo\.net\/(ko|en|ja|zh|fr|es)\/financial-ratios\?utm_source=blog&utm_medium=article&utm_campaign=financial_ratios_guide/g, (_all, locale) => `https://blog.oiyo.net/${locale}/financial-ratio-trend/?utm_source=blog&utm_medium=article&utm_campaign=financial_ratios_guide`).replaceAll(" (oiyo.net)", " (blog.oiyo.net)"));
  }
}

if (!fix && (wrong.length || legacyLinks.length)) {
  console.error(`exam category audit FAIL: ${wrong.length} exam pages outside Exam; ${legacyLinks.length} financial-ratios links point to oiyo.net`);
  for (const file of [...wrong.slice(0, 20), ...legacyLinks]) console.error(`- ${file}`);
  process.exit(1);
}

console.log(`exam category audit PASS: ${examSlugs.size} exam slugs; ${fix ? `${wrong.length} pages and ${legacyLinks.length} links fixed` : "all canonical"}`);

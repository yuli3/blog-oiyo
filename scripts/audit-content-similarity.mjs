import fs from "node:fs";
import path from "node:path";

const contentDir = path.resolve("src/content/blog/ko");
const genericComponents = new Set([
  "BarChart",
  "Callout",
  "CompareTable",
  "FaqAccordion",
  "StatCards",
  "TestCTA",
  "Timeline",
  "ToolCTA",
]);
const stopwords = new Set([
  "가이드", "계산기", "완벽", "완전", "기초", "입문", "방법", "우리", "위한", "하는",
  "대해", "통해", "그리고", "에서", "으로", "까지", "있는", "없는", "알아보기", "guide",
  "complete", "calculator", "introduction", "basics", "the", "and", "for", "with",
]);

function frontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  const data = {};
  if (!match) return data;
  for (const line of match[1].split("\n")) {
    const item = line.match(/^([A-Za-z][\w-]*):\s*["']?(.*?)["']?\s*$/);
    if (item) data[item[1]] = item[2];
  }
  return data;
}

function normalize(value) {
  return value
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^0-9a-z가-힣]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function terms(value) {
  return normalize(value)
    .split(" ")
    .filter((term) => term.length > 1 && !stopwords.has(term));
}

function characterGrams(value, width = 2) {
  const compact = normalize(value).replaceAll(" ", "");
  const result = new Set();
  for (let index = 0; index <= compact.length - width; index += 1) {
    result.add(compact.slice(index, index + width));
  }
  return result;
}

function wordShingles(value, width = 4) {
  const words = terms(value);
  const result = new Set();
  for (let index = 0; index <= words.length - width; index += 1) {
    result.add(words.slice(index, index + width).join(" "));
  }
  return result;
}

function jaccard(left, right) {
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  for (const value of left) if (right.has(value)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
}

function meaningfulBody(source) {
  return source
    .replace(/^---[\s\S]*?---/, "")
    .replace(/^import .*$/gm, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[|#>*_`()[\]{}-]/g, " ")
    .slice(0, 12000);
}

const docs = fs
  .readdirSync(contentDir)
  .filter((filename) => filename.endsWith(".mdx"))
  .sort()
  .map((filename, id) => {
    const source = fs.readFileSync(path.join(contentDir, filename), "utf8");
    const meta = frontmatter(source);
    const slug = path.basename(filename, ".mdx");
    const headings = [...source.matchAll(/^#{1,3}\s+(.+)$/gm)].map((match) => match[1]).join(" ");
    const components = new Set();
    for (const match of source.matchAll(/^import\s+(.+?)\s+from\s+["'](@\/[^"']+)["'];?$/gm)) {
      const [, bindings, importPath] = match;
      if (importPath.includes("/mdx/")) continue;
      for (const name of bindings.match(/[A-Z][A-Za-z0-9_]*/g) ?? []) {
        if (!genericComponents.has(name)) components.add(name);
      }
    }
    const body = meaningfulBody(source);
    return {
      id,
      filename,
      slug,
      title: meta.title ?? slug,
      description: meta.description ?? "",
      track: meta.track ?? "",
      category: meta.category ?? "",
      series: meta.series ?? "",
      titleGrams: characterGrams(`${meta.title ?? slug} ${slug.replaceAll("-", " ")}`),
      titleTerms: new Set(terms(`${meta.title ?? slug} ${slug.replaceAll("-", " ")}`)),
      headingGrams: characterGrams(headings),
      bodyShingles: wordShingles(body),
      components,
      indexTerms: new Set(terms(`${meta.title ?? ""} ${meta.description ?? ""} ${slug.replaceAll("-", " ")} ${headings}`)),
    };
  });

const inverted = new Map();
for (const doc of docs) {
  const keys = [
    ...[...doc.indexTerms].map((term) => `t:${term}`),
    ...[...doc.components].map((component) => `c:${component}`),
  ];
  for (const key of keys) {
    const list = inverted.get(key) ?? [];
    list.push(doc.id);
    inverted.set(key, list);
  }
}

const candidatePairs = new Set();
for (const [key, ids] of inverted) {
  const maxFrequency = key.startsWith("c:") ? 100 : 80;
  if (ids.length < 2 || ids.length > maxFrequency) continue;
  for (let left = 0; left < ids.length; left += 1) {
    for (let right = left + 1; right < ids.length; right += 1) {
      candidatePairs.add(`${ids[left]}:${ids[right]}`);
    }
  }
}

const results = [];
for (const pair of candidatePairs) {
  const [leftId, rightId] = pair.split(":").map(Number);
  const left = docs[leftId];
  const right = docs[rightId];
  const title = jaccard(left.titleGrams, right.titleGrams);
  const titleTerms = jaccard(left.titleTerms, right.titleTerms);
  const headings = jaccard(left.headingGrams, right.headingGrams);
  const body = jaccard(left.bodyShingles, right.bodyShingles);
  const sharedComponents = [...left.components].filter((name) => right.components.has(name));
  const component = sharedComponents.length > 0;
  const sameSeries = left.series && left.series === right.series;
  const score = Math.max(
    titleTerms * 0.62 + headings * 0.23 + body * 0.15,
    body * 0.65 + titleTerms * 0.25 + headings * 0.1,
    component ? 0.45 + titleTerms * 0.35 + body * 0.2 : 0,
  );
  const likelyAdjacentChapter = sameSeries && /(?:ch|chapter|lecture|meaning-of-myth)-?\d+/i.test(`${left.slug} ${right.slug}`);
  const protectedDictionary = left.slug.startsWith("meaning-of-myth-") || right.slug.startsWith("meaning-of-myth-");
  const academyTemplatePair = left.track === "academy" && right.track === "academy" && body < 0.28 && !component;
  if (likelyAdjacentChapter || protectedDictionary || academyTemplatePair) continue;
  let confidence = "";
  if (body >= 0.55 || (titleTerms >= 0.72 && headings >= 0.2) || (component && titleTerms >= 0.5 && body >= 0.08)) confidence = "high";
  else if (body >= 0.28 || (titleTerms >= 0.55 && headings >= 0.12) || (component && titleTerms >= 0.35)) confidence = "medium";
  if (!confidence) continue;
  results.push({
    confidence,
    score: Number(score.toFixed(3)),
    titleSimilarity: Number(title.toFixed(3)),
    titleTermSimilarity: Number(titleTerms.toFixed(3)),
    headingSimilarity: Number(headings.toFixed(3)),
    bodySimilarity: Number(body.toFixed(3)),
    sharedComponents,
    left: { slug: left.slug, title: left.title, track: left.track, series: left.series },
    right: { slug: right.slug, title: right.title, track: right.track, series: right.series },
  });
}

results.sort((a, b) => b.score - a.score || a.left.slug.localeCompare(b.left.slug));
const summary = {
  generatedAt: new Date().toISOString(),
  locale: "ko",
  documents: docs.length,
  candidatePairs: candidatePairs.size,
  high: results.filter((result) => result.confidence === "high").length,
  medium: results.filter((result) => result.confidence === "medium").length,
  results,
};

const outputIndex = process.argv.indexOf("--output");
if (outputIndex !== -1) {
  const outputPath = path.resolve(process.argv[outputIndex + 1]);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
}
console.log(JSON.stringify({ ...summary, results: undefined }, null, 2));

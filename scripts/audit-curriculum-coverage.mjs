#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const curriculaDir = path.join(root, "data/curricula");
const contentDir = path.join(root, "src/content/blog/ko");
const outputDir = path.join(root, "reports/curriculum-coverage");
const requested = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const check = process.argv.includes("--check");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalize = (value) => value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ");

const curriculumFiles = (await readdir(curriculaDir))
  .filter((name) => name.endsWith(".json"))
  .filter((name) => requested.length === 0 || requested.includes(name.replace(/\.json$/, "")));
if (curriculumFiles.length === 0) throw new Error("점검할 curriculum JSON이 없습니다.");

await mkdir(outputDir, { recursive: true });
let hasHighPriorityGap = false;

for (const fileName of curriculumFiles) {
  const curriculum = JSON.parse(await readFile(path.join(curriculaDir, fileName), "utf8"));
  const allContentNames = await readdir(contentDir);
  const contentNames = allContentNames.filter(
    (name) => name.endsWith(".mdx") && curriculum.seriesPrefixes.some((prefix) => name.startsWith(prefix)),
  );
  const documents = await Promise.all(
    contentNames.map(async (name) => ({ name, body: normalize(await readFile(path.join(contentDir, name), "utf8")) })),
  );

  const rows = curriculum.topics.map((topic) => {
    const terms = [topic.term, ...(topic.aliases ?? [])].map(normalize);
    let occurrences = 0;
    const matchedFiles = [];
    let heading = false;
    for (const document of documents) {
      const documentHits = terms.reduce((sum, term) => {
        const matches = document.body.match(new RegExp(escapeRegex(term), "g"));
        return sum + (matches?.length ?? 0);
      }, 0);
      if (documentHits > 0) matchedFiles.push(document.name.replace(/\.mdx$/, ""));
      occurrences += documentHits;
      heading ||= terms.some((term) => new RegExp(`^#{2,4} .*${escapeRegex(term)}`, "m").test(document.body));
    }
    const status = occurrences === 0 ? "missing" : heading || occurrences >= 3 ? "covered" : "mention-only";
    if (topic.priority === "high" && status !== "covered") hasHighPriorityGap = true;
    return { ...topic, status, occurrences, matchedFiles };
  });

  const summary = Object.fromEntries(
    ["covered", "mention-only", "missing"].map((status) => [status, rows.filter((row) => row.status === status).length]),
  );
  const id = fileName.replace(/\.json$/, "");
  const result = {
    generatedAt: new Date().toISOString(),
    curriculum: fileName,
    subject: curriculum.subject,
    sources: curriculum.sources,
    scannedFiles: contentNames.length,
    summary,
    rows,
  };
  await writeFile(path.join(outputDir, `${id}.json`), `${JSON.stringify(result, null, 2)}\n`);
  const md = [
    `# ${curriculum.subject} curriculum coverage`,
    "",
    `- scanned: ${contentNames.length} files`,
    `- covered: ${summary.covered} · mention-only: ${summary["mention-only"]} · missing: ${summary.missing}`,
    "- 문자열 등장은 범위 후보를 찾는 신호다. 설명의 정확성·충분성 판정은 사람이 본문을 검토한다.",
    "",
    "| 상태 | 우선순위 | 개념 | 등장 | 파일 |",
    "| --- | --- | --- | ---: | --- |",
    ...rows.map((row) => `| ${row.status} | ${row.priority} | ${row.term} | ${row.occurrences} | ${row.matchedFiles.join(", ")} |`),
    "",
  ].join("\n");
  await writeFile(path.join(outputDir, `${id}.md`), md);
  console.log(`${curriculum.subject}: covered ${summary.covered}, mention-only ${summary["mention-only"]}, missing ${summary.missing}`);
}

if (check && hasHighPriorityGap) {
  console.error("high priority curriculum에 covered가 아닌 항목이 있습니다.");
  process.exitCode = 1;
}

#!/usr/bin/env node
/**
 * 본문에 리터럴 `**` 가 새어 나오는 것을 막는다.
 *
 * 2026-07-27 감사에서 1,498페이지가 이 증상을 보였고 원인이 둘로 갈렸다:
 *
 *  1) CommonMark 의 right-flanking 규칙 — `**볼드(영문)**조사` 처럼 닫는 `**`
 *     앞이 구두점이고 뒤가 CJK 문자면 강조가 닫히지 않는다.
 *     → astro.config.mjs 의 remark-cjk-friendly 로 해결. 여기서는 그 플러그인이
 *       빠지면 바로 알도록 소스 패턴 수가 아니라 *설정 존재* 를 확인한다.
 *
 *  2) `\*\*` — 이스케이프된 별표. 라벨 텍스트까지 함께 사라져 있었고
 *     최초 커밋부터 존재해 git 으로 복구할 수 없었다(2026-07-27 수동 복원).
 *     → 소스에 다시 들어오면 즉시 실패시킨다.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";

const CONTENT = "src/content/blog";
const failures = [];

const config = readFileSync("astro.config.mjs", "utf8");
if (!/remarkCjkFriendly/.test(config)) {
  failures.push("astro.config.mjs 에 remarkCjkFriendly 가 없다 — CJK 강조가 다시 깨진다");
}

let scanned = 0;
for (const entry of readdirSync(CONTENT, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const locale = entry.name;
  const dir = `${CONTENT}/${locale}`;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".mdx")) continue;
    scanned += 1;
    const text = readFileSync(`${dir}/${file}`, "utf8");
    const escaped = text.match(/\\\*\\\*/g);
    if (escaped) {
      failures.push(`${locale}/${file}: 이스케이프된 별표 ${escaped.length}건 — 라벨이 소실됐을 수 있다`);
    }
  }
}

if (failures.length) {
  console.error(`FAIL — ${failures.length}건\n${failures.map((f) => `  - ${f}`).join("\n")}`);
  process.exit(1);
}
console.log(`PASS — mdx ${scanned}개, 리터럴 별표 0건 · remark-cjk-friendly 적용됨`);

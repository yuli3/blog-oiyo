#!/usr/bin/env node
/**
 * `$120,000` 같은 통화 표기가 remark-math 에 인라인 수식 여는 기호로 잡히면
 * 그 뒤 아무 `$` 나 만나 닫혀버려 `120 , 000 ) = ∗ ∗` 처럼 렌더링이 깨진다.
 * 2026-07-28 감사에서 43페이지가 이 증상을 보였다.
 *
 * remark-math 는 single-`$` 인라인 수식을 끌 수 있는 옵션이 없고(라이브러리
 * 확인 완료), 사이트에 `$1 + 2 + ... = \frac{k(k+1)}{2}` 같은 진짜 수식도
 * 있어서 전역 설정으로 막을 수 없다. 그래서 통화 `$` 는 소스에서
 * `\$`(이스케이프)로 쓰는 게 유일한 안전한 방법이다.
 *
 * 이 검사는 "$ 바로 뒤에 숫자"가 이스케이프 없이 남아있으면 실패시킨다.
 * 진짜 수식(`\frac`, `^`, `\implies` 등 LaTeX 명령이 함께 있는 경우)은 예외.
 */
import { readFileSync, readdirSync } from "node:fs";

const CONTENT = "src/content/blog";
const MATH_COMMAND = /\\[a-zA-Z]+|\^|_\{/;
const failures = [];
let scanned = 0;

for (const entry of readdirSync(CONTENT, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dir = `${CONTENT}/${entry.name}`;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".mdx")) continue;
    scanned += 1;
    const text = readFileSync(`${dir}/${file}`, "utf8").replace(/```[\s\S]*?```/g, "");
    const bad = [];
    for (const match of text.matchAll(/(?<!\\)\$[0-9][^\n$]{0,60}\$/g)) {
      if (!MATH_COMMAND.test(match[0])) bad.push(match[0].slice(0, 40));
    }
    if (bad.length) failures.push(`${entry.name}/${file}: ${bad.length}건 — 예: ${bad[0]}`);

    // `<1 year` 처럼 `<` 바로 뒤에 숫자가 오면 MDX 가 JSX 태그 시작으로
    // 오인해 "Unexpected character before name" 로 빌드가 죽는다.
    // 2026-07-28: `held <1 year` 하나가 통화 이스케이프 수정 중 캐시가
    // 무효화되며 처음 드러났다 — 그전엔 빌드가 이 파일을 재파싱하지
    // 않아 조용히 숨어 있었다.
    for (const match of text.matchAll(/<[0-9]/g)) {
      failures.push(`${entry.name}/${file}: MDX 함정 "<숫자" — "${match[0]}" (예: "<1 year" 처럼 "less than 1 year" 로 풀어 쓸 것)`);
    }
  }
}

if (failures.length) {
  console.error(`FAIL — ${failures.length}개 파일\n${failures.map((f) => `  - ${f}`).join("\n")}`);
  process.exit(1);
}
console.log(`PASS — mdx ${scanned}개, 이스케이프 안 된 통화 \`$숫자\` 쌍 0건`);

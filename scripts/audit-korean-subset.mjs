#!/usr/bin/env node
// 한글 서브셋 감사 — 2026-09-02.
//
// 본문 서체는 KS X 1001 완성형 2,350자로 자른 `GowunBatang-ks-400.woff2` 다.
// 그 범위를 벗어나는 한글은 서체가 못 그려서 폴백으로 렌더되는데, **현대
// 한국어 텍스트에서 그런 글자는 거의 항상 오타다.** 실제로 이 감사를 처음
// 돌렸을 때 나온 4자 중 확인 가능한 것은 "더 눟게"(← "더 높게")였다.
//
// 그래서 이 감사는 폰트 커버리지 검사이자 **오타 탐지기**다. 기존 4자는
// 예산으로 잡아 두고, 늘어나면 실패한다 — 새로 들어온 오타라는 뜻이다.
//
// 서체를 바꿀 때만: bash scripts/build-korean-subset.sh
// usage: node scripts/audit-korean-subset.mjs
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const FONT = "public/fonts/GowunBatang-ks-400.woff2";
const CONTENT = "src/content/blog/ko";
// 2026-09-02 실측. 줄이는 방향으로만 갱신한다 — 늘리는 건 오타를 승인하는 것이다.
const TYPO_BUDGET = 4;
const SIZE_CAP_KB = 240;

const ks = new Set();
for (let hi = 0xb0; hi <= 0xc8; hi++) {
  for (let lo = 0xa1; lo <= 0xfe; lo++) {
    try {
      const ch = new TextDecoder("euc-kr", { fatal: true }).decode(new Uint8Array([hi, lo]));
      ks.add(ch);
    } catch { /* 빈 자리 */ }
  }
}

const failures = [];
if (!existsSync(FONT)) {
  failures.push(`${FONT} 이 없다. bash scripts/build-korean-subset.sh 로 만든다.`);
} else {
  const kb = statSync(FONT).size / 1024;
  if (kb > SIZE_CAP_KB) {
    failures.push(`${FONT} 이 ${kb.toFixed(0)} KB 다(상한 ${SIZE_CAP_KB}). 무엇이 늘었는지 보고 상한을 올릴지 판단한다.`);
  }

  const files = readdirSync(CONTENT).filter((f) => /\.mdx?$/.test(f));
  const odd = new Map();
  for (const name of files) {
    for (const ch of readFileSync(join(CONTENT, name), "utf8")) {
      const cp = ch.codePointAt(0);
      if (cp < 0xac00 || cp > 0xd7a3) continue; // 한글 완성형만 본다
      if (ks.has(ch)) continue;
      if (!odd.has(ch)) odd.set(ch, name);
    }
  }
  if (odd.size > TYPO_BUDGET) {
    const list = [...odd.entries()].map(([c, f]) => `${c}(${f})`).join(" ");
    failures.push(
      `KS X 1001 밖의 한글이 ${odd.size}자다(기록된 ${TYPO_BUDGET}자보다 늘었다). 대개 오타이고, 서체가 못 그려 폴백으로 렌더된다.\n    ${list}`,
    );
  }
  if (!failures.length) {
    console.log(
      `한글 서브셋 감사 PASS — 폰트 ${kb.toFixed(0)} KB, 글 ${files.length}편에서 KS 밖 한글 ${odd.size}/${TYPO_BUDGET}자.`,
    );
  }
}

if (failures.length) {
  console.error("한글 서브셋 감사 FAIL\n");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

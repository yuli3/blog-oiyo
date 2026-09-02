#!/usr/bin/env node
// 한글 서브셋 커버리지 감사 — 2026-09-02.
//
// `public/fonts/GowunBatang-corpus-400.woff2` 는 **이 블로그의 글에 실제로 쓰인
// 글자만** 담은 서브셋이다(원본 8.2MB → 140KB). 그래서 새 글에 없던 글자가
// 들어오면 그 글자만 OS 폴백으로 렌더된다 — 두부는 안 뜨지만 한 문장 안에서
// 서체가 섞인다. 눈으로는 잘 안 보이고, 글이 쌓일수록 조용히 늘어난다.
//
// 폰트 파일을 파싱하지 않는다. 서브셋을 만들 때 쓴 문자 목록을 옆에 적어 두고
// (`*.chars.txt`) **콘텐츠의 문자 집합이 그 안에 들어가는지**만 본다. woff2 를
// 열지 않으므로 CI 에 Python 도 fonttools 도 필요 없다.
//
// 재생성: bash scripts/build-korean-subset.sh
// usage: node scripts/audit-korean-subset.mjs
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const FONT = "public/fonts/GowunBatang-corpus-400.woff2";
const MANIFEST = "scripts/data/GowunBatang-corpus-400.chars.txt";
const CONTENT = "src/content/blog/ko";

const failures = [];
if (!existsSync(FONT)) failures.push(`${FONT} 이 없다.`);
if (!existsSync(MANIFEST)) failures.push(`${MANIFEST} 가 없다 — 서브셋에 무엇이 들어갔는지 알 수 없다.`);

if (!failures.length) {
  const covered = new Set([...readFileSync(MANIFEST, "utf8")]);
  const files = readdirSync(CONTENT).filter((f) => /\.mdx?$/.test(f));
  const missing = new Map();

  for (const name of files) {
    // frontmatter 를 자르지 않는다. `title` 은 h1 으로 렌더되고, 자르는 규칙을
    // 생성기와 감사 두 곳에 두면 그 둘이 갈라진다 — 실제로 갈라져서 362자가
    // 서브셋 밖에 있었다(생성기 쪽 `re.sub` 이 `count=1` 없이 `---` 쌍을 전부
    // 지워 본문 일부까지 날렸다). 양쪽 다 원문 전체를 본다.
    const raw = readFileSync(join(CONTENT, name), "utf8");
    for (const ch of raw) {
      if (!ch.trim() && ch !== " ") continue;
      // 라틴·숫자·기본 구두점은 폴백(Georgia)이 제대로 그린다. 폴백이 없는
      // 문자만 본다 — 한글·한자·전각 기호.
      const cp = ch.codePointAt(0);
      const needsFont =
        (cp >= 0xac00 && cp <= 0xd7a3) || // 한글 완성형
        (cp >= 0x1100 && cp <= 0x11ff) || // 한글 자모
        (cp >= 0x3130 && cp <= 0x318f) || // 호환 자모
        (cp >= 0x4e00 && cp <= 0x9fff) || // 한자
        (cp >= 0x3000 && cp <= 0x303f); // 전각 구두점
      if (!needsFont || covered.has(ch)) continue;
      if (!missing.has(ch)) missing.set(ch, []);
      if (missing.get(ch).length < 3) missing.get(ch).push(name);
    }
  }

  if (missing.size) {
    const sample = [...missing.entries()].slice(0, 12)
      .map(([ch, where]) => `${ch}(${where[0]})`).join(" ");
    failures.push(
      `서브셋에 없는 글자가 ${missing.size}자 있다. 그 글자만 OS 폴백으로 렌더된다.\n` +
        `    예: ${sample}\n` +
        `    고치기: bash scripts/build-korean-subset.sh 로 재생성한 뒤 커밋한다.`,
    );
  }

  const kb = statSync(FONT).size / 1024;
  // 코퍼스가 늘면 폰트도 커진다. 조용히 커지지 않게 상한을 둔다.
  if (kb > 220) {
    failures.push(`${FONT} 이 ${kb.toFixed(0)} KB 다(상한 220). 코퍼스가 얼마나 늘었는지 보고 상한을 올릴지 판단한다.`);
  }
  if (!failures.length) {
    console.log(
      `한글 서브셋 감사 PASS — 글 ${files.length}편의 글자가 모두 서브셋 안에 있다. ` +
        `폰트 ${kb.toFixed(0)} KB, 수록 ${covered.size}자.`,
    );
  }
}

if (failures.length) {
  console.error("한글 서브셋 감사 FAIL\n");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

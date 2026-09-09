#!/usr/bin/env node
// 화살표 개요(`→ 항목`)가 담긴 코드펜스를 중첩 목록으로 옮긴다.
//
// arrow-outline 은 남은 블록의 최대 버킷(1,379개)이고, 시리즈별로 보면 가장
// 균질하다 — food-nutrition 100%, calculus 96%, 사회복지사 83%. 모양이 한 가지라
// 규칙을 세울 수 있다:
//
//   Subfields of food and nutrition science:      ← 도입줄(콜론으로 끝)
//   → Basic nutrition: the chemical structure     ← 항목
//   → Clinical nutrition: nutritional management
//     and treatment                               ← 앞 항목의 이어짐(들여쓰기)
//
// 이어지는 줄을 새 항목으로 만들면 문장이 두 동강 난다. 들여쓴 줄은 앞 항목에
// 붙인다. 규칙에 맞지 않는 줄이 하나라도 있으면 블록을 통째로 포기한다.
//
// 사용:
//   node scripts/migrate-codeblock-outlines.mjs --series food-nutrition
//   node scripts/migrate-codeblock-outlines.mjs --series food-nutrition --write
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { escapeMdx } from './lib/mdx-escape.mjs';
import { classifyBlock, extractUntaggedBlocks } from './lib/codeblock-classify.mjs';

const ROOT = 'src/content/blog';
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const WRITE = args.includes('--write');
const wantSeries = opt('series');
const wantLocale = opt('locale');
const LIMIT = Number(opt('show', 3));

// ⚠ 이 정규식들은 옆 스크립트(migrate-codeblock-{lists,definitions,outlines})의
// 같은 이름 정규식과 **비슷해 보이지만 의도적으로 다르다.** 하나로 합치면 조용히
// 동작이 바뀐다. 2026-09-10 코퍼스 실측:
//   depthOf 5칸판 vs 6칸판    → 정확히 6칸 들여쓴 줄 5,047개에서 갈린다
//   NUMBERED 원문자 포함 여부  → ①~⑳ 로 시작하는 줄 1,236개에서 갈린다
//   CONTINUATION 세 변형       → 매치 수가 56,627 / 13,231 / 45,471 로 다르다
// 진짜 중복은 LEAD_IN 하나뿐이라 모듈로 뺄 값어치가 없다. 이스케이프는 이미
// lib/mdx-escape.mjs 로 합쳐져 있다(`<18.5` 빌드 실패의 원인이 그 흩어짐이었다).
const ARROW = /^(\s*)[→▶⇒]\s*(\S.*)$/;
const NUMBERED = /^(\s*)(\d+)[.)]\s+(\S.*)$/;
const BULLET = /^(\s*)[-•*]\s+(\S.*)$/;
const LEAD_IN = /^\S.*:\s*$/;
const CONTINUATION = /^\s{2,}(\S.*)$/;
const KEY_VALUE = /^([^:\n]{1,44}):\s+(\S.*)$/;

/** 항목 본문. `용어: 설명` 이면 용어를 굵게 세운다. */
function itemText(raw) {
  const t = escapeMdx(raw.trim());
  const m = KEY_VALUE.exec(t);
  if (m && !/[.!?。]/.test(m[1])) return `**${m[1].trim()}**: ${m[2].trim()}`;
  return t;
}

const depthOf = (indent) => {
  const n = indent.replace(/\t/g, '  ').length;
  if (n === 0) return 0;
  if (n <= 3) return 1;
  if (n <= 6) return 2;
  return null;
};

function convert(content) {
  const out = [];
  let lastItem = -1;   // out 에서 마지막 목록 항목의 위치
  let proseRun = 0;    // 항목이 시작되기 전 덩이를 여는 산문 줄 수

  for (const line of content.split('\n')) {
    if (!line.trim()) { out.push(''); lastItem = -1; proseRun = 0; continue; }

    const a = ARROW.exec(line);
    if (a) {
      const d = depthOf(a[1]);
      if (d === null) return null;
      out.push(`${'  '.repeat(d)}- ${itemText(a[2])}`);
      lastItem = out.length - 1;
      continue;
    }

    const n = NUMBERED.exec(line);
    if (n) {
      const d = depthOf(n[1]);
      if (d === null) return null;
      out.push(`${'  '.repeat(d)}${n[2]}. ${itemText(n[3])}`);
      lastItem = out.length - 1;
      continue;
    }

    const b = BULLET.exec(line);
    if (b) {
      const d = depthOf(b[1]);
      if (d === null) return null;
      out.push(`${'  '.repeat(d)}- ${itemText(b[2])}`);
      lastItem = out.length - 1;
      continue;
    }

    // 들여쓴 줄은 앞 항목의 이어짐이다. 새 항목으로 만들면 문장이 잘린다.
    const c = CONTINUATION.exec(line);
    if (c && lastItem >= 0) { out[lastItem] += ` ${escapeMdx(c[1].trim())}`; continue; }

    if (LEAD_IN.test(line)) { out.push(`**${escapeMdx(line.trim())}**`, ''); lastItem = -1; proseRun = 0; continue; }

    // 콜론 없이 덩이를 여는 줄 — "Example: Product manufacturing costs" 처럼
    // 항목 앞에 놓인 한 줄짜리 도입문. 이전 판은 이 한 줄 때문에 블록을 통째로
    // 거부했고, 그게 613개가 남은 가장 큰 이유였다. 항목이 시작되기 전 두 줄까지만
    // 허용한다 — 그보다 길면 목록이 아니라 본문이다.
    if (lastItem < 0 && proseRun < 2 && !/^\s/.test(line)) {
      out.push(itemText(line), '');
      proseRun += 1;
      continue;
    }

    return null;   // 항목 사이에 섞인 산문은 사람이 구조를 정해야 한다
  }

  // 항목 본문에 화살표가 다시 나오면 개요가 아니라 흐름도다
  // ("→ Conv → Conv → Conv"). 줄로 쪼개면 연결이 끊긴다.
  const arrowItems = out.filter((l) => /^\s*- /.test(l));
  const chained = arrowItems.filter((l) => /[→▶⇒]/.test(l)).length;
  if (arrowItems.length && chained >= arrowItems.length / 2) return null;

  const md = out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return /^[-\d]/m.test(md) ? md : null;   // 목록이 하나도 없으면 옮길 이유가 없다
}

function walk(dir) {
  const o = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) o.push(...walk(p));
    else if (/\.mdx?$/.test(name)) o.push(p);
  }
  return o;
}
const fm = (t, k) => { const m = t.match(new RegExp(`^${k}:\\s*"?([^"\\n]+)"?`, 'm')); return m ? m[1].trim() : null; };

let converted = 0, skipped = 0, touched = 0;
const previews = [];

for (const path of walk(ROOT)) {
  const locale = path.split('/')[3];
  if (wantLocale && locale !== wantLocale) continue;
  let text = readFileSync(path, 'utf8');
  // --series 는 frontmatter series 또는 slug 어느 쪽에 맞아도 통과시킨다.
  if (wantSeries && !(fm(text, 'series') ?? '').includes(wantSeries) && !path.includes(wantSeries)) continue;

  const blocks = extractUntaggedBlocks(text).filter((b) => classifyBlock(b.content) === 'arrow-outline');
  if (!blocks.length) continue;

  let changed = false;
  for (const block of [...blocks].reverse()) {
    const md = convert(block.content);
    if (!md) { skipped += 1; continue; }
    if (previews.length < LIMIT) previews.push({ path, before: block.content.trim(), after: md });
    text = `${text.slice(0, block.start)}${md}${text.slice(block.end)}`;
    converted += 1; changed = true;
  }
  if (changed) { touched += 1; if (WRITE) writeFileSync(path, text); }
}

console.log(`화살표 개요 → 목록 ${WRITE ? '(적용)' : '(미적용 · --write 로 반영)'}`);
console.log(`변환 ${converted} · 건너뜀 ${skipped} · 문서 ${touched}\n`);
for (const p of previews) {
  console.log(`▶ ${p.path}`);
  console.log('--- before ---'); console.log(p.before);
  console.log('--- after ----'); console.log(p.after); console.log();
}

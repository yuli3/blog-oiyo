#!/usr/bin/env node
// 목록만 담긴 코드펜스를 마크다운 목록으로 옮긴다.
//
// 안전 규칙이 이 스크립트의 전부다. 애매하면 건드리지 않는다 — 본문을 망가뜨리는
// 것이 검은 상자로 남는 것보다 나쁘다. 실제로 겪은 함정 둘:
//   1. 줄머리 `-` 가 글머리표가 아니라 **뺄셈**인 계산 사다리
//      (Net Income + 감가상각 − 운전자본 = CFO). 목록으로 옮기면 계산이 사라진다.
//      → classifyBlock 이 calc-ladder 로 먼저 걸러낸다.
//   2. 들여쓰기가 의미를 갖는 블록. 2단 들여쓰기는 중첩 목록으로 살리되,
//      3단 이상이나 불규칙한 들여쓰기는 도식일 수 있으므로 건너뛴다.
//
// 사용:
//   node scripts/migrate-codeblock-lists.mjs --locale ko --category Economics
//   node scripts/migrate-codeblock-lists.mjs --locale ko --category Economics --write
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { escapeMdx } from './lib/mdx-escape.mjs';
import { classifyBlock, extractUntaggedBlocks } from './lib/codeblock-classify.mjs';

const ROOT = 'src/content/blog';
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const WRITE = args.includes('--write');
const SHOW_SKIPS = args.includes('--skips');   // 옮기지 못한 블록을 대신 보여준다
const wantCategory = opt('category');
const wantLocale = opt('locale');
const wantSeries = opt('series');
const LIMIT = Number(opt('show', 4));

// MDX 에서 `{...}` 는 JSX 표현식이다. 펜스 밖으로 꺼내면 자바스크립트로 파싱돼
// 빌드가 깨진다(2026-09-09 `Y_{t−1}` 로 실제 발생). 평문으로 나가는 값은 escape 한다.
const BULLET = /^(\s*)[-•*]\s+(\S.*)$/;
const NUMBERED = /^(\s*)(?:(\d+)[.)]|([①-⑳]))\s+(\S.*)$/;
const LEAD_IN = /^\S.*:\s*$/;          // "재고자산의 종류:" 처럼 목록을 여는 줄
// "미시경제학: 개인·기업·시장의 의사결정" 처럼 낱말과 뜻이 콜론으로 붙은 줄.
// 이런 줄이 불릿과 섞여 있어 초안에서는 30개 중 28개가 통째로 거부됐다.
// 용어를 굵게 세운 정의 항목으로 살리는 것이 안전하고 원문에 충실하다.
const DEFINITION = /^(\s*)([^:\n]{1,40}):\s+(\S.*)$/;
const CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';

/** 들여쓰기 폭 → 중첩 단계. 0 또는 2·4칸만 허용한다. */
function depthOf(indent) {
  const n = indent.replace(/\t/g, '  ').length;
  if (n === 0) return 0;
  if (n <= 3) return 1;
  if (n <= 5) return 2;
  return null;  // 6칸 이상은 도식일 가능성이 높다 — 손대지 않는다
}

// 강의 원고의 블록은 하나의 목록이 아니라 **여러 덩이가 빈 줄로 붙어 있다.**
// 법률 시리즈가 전형이다:
//
//   상법:                       ← 머리
//   기업·상거래를 규율하는 특별법   ← 몸(산문)
//                               ← 빈 줄
//   상법의 특성:                  ← 다음 덩이의 머리
//   ① 민법의 특별법: ...          ← 몸(항목)
//
// 그래서 빈 줄로 잘라 덩이마다 머리와 몸을 정한다. 이전 판은 머리를 첫 줄에서만
// 인정해 Law 172개 중 171개를 통째로 거부했다.
const PROSE_RUN_MAX = 3;   // 이보다 긴 산문 덩이는 목록이 아니라 본문이다 — 포기한다
const CONTINUATION = /^(\s+|→|↳)/;   // 앞 항목에 이어지는 줄

/** 항목 한 줄을 마크다운으로. 항목이 아니면 null. */
function asItem(line) {
  const b = BULLET.exec(line);
  if (b) {
    const d = depthOf(b[1]);
    return d === null ? null : `${'  '.repeat(d)}- ${escapeMdx(b[2].trim())}`;
  }
  const n = NUMBERED.exec(line);
  if (n) {
    const d = depthOf(n[1]);
    if (d === null) return null;
    const num = n[2] ?? String(CIRCLED.indexOf(n[3]) + 1);
    return `${'  '.repeat(d)}${num}. ${escapeMdx(n[4].trim())}`;
  }
  const def = DEFINITION.exec(line);
  if (def) {
    const d = depthOf(def[1]);
    // 용어 쪽에 문장부호가 들어 있으면 정의가 아니라 산문이다.
    if (d === null || /[.!?。]/.test(def[2])) return null;
    return `${'  '.repeat(d)}- **${escapeMdx(def[2].trim())}**: ${escapeMdx(def[3].trim())}`;
  }
  return null;
}

/** 여러 줄 산문은 줄바꿈을 지킨다 — 원문에서 줄이 나뉜 데는 이유가 있다. */
const proseBlock = (lines) => lines.map((l) => escapeMdx(l)).join('  \n');

/** 빈 줄로 잘린 덩이 하나. 옮기지 못하면 null — 블록 전체를 포기한다. */
function convertGroup(lines) {
  let head = null;
  let body = lines;
  if (LEAD_IN.test(lines[0]) && lines.length > 1) { head = lines[0].trim(); body = lines.slice(1); }

  const prose = [];
  const items = [];
  for (const line of body) {
    const item = asItem(line);
    if (item) { items.push(item); continue; }
    // 들여쓴 줄·화살표 줄은 새 항목이 아니라 앞 항목의 이어짐이다.
    // 새 항목으로 끊으면 문장이 두 동강 난다(2026-09-09 개요 변환에서 겪음).
    if (items.length && CONTINUATION.test(line)) {
      items[items.length - 1] += ` ${escapeMdx(line.trim())}`;
      continue;
    }
    if (items.length) return null;   // 항목이 시작된 뒤의 산문은 사람이 판단한다
    // 산문도 마찬가지로 이어짐을 합친다. 다만 나란한 두 규칙
    // ("A 면 → B" / "C 면 → D") 을 한 줄로 붙이면 병렬이 사라지므로,
    // 이어짐 표시가 있는 줄만 합치고 나머지는 줄을 지킨다.
    if (prose.length && CONTINUATION.test(line)) prose[prose.length - 1] += ` ${line.trim()}`;
    else prose.push(line.trim());
  }
  if (prose.length > PROSE_RUN_MAX) return null;
  if (!head && !items.length) return null;   // 산문만 있는 덩이는 옮길 근거가 없다

  const out = [];
  if (head) {
    const label = escapeMdx(head.replace(/:\s*$/, ''));
    // 머리 + 산문 한 줄이면 한 줄짜리 정의로 붙인다. 그 밖에는 줄을 나눈다.
    if (prose.length === 1 && !items.length) out.push(`**${label}** — ${escapeMdx(prose[0])}`);
    else {
      out.push(`**${label}**`, '');
      if (prose.length) out.push(proseBlock(prose), '');
    }
  } else if (prose.length) {
    out.push(proseBlock(prose), '');
  }
  if (items.length) out.push(...items);
  return { md: out.join('\n').replace(/\n+$/, ''), hasItem: items.length > 0 };
}

function convert(content) {
  const lines = content.split('\n').map((l) => l.replace(/\s+$/, ''));
  const groups = [];
  let cur = [];
  for (const line of lines) {
    if (line.trim()) cur.push(line);
    else if (cur.length) { groups.push(cur); cur = []; }
  }
  if (cur.length) groups.push(cur);
  if (!groups.length) return null;

  const parts = [];
  let sawItem = false;
  for (const g of groups) {
    const r = convertGroup(g);
    if (!r) return null;
    sawItem ||= r.hasItem;
    parts.push(r.md);
  }
  if (!sawItem) return null;   // 목록이 하나도 없으면 이 스크립트의 대상이 아니다
  return parts.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
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
  if (wantCategory && fm(text, 'category') !== wantCategory) continue;
  if (wantSeries && fm(text, 'series') !== wantSeries) continue;

  const blocks = extractUntaggedBlocks(text)
    .map((b) => ({ ...b, kind: classifyBlock(b.content) }))
    .filter((b) => b.kind === 'bullet-list' || b.kind === 'numbered-list');
  if (!blocks.length) continue;

  let changed = false;
  for (const block of [...blocks].reverse()) {
    const md = convert(block.content);
    if (!md) {
      skipped += 1;
      if (SHOW_SKIPS && previews.length < LIMIT) previews.push({ path, before: block.content.trim(), after: '(건너뜀)' });
      continue;
    }
    if (!SHOW_SKIPS && previews.length < LIMIT) previews.push({ path, before: block.content.trim(), after: md });
    text = `${text.slice(0, block.start)}${md}${text.slice(block.end)}`;
    converted += 1; changed = true;
  }
  if (changed) { touched += 1; if (WRITE) writeFileSync(path, text); }
}

console.log(`목록 → 마크다운 ${WRITE ? '(적용)' : '(미적용 · --write 로 반영)'}`);
console.log(`변환 ${converted} · 안전하지 않아 건너뜀 ${skipped} · 문서 ${touched}\n`);
for (const p of previews) {
  console.log(`▶ ${p.path}`);
  console.log('--- before ---'); console.log(p.before);
  console.log('--- after ----'); console.log(p.after); console.log();
}

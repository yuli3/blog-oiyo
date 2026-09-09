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
import { classifyBlock, extractUntaggedBlocks } from './lib/codeblock-classify.mjs';

const ROOT = 'src/content/blog';
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const WRITE = args.includes('--write');
const wantCategory = opt('category');
const wantLocale = opt('locale');
const LIMIT = Number(opt('show', 4));

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

function convert(content, kind) {
  const lines = content.split('\n').map((l) => l.replace(/\s+$/, ''));
  const out = [];
  let sawItem = false;

  for (const line of lines) {
    if (!line.trim()) { out.push(''); continue; }

    const b = BULLET.exec(line);
    if (b) {
      const d = depthOf(b[1]);
      if (d === null) return null;
      out.push(`${'  '.repeat(d)}- ${b[2].trim()}`);
      sawItem = true;
      continue;
    }

    const n = NUMBERED.exec(line);
    if (n) {
      const d = depthOf(n[1]);
      if (d === null) return null;
      const num = n[2] ?? String(CIRCLED.indexOf(n[3]) + 1);
      out.push(`${'  '.repeat(d)}${num}. ${n[4].trim()}`);
      sawItem = true;
      continue;
    }

    // 목록을 여는 한 줄은 굵게 세워 둔다.
    if (LEAD_IN.test(line) && !sawItem) { out.push(`**${line.trim()}**`, ''); continue; }

    const d = DEFINITION.exec(line);
    if (d) {
      const depth = depthOf(d[1]);
      // 용어 쪽에 문장부호가 들어 있으면 정의가 아니라 산문이다.
      if (depth === null || /[.!?。]/.test(d[2])) return null;
      out.push(`${'  '.repeat(depth)}- **${d[2].trim()}**: ${d[3].trim()}`);
      sawItem = true;
      continue;
    }

    // 그 밖의 산문이 섞이면 포기한다 — 목록과 설명이 뒤엉킨 블록은
    // 사람이 구조를 정해야 한다.
    return null;
  }
  if (!sawItem) return null;
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
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

  const blocks = extractUntaggedBlocks(text)
    .map((b) => ({ ...b, kind: classifyBlock(b.content) }))
    .filter((b) => b.kind === 'bullet-list' || b.kind === 'numbered-list');
  if (!blocks.length) continue;

  let changed = false;
  for (const block of [...blocks].reverse()) {
    const md = convert(block.content, block.kind);
    if (!md) { skipped += 1; continue; }
    if (previews.length < LIMIT) previews.push({ path, before: block.content.trim(), after: md });
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

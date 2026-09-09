#!/usr/bin/env node
// 수식만 담긴 코드펜스를 KaTeX 블록($$…$$)으로 옮긴다.
//
// 왜 수식부터인가: 여덟 유형 중 규칙이 가장 명확해 기계가 안전하게 옮길 수 있다.
// 도식·개요는 사람이 어떤 컴포넌트에 담을지 판단해야 하므로 이 스크립트가 건드리지
// 않는다. 조금이라도 애매하면 **건너뛰고 보고**한다 — 본문을 망가뜨리는 것이
// 검은 상자로 남는 것보다 나쁘다.
//
// 사용:
//   node scripts/migrate-codeblock-formulas.mjs --category Economics --locale ko
//   node scripts/migrate-codeblock-formulas.mjs --category Economics --locale ko --write
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { toKatexBlock } from './lib/to-katex.mjs';
import { classifyBlock, extractUntaggedBlocks } from './lib/codeblock-classify.mjs';

const ROOT = 'src/content/blog';
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const WRITE = args.includes('--write');
const wantCategory = opt('category');
const wantLocale = opt('locale');
const LIMIT = Number(opt('show', 6));
const SHOW_SKIPS = args.includes('--skips');

// `formula` 만 보던 것을 셋으로 넓힌다. 셋 다 최종 형태가 KaTeX 다:
//   calc-ladder          세로로 쌓인 가감산 사다리 → aligned
//   formula-with-legend  `라벨 = 식  (주석)` → aligned + \quad\text{주석}
// 남은 유형(개요·도식)은 사람이 컴포넌트를 골라야 하므로 그대로 둔다.
const KINDS = new Set(['formula', 'calc-ladder', 'formula-with-legend']);

// `other` 로 분류된 819개 안에도 수식이 숨어 있다 — 분류기가 "캡션 한 줄 + 식"과
// 한글 사다리("고정예산차이" / "= 실제원가 - 고정예산")를 담을 자리를 못 찾은 것뿐이다.
// 통째로 열면 흐름도(A → B → C)와 분개장까지 들어오므로 모양을 좁게 못박는다.
const CAPTION = /^[^=\n]{1,60}:\s*$/;
const OPERATOR_FIRST = /^\s*[-+−×÷=÷/]/;

/** 캡션을 떼고, 남은 줄이 전부 식이거나 식의 라벨이면 그 둘을 돌려준다. */
function asCaptionedFormula(content) {
  const lines = content.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim());
  if (!lines.length) return null;
  const caption = CAPTION.test(lines[0]) ? lines.shift().trim().replace(/:\s*$/, '') : null;
  if (!lines.length) return null;
  if (!lines.some((l) => l.includes('='))) return null;   // = 가 없으면 흐름도거나 산문이다
  const ok = lines.every((l, i) =>
    l.includes('=') || OPERATOR_FIRST.test(l) ||
    // 사다리의 라벨 줄 — 바로 다음 줄이 `=` 로 시작하면 이 줄은 그 식의 이름이다
    (lines[i + 1] && /^\s*=/.test(lines[i + 1])));
  return ok ? { caption, body: lines.join('\n') } : null;
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.mdx?$/.test(name)) out.push(p);
  }
  return out;
}
const fm = (t, k) => { const m = t.match(new RegExp(`^${k}:\\s*"?([^"\\n]+)"?`, 'm')); return m ? m[1].trim() : null; };

let converted = 0, skipped = 0, touchedFiles = 0;
const previews = [];

for (const path of walk(ROOT)) {
  const locale = path.split('/')[3];
  if (wantLocale && locale !== wantLocale) continue;
  let text = readFileSync(path, 'utf8');
  if (wantCategory && fm(text, 'category') !== wantCategory) continue;

  const blocks = extractUntaggedBlocks(text)
    .filter((b) => { const k = classifyBlock(b.content); return KINDS.has(k) || k === 'other'; });
  if (!blocks.length) continue;

  let changed = false;
  // 뒤에서부터 바꿔야 앞쪽 오프셋이 밀리지 않는다.
  for (const block of [...blocks].reverse()) {
    const kind = classifyBlock(block.content);
    const shaped = kind === 'other' ? asCaptionedFormula(block.content) : { caption: null, body: block.content };
    if (!shaped) { skipped += 1; continue; }
    const inner = toKatexBlock(shaped.body);
    const latex = inner && shaped.caption ? `**${shaped.caption}**\n\n${inner}` : inner;
    if (!latex) {
      skipped += 1;
      if (SHOW_SKIPS && previews.length < LIMIT) previews.push({ path, before: block.content.trim(), after: '(건너뜀)' });
      continue;
    }
    if (!SHOW_SKIPS && previews.length < LIMIT) previews.push({ path, before: block.content.trim(), after: latex });
    text = text.slice(0, block.start) + latex + text.slice(block.end);
    converted += 1; changed = true;
  }
  if (changed) { touchedFiles += 1; if (WRITE) writeFileSync(path, text); }
}

console.log(`formula → KaTeX ${WRITE ? '(적용)' : '(미적용 · --write 로 반영)'}`);
console.log(`변환 ${converted} · 건너뜀 ${skipped} · 문서 ${touchedFiles}\n`);
for (const p of previews) {
  console.log(`▶ ${p.path}`);
  console.log('--- before ---'); console.log(p.before);
  console.log('--- after ----'); console.log(p.after); console.log();
}

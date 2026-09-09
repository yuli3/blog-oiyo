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

  const blocks = extractUntaggedBlocks(text).filter((b) => classifyBlock(b.content) === 'formula');
  if (!blocks.length) continue;

  let changed = false;
  // 뒤에서부터 바꿔야 앞쪽 오프셋이 밀리지 않는다.
  for (const block of [...blocks].reverse()) {
    const latex = toKatexBlock(block.content);
    if (!latex) { skipped += 1; continue; }
    if (previews.length < LIMIT) previews.push({ path, before: block.content.trim(), after: latex });
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

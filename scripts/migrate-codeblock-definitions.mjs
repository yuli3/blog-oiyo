#!/usr/bin/env node
// 정의 목록·키값·공백 정렬 표가 담긴 코드펜스를 옮긴다.
//
// 이 유형은 한 덩어리가 아니라 **여러 조각이 붙어 있다.** 회계 예제가 전형이다:
//
//   Current Assets:      $800,000        ← 키-값
//   Current Liabilities: $400,000
//                                        ← 빈 줄
//   Current Ratio = $800,000 / $400,000 × 100 = 200%   ← 수식
//
// 그래서 블록을 빈 줄로 잘라 조각마다 성격을 정하고 따로 옮긴다.
// **조각 하나라도 옮기지 못하면 블록 전체를 포기한다** — 절반만 바뀐 본문은
// 검은 상자보다 나쁘다.
//
// 사용:
//   node scripts/migrate-codeblock-definitions.mjs --locale ko --category Economics
//   node scripts/migrate-codeblock-definitions.mjs --write
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { toKatexBlock } from './lib/to-katex.mjs';
import { classifyBlock, extractUntaggedBlocks, isFormulaLine } from './lib/codeblock-classify.mjs';

const ROOT = 'src/content/blog';
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const WRITE = args.includes('--write');
const wantCategory = opt('category');
const wantLocale = opt('locale');
const LIMIT = Number(opt('show', 4));

const KEY_VALUE = /^\s*([^:\n]{1,44}):\s+(\S.*)$/;

/**
 * MDX 에서 `{...}` 는 JSX 표현식이다. 코드펜스 안에서는 글자였지만 본문으로 꺼내는
 * 순간 자바스크립트로 파싱된다 — `Y_{t−1}` 이 빌드를 통째로 깨뜨렸다
 * (academy-statistics-basics-ch9, `Unexpected character '−'`). `$$…$$` 안은
 * remark-math 가 먼저 토큰화해 안전하지만, 목록·표로 나가는 평문은 막아야 한다. */
const escapeMdx = (s) => s.replace(/([{}])/g, '\\$1');
const LEAD_IN = /^\S.*:\s*$/;
const BULLET = /^\s*[-•*]\s+(\S.*)$/;

/** 셀 안의 파이프는 표를 깨뜨린다. */
const escapeCell = (s) => escapeMdx(s.trim().replace(/\|/g, '\\|'));

/**
 * 공백 두 칸 이상으로 열이 나뉘고 줄마다 열 수가 같으면 표다.
 * `|` 가 없어 마크다운 표로 보이지 않지만, 사람 눈에는 이미 표다.
 */
function asAlignedTable(lines) {
  const rows = lines.map((l) => l.trim().split(/\s{2,}/));
  const width = rows[0].length;
  if (width < 2 || rows.length < 2) return null;
  if (!rows.every((r) => r.length === width)) return null;
  // 첫 줄이 머리글이 아니면(값이 섞이면) 머리글을 비워 둔다.
  const head = rows[0].map(escapeCell);
  const body = rows.slice(1).map((r) => `| ${r.map(escapeCell).join(' | ')} |`);
  return [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...body].join('\n');
}

/** `라벨: 값` 만으로 이루어진 조각 → 용어를 굵게 세운 목록. */
function asKeyValueList(lines) {
  const out = [];
  for (const line of lines) {
    const b = BULLET.exec(line);
    const target = b ? b[1] : line;
    const m = KEY_VALUE.exec(target);
    if (!m) return null;
    // 라벨에 문장부호가 있으면 정의가 아니라 산문이다.
    if (/[.!?。]/.test(m[1])) return null;
    out.push(`- **${escapeMdx(m[1].trim())}**: ${escapeMdx(m[2].trim())}`);
  }
  return out.join('\n');
}

/** 한 조각을 옮긴다. 못 옮기면 null. */
function convertChunk(lines) {
  if (!lines.length) return '';

  // 조각을 여는 한 줄("계산 예시:")은 굵게 세우고 나머지를 다시 본다.
  if (lines.length > 1 && LEAD_IN.test(lines[0])) {
    const rest = convertChunk(lines.slice(1));
    return rest === null ? null : `**${escapeMdx(lines[0].trim())}**\n\n${rest}`;
  }

  if (lines.every(isFormulaLine)) {
    const katex = toKatexBlock(lines.join('\n'));
    if (katex) return katex;
  }
  const table = asAlignedTable(lines);
  if (table) return table;
  return asKeyValueList(lines);
}

function convert(content) {
  const chunks = content.split(/\n\s*\n/).map((c) => c.split('\n').filter((l) => l.trim()));
  const out = [];
  for (const chunk of chunks) {
    if (!chunk.length) continue;
    const md = convertChunk(chunk);
    if (md === null) return null;   // 조각 하나라도 실패하면 통째로 포기
    out.push(md);
  }
  return out.length ? out.join('\n\n') : null;
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

  const blocks = extractUntaggedBlocks(text).filter((b) => classifyBlock(b.content) === 'definition-list');
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

console.log(`정의·키값 → 목록·표·KaTeX ${WRITE ? '(적용)' : '(미적용 · --write 로 반영)'}`);
console.log(`변환 ${converted} · 건너뜀 ${skipped} · 문서 ${touched}\n`);
for (const p of previews) {
  console.log(`▶ ${p.path}`);
  console.log('--- before ---'); console.log(p.before);
  console.log('--- after ----'); console.log(p.after); console.log();
}

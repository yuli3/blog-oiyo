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
import { escapeMdx } from './lib/mdx-escape.mjs';
import { toKatexBlock } from './lib/to-katex.mjs';
import { classifyBlock, extractUntaggedBlocks, isFormulaLine } from './lib/codeblock-classify.mjs';

const ROOT = 'src/content/blog';
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const WRITE = args.includes('--write');
const wantCategory = opt('category');
const wantLocale = opt('locale');
const wantSeries = opt('series');
const LIMIT = Number(opt('show', 4));

const KEY_VALUE = /^\s*([^:\n]{1,44}):\s+(\S.*)$/;

const LEAD_IN = /^\S.*:\s*$/;   // "계산 예시:" 처럼 조각을 여는 한 줄

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

/** 들여쓰기 폭 → 중첩 단계. 조각 안에서 가장 얕은 줄을 0으로 본다. */
function depthOf(indent, base) {
  const n = indent.replace(/\t/g, '  ').length - base;
  if (n <= 0) return 0;
  if (n <= 3) return 1;
  if (n <= 5) return 2;
  return null;   // 6칸 이상은 정렬 도식일 수 있다 — 손대지 않는다
}

// 앞 항목의 뒷부분인 줄. 새 항목으로 끊으면 문장이나 계산이 두 동강 난다.
const CONTINUATION = /^\s*(?:[=∴→↳]|\(.*\)\s*$)/;

/**
 * 조각을 줄 단위로 걷는다. 조각 안에도 머리가 여러 번 나온다 —
 * 머리를 첫 줄에서만 인정하던 이전 판은 757개를 전부 거부했다.
 */
function asKeyValueList(lines) {
  let base = Math.min(...lines.map((l) => (/^\s*/.exec(l)[0].replace(/\t/g, '  ').length)));
  // 머리 다음 줄들은 대개 한 단 들여쓴다. 그대로 두면 부모 없는 중첩 목록이 되어
  // 여백만 밀려나므로, 머리를 만나면 다음 줄의 들여쓰기를 새 기준으로 삼는다.
  let rebase = false;
  const out = [];
  let lastItem = -1;   // out 안에서 마지막 항목의 자리

  for (const line of lines) {
    if (LEAD_IN.test(line.trim()) && !BULLET.test(line)) {
      out.push('', `**${escapeMdx(line.trim().replace(/:\s*$/, ''))}**`, '');
      lastItem = -1;
      rebase = true;
      continue;
    }

    // 통째로 괄호에 싸인 줄은 항목이 아니라 앞 항목에 붙는 주석이다.
    // 안에 콜론이 있으면 KEY_VALUE 가 먼저 물어 "(필요경비" 가 라벨이 된다.
    const isNote = /^\s*\(.*\)\s*$/.test(line);
    const b = isNote ? null : BULLET.exec(line);
    const target = b ? b[1] : line;
    const m = isNote ? null : KEY_VALUE.exec(target);
    if (m && !/[.!?。]/.test(m[1])) {
      const indent = /^\s*/.exec(line)[0];
      if (rebase) { base = indent.replace(/\t/g, '  ').length; rebase = false; }
      const d = depthOf(indent, base);
      if (d === null) return null;
      out.push(`${'  '.repeat(d)}- **${escapeMdx(m[1].trim())}**: ${escapeMdx(m[2].trim())}`);
      lastItem = out.length - 1;
      continue;
    }

    if (lastItem >= 0 && /^\s*(?:\.{3}|…)\s*$/.test(line)) return null;   // 줄임표는 발췌한 실행 예다

    // 이어짐 표시(= ∴ →)나 괄호 주석만 앞 항목에 붙인다. 그 밖의 들여쓴 줄은
    // 하위 항목으로 살린다 — 무턱대고 붙이면 나란한 세 줄이 한 문장이 된다
    // ("U-shaped Initially fall … Then rise …").
    // 소문자로 시작하는 줄은 새 항목이 아니라 접힌 문장의 뒷부분이다
    // ("… to the LEFT of ATC minimum" / "because ATC = AVC + AFC").
    if (lastItem >= 0 && /^\s+[a-z]/.test(line)) {
      out[lastItem] += ` ${escapeMdx(line.trim())}`;
      continue;
    }
    if (lastItem >= 0 && CONTINUATION.test(line)) {
      out[lastItem] += ` ${escapeMdx(line.trim())}`;
      continue;
    }
    if (lastItem >= 0 && /^\s{2,}\S/.test(line)) {
      const d = depthOf(/^\s*/.exec(line)[0], base);
      if (d === null) return null;
      out.push(`${'  '.repeat(Math.max(d, 1))}- ${escapeMdx(line.trim())}`);
      continue;
    }
    return null;
  }
  if (lastItem < 0 && !out.some((l) => l.startsWith('**'))) return null;
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// 왜 거부됐는지 세어 둔다. 전량 거부(757 → 0)는 규칙이 아니라 진단의 문제다.
export const rejects = new Map();
const reject = (why, line) => {
  rejects.set(why, (rejects.get(why) ?? 0) + 1);
  if (!SAMPLES.has(why)) SAMPLES.set(why, line);
  return null;
};
const SAMPLES = new Map();

/** 거부된 줄이 어떤 모양인지 — 사유를 뭉뚱그리면 다음 규칙을 정할 수 없다. */
function shapeOf(line) {
  const t = line.trim();
  if (/^\[.+\]$/.test(t)) return '대괄호 머리 [국세 암기법]';
  if (/^[-•*]\s/.test(t)) return '불릿';
  if (/^\(.*\)$/.test(t)) return '괄호 주석 줄';
  if (/^[=∴→]/.test(t)) return '계산 이어짐 (= ∴ →)';
  if (/[=]/.test(t) && !/:/.test(t)) return '수식 줄';
  if (/^\s+\S/.test(line)) return '들여쓴 줄';
  if (!/:/.test(t)) return '콜론 없는 산문';
  return '그 밖';
}

/** 한 조각을 옮긴다. 못 옮기면 null. */
function convertChunk(lines, allowFormula = true) {
  if (!lines.length) return { md: '', kind: 'empty' };

  if (allowFormula && lines.every(isFormulaLine)) {
    const katex = toKatexBlock(lines.join('\n'));
    if (katex) return { md: katex, kind: 'formula' };
  }
  const table = asAlignedTable(lines);
  if (table) return { md: table, kind: 'table' };
  const kv = asKeyValueList(lines);
  if (kv === null) {
    const bad = (lines.find((l) => !KEY_VALUE.test(l.replace(/^\s*[-•*]\s+/, ''))) ?? lines[0]);
    return reject(shapeOf(bad), bad.trim());
  }
  return { md: kv, kind: 'list' };
}

function convert(content) {
  const chunks = content.split(/\n\s*\n/).map((c) => c.split('\n').filter((l) => l.trim())).filter((c) => c.length);
  if (!chunks.length) return null;

  const run = (allowFormula) => {
    const parts = [];
    for (const chunk of chunks) {
      const r = convertChunk(chunk, allowFormula);
      if (r === null) return null;   // 조각 하나라도 실패하면 통째로 포기
      parts.push(r);
    }
    return parts;
  };

  let parts = run(true);
  if (!parts) return null;
  // 나란한 조각이 목록과 수식으로 갈리면 한 블록 안에서 같은 것이 다르게 보인다
  // (양도소득세 1~2단계는 목록, 3~5단계는 KaTeX 로 갈렸다). 목록으로 통일한다.
  const kinds = new Set(parts.map((p) => p.kind));
  if (kinds.has('list') && kinds.has('formula')) {
    parts = run(false);
    if (!parts) return null;
  }
  return parts.length ? parts.map((p) => p.md).join('\n\n') : null;
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
if (args.includes('--why')) {
  console.log('거부 사유:');
  for (const [why, n] of [...rejects].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(5)}  ${why}  — 예: ${SAMPLES.get(why)?.slice(0, 60)}`);
  }
  console.log();
}
for (const p of previews) {
  console.log(`▶ ${p.path}`);
  console.log('--- before ---'); console.log(p.before);
  console.log('--- after ----'); console.log(p.after); console.log();
}

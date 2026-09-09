#!/usr/bin/env node
// 선 그림으로 그린 도식을 마크다운 구조로 옮긴다.
//
// `diagram` 으로 분류된 172개는 한 덩어리가 아니다. 세 가지는 도식이 아니라
// **선 문자로 그린 표·목록**이고, 그래서 컴포넌트가 아니라 마크다운으로 나가야 한다:
//
//   박스 표   ┌──┬──┐ 로 그린 표          → 마크다운 표 (52)
//   트리     ├── └── 로 그린 계층          → 중첩 목록 (40)
//   사다리   ───── 로 소계를 그은 손익계산 → 목록, 소계는 굵게 (22)
//
// 나머지 58개는 진짜 그림이다(상자그림, 좌표축). 손대지 않는다.
//
// 왜 이걸 먼저 하나 — 표는 `<table>` 로 나가야 표로 읽힌다. `<pre>` 안의 ┌─┬─┐ 는
// 사람 눈에만 표이고, 모바일에서는 가로로 넘친다.
//
// 사용:
//   node scripts/migrate-codeblock-diagrams.mjs --kind box --show 3
//   node scripts/migrate-codeblock-diagrams.mjs --write
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { escapeMdx } from './lib/mdx-escape.mjs';
import { extractUntaggedBlocks } from './lib/codeblock-classify.mjs';

const ROOT = 'src/content/blog';
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const WRITE = args.includes('--write');
const SHOW_SKIPS = args.includes('--skips');
const wantCategory = opt('category');
const wantLocale = opt('locale');
const wantSeries = opt('series');
const wantKind = opt('kind');
const LIMIT = Number(opt('show', 4));

const cell = (s) => escapeMdx(s.trim().replace(/\|/g, '\\|'));
const BORDER = /^[┌├└╔╠╚][─━═┬┼┴╦╬╩\s]*[┐┤┘╗╣╝]?\s*$/;
const RULE = /^[─━=_]{5,}$/;

/** ┌──┬──┐ 로 그린 표 → 마크다운 표. */
function fromBoxTable(lines) {
  const rows = [];
  let separatorAt = -1;
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (BORDER.test(t)) {
      // ├──┼──┤ 는 머리글과 본문을 가르는 줄이다. 위아래 테두리와 구별한다.
      if (/^├/.test(t) && rows.length) separatorAt = rows.length;
      continue;
    }
    if (!/│/.test(t) && !/\|/.test(t)) return null;
    const cells = t.split(/[│|]/).slice(1, -1).map((c) => c.trim());
    if (!cells.length) return null;
    // 첫 칸이 비면 새 행이 아니라 윗 행의 이어짐이다 — 칸 안에서 줄이 접힌 것이다.
    if (rows.length && cells[0] === '') {
      const prev = rows[rows.length - 1];
      if (prev.length !== cells.length) return null;
      cells.forEach((c, i) => { if (c) prev[i] = `${prev[i]} ${c}`.trim(); });
      continue;
    }
    rows.push(cells);
  }
  if (rows.length < 2) return null;
  const width = rows[0].length;
  if (width < 2 || !rows.every((r) => r.length === width)) return null;
  // 구분선이 없으면 머리글이 없는 것이다. 첫 행을 올리면 자료 한 줄이 사라진다.
  if (separatorAt !== 1) return null;

  const [head, ...body] = rows;
  return [
    `| ${head.map(cell).join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...body.map((r) => `| ${r.map(cell).join(' | ')} |`),
  ].join('\n');
}

/** ├── └── 로 그린 계층 → 중첩 목록. */
function fromTree(lines) {
  const BRANCH = /^([\s│]*)(?:[├└][─━]+)\s*(\S.*)$/;
  // 들여쓰기 폭은 글마다 다르다 — `│   ` 네 칸도 있고 `  ├─ ` 두 칸도 있다.
  // 폭을 상수로 박으면 두 칸짜리 트리가 통째로 한 단계 밀린다. 실제로 쓰인
  // 폭들을 모아 순서를 매기고, 그 순위를 단계로 삼는다.
  const widths = [...new Set(lines
    .map((l) => BRANCH.exec(l))
    .filter(Boolean)
    .map((m) => m[1].replace(/\t/g, '    ').length))].sort((a, b) => a - b);
  if (widths.length > 6) return null;

  const out = [];
  let root = null;
  for (const line of lines) {
    if (!line.trim()) continue;
    const m = BRANCH.exec(line);
    if (!m) {
      // 가지가 시작되기 전 한 줄은 뿌리다.
      if (out.length || root) return null;
      if (/[├└─│]/.test(line)) return null;
      root = line.trim();
      continue;
    }
    const depth = widths.indexOf(m[1].replace(/\t/g, '    ').length);
    out.push(`${'  '.repeat(depth)}- ${escapeMdx(m[2].trim())}`);
  }
  if (out.length < 2) return null;
  return root ? `**${escapeMdx(root)}**\n\n${out.join('\n')}` : out.join('\n');
}

/** ───── 로 소계를 그은 계산 사다리 → 목록. 선 다음 줄은 소계이므로 굵게. */
function fromRuleLadder(lines) {
  const out = [];
  let afterRule = false;
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (RULE.test(t)) { afterRule = true; continue; }
    if (/[│┌┐└┘├┤┬┴┼]/.test(t)) return null;    // 선 그림이 섞이면 그림이다
    // 줄머리의 ASCII `-` 는 뺄셈인데, 목록 항목 안에서는 `- - x` 가 되어
    // 중첩 불릿으로 파싱된다. 조판용 마이너스로 바꿔 그 충돌을 없앤다.
    const body = escapeMdx(t.replace(/^-(?=\s)/, '−'));
    out.push(afterRule ? `- **${body}**` : `- ${body}`);
    afterRule = false;
  }
  if (out.length < 3) return null;
  if (!out.some((l) => l.startsWith('- **'))) return null;   // 소계가 없으면 사다리가 아니다
  return out.join('\n');
}

function convert(content) {
  const lines = content.split('\n').map((l) => l.replace(/\s+$/, ''));
  const nonEmpty = lines.filter((l) => l.trim());
  if (!nonEmpty.length) return null;

  if (nonEmpty.some((l) => BORDER.test(l.trim())) && nonEmpty.some((l) => /│.*│/.test(l))) {
    const md = fromBoxTable(lines);
    return md && (!wantKind || wantKind === 'box') ? { md, kind: 'box' } : null;
  }
  if (nonEmpty.filter((l) => /[├└][─━]/.test(l)).length >= 2) {
    const md = fromTree(lines);
    return md && (!wantKind || wantKind === 'tree') ? { md, kind: 'tree' } : null;
  }
  if (nonEmpty.some((l) => RULE.test(l.trim()))) {
    const md = fromRuleLadder(lines);
    return md && (!wantKind || wantKind === 'ladder') ? { md, kind: 'ladder' } : null;
  }
  return null;
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

const counts = new Map();
let converted = 0, skipped = 0, touched = 0;
const previews = [];

for (const path of walk(ROOT)) {
  const locale = path.split('/')[3];
  if (wantLocale && locale !== wantLocale) continue;
  let text = readFileSync(path, 'utf8');
  if (wantCategory && fm(text, 'category') !== wantCategory) continue;
  if (wantSeries && fm(text, 'series') !== wantSeries) continue;

  const blocks = extractUntaggedBlocks(text);
  if (!blocks.length) continue;

  let changed = false;
  for (const block of [...blocks].reverse()) {
    const r = convert(block.content);
    if (!r) {
      skipped += 1;
      if (SHOW_SKIPS && previews.length < LIMIT && /[│├└┌┐┘─]/.test(block.content)) {
        previews.push({ path, before: block.content.trim(), after: '(건너뜀)' });
      }
      continue;
    }
    counts.set(r.kind, (counts.get(r.kind) ?? 0) + 1);
    if (!SHOW_SKIPS && previews.length < LIMIT) previews.push({ path, before: block.content.trim(), after: r.md });
    text = `${text.slice(0, block.start)}${r.md}${text.slice(block.end)}`;
    converted += 1; changed = true;
  }
  if (changed) { touched += 1; if (WRITE) writeFileSync(path, text); }
}

console.log(`선 그림 → 표·목록 ${WRITE ? '(적용)' : '(미적용 · --write 로 반영)'}`);
console.log(`변환 ${converted} (${[...counts].map(([k, n]) => `${k} ${n}`).join(' · ')}) · 건너뜀 ${skipped} · 문서 ${touched}\n`);
for (const p of previews) {
  console.log(`▶ ${p.path}`);
  console.log('--- before ---'); console.log(p.before);
  console.log('--- after ----'); console.log(p.after); console.log();
}

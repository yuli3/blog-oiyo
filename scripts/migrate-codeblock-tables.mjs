#!/usr/bin/env node
// 표가 담긴 코드펜스를 마크다운 표로 옮긴다.
//
// 왜 표를 먼저 하나 — 2026-09-09 GSC 기준 blog 는 90일 인상 3,153·클릭 141 로
// 순위를 지킬 페이지가 없다. 그래서 "트래픽이 많은 문서부터"가 아니라
// "구글이 무엇을 추출할 수 있나"로 순서를 정했고, `<pre>` 안의 정렬된 텍스트는
// 사람 눈에만 표다. `<table>` 로 나가야 표로 읽힌다.
//
// 함정은 **표처럼 생겼지만 표가 아닌 것**이다. 공백 두 칸으로 열이 갈리고 줄마다
// 열 수가 같다는 조건만 보면 골든크로스 ASCII 도식과 `라벨: 수식` 목록이 함께
// 걸린다. 셋을 가른다:
//   1. 선 그림 문자(─ │ \ /)가 섞이면 도식이다 — 손대지 않는다
//   2. 대부분의 줄이 `라벨: 수식` 이면 수식 목록이다 — KaTeX 담당이다
//   3. 머리글 줄을 못 찾으면 표로 만들지 않는다. 마크다운 표는 머리글이 필수라
//      아무 줄이나 올리면 첫 데이터 행이 사라진다
//
// 사용:
//   node scripts/migrate-codeblock-tables.mjs --locale ko --category Tax
//   node scripts/migrate-codeblock-tables.mjs --write
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
const LIMIT = Number(opt('show', 4));

// 선 그림·화살표 그림이 섞인 줄. 하나라도 있으면 도식으로 본다.
const ART = /[│├└┌┐┘─━╌┈↗↘⟶]|[\\\/]{1,}\s*$|^\s*[\\\/]/;
// "Sharpe Ratio:      Sharpe = (Rp - Rf) / σp" 처럼 라벨 뒤가 수식인 줄.
const LABELLED_FORMULA = /^[^:]{1,40}:\s+\S.*[=＝]/;
// 값처럼 보이는 칸 — 숫자·통화·비율·기호.
const LOOKS_LIKE_VALUE = /[0-9%$€£¥₩✓✗×○△]|\b(?:yes|no|n\/a)\b/i;

export const why = new Map();
const no = (r) => { why.set(r, (why.get(r) ?? 0) + 1); return null; };

const cell = (s) => escapeMdx(s.trim().replace(/\|/g, '\\|'));

/**
 * 머리글 줄을 찾는다. 첫 줄에 값이 없고 아래 줄 과반에 값이 있으면 머리글이다.
 * 못 찾으면 null — 표로 만들지 않는다.
 */
function hasHeader(rows) {
  const [head, ...body] = rows;
  if (head.some((c) => LOOKS_LIKE_VALUE.test(c))) return false;
  if (head.some((c) => c.trim().length > 30)) return false;
  const withValue = body.filter((r) => r.some((c) => LOOKS_LIKE_VALUE.test(c))).length;
  return withValue >= Math.ceil(body.length / 2);
}

function convert(content) {
  const raw = content.split('\n').filter((l) => l.trim());
  if (raw.length < 3) return no('3줄 미만');
  if (raw.some((l) => ART.test(l))) return no('선 그림');
  const formulaRows = raw.filter((l) => LABELLED_FORMULA.test(l.trim())).length;
  if (formulaRows >= raw.length / 2) return no('수식 목록');

  // 열은 공백 두 칸으로만 가른다. 콜론으로 가르면 `AUC ≥ 0.9: 우수` 같은
  // 정의 목록이 머리글 없는 표가 된다 — 그건 정의 변환기 몫이다.
  const rows = raw.map((l) => l.trim().split(/\s{2,}/));
  const width = rows[0].length;
  if (width < 2) return no('열이 하나');
  if (!rows.every((r) => r.length === width)) return no('줄마다 열 수가 다름');
  if (rows.some((r) => r.some((c) => !c.trim()))) return no('빈 칸');

  // 열 수만 세면 어긋난 정렬도 통과한다 — ICC 표는 머리글 6칸에 본문 7칸이
  // 몰려 첫 칸이 "ICC (A) ✓" 가 됐다. 칸이 시작하는 자리까지 맞는지 본다.
  // 폭은 문자 수가 아니라 **표시 폭**으로 잰다 — 한글·한자는 두 칸을 차지하므로
  // 인덱스로 재면 CJK 표가 전부 어긋난 것으로 보인다.
  const widthOf = (s) => [...s].reduce((a, ch) => a + (/[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]/.test(ch) ? 2 : 1), 0);
  const offsets = raw.map((l) => {
    const out = []; let i = 0;
    for (const c of l.trim().split(/\s{2,}/)) { i = l.indexOf(c, i); out.push(widthOf(l.slice(0, i))); i += c.length; }
    return out;
  });
  for (let col = 1; col < width; col += 1) {
    const at = offsets.map((o) => o[col]);
    if (Math.max(...at) - Math.min(...at) > 3) return no('열 위치 어긋남');
  }

  if (!hasHeader(rows)) return no('머리글 없음');

  const [head, ...body] = rows;
  return [
    `| ${head.map(cell).join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...body.map((r) => `| ${r.map(cell).join(' | ')} |`),
  ].join('\n');
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

  const blocks = extractUntaggedBlocks(text);
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

console.log(`정렬된 텍스트 → 마크다운 표 ${WRITE ? '(적용)' : '(미적용 · --write 로 반영)'}`);
console.log(`변환 ${converted} · 표가 아니어서 건너뜀 ${skipped} · 문서 ${touched}\n`);
if (args.includes('--why')) { console.log('거부 사유:', [...why].sort((a,b)=>b[1]-a[1])); console.log(); }
for (const p of previews) {
  console.log(`▶ ${p.path}`);
  console.log('--- before ---'); console.log(p.before);
  console.log('--- after ----'); console.log(p.after); console.log();
}

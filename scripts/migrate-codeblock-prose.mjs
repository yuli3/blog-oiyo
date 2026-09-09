#!/usr/bin/env node
// 산문만 담긴 코드펜스를 본문으로 꺼낸다.
//
// 남은 2,460개 중 절반이 이 모양이다 — 목록도 수식도 도식도 아닌, 그냥 검은
// 상자에 갇힌 글이다. `<pre>` 안에서는 고정폭으로 찍히고 줄바꿈이 되지 않으며,
// 본문이 아니라 코드로 읽힌다.
//
// 두 가지로 나눠 담는다(세운 결정 2026-09-09):
//   캡션으로 시작하는 블록 → <HighlightBox title="캡션">. 강의 원고에서 예시를
//       본문과 떼어 두려던 의도가 살아 있으므로 그 구분을 지킨다.
//   표지 없는 블록        → 평범한 문단. 상자로 감쌀 이유가 없다.
//
// 안전 규칙은 하나다 — **산문이 아닌 것이 한 줄이라도 섞이면 건드리지 않는다.**
// 목록·수식·화살표는 각자의 변환기 몫이고, 여기서 삼키면 구조가 사라진다.
//
// 사용:
//   node scripts/migrate-codeblock-prose.mjs --kind box --show 3
//   node scripts/migrate-codeblock-prose.mjs --write
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { escapeMdx } from './lib/mdx-escape.mjs';
import { extractUntaggedBlocks, isFormulaLine } from './lib/codeblock-classify.mjs';

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

const CAPTION = /^[^=\n]{1,60}:\s*$/;
const ITEM = /^\s*(?:[-•*→▶⇒↳]|\d+[.)]|[①-⑳])\s/;
const ART = /[│┌┐└┘├┤┬┴┼─━╌┈]/;
// "미시경제학: 개인·기업의 의사결정" 처럼 낱말과 뜻이 콜론으로 붙은 줄.
const TERM = /^([^:\n]{1,40}):\s+(\S.*)$/;

/** 한 줄을 본문 한 줄로. 용어가 앞에 서면 굵게 세운다. */
function proseLine(raw) {
  const t = raw.trim();
  const m = TERM.exec(t);
  if (m && !/[.!?。]/.test(m[1])) {
    return `**${escapeMdx(m[1].trim())}**: ${escapeMdx(m[2].trim())}`;
  }
  return escapeMdx(t);
}

/**
 * 산문 덩이 → 문단. 원문에서 줄이 나뉜 데는 이유가 있으므로 줄바꿈을 지킨다.
 * 다만 소문자로 이어지는 줄은 접힌 문장이므로 앞줄에 붙인다.
 */
function paragraphs(lines) {
  const blocks = [];
  let cur = [];
  for (const line of lines) {
    if (!line.trim()) { if (cur.length) { blocks.push(cur); cur = []; } continue; }
    if (cur.length && /^\s+[a-z]/.test(line)) { cur[cur.length - 1] += ` ${line.trim()}`; continue; }
    cur.push(line);
  }
  if (cur.length) blocks.push(cur);
  return blocks
    .map((b) => b.map(proseLine).join('  \n'))   // 두 칸 + 줄바꿈 = 유지되는 줄바꿈
    .join('\n\n');
}

function convert(content) {
  const lines = content.split('\n').map((l) => l.replace(/\s+$/, ''));
  const body = lines.filter((l) => l.trim());
  if (!body.length) return null;
  if (body.some((l) => ART.test(l))) return null;               // 도식
  if (body.some((l) => ITEM.test(l))) return null;              // 목록은 목록 변환기 몫
  if (body.some((l) => isFormulaLine(l))) return null;          // 수식은 KaTeX 몫
  if (body.some((l) => /^\s*=/.test(l))) return null;           // 계산 사다리·스프레드시트
  // 수학 기호가 있으면 산문이 아니다. 문단으로 꺼내면 식이 본문에 섞인다.
  if (body.some((l) => /[←→⇐⇒∂∑∏√∫≈≠≤≥±∞]/.test(l) && /[=×÷·]/.test(l))) return null;

  // 공백 두 칸으로 열이 갈리고 줄마다 열 수가 같으면 눈에는 표다. HTML 은 연속
  // 공백을 하나로 접으므로, 문단으로 꺼내는 순간 정렬이 사라진다
  // ("High        →    Low" → "High → Low"). 표 변환기 몫으로 남긴다.
  // 열 수를 세는 것만으로는 모자랐다 — "Train Error:   High   →   Low" 는 줄마다
  // 칸 수가 달라 통과했고, 문단으로 꺼내자 정렬이 통째로 사라졌다. 줄 **안쪽**에
  // 공백이 두 칸 이상 있으면 그 공백이 배치를 하고 있다는 뜻이다.
  const aligned = body.filter((l) => /\S {2,}\S/.test(l)).length;
  if (aligned >= Math.ceil(body.length * 0.4)) return null;

  // 화살표가 한 줄 안에서 두 번 이상 이어지면 사슬이다. 문단으로 꺼내도 글자는
  // 남지만 단계라는 사실이 사라진다 — StepFlow 몫으로 남긴다.
  if (body.some((l) => (l.match(/[→⇒▶]/g) ?? []).length >= 2)) return null;

  // 캡션이 둘 이상이면 덩이가 여러 개다. 하나로 감싸면 두 번째 캡션이 상자 안의
   // 평범한 줄로 내려앉는다("Training" 상자 안에 "Generation:" 이 남았다).
  if (body.filter((l) => CAPTION.test(l.trim())).length > 1) return null;

  const hasCaption = CAPTION.test(body[0].trim()) && body.length > 1;
  const kind = hasCaption ? 'box' : 'text';
  if (wantKind && wantKind !== kind) return null;

  if (!hasCaption) {
    const md = paragraphs(lines);
    return md ? { md, kind } : null;
  }

  const title = body[0].trim().replace(/:\s*$/, '');
  // 큰따옴표는 JSX 속성을 닫아 버린다.
  if (/["{}<>]/.test(title)) return null;
  const rest = paragraphs(lines.slice(lines.indexOf(body[0]) + 1));
  if (!rest) return null;
  return { md: `<HighlightBox title="${title}">\n\n${rest}\n\n</HighlightBox>`, kind };
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
      if (SHOW_SKIPS && previews.length < LIMIT) previews.push({ path, before: block.content.trim(), after: '(건너뜀)' });
      continue;
    }
    counts.set(r.kind, (counts.get(r.kind) ?? 0) + 1);
    if (!SHOW_SKIPS && previews.length < LIMIT) previews.push({ path, before: block.content.trim(), after: r.md });
    text = `${text.slice(0, block.start)}${r.md}${text.slice(block.end)}`;
    converted += 1; changed = true;
  }
  if (changed) { touched += 1; if (WRITE) writeFileSync(path, text); }
}

console.log(`산문 → 본문 ${WRITE ? '(적용)' : '(미적용 · --write 로 반영)'}`);
console.log(`변환 ${converted} (${[...counts].map(([k, n]) => `${k} ${n}`).join(' · ')}) · 건너뜀 ${skipped} · 문서 ${touched}\n`);
for (const p of previews) {
  console.log(`▶ ${p.path}`);
  console.log('--- before ---'); console.log(p.before);
  console.log('--- after ----'); console.log(p.after); console.log();
}

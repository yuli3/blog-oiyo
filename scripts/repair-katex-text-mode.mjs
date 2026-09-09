#!/usr/bin/env node
// 이미 옮겨 놓은 $$ 블록에서 낱말이 수식 이탤릭으로 붙어 나오는 것을 고친다.
//
// 첫 배치(940ca83d)에는 라틴 낱말을 \text{} 로 감싸는 처리가 없었다. 그 결과
// `Current Ratio = Current Assets / Current Liabilities` 가 화면에서
// `CurrentRatio = CurrentAssets/CurrentLiabilities` 로 붙어 나온다 — 수식 모드는
// 공백을 버리고 낱자마다 변수 간격을 준다. 한글은 wrapCjk 가 감쌌기 때문에
// 한국어 문서에서는 드러나지 않았고 영어 문서에서만 보였다.
//
// 손으로 쓴 기존 수식은 이미 \text{} 를 제대로 쓰고 있어 이 규칙에 걸리지 않는다.
// 그래도 KaTeX 로 다시 렌더해 보고 통과할 때만 쓴다.
//
// 사용: node scripts/repair-katex-text-mode.mjs [--write]
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { toLatex, rendersInKatex } from './lib/to-katex.mjs';

const ROOT = 'src/content/blog';
const WRITE = process.argv.includes('--write');

function walk(dir) {
  const o = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) o.push(...walk(p));
    else if (/\.mdx?$/.test(name)) o.push(p);
  }
  return o;
}

let fixed = 0, touched = 0, skipped = 0;
const previews = [];

for (const path of walk(ROOT)) {
  const text = readFileSync(path, 'utf8');
  let changed = false;
  const out = text.replace(/^\$\$[ \t]*\n([\s\S]*?)^\$\$[ \t]*$/gm, (whole, body) => {
    // 소문자가 섞인 두 글자 이상 낱말이 \text 밖에 있으면 고칠 거리가 있다.
    const bare = body.replace(/\\text\{[^}]*\}/g, '');
    if (!/[A-Za-z]*[a-z][A-Za-z]+/.test(bare)) return whole;

    // \begin{aligned} 블록은 행 단위로 다룬다. 통째로 건너뛰면 첫 배치에서
    // aligned 로 만든 수식이 영원히 붙어 나온다.
    let next;
    if (/\\begin\{aligned\}/.test(body)) {
      const inner = body.replace(/\\begin\{aligned\}/, '').replace(/\\end\{aligned\}/, '').trim();
      const rows = inner.split(/\\\\\s*\n?/).map((r) => r.trim()).filter(Boolean);
      const rebuilt = rows.map((row) => {
        // 정렬 마커를 떼고 낱말을 감싼 뒤 같은 자리에 다시 붙인다.
        const m = /^(.*?)&(=?)(.*)$/s.exec(row);
        if (!m) return toLatex(row.replace(/\\text\{([^}]*)\}/g, '$1'));
        const lhs = toLatex(m[1].replace(/\\text\{([^}]*)\}/g, '$1'));
        const rhs = toLatex(m[3].replace(/\\text\{([^}]*)\}/g, '$1'));
        if (lhs === null || rhs === null) return null;
        return `${lhs} &${m[2]} ${rhs}`;
      });
      if (rebuilt.some((r) => r === null)) { skipped += 1; return whole; }
      next = `$$\n\\begin{aligned}\n${rebuilt.join(' \\\\\n')}\n\\end{aligned}\n$$`;
    } else {
      const lines = body.split('\n').filter((l) => l.trim());
      const rebuilt = lines.map((l) => toLatex(l.replace(/\\text\{([^}]*)\}/g, '$1')));
      if (rebuilt.some((l) => l === null)) { skipped += 1; return whole; }
      next = `$$\n${rebuilt.join('\n')}\n$$`;
    }
    if (next === whole || !rendersInKatex(next)) { skipped += 1; return whole; }
    if (previews.length < 4) previews.push({ path, before: whole.trim(), after: next });
    fixed += 1; changed = true;
    return next;
  });
  if (changed) { touched += 1; if (WRITE) writeFileSync(path, out); }
}

console.log(`KaTeX 텍스트 모드 보정 ${WRITE ? '(적용)' : '(미적용 · --write 로 반영)'}`);
console.log(`수정 ${fixed} · 건너뜀 ${skipped} · 문서 ${touched}\n`);
for (const p of previews) {
  console.log(`▶ ${p.path}`);
  console.log('--- before ---'); console.log(p.before);
  console.log('--- after ----'); console.log(p.after); console.log();
}

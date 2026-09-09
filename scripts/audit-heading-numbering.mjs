#!/usr/bin/env node
// 제목 번호 체계를 점검한다. 정본은 h2 = `## 1.`, h3 = `### (1)`, h4 = `#### 가.`
//
// 왜 규칙이 필요한가: 같은 시리즈 안에서도 `## 1.` 과 번호 없는 h2 가 섞이면
// 목차가 들쭉날쭉해지고, 독자는 "여기가 몇 번째 절인지"를 스크롤로 세야 한다.
// 2026-09-09 실측으로 blog 전체 h2 20,069개 중 번호가 붙은 것은 5,220개(26%)였다.
//
// SEO 상 번호 자체는 순위 요소가 아니다. 중요한 것은 (1) h1 이 하나일 것,
// (2) 레벨을 건너뛰지 않을 것(h2 다음에 바로 h4 가 오지 않을 것), (3) 제목에
// 실질 키워드가 남을 것이다. 그래서 이 감사는 번호와 함께 **계층 건너뜀**을 센다.
//
// 사용:
//   node scripts/audit-heading-numbering.mjs --category Economics --locale ko
//   node scripts/audit-heading-numbering.mjs --category Economics --locale ko --detail
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'src/content/blog';
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const DETAIL = args.includes('--detail');
const wantCategory = opt('category');
const wantLocale = opt('locale');

/** 레벨별 정본 표기. h5 이하는 본문에서 쓰지 않는다. */
export const STYLE = {
  2: { name: '1.', re: /^\d+\.\s+\S/ },
  3: { name: '(1)', re: /^\(\d+\)\s+\S/ },
  4: { name: '가.', re: /^[가-힣]\.\s+\S/ },
};

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

/** 코드펜스 안의 `#` 은 제목이 아니다. 펜스 구간을 먼저 지운다. */
function stripFences(text) {
  return text.replace(/^```[\s\S]*?^```[ \t]*$/gm, (m) => m.replace(/[^\n]/g, ' '));
}

let files = 0, ok = 0, wrong = 0, missing = 0, skips = 0;
const detail = [];

for (const path of walk(ROOT)) {
  const locale = path.split('/')[3];
  if (wantLocale && locale !== wantLocale) continue;
  const text = readFileSync(path, 'utf8');
  if (wantCategory && fm(text, 'category') !== wantCategory) continue;
  files += 1;

  const body = stripFences(text);
  const heads = [...body.matchAll(/^(#{2,6})[ \t]+(.+)$/gm)].map((m) => ({ level: m[1].length, text: m[2].trim() }));
  let prev = 1;
  const bad = [];
  for (const h of heads) {
    if (h.level > prev + 1) { skips += 1; bad.push(`h${prev}→h${h.level} 건너뜀: ${h.text.slice(0, 40)}`); }
    prev = h.level;
    const style = STYLE[h.level];
    if (!style) continue;
    if (style.re.test(h.text)) { ok += 1; continue; }
    // 번호가 아예 없는 것과 다른 번호를 쓴 것을 구분한다 — 고치는 손이 다르다.
    if (/^(\(?\d+[.)]|[가-힣]\.|[①-⑳])/.test(h.text)) { wrong += 1; bad.push(`h${h.level} 표기 불일치(정본 ${style.name}): ${h.text.slice(0, 40)}`); }
    else { missing += 1; bad.push(`h${h.level} 번호 없음(정본 ${style.name}): ${h.text.slice(0, 40)}`); }
  }
  if (bad.length && DETAIL) detail.push({ path, bad });
}

const total = ok + wrong + missing;
console.log('heading numbering audit — 정본 h2 `1.` · h3 `(1)` · h4 `가.`');
console.log(`문서 ${files}개 · 대상 제목 ${total}개`);
console.log(`  정본 일치      ${ok} (${total ? Math.round((ok * 100) / total) : 0}%)`);
console.log(`  다른 번호 표기  ${wrong}`);
console.log(`  번호 없음      ${missing}`);
console.log(`  계층 건너뜀    ${skips}${skips ? '  ← SEO·접근성에서 실제로 문제되는 것' : ''}`);

for (const d of detail.slice(0, 12)) {
  console.log(`\n▶ ${d.path}`);
  for (const b of d.bad.slice(0, 6)) console.log(`   ${b}`);
}

#!/usr/bin/env node
// 제목 앞머리에 손으로 적힌 절 번호를 걷어낸다. 번호는 CSS 카운터가 그린다.
//
// 왜 걷어내는가: 카운터를 켜면 `### 1. 효율성` 이 `(1) 1. 효율성` 으로 번호가 둘이
// 된다. 정본을 CSS 로 옮기는 이상 본문에 남은 번호는 중복이다.
//
// 슬러그가 바뀌는 것은 이쪽도 마찬가지지만 규모가 다르다 — 걷어낼 제목은
// 7,216개고, 반대로 본문에 번호를 붙이는 방식은 24,809개를 건드린다(2026-09-09 실측).
// 게다가 이쪽은 **한 번으로 끝난다**. 앞으로 절을 넣고 빼도 번호는 CSS 가 다시 센다.
//
// 사용:
//   node scripts/migrate-heading-strip-numbers.mjs --category Economics --locale ko
//   node scripts/migrate-heading-strip-numbers.mjs --category Economics --locale ko --write
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'src/content/blog';
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const WRITE = args.includes('--write');
const wantCategory = opt('category');
const wantLocale = opt('locale');
const LIMIT = Number(opt('show', 8));

// 앞머리 번호만 지운다. `제25장.` 처럼 뜻이 있는 번호는 rehype 가 data-nonum 으로
// 빼주므로 여기서도 남긴다 — 지우면 "케인즈의 유효수요이론" 만 남아 몇 장인지 잃는다.
const LEADING_NUMBER = /^(\(\d+\)|\d+[.)]|[가-힣]\.|[①-⑳]|\d+-\d+\.?)\s+/;
const SEMANTIC = /^(?:제\s*\d+\s*(?:장|편|차|주차|일차))/;

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

function fenceRanges(text) {
  const r = [];
  const re = /^```[\s\S]*?^```[ \t]*$/gm;
  let m;
  while ((m = re.exec(text)) !== null) r.push([m.index, m.index + m[0].length]);
  return r;
}

let changed = 0, touched = 0;
const previews = [];

for (const path of walk(ROOT)) {
  const locale = path.split('/')[3];
  if (wantLocale && locale !== wantLocale) continue;
  const text = readFileSync(path, 'utf8');
  if (wantCategory && fm(text, 'category') !== wantCategory) continue;

  const fences = fenceRanges(text);
  const inFence = (i) => fences.some(([a, b]) => i >= a && i < b);
  let n = 0;
  const out = text.replace(/^(#{2,4})[ \t]+(.+)$/gm, (whole, hashes, title, offset) => {
    if (inFence(offset)) return whole;
    if (SEMANTIC.test(title.trim())) return whole;
    const bare = title.replace(LEADING_NUMBER, '').trim();
    if (!bare || bare === title.trim()) return whole;
    n += 1;
    if (previews.length < LIMIT) previews.push(`${whole}  →  ${hashes} ${bare}`);
    return `${hashes} ${bare}`;
  });
  if (!n) continue;
  changed += n; touched += 1;
  if (WRITE) writeFileSync(path, out);
}

console.log(`제목 앞 번호 제거 ${WRITE ? '(적용)' : '(미적용 · --write 로 반영)'}`);
console.log(`제목 ${changed}개 · 문서 ${touched}개 — 번호는 CSS 카운터가 그립니다\n`);
for (const p of previews.slice(0, 6)) console.log(`  ${p}`);

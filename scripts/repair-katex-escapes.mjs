#!/usr/bin/env node
// 수식 안의 이스케이프·괄호 오염을 되돌린다.
//
// 첫 보정 실행이 이미 `\%` 인 것을 다시 감싸 `\\%` 로 만들었다. aligned 안에서
// `\\` 는 행 바꿈이라 백분율 기호만 다음 줄로 떨어진다. 변환기는 이후 멱등하게
// 고쳤지만, 이미 쓰인 파일은 이 스크립트로 되돌린다.
//
// 사용: node scripts/repair-katex-escapes.mjs [--write]
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const WRITE = process.argv.includes('--write');
function walk(dir) {
  const o = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) o.push(...walk(p));
    else if (/\.mdx?$/.test(n)) o.push(p);
  }
  return o;
}

let files = 0, hits = 0;
for (const path of walk('src/content/blog')) {
  const text = readFileSync(path, 'utf8');
  // $$ 블록 안에서만 고친다. 본문의 `\\` 는 다른 뜻일 수 있다.
  let n = 0;
  const out = text.replace(/^\$\$[ \t]*\n[\s\S]*?^\$\$[ \t]*$/gm, (block) => block
    .replace(/\\\\([%$&])/g, (_, c) => { n += 1; return `\\${c}`; })
    // 초기 wrapCjk 가 CJK 덩어리에 괄호를 포함시켜 닫는 괄호만 빨려 들어갔다.
    // `\text{손실 합계)}` → `\text{손실 합계})` 로 짝을 되돌린다.
    .replace(/(\\text\{[^}()]*)\)\}/g, (_, head) => { n += 1; return `${head}})`; }));
  if (!n) continue;
  files += 1; hits += n;
  if (WRITE) writeFileSync(path, out);
}
console.log(`이중 이스케이프 되돌리기 ${WRITE ? '(적용)' : '(미적용)'}: ${hits}곳 · 문서 ${files}개`);

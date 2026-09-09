#!/usr/bin/env node
// 언어 태그가 빠진 **진짜 코드** 블록에 태그를 단다.
//
// 남은 블록을 전부 "컴포넌트로 옮길 산문"으로 보면 틀린다. academy-python-basics
// 챕터의 블록은 실제 파이썬 코드와 그 실행 결과다. 코드에는 검은 상자가 맞는
// 표현이고, 필요한 것은 언어 태그뿐이다 — 태그를 달면 shiki 가 문법을 강조해
// 지금의 흰 글씨 덩어리보다 오히려 잘 읽힌다.
//
// 코드 바로 뒤에 오는 결과 블록에는 ```text 를 단다. 강조할 문법이 없는데
// 파이썬으로 칠하면 엉뚱한 색이 붙는다.
//
// 사용: node scripts/migrate-codeblock-tag-language.mjs [--write]
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { extractUntaggedBlocks } from './lib/codeblock-classify.mjs';
import { detectLanguage, looksLikeOutput } from './lib/detect-code-language.mjs';

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const LIMIT = 3;

function walk(dir) {
  const o = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) o.push(...walk(p));
    else if (/\.mdx?$/.test(n)) o.push(p);
  }
  return o;
}

let tagged = 0, outputs = 0, touched = 0;
const previews = [];

for (const path of walk('src/content/blog')) {
  let text = readFileSync(path, 'utf8');
  const blocks = extractUntaggedBlocks(text);
  if (!blocks.length) continue;

  // 앞에서부터 언어를 정해 두고, 뒤에서부터 써 넣는다(오프셋 보존).
  const plan = [];
  let prevLang = null;
  for (const b of blocks) {
    const lang = detectLanguage(b.content);
    if (lang) { plan.push({ b, lang }); prevLang = lang; continue; }
    // 코드 바로 다음에 오는 짧고 기호 없는 블록은 그 코드의 출력이다.
    if (prevLang && looksLikeOutput(b.content)) { plan.push({ b, lang: 'text', output: true }); continue; }
    prevLang = null;
  }
  if (!plan.length) continue;

  for (const { b, lang, output } of [...plan].reverse()) {
    const next = `\`\`\`${lang}\n${b.content.replace(/\n+$/, '')}\n\`\`\``;
    if (previews.length < LIMIT) previews.push({ path, lang, sample: b.content.trim().split('\n').slice(0, 12).join('\n') });
    text = `${text.slice(0, b.start)}${next}${text.slice(b.end)}`;
    if (output) outputs += 1; else tagged += 1;
  }
  touched += 1;
  if (WRITE) writeFileSync(path, text);
}

console.log(`언어 태그 부여 ${WRITE ? '(적용)' : '(미적용 · --write 로 반영)'}`);
console.log(`코드 ${tagged} · 실행 결과(text) ${outputs} · 문서 ${touched}\n`);
for (const p of previews) console.log(`▶ [${p.lang}] ${p.path.split('/').slice(-2).join('/')}\n${p.sample}\n`);

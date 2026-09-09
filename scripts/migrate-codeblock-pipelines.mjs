#!/usr/bin/env node
// 한 줄짜리 파이프라인을 <StepFlow> 로 옮긴다.
//
// 조사에서 "흐름" 으로 묶인 것은 218개였지만, 실물을 보면 대부분 단계가 아니다 —
// `→` 가 산문 안의 인과 표시로 쓰인 설명문이고, 카드로 쪼개면 문장이 부서진다.
// 진짜 파이프라인은 **한 줄에 마디가 셋 이상 이어진 것**뿐이다:
//
//   Collection → Storage → Processing → Analysis → Visualization → Decision
//   FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY
//
// 이건 StepFlow 가 정확히 그리려고 만든 모양이다. 수가 적어(25개 남짓) 자동화의
// 이득은 크지 않지만, 손으로 고치면 파일마다 형식이 갈린다.
//
// 건드리지 않는 것:
//   논리 기호(A → B → C, ¬P → ⊥)는 단계가 아니라 함의다 — 수식 몫이다
//   대괄호로 묶인 마디([스프린트 계획 → 개발] × N)는 쪼개면 묶음이 깨진다
//
// 사용:
//   node scripts/migrate-codeblock-pipelines.mjs --show 5
//   node scripts/migrate-codeblock-pipelines.mjs --write
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { extractUntaggedBlocks } from './lib/codeblock-classify.mjs';

const ROOT = 'src/content/blog';
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const WRITE = args.includes('--write');
const SHOW_SKIPS = args.includes('--skips');
const wantLocale = opt('locale');
const LIMIT = Number(opt('show', 5));

// 논리 기호가 섞이면 파이프라인이 아니라 함의식이다.
const LOGIC = /[¬⊥∧∨∀∃⊢≡]|^[A-Z](\s*→\s*[A-Z])+$/;
const GROUPED = /[[\]{}]/;   // 묶인 마디는 쪼갤 수 없다

function convert(content) {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length !== 1) return null;
  const line = lines[0].trim();
  if (LOGIC.test(line) || GROUPED.test(line)) return null;

  const nodes = line.split(/\s*[→⇒▶]\s*/).map((n) => n.trim()).filter(Boolean);
  if (nodes.length < 3 || nodes.length > 8) return null;
  // 마디가 길면 단계 이름이 아니라 문장이다.
  if (nodes.some((n) => n.length > 30 || /[.!?。]/.test(n))) return null;
  // 큰따옴표는 JSX 속성을, 중괄호는 표현식을 깨뜨린다.
  if (nodes.some((n) => /["'{}<>]/.test(n))) return null;

  const items = nodes.map((n) => `    { title: "${n}" },`).join('\n');
  return `<StepFlow\n  items={[\n${items}\n  ]}\n/>`;
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

let converted = 0, skipped = 0, touched = 0;
const previews = [];

for (const path of walk(ROOT)) {
  const locale = path.split('/')[3];
  if (wantLocale && locale !== wantLocale) continue;
  let text = readFileSync(path, 'utf8');

  const blocks = extractUntaggedBlocks(text);
  if (!blocks.length) continue;

  let changed = false;
  for (const block of [...blocks].reverse()) {
    const md = convert(block.content);
    if (!md) {
      skipped += 1;
      if (SHOW_SKIPS && previews.length < LIMIT && /[→⇒▶]/.test(block.content)) {
        previews.push({ path, before: block.content.trim(), after: '(건너뜀)' });
      }
      continue;
    }
    if (!SHOW_SKIPS && previews.length < LIMIT) previews.push({ path, before: block.content.trim(), after: md });
    text = `${text.slice(0, block.start)}${md}${text.slice(block.end)}`;
    converted += 1; changed = true;
  }
  if (changed) { touched += 1; if (WRITE) writeFileSync(path, text); }
}

console.log(`한 줄 파이프라인 → StepFlow ${WRITE ? '(적용)' : '(미적용 · --write 로 반영)'}`);
console.log(`변환 ${converted} · 건너뜀 ${skipped} · 문서 ${touched}\n`);
for (const p of previews) {
  console.log(`▶ ${p.path}`);
  console.log('--- before ---'); console.log(p.before);
  console.log('--- after ----'); console.log(p.after); console.log();
}

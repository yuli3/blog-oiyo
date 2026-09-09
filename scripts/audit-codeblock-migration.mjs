#!/usr/bin/env node
// 태그 없는 코드펜스 현황을 세고, 어떤 컴포넌트로 옮길지 분류해 보고한다.
//
// 이 감사는 래칫이 아니라 진행률 계기다 — 마이그레이션이 진행되면 숫자가
// 내려가야 하고, 새 글이 다시 ``` 로 도식을 감싸면 올라간다.
//
// 사용:
//   node scripts/audit-codeblock-migration.mjs                # 전체 요약
//   node scripts/audit-codeblock-migration.mjs --category Economics --locale ko
//   node scripts/audit-codeblock-migration.mjs --kind formula --show 5
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { classifyBlock, extractUntaggedBlocks, TARGET } from './lib/codeblock-classify.mjs';

const ROOT = 'src/content/blog';
const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const wantCategory = opt('category');
const wantLocale = opt('locale');
const wantKind = opt('kind');
const show = Number(opt('show', 0));

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.mdx?$/.test(name)) out.push(p);
  }
  return out;
}

const frontmatterValue = (text, key) => {
  const m = text.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?`, 'm'));
  return m ? m[1].trim() : null;
};

const byKind = new Map();
const byCategory = new Map();
const samples = [];
let files = 0;
let taggedBlocks = 0;

for (const path of walk(ROOT)) {
  const locale = path.split('/')[3];
  if (wantLocale && locale !== wantLocale) continue;
  const text = readFileSync(path, 'utf8');
  const category = frontmatterValue(text, 'category') ?? '(none)';
  if (wantCategory && category !== wantCategory) continue;

  taggedBlocks += [...text.matchAll(/^```[a-zA-Z0-9]+[ \t]*$/gm)].length;
  const blocks = extractUntaggedBlocks(text);
  if (!blocks.length) continue;
  files += 1;

  for (const block of blocks) {
    const kind = classifyBlock(block.content);
    byKind.set(kind, (byKind.get(kind) ?? 0) + 1);
    byCategory.set(category, (byCategory.get(category) ?? 0) + 1);
    if (wantKind && kind === wantKind && samples.length < show) {
      samples.push({ path, content: block.content });
    }
  }
}

const total = [...byKind.values()].reduce((a, b) => a + b, 0);
const scope = [wantLocale && `locale=${wantLocale}`, wantCategory && `category=${wantCategory}`]
  .filter(Boolean).join(' ') || '전체';

console.log(`codeblock migration audit — ${scope}`);
console.log(`태그 없는 블록 ${total}개 · 문서 ${files}개 · 언어 태그 있는 블록 ${taggedBlocks}개\n`);

const pct = (n) => (total ? Math.round((n * 100) / total) : 0);
console.log('유형별 (옮겨 담을 곳):');
for (const [kind, n] of [...byKind].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${kind.padEnd(20)} ${String(n).padStart(5)}  ${String(pct(n)).padStart(3)}%  → ${TARGET[kind]}`);
}

if (!wantCategory) {
  console.log('\n카테고리 상위 12:');
  for (const [cat, n] of [...byCategory].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    console.log(`  ${cat.padEnd(22)} ${n}`);
  }
}

for (const s of samples) {
  console.log(`\n▶ ${s.path}`);
  console.log(s.content.trimEnd().split('\n').slice(0, 8).join('\n'));
}

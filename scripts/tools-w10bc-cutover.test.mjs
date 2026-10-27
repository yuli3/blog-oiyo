import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// 2026-10-27 W10b/W10c: pay, leave and legal tools live on tools.oiyo.net in the same language
// (ja/zh/fr/es keep their own country's law for severance and annual leave).
const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(join(root,p),'utf8');
const LOCALES = ['ko','en','ja','zh','fr','es'];
const SLUGS = ['salary-calculator','severance-calculator','annual-leave-calculator','litigation-cost-calculator','loss-of-income-calculator','salary-negotiation-calculator','legal-docs-generator'];
const sitemap = readdirSync(join(root,'dist')).filter(p=>/^sitemap.*xml$/.test(p)).map(p=>read(`dist/${p}`)).join('');
const redirects = read('dist/_redirects').split('\n').map(l=>l.trim().split(/\s+/));
for (const slug of SLUGS) for (const lang of LOCALES) test(`${lang}/${slug} 301s to Tools ${lang}`, () => {
  const dest = `https://tools.oiyo.net/${lang}/${slug}/`;
  // Every source has a stub page, so Pages 308s the slash-less URL to the slash rule first.
  assert.ok(redirects.some(([src,to,status])=>src===`/${lang}/${slug}/` && to===dest && status==='301'));
  assert.ok(!sitemap.includes(`https://blog.oiyo.net/${lang}/${slug}/`));
  const html = read(`dist/${lang}/${slug}/index.html`);
  assert.ok(html.includes(`<link rel="canonical" href="${dest}"`));
  assert.match(html, /<meta name="robots" content="noindex"/);
});
test('W10b/W10c slugs are migrated and not ko-only', () => {
  const list = JSON.parse(read('src/config/tools-migrated-slugs.json'));
  const koOnly = JSON.parse(read('src/config/tools-migrated-ko-only.json'));
  for (const slug of SLUGS) assert.ok(list.includes(slug) && !koOnly.includes(slug), slug);
});
test('Blog pages link the moved tools on Tools in the same language', () => {
  assert.ok(read('dist/en/4-insurance-complete-guide/index.html').includes('https://tools.oiyo.net/en/severance-calculator/'));
  assert.ok(read('dist/ko/career-change-guide/index.html').includes('https://tools.oiyo.net/ko/salary-negotiation-calculator/'));
  assert.ok(read('dist/fr/savings-comparison-calculator/index.html').includes('https://tools.oiyo.net/fr/salary-calculator/'));
});

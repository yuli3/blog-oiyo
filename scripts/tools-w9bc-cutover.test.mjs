import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// 2026-10-27 W9b/W9c: housing and income tax calculators live on Tools in every locale (ko/en use Korean law,
// ja/zh/fr/es each country's own), so each locale 301s to the same locale on Tools.
const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(join(root,p),'utf8');
const LOCALES = ['ko','en','ja','zh','fr','es'];
const SLUGS = ['acquisition-tax-calculator','property-tax-calculator','capital-gains-tax-calculator','comprehensive-income-tax-calculator','freelancer-tax-calculator','year-end-settlement-calculator','pension-tax-calculator'];
const sitemap = readdirSync(join(root,'dist')).filter(p=>/^sitemap.*xml$/.test(p)).map(p=>read(`dist/${p}`)).join('');
const redirects = read('dist/_redirects').split('\n').map(l=>l.trim().split(/\s+/));
for (const slug of SLUGS) for (const lang of LOCALES) test(`${lang}/${slug} 301s to Tools`, () => {
  const dest = `https://tools.oiyo.net/${lang}/${slug}/`;
  // Every source has a stub page, so Pages 308s the slash-less URL to the slash rule first.
  assert.ok(redirects.some(([src,to,status])=>src===`/${lang}/${slug}/` && to===dest && status==='301'));
  assert.ok(!sitemap.includes(`https://blog.oiyo.net/${lang}/${slug}/`));
  const html = read(`dist/${lang}/${slug}/index.html`);
  assert.ok(html.includes(`<link rel="canonical" href="${dest}"`));
  assert.match(html, /<meta name="robots" content="noindex"/);
});
test('W9b/W9c slugs are migrated and not ko-only', () => {
  const list = JSON.parse(read('src/config/tools-migrated-slugs.json'));
  const koOnly = JSON.parse(read('src/config/tools-migrated-ko-only.json'));
  for (const s of SLUGS) { assert.ok(list.includes(s), s); assert.ok(!koOnly.includes(s), s); }
});
test('Blog pages link the moved calculators on Tools in the same language', () => {
  assert.ok(read('dist/ja/pension-optimizer-calculator/index.html').includes('https://tools.oiyo.net/ja/pension-tax-calculator/'));
  assert.ok(read('dist/ko/tax-checklist-hub-guide/index.html').includes('https://tools.oiyo.net/ko/capital-gains-tax-calculator/'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// 2026-10-27 W9a: Korean VAT, first-home and auto tax tools live only at tools.oiyo.net/ko/. vat-penalty,
// deemed-rent-vat and first-home-tax only ever had a ko Blog page. gift-vs-inheritance merges into gift-tax;
// the repealed 금융투자소득세 calculator lands on overseas-stock-tax in the same language.
const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(join(root,p),'utf8');
const LOCALES = ['ko','en','ja','zh','fr','es'];
const KO_ONLY = JSON.parse(read('src/config/tools-migrated-ko-only.json'));
const W9 = {
  'vat-penalty-calculator': ['vat-penalty-calculator', ['ko']],
  'deemed-rent-vat-calculator': ['deemed-rent-vat-calculator', ['ko']],
  'first-home-tax-calculator': ['first-home-tax-calculator', ['ko']],
  'auto-tax-calculator': ['auto-tax-calculator', LOCALES],
  'gift-vs-inheritance-calculator': ['gift-tax-calculator', LOCALES],
  'financial-investment-tax-calculator': ['overseas-stock-tax', LOCALES],
};
const target = (lang, d) => `https://tools.oiyo.net/${KO_ONLY.includes(d) ? 'ko' : lang}/${d}/`;
const sitemap = readdirSync(join(root,'dist')).filter(p=>/^sitemap.*xml$/.test(p)).map(p=>read(`dist/${p}`)).join('');
const redirects = read('dist/_redirects').split('\n').map(l=>l.trim().split(/\s+/));
for (const [slug, [d, langs]] of Object.entries(W9)) for (const lang of langs) test(`${lang}/${slug} 301s to Tools`, () => {
  const dest = target(lang, d);
  // Every source has a stub page, so Pages 308s the slash-less URL to the slash rule first.
  assert.ok(redirects.some(([src,to,status])=>src===`/${lang}/${slug}/` && to===dest && status==='301'));
  assert.ok(!sitemap.includes(`https://blog.oiyo.net/${lang}/${slug}/`));
  const html = read(`dist/${lang}/${slug}/index.html`);
  assert.ok(html.includes(`<link rel="canonical" href="${dest}"`));
  assert.match(html, /<meta name="robots" content="noindex"/);
});
test('W9a slugs are in the migrated list or aliases, Korean-law ones ko-only', () => {
  const list = JSON.parse(read('src/config/tools-migrated-slugs.json'));
  const aliases = JSON.parse(read('src/config/tools-migrated-aliases.json'));
  for (const [slug, [d]] of Object.entries(W9)) assert.ok(slug === d ? list.includes(slug) && KO_ONLY.includes(slug) : aliases[slug] === d, slug);
  assert.ok(!KO_ONLY.includes('overseas-stock-tax'));
});
test('Blog pages link the moved tools on Tools', () => {
  // salary-calculator, the last Blog page linking auto-tax, moved to Tools in W10b.
  assert.ok(read('dist/ja/isa-vs-pension-calculator/index.html').includes('https://tools.oiyo.net/ja/overseas-stock-tax/'));
  assert.ok(read('dist/ko/magazine-tax-office-deadline-night/index.html').includes('https://tools.oiyo.net/ko/vat-penalty-calculator/'));
  assert.ok(!existsSync(join(root, 'dist/en/vat-penalty-calculator/index.html')));
});

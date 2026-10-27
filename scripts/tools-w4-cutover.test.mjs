import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// 2026-10-27 W4: finance batch 3 keeps a noindex bridge and both slash forms 301 once to Tools
// (caffelatte-calculator lands on latte-factor-calculator).
const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(join(root,p),'utf8');
const W4 = {"dividend-tracker":"dividend-tracker","latte-factor-calculator":"latte-factor-calculator","caffelatte-calculator":"latte-factor-calculator","separate-vs-comprehensive-tax-calculator":"separate-vs-comprehensive-tax-calculator"};
const sitemap = readdirSync(join(root,'dist')).filter(p=>/^sitemap.*xml$/.test(p)).map(p=>read(`dist/${p}`)).join('');
const redirects = read('dist/_redirects').split('\n').map(l=>l.trim().split(/\s+/));
for (const [slug, dest] of Object.entries(W4)) for (const lang of ['ko','en','ja','zh','fr','es']) test(`${lang}/${slug} bridges to Tools`, () => {
  const target = `https://tools.oiyo.net/${lang}/${dest}/`;
  const html = read(`dist/${lang}/${slug}/index.html`);
  assert.ok(html.includes(`<link rel="canonical" href="${target}"`));
  assert.match(html, /<meta name="robots" content="noindex"/);
  assert.ok(!sitemap.includes(`https://blog.oiyo.net/${lang}/${slug}/`));
  for (const suffix of ['/','']) assert.ok(redirects.some(([src,dest,status])=>src===`/${lang}/${slug}${suffix}` && dest===target && status==='301'));
});
test('the shared migrated list and alias map cover every W4 slug', () => {
  const list = JSON.parse(read('src/config/tools-migrated-slugs.json'));
  const aliases = JSON.parse(read('src/config/tools-migrated-aliases.json'));
  for (const [slug, dest] of Object.entries(W4)) assert.ok(slug === dest ? list.includes(slug) : aliases[slug] === dest);
});
test('Blog pages link the moved finance tools on Tools', () => {
  assert.ok(read('dist/ko/stock-yield-calculator/index.html').includes('https://tools.oiyo.net/ko/dividend-tracker/'));
  assert.ok(read('dist/en/compound2-calculator/index.html').includes('https://tools.oiyo.net/en/latte-factor-calculator/'));
  assert.ok(!read('dist/en/compound2-calculator/index.html').includes('href="/en/caffelatte-calculator/"'));
});
test('the dividend calendar no longer lists a total-return ETF as a payer', () => {
  assert.ok(!read('src/components/tools/DividendCalendar.tsx').includes('ticker: "KODEX 미국S&P500TR"'));
});

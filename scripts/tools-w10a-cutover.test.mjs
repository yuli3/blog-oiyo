import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// 2026-10-27 W10a: Korean labor and legal tools live only at tools.oiyo.net/ko/. Weekly holiday pay and the
// day-worker insurance checker only ever had a ko Blog page; the other five 301 every locale to /ko/.
const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(join(root,p),'utf8');
const LOCALES = ['ko','en','ja','zh','fr','es'];
const W10A = {
  'weekly-holiday-pay-calculator': ['ko'],
  'daily-worker-insurance-checker': ['ko'],
  'labor-cost-calculator': LOCALES,
  'incorporation-calculator': LOCALES,
  'legal-interest-calculator': LOCALES,
  'statute-limitations-calculator': LOCALES,
  'labor-law-quick-check': LOCALES,
};
const sitemap = readdirSync(join(root,'dist')).filter(p=>/^sitemap.*xml$/.test(p)).map(p=>read(`dist/${p}`)).join('');
const redirects = read('dist/_redirects').split('\n').map(l=>l.trim().split(/\s+/));
for (const [slug, langs] of Object.entries(W10A)) for (const lang of langs) test(`${lang}/${slug} 301s to Tools ko`, () => {
  const dest = `https://tools.oiyo.net/ko/${slug}/`;
  // Every source has a stub page, so Pages 308s the slash-less URL to the slash rule first.
  assert.ok(redirects.some(([src,to,status])=>src===`/${lang}/${slug}/` && to===dest && status==='301'));
  assert.ok(!sitemap.includes(`https://blog.oiyo.net/${lang}/${slug}/`));
  const html = read(`dist/${lang}/${slug}/index.html`);
  assert.ok(html.includes(`<link rel="canonical" href="${dest}"`));
  assert.match(html, /<meta name="robots" content="noindex"/);
});
test('W10a slugs are migrated and ko-only', () => {
  const list = JSON.parse(read('src/config/tools-migrated-slugs.json'));
  const koOnly = JSON.parse(read('src/config/tools-migrated-ko-only.json'));
  for (const slug of Object.keys(W10A)) assert.ok(list.includes(slug) && koOnly.includes(slug), slug);
});
test('Blog pages link the moved tools on Tools', () => {
  assert.ok(read('dist/ko/magazine-tax-office-part-time-insurance/index.html').includes('https://tools.oiyo.net/ko/weekly-holiday-pay-calculator/'));
  assert.ok(read('dist/ko/health-insurance-leaver-settlement/index.html').includes('https://tools.oiyo.net/ko/daily-worker-insurance-checker/'));
  assert.ok(read('dist/en/insurance-premium-calculator/index.html').includes('https://tools.oiyo.net/ko/legal-interest-calculator/'));
  assert.ok(!existsSync(join(root, 'dist/en/weekly-holiday-pay-calculator/index.html')));
});

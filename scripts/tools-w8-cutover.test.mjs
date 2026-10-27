import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// 2026-10-27 W8: Korean-law finance tools live only at tools.oiyo.net/ko/, so every locale 301s
// there; duplicates (dsr-mortgage, jeonse-vs-monthly, isa-tax-savings, inheritance-gift, financial-ratios)
// land on the merged Tools slug.
const root = fileURLToPath(new URL('../', import.meta.url));
// A stub page means Pages 308s the slash-less URL to the slash rule, so only the slash rule is kept.
const read = p => readFileSync(join(root,p),'utf8');
const LOCALES = ['ko','en','ja','zh','fr','es'];
const KO_ONLY = JSON.parse(read('src/config/tools-migrated-ko-only.json'));
const W8 = {
  'retirement-tax-calculator':'retirement-tax-calculator','youth-future-savings-calculator':'youth-future-savings-calculator',
  'dsr-calculator':'dsr-calculator','dsr-mortgage-calculator':'dsr-calculator',
  'jeonse-vs-rent-calculator':'jeonse-vs-rent-calculator','jeonse-vs-monthly-calculator':'jeonse-vs-rent-calculator',
  'isa-calculator':'isa-calculator','isa-tax-savings-calculator':'isa-calculator',
  'inheritance-tax-calculator':'inheritance-tax-calculator','gift-tax-calculator':'gift-tax-calculator',
  'inheritance-gift-tax-calculator':'inheritance-tax-calculator',
  'financial-ratio-trend':'financial-ratio-trend','financial-ratios':'financial-ratio-trend',
};
const target = (lang, slug) => { const d = W8[slug]; return `https://tools.oiyo.net/${KO_ONLY.includes(d) ? 'ko' : lang}/${d}/`; };
const sitemap = readdirSync(join(root,'dist')).filter(p=>/^sitemap.*xml$/.test(p)).map(p=>read(`dist/${p}`)).join('');
const redirects = read('dist/_redirects').split('\n').map(l=>l.trim().split(/\s+/));
for (const slug of Object.keys(W8)) for (const lang of LOCALES) test(`${lang}/${slug} 301s to Tools`, () => {
  const dest = target(lang, slug);
  for (const suffix of ['/', ...(existsSync(join(root, 'dist', lang, slug, 'index.html')) ? [] : [''])]) assert.ok(redirects.some(([src,d,status])=>src===`/${lang}/${slug}${suffix}` && d===dest && status==='301'));
  assert.ok(!sitemap.includes(`https://blog.oiyo.net/${lang}/${slug}/`));
  const file = `dist/${lang}/${slug}/index.html`;
  if (existsSync(join(root, file))) {
    const html = read(file);
    assert.ok(html.includes(`<link rel="canonical" href="${dest}"`));
    assert.match(html, /<meta name="robots" content="noindex"/);
  }
});
test('the Korean-law tools are ko-only and all W8 slugs are in the migrated list or aliases', () => {
  // Later waves add more ko-only slugs; W8's own must stay listed.
  for (const s of ['dsr-calculator','gift-tax-calculator','inheritance-tax-calculator','isa-calculator','jeonse-vs-rent-calculator','retirement-tax-calculator','youth-future-savings-calculator']) assert.ok(KO_ONLY.includes(s), s);
  const list = JSON.parse(read('src/config/tools-migrated-slugs.json'));
  const aliases = JSON.parse(read('src/config/tools-migrated-aliases.json'));
  for (const [slug, dest] of Object.entries(W8)) assert.ok(slug === dest ? list.includes(slug) : aliases[slug] === dest, slug);
});
test('Blog pages link the moved tools on Tools, ko-only tools at /ko/ from every locale', () => {
  assert.ok(read('dist/en/mortgage-calculator/index.html').includes('https://tools.oiyo.net/ko/dsr-calculator/'));
  assert.ok(!read('dist/en/mortgage-calculator/index.html').includes('href="/en/dsr-calculator/"'));
  assert.ok(read('dist/ko/deposit-calculator/index.html').includes('https://tools.oiyo.net/ko/isa-calculator/'));
  assert.ok(!read('dist/en/property-tax-calculator/index.html').includes('https://tools.oiyo.net/en/gift-tax-calculator/'));
});

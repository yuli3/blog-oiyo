import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// 2026-10-27 W11: investing and savings tools live on tools.oiyo.net in the same language; Korean-rule tools are
// ko-only, so every locale lands on /ko/; pension-calculator merges into pension-tax-calculator.
const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(join(root,p),'utf8');
const LOCALES = ['ko','en','ja','zh','fr','es'];
const SAME = ['compound-interest-calculator','compound2-calculator','stock-average-calculator','roi-calculator','inflation-calculator','fire-retirement-calculator','life-planning-calculator','early-repayment-calculator','etf-recommender','money-planner'];
const KO_ONLY = ['deposit-calculator','brokerage-calculator','expense-ratio-calculator','overseas-stock-saver-calculator','tax-savings-roadmap','tax-formula-explorer'];
const ALIASES = { 'pension-calculator': 'pension-tax-calculator' };
const destOf = (slug, lang) => `https://tools.oiyo.net/${KO_ONLY.includes(slug) ? 'ko' : lang}/${ALIASES[slug] ?? slug}/`;
const sitemap = readdirSync(join(root,'dist')).filter(p=>/^sitemap.*xml$/.test(p)).map(p=>read(`dist/${p}`)).join('');
const redirects = read('dist/_redirects').split('\n').map(l=>l.trim().split(/\s+/));
for (const slug of [...SAME, ...KO_ONLY, ...Object.keys(ALIASES)]) for (const lang of LOCALES) test(`${lang}/${slug} 301s to Tools`, () => {
  const dest = destOf(slug, lang);
  // Every source has a stub page, so Pages 308s the slash-less URL to the slash rule first.
  assert.ok(redirects.some(([src,to,status])=>src===`/${lang}/${slug}/` && to===dest && status==='301'));
  assert.ok(!sitemap.includes(`https://blog.oiyo.net/${lang}/${slug}/`));
  const html = read(`dist/${lang}/${slug}/index.html`);
  assert.ok(html.includes(`<link rel="canonical" href="${dest}"`));
  assert.match(html, /<meta name="robots" content="noindex"/);
});
test('W11 config lists', () => {
  const list = JSON.parse(read('src/config/tools-migrated-slugs.json'));
  const koOnly = JSON.parse(read('src/config/tools-migrated-ko-only.json'));
  const aliases = JSON.parse(read('src/config/tools-migrated-aliases.json'));
  for (const slug of SAME) assert.ok(list.includes(slug) && !koOnly.includes(slug), slug);
  for (const slug of KO_ONLY) assert.ok(list.includes(slug) && koOnly.includes(slug), slug);
  assert.equal(aliases['pension-calculator'], 'pension-tax-calculator');
});
test('Blog pages link the moved tools on Tools', () => {
  assert.ok(read('dist/en/compound-interest-complete-guide/index.html').includes('https://tools.oiyo.net/en/inflation-calculator/'));
  assert.ok(read('dist/ko/tax-checklist-hub-guide/index.html').includes('https://tools.oiyo.net/ko/tax-savings-roadmap/'));
  assert.ok(read('dist/en/labor-rights-guide/index.html').includes('https://tools.oiyo.net/en/pension-tax-calculator/'));
});

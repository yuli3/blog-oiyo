import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// 2026-11-01 W15: loan, pension and everyday tools live on tools.oiyo.net in the same language; Korean-rule money
// tools are ko-only; home-buying, rent-comparison, stock-yield and global-income-tax merge into existing Tools pages.
const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(join(root,p),'utf8');
const LOCALES = ['ko','en','ja','zh','fr','es'];
const SAME = ["loan-calculator", "mortgage-calculator", "dividend-calendar", "pension-optimizer-calculator", "baby-name-generator", "cultural-greeting-guide", "dog-vision-simulator", "interview-question-generator", "korean-spelling-quiz", "love-calculator", "marriage-age-calculator", "mbti-saju-cross", "mbti-stress-relief", "number-sorter", "pet-age-calculator", "toeic-score-converter", "vocab-flashcard", "wedding-planning-calculator", "stock-yield-calculator", "global-income-tax-calculator"];
const KO_ONLY = ["jeonse-vs-buy-calculator", "savings-comparison-calculator", "isa-vs-pension-calculator", "present-value-calculator", "electricity-bill-calculator", "health-insurance-leaver-settlement", "home-buying-calculator", "rent-comparison-calculator"];
const ALIASES = {"home-buying-calculator": "jeonse-vs-buy-calculator", "rent-comparison-calculator": "jeonse-vs-rent-calculator", "stock-yield-calculator": "stock-average-calculator", "global-income-tax-calculator": "comprehensive-income-tax-calculator"};
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
test('W15 config lists', () => {
  const list = JSON.parse(read('src/config/tools-migrated-slugs.json'));
  const koOnly = JSON.parse(read('src/config/tools-migrated-ko-only.json'));
  const aliases = JSON.parse(read('src/config/tools-migrated-aliases.json'));
  for (const slug of SAME) assert.ok(list.includes(slug) && !koOnly.includes(slug), slug);
  for (const slug of KO_ONLY) assert.ok(list.includes(slug) && koOnly.includes(slug), slug);
  for (const [from, to] of Object.entries(ALIASES)) assert.equal(aliases[from], to);
});
test('Blog pages link the moved money tools on Tools', () => {
  assert.ok(read('dist/ko/magazine-electricity-bill-reading/index.html').includes('https://tools.oiyo.net/ko/electricity-bill-calculator/'));
});

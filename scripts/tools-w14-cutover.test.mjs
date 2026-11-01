import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// 2026-11-01 W14: health and fitness tools live on tools.oiyo.net in the same language; Korean vaccination and
// life-expectancy tools are ko-only; height-predictor merges into child-height-calculator.
const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(join(root,p),'utf8');
const LOCALES = ['ko','en','ja','zh','fr','es'];
const SAME = ["baby-food-scheduler", "bmi-calculator", "body-fat-calculator", "caffeine-calculator", "child-height-calculator", "fasting-timer", "heart-rate-calculator", "ideal-weight-calculator", "macro-calculator", "menstrual-cycle-calculator", "nutrition-calculator", "one-rep-max-calculator", "pregnancy-calculator", "sleep-calculator", "tdee-calculator", "water-intake-calculator"];
const KO_ONLY = ["vaccination-schedule", "life-expectancy-calculator"];
const ALIASES = {"height-predictor": "child-height-calculator"};
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
for (const [slug, langs] of [['male-to-female-running-time-converter',['en','ko']],['crossfit-male-to-female-weight-converter',['en']]]) for (const lang of langs) test(`${lang}/${slug} 301s to Tools in its own languages`, () => {
  const dest = `https://tools.oiyo.net/${lang}/${slug}/`;
  assert.ok(redirects.some(([src,to,status])=>src===`/${lang}/${slug}/` && to===dest && status==='301'));
  assert.ok(!sitemap.includes(`https://blog.oiyo.net/${lang}/${slug}/`));
  assert.ok(read(`dist/${lang}/${slug}/index.html`).includes(`<link rel="canonical" href="${dest}"`));
});
test('W14 config lists', () => {
  const list = JSON.parse(read('src/config/tools-migrated-slugs.json'));
  const koOnly = JSON.parse(read('src/config/tools-migrated-ko-only.json'));
  const aliases = JSON.parse(read('src/config/tools-migrated-aliases.json'));
  for (const slug of SAME) assert.ok(list.includes(slug) && !koOnly.includes(slug), slug);
  for (const slug of KO_ONLY) assert.ok(list.includes(slug) && koOnly.includes(slug), slug);
  for (const [from, to] of Object.entries(ALIASES)) assert.equal(aliases[from], to);
});
test('Blog pages link the moved health tools on Tools', () => {
  assert.ok(read('dist/en/height-converter/index.html').includes('https://tools.oiyo.net/en/body-fat-calculator/'));
});

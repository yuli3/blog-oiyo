import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// 2026-10-27 W7: date, time and everyday calculators and the word counter keep a noindex bridge
// and both slash forms 301 once to the same slug on Tools.
const root = fileURLToPath(new URL('../', import.meta.url));
// A stub page means Pages 308s the slash-less URL to the slash rule, so only the slash rule is kept.
const read = p => readFileSync(join(root,p),'utf8');
const W7 = ['date-calculator','dday-counter','hours-calculator','world-clock','timer','pomodoro','metronome','percentage-calculator','ratio-calculator','discount-calculator','tip-calculator','dutch-pay-calculator','unit-price-calculator','travel-budget-calculator','fuel-cost-calculator','fuel-efficiency-calculator','calculator','word-counter'];
const sitemap = readdirSync(join(root,'dist')).filter(p=>/^sitemap.*xml$/.test(p)).map(p=>read(`dist/${p}`)).join('');
const redirects = read('dist/_redirects').split('\n').map(l=>l.trim().split(/\s+/));
for (const slug of W7) for (const lang of ['ko','en','ja','zh','fr','es']) test(`${lang}/${slug} bridges to Tools`, () => {
  const target = `https://tools.oiyo.net/${lang}/${slug}/`;
  const html = read(`dist/${lang}/${slug}/index.html`);
  assert.ok(html.includes(`<link rel="canonical" href="${target}"`));
  assert.match(html, /<meta name="robots" content="noindex"/);
  assert.ok(!sitemap.includes(`https://blog.oiyo.net/${lang}/${slug}/`));
  for (const suffix of ['/', ...(existsSync(join(root, 'dist', lang, slug, 'index.html')) ? [] : [''])]) assert.ok(redirects.some(([src,dest,status])=>src===`/${lang}/${slug}${suffix}` && dest===target && status==='301'));
});
test('the shared migrated list covers every W7 slug', () => {
  const list = JSON.parse(read('src/config/tools-migrated-slugs.json'));
  for (const slug of W7) assert.ok(list.includes(slug), slug);
});
test('Blog pages link the moved calculators on Tools', () => {
  assert.ok(read('dist/ko/final-grade-calculator/index.html').includes('https://tools.oiyo.net/ko/final-grade-calculator/'));
  assert.ok(read('dist/ko/electricity-bill-calculator/index.html').includes('https://tools.oiyo.net/ko/fuel-cost-calculator/'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// 2026-10-27 W6: unit and number converters keep a noindex bridge and both slash forms 301 once
// to the same slug on Tools.
const root = fileURLToPath(new URL('../', import.meta.url));
// A stub page means Pages 308s the slash-less URL to the slash rule, so only the slash rule is kept.
const read = p => readFileSync(join(root,p),'utf8');
const W6 = ['percent','fraction','scientific-notation','angle','universal','length','weight','volume','temperature','speed','pressure','energy','area','data-storage','time'].map(s=>`${s}-converter`);
const sitemap = readdirSync(join(root,'dist')).filter(p=>/^sitemap.*xml$/.test(p)).map(p=>read(`dist/${p}`)).join('');
const redirects = read('dist/_redirects').split('\n').map(l=>l.trim().split(/\s+/));
for (const slug of W6) for (const lang of ['ko','en','ja','zh','fr','es']) test(`${lang}/${slug} bridges to Tools`, () => {
  const target = `https://tools.oiyo.net/${lang}/${slug}/`;
  const html = read(`dist/${lang}/${slug}/index.html`);
  assert.ok(html.includes(`<link rel="canonical" href="${target}"`));
  assert.match(html, /<meta name="robots" content="noindex"/);
  assert.ok(!sitemap.includes(`https://blog.oiyo.net/${lang}/${slug}/`));
  for (const suffix of ['/', ...(existsSync(join(root, 'dist', lang, slug, 'index.html')) ? [] : [''])]) assert.ok(redirects.some(([src,dest,status])=>src===`/${lang}/${slug}${suffix}` && dest===target && status==='301'));
});
test('the shared migrated list covers every W6 slug', () => {
  const list = JSON.parse(read('src/config/tools-migrated-slugs.json'));
  for (const slug of W6) assert.ok(list.includes(slug), slug);
});
test('Blog pages link the moved converters on Tools', () => {
  assert.ok(read('dist/ko/pace-calculator/index.html').includes('https://tools.oiyo.net/ko/pace-calculator/'));
  assert.ok(!read('dist/en/recipe-scaler/index.html').match(/href="\/en\/(volume|weight)-converter\/"/));
});

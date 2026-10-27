import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// 2026-10-27 W6b: the size converters and the ko/en per-size shoe pages keep a noindex bridge and
// both slash forms 301 once to the same path on Tools.
const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(join(root,p),'utf8');
const W6B = ['hat','ring','shoe'].map(s=>`${s}-size-converter`);
const sitemap = readdirSync(join(root,'dist')).filter(p=>/^sitemap.*xml$/.test(p)).map(p=>read(`dist/${p}`)).join('');
const redirects = read('dist/_redirects').split('\n').map(l=>l.trim().split(/\s+/));
const bridges = (path) => {
  const target = `https://tools.oiyo.net/${path}/`;
  const html = read(`dist/${path}/index.html`);
  assert.ok(html.includes(`<link rel="canonical" href="${target}"`));
  assert.match(html, /<meta name="robots" content="noindex"/);
  assert.ok(!sitemap.includes(`https://blog.oiyo.net/${path}/`));
  for (const suffix of ['/','']) assert.ok(redirects.some(([src,dest,status])=>src===`/${path}${suffix}` && dest===target && status==='301'), path);
};
for (const slug of W6B) for (const lang of ['ko','en','ja','zh','fr','es']) test(`${lang}/${slug} bridges to Tools`, () => bridges(`${lang}/${slug}`));
for (const lang of ['ko','en']) test(`${lang} shoe size pages bridge to Tools`, () => {
  const sizes = readdirSync(join(root,`dist/${lang}/shoe-size-converter`)).filter(d=>d!=='index.html');
  assert.ok(sizes.length >= 17, `${lang}: ${sizes.length}`);
  for (const size of sizes) bridges(`${lang}/shoe-size-converter/${size}`);
});
test('the shared migrated list covers every W6b slug', () => {
  const list = JSON.parse(read('src/config/tools-migrated-slugs.json'));
  for (const slug of W6B) assert.ok(list.includes(slug), slug);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// 2026-10-27 W2: image and color utilities keep a noindex bridge and both slash forms 301 once to Tools
// (grayscale-converter lands on the merged image-grayscale page).
const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(join(root,p),'utf8');
const W2 = {"image-cropper":"image-cropper","image-pixelator":"image-pixelator","image-grayscale":"image-grayscale","grayscale-converter":"image-grayscale","image-metadata-viewer":"image-metadata-viewer","image-processor":"image-processor","gif-splitter":"gif-splitter","favicon-generator":"favicon-generator","svg-studio":"svg-studio","palette-extractor":"palette-extractor","color-converter":"color-converter","color-pairs":"color-pairs","emoji-picker":"emoji-picker"};
const sitemap = readdirSync(join(root,'dist')).filter(p=>/^sitemap.*xml$/.test(p)).map(p=>read(`dist/${p}`)).join('');
const redirects = read('dist/_redirects').split('\n').map(l=>l.trim().split(/\s+/));
for (const [slug, dest] of Object.entries(W2)) for (const lang of ['ko','en','ja','zh','fr','es']) test(`${lang}/${slug} bridges to Tools`, () => {
  const target = `https://tools.oiyo.net/${lang}/${dest}/`;
  const html = read(`dist/${lang}/${slug}/index.html`);
  assert.ok(html.includes(`<link rel="canonical" href="${target}"`));
  assert.match(html, /<meta name="robots" content="noindex"/);
  assert.ok(!sitemap.includes(`https://blog.oiyo.net/${lang}/${slug}/`));
  for (const suffix of ['/','']) assert.ok(redirects.some(([src,dest,status])=>src===`/${lang}/${slug}${suffix}` && dest===target && status==='301'));
});
test('the shared migrated list and alias map cover every W2 slug', () => {
  const list = JSON.parse(read('src/config/tools-migrated-slugs.json'));
  const aliases = JSON.parse(read('src/config/tools-migrated-aliases.json'));
  for (const [slug, dest] of Object.entries(W2)) assert.ok(slug === dest ? list.includes(slug) : aliases[slug] === dest);
});

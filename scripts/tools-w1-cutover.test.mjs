import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// 2026-10-27 W1: every moved utility keeps a noindex bridge and both slash forms 301 once to Tools.
const root = fileURLToPath(new URL('../', import.meta.url));
// A stub page means Pages 308s the slash-less URL to the slash rule, so only the slash rule is kept.
const read = p => readFileSync(join(root,p),'utf8');
const W1 = ["aspect-ratio-calculator", "number-base-converter", "base64-converter", "hash-generator", "uuid-generator", "password-generator", "random-data-generator", "lorem-ipsum-generator", "morse-code-converter", "ascii-art-generator"];
const sitemap = readdirSync(join(root,'dist')).filter(p=>/^sitemap.*xml$/.test(p)).map(p=>read(`dist/${p}`)).join('');
const redirects = read('dist/_redirects').split('\n').map(l=>l.trim().split(/\s+/));
for (const slug of W1) for (const lang of ['ko','en','ja','zh','fr','es']) test(`${lang}/${slug} bridges to Tools`, () => {
  const target = `https://tools.oiyo.net/${lang}/${slug}/`;
  const html = read(`dist/${lang}/${slug}/index.html`);
  assert.ok(html.includes(`<link rel="canonical" href="${target}"`));
  assert.match(html, /<meta name="robots" content="noindex"/);
  assert.ok(!sitemap.includes(`https://blog.oiyo.net/${lang}/${slug}/`));
  for (const suffix of ['/', ...(existsSync(join(root, 'dist', lang, slug, 'index.html')) ? [] : [''])]) assert.ok(redirects.some(([src,dest,status])=>src===`/${lang}/${slug}${suffix}` && dest===target && status==='301'));
});
test('the shared migrated list includes every W1 slug', () => {
  const list = JSON.parse(read('src/config/tools-migrated-slugs.json'));
  for (const slug of W1) assert.ok(list.includes(slug));
});

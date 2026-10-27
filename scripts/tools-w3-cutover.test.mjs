import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// 2026-10-27 W3: the tax calendar and menu picker keep a noindex bridge and both slash forms 301 once to Tools
// (random-menu lands on menu-roulette).
const root = fileURLToPath(new URL('../', import.meta.url));
// A stub page means Pages 308s the slash-less URL to the slash rule, so only the slash rule is kept.
const read = p => readFileSync(join(root,p),'utf8');
const W3 = {"tax-calendar":"tax-calendar","random-menu":"menu-roulette"};
const sitemap = readdirSync(join(root,'dist')).filter(p=>/^sitemap.*xml$/.test(p)).map(p=>read(`dist/${p}`)).join('');
const redirects = read('dist/_redirects').split('\n').map(l=>l.trim().split(/\s+/));
for (const [slug, dest] of Object.entries(W3)) for (const lang of ['ko','en','ja','zh','fr','es']) test(`${lang}/${slug} bridges to Tools`, () => {
  const target = `https://tools.oiyo.net/${lang}/${dest}/`;
  const html = read(`dist/${lang}/${slug}/index.html`);
  assert.ok(html.includes(`<link rel="canonical" href="${target}"`));
  assert.match(html, /<meta name="robots" content="noindex"/);
  assert.ok(!sitemap.includes(`https://blog.oiyo.net/${lang}/${slug}/`));
  for (const suffix of ['/', ...(existsSync(join(root, 'dist', lang, slug, 'index.html')) ? [] : [''])]) assert.ok(redirects.some(([src,dest,status])=>src===`/${lang}/${slug}${suffix}` && dest===target && status==='301'));
});
test('the shared migrated list and alias map cover every W3 slug', () => {
  const list = JSON.parse(read('src/config/tools-migrated-slugs.json'));
  const aliases = JSON.parse(read('src/config/tools-migrated-aliases.json'));
  for (const [slug, dest] of Object.entries(W3)) assert.ok(slug === dest ? list.includes(slug) : aliases[slug] === dest);
});
test('Blog pages link the moved tax calendar on Tools', () => {
  assert.ok(read('dist/ko/vat-penalty-calculator/index.html').includes('https://tools.oiyo.net/ko/tax-calendar/'));
  // The Blog tools index no longer carries moved tools as cards (2026-10-27).
  assert.ok(!read('dist/ko/tools/index.html').includes('https://tools.oiyo.net/ko/menu-roulette/'));
});

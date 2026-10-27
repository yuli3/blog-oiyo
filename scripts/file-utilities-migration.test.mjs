import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const slugs = ['image-converter', 'pdf-merge-split', 'qr-code-generator'];
const locales = ['ko', 'en', 'ja', 'zh', 'fr', 'es'];
const rules = read('public/_redirects').split('\n');
const sitemap = readdirSync(new URL('../dist/', import.meta.url)).filter(p => /^sitemap.*xml$/.test(p)).map(p => read(`dist/${p}`)).join('');
for (const locale of locales) for (const slug of slugs) {
  test(`${locale}/${slug}: one-hop 301 and no duplicate canonical`, () => {
    const target = `https://tools.oiyo.net/${locale}/${slug}/`;
    const path = `/${locale}/${slug}/`;
    assert.ok(rules.some(line => line.trim().split(/\s+/).join(' ') === `${path} ${target} 301`));
    assert.ok(rules.some(line => line.trim().split(/\s+/).join(' ') === `${path.slice(0, -1)} ${target} 301`));
    const html = read(`dist${path}index.html`);
    assert.ok(html.includes(target));
    assert.match(html, /http-equiv="refresh"/);
    assert.match(html, /noindex/);
    assert.ok(!sitemap.includes(`https://blog.oiyo.net${path}`));
    // 2026-10-27: the Blog tools index lists only Blog-owned tools and links Tools once.
    const index = read(`dist/${locale}/tools/index.html`);
    assert.ok(!index.includes(`href="${target}"`));
    assert.ok(index.includes(`href="https://tools.oiyo.net/${locale}/"`));
  });
}
test('related links go directly to Tools in every locale', () => {
  for (const locale of locales) {
    // word-counter itself moved in W7, so a page that still lives on Blog carries the sample.
    const html = read(`dist/${locale}/sleep-calculator/index.html`);
    assert.ok(html.includes(`href="https://tools.oiyo.net/${locale}/hours-calculator/"`));
    assert.ok(!html.includes(`href="/${locale}/hours-calculator/"`));
  }
});
test('public SEO audit accepts only exact noindex Tools bridges, not arbitrary host exceptions', () => {
  const dir = mkdtempSync(join(tmpdir(), 'oiyo-seo-bridge-'));
  const target = 'https://tools.oiyo.net/ko/image-converter/';
  try {
    mkdirSync(join(dir, 'dist/ko/image-converter'), { recursive: true });
    writeFileSync(join(dir, 'dist/sitemap-index.xml'), '<loc>https://blog.oiyo.net/sitemap-0.xml</loc>');
    writeFileSync(join(dir, 'dist/sitemap-0.xml'), '<urlset></urlset>');
    const run = ({ canonical = target, refresh = target, robots = 'noindex' } = {}) => {
      writeFileSync(join(dir, 'dist/ko/image-converter/index.html'), `<meta name="robots" content="${robots}"><link rel="canonical" href="${canonical}"><meta http-equiv="refresh" content="0;url=${refresh}">`);
      return spawnSync(process.execPath, [fileURLToPath(new URL('./audit-seo-output.mjs', import.meta.url))], { cwd: dir, encoding: 'utf8' });
    };
    assert.equal(run().status, 0);
    for (const input of [
      { canonical: target.replace('/ko/', '/en/') },
      { canonical: 'https://tools.oiyo.net/ko/unrelated/' },
      { refresh: target.replace('/ko/', '/en/') },
      { robots: 'index' },
      { canonical: 'https://blog.oiyo.net/ko/image-converter/' },
    ]) assert.equal(run(input).status, 1, JSON.stringify(input));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

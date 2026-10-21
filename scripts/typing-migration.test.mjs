import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const locales = ['ko', 'en', 'ja', 'zh', 'fr', 'es'];
const rules = fs.readFileSync('dist/_redirects', 'utf8').split('\n').map(line => line.trim().split(/\s+/));
const sitemap = fs.readdirSync('dist').filter(f => /^sitemap.*\.xml$/.test(f)).map(f => fs.readFileSync('dist/' + f, 'utf8')).join('');
for (const locale of locales) test(locale + ': typing bookmark preserves locale and leaves the sitemap', () => {
  const target = 'https://oiyo.net/' + locale + '/typing-speed-test/';
  for (const suffix of ['/', '']) {
    const source = '/' + locale + '/typing-speed-calculator' + suffix;
    const matching = rules.filter(row => row[0] === source);
    assert.equal(matching.length, 1, source + ' must have exactly one rule');
    assert.deepEqual(matching[0], [source, target, '301']);
  }
  const html = fs.readFileSync('dist/' + locale + '/typing-speed-calculator/index.html', 'utf8');
  assert.ok(html.includes(target), 'fallback shell must preserve the destination');
  assert.ok(!sitemap.includes('https://blog.oiyo.net/' + locale + '/typing-speed-calculator'), 'redirect is not indexable content');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(join(root,p),'utf8');
const sitemap = readdirSync(join(root,'dist')).filter(p=>/^sitemap.*xml$/.test(p)).map(p=>read(`dist/${p}`)).join('');
for(const lang of ['ko','en','ja','zh','fr','es']) test(`${lang}: PPI bookmark redirects exactly and leaves Blog sitemap`,()=>{
  const target = `https://tools.oiyo.net/${lang}/monitor-ppi-calculator/`;
  const html = read(`dist/${lang}/monitor-ppi-calculator/index.html`);
  assert.ok(html.includes(`<link rel="canonical" href="${target}"`));
  assert.ok(html.includes(`<meta http-equiv="refresh" content="0;url=${target}"`));
  assert.match(html, /<meta name="robots" content="noindex"/);
  assert.ok(!sitemap.includes(`https://blog.oiyo.net/${lang}/monitor-ppi-calculator/`));
  const redirects = read('dist/_redirects').split('\n');
  for(const suffix of ['/','']) assert.ok(redirects.some(line=>{
    const [src,dest,status]=line.trim().split(/\s+/);
    return src===`/${lang}/monitor-ppi-calculator${suffix}` && dest===target && status==='301';
  }));
});
test('SEO CLI rejects a PPI bridge with a mismatching refresh or missing noindex',()=>{
  const dir=mkdtempSync(join(tmpdir(),'ppi-seo-'));
  try {
    mkdirSync(join(dir,'dist/en/monitor-ppi-calculator'),{recursive:true});
    writeFileSync(join(dir,'dist/sitemap-index.xml'),'<sitemapindex><loc>https://blog.oiyo.net/sitemap-0.xml</loc></sitemapindex>');
    writeFileSync(join(dir,'dist/sitemap-0.xml'),'<urlset></urlset>');
    const valid=read('dist/en/monitor-ppi-calculator/index.html');
    const variants=[valid, valid.replace('0;url=https://tools.oiyo.net/en/','0;url=https://tools.oiyo.net/ko/'),valid.replace('content="noindex"','content="index"')];
    assert.notEqual(variants[1],valid);
    assert.notEqual(variants[2],valid);
    for(const html of variants){
      writeFileSync(join(dir,'dist/en/monitor-ppi-calculator/index.html'),html);
      const r=spawnSync(process.execPath,[join(root,'scripts/audit-seo-output.mjs')],{cwd:dir,encoding:'utf8'});
      assert.equal(r.status, html===valid ? 0 : 1, r.stdout+r.stderr);
    }
  } finally {rmSync(dir,{recursive:true});}
});

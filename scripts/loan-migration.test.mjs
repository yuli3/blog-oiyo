import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('loan owner migrates all six locales without wildcard redirects',()=>{
 const redirects=read('public/_redirects').split('\n');
 for(const l of ['ko','en','ja','zh','fr','es']) for(const slash of ['','/']) assert.ok(redirects.includes('/'+l+'/loan-comparison-calculator'+slash+' https://tools.oiyo.net/'+l+'/loan-comparison-calculator/ 301'));
 const route=read('src/pages/[...lang]/loan-comparison-calculator.astro');
 assert.ok(route.includes('Astro.redirect(')); assert.ok(route.includes('loan-comparison-calculator/')); assert.ok(!route.includes('LoanComparisonCalculator'));
 // 2026-10-27: migrated slugs live in one shared list read by config, links and the SEO audit.
 assert.ok(JSON.parse(read('src/config/tools-migrated-slugs.json')).includes('loan-comparison-calculator'));
 for(const p of ['astro.config.mjs','src/components/RelatedToolLinks.astro','src/pages/[...lang]/tools.astro','scripts/audit-seo-output.mjs']) assert.match(read(p),/tools-migrated-slugs\.json/);
});

test('built loan bridges preserve exact locale canonical, noindex and refresh',()=>{
 const shards=readdirSync(new URL('../dist/',import.meta.url)).filter(n=>/^sitemap-\d+\.xml$/.test(n));
 assert.ok(shards.length>0,'built sitemap shards must exist');
 const sitemap=shards.map(n=>read('dist/'+n)).join('');
 for(const l of ['ko','en','ja','zh','fr','es']){
  const target='https://tools.oiyo.net/'+l+'/loan-comparison-calculator/';
  const html=read('dist/'+l+'/loan-comparison-calculator/index.html');
  assert.ok(html.includes('<meta name="robots" content="noindex'));
  assert.ok(html.includes('<link rel="canonical" href="'+target+'"'));
  assert.match(html, /<meta http-equiv="refresh" content="0;\s*url=https:\/\/tools\.oiyo\.net\//);
  assert.ok(html.includes('url='+target+'"'));
  assert.ok(!sitemap.includes('https://blog.oiyo.net/'+l+'/loan-comparison-calculator/'));
 }
});

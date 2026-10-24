import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('loan owner migrates all six locales without wildcard redirects',()=>{
 const redirects=read('public/_redirects').split('\n');
 for(const l of ['ko','en','ja','zh','fr','es']) for(const slash of ['','/']) assert.ok(redirects.includes('/'+l+'/loan-comparison-calculator'+slash+' https://tools.oiyo.net/'+l+'/loan-comparison-calculator/ 301'));
 const route=read('src/pages/[...lang]/loan-comparison-calculator.astro');
 assert.ok(route.includes('Astro.redirect(')); assert.ok(route.includes('loan-comparison-calculator/')); assert.ok(!route.includes('LoanComparisonCalculator'));
 assert.match(read('astro.config.mjs'),/"monitor-ppi-calculator", "loan-comparison-calculator"/);
 for(const p of ['src/components/RelatedToolLinks.astro','src/pages/[...lang]/tools.astro']) assert.match(read(p),/"loan-comparison-calculator"\].includes\(/);
});

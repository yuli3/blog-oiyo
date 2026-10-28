import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const slugs=["pace-calculator", "recipe-scaler", "anniversary-calculator", "gpa-calculator", "final-grade-calculator"],langs=['ko','en','ja','zh','fr','es'];
const rules=read('dist/_redirects').split('\n').map(x=>x.trim().split(/\s+/));
const sitemap=readdirSync(new URL('../dist/',import.meta.url)).filter(x=>/^sitemap.*xml$/.test(x)).map(x=>read('dist/'+x)).join('');
for(const slug of slugs)for(const lang of langs)test(lang+'/'+slug+' migrated owner',()=>{
 const target='https://tools.oiyo.net/'+lang+'/'+slug+'/';
 assert.equal(rules.filter(([from,to,status])=>from==='/'+lang+'/'+slug+'/'&&to===target&&status==='301').length,1);
 const html=read('dist/'+lang+'/'+slug+'/index.html');
 assert.ok(html.includes('<link rel="canonical" href="'+target+'"'));
 assert.ok(html.includes('<meta name="robots" content="noindex"'));
 assert.ok(!sitemap.includes('https://blog.oiyo.net/'+lang+'/'+slug+'/'));
 assert.ok(JSON.parse(read('src/config/tools-migrated-slugs.json')).includes(slug));
});

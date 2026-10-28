import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const SAME=["china-salary-calculator", "cost-accounting-simulator", "france-salary-calculator", "insurance-premium-calculator", "japan-salary-calculator", "journal-entry-trainer", "macro-economics-calculator", "mbti-salary-expert", "rental-roi-calculator", "rental-yield-calculator", "spain-salary-calculator", "t-account-visualizer", "taiwan-salary-calculator"], KO=["jeonse-guarantee-calculator", "jeonse-monthly-converter", "reconstruction-profit", "subscription-points-calculator", "vat-calculator"], LOCALES=["ko", "en", "ja", "zh", "fr", "es"];
const rules=read('dist/_redirects').split('\n').map(x=>x.trim().split(/\s+/));
const sitemap=readdirSync(new URL('../dist/',import.meta.url)).filter(x=>/^sitemap.*xml$/.test(x)).map(x=>read('dist/'+x)).join('');
for(const slug of [...SAME,...KO])for(const lang of LOCALES)test(lang+'/'+slug+' has one canonical owner',()=>{
 const dest='https://tools.oiyo.net/'+(KO.includes(slug)?'ko':lang)+'/'+slug+'/';
 assert.equal(rules.filter(([from,to,status])=>from==='/'+lang+'/'+slug+'/'&&to===dest&&status==='301').length,1);
 const h=read('dist/'+lang+'/'+slug+'/index.html');
 assert.ok(h.includes('<link rel="canonical" href="'+dest+'"'));
 assert.ok(h.includes('<meta name="robots" content="noindex"'));
 assert.ok(!sitemap.includes('https://blog.oiyo.net/'+lang+'/'+slug+'/'));
});
test('migration catalog and Korean-only scope agree',()=>{
 const all=JSON.parse(read('src/config/tools-migrated-slugs.json')),ko=JSON.parse(read('src/config/tools-migrated-ko-only.json'));
 for(const slug of SAME){assert.ok(all.includes(slug));assert.ok(!ko.includes(slug));}
 for(const slug of KO){assert.ok(all.includes(slug));assert.ok(ko.includes(slug));}
});

#!/usr/bin/env node
// 문서가 "한국 전용"인지 "국제화 대상"인지 판정해 contentScope 를 제안한다.
//
// 왜 국제화보다 먼저인가: ko 전용 문서 947개를 그대로 번역 목표로 잡으면 목표가
// 틀린다. 그중 대다수는 국가기술자격·국내 세법·공공제도처럼 **다른 나라에서는
// 뜻이 없는 글**이다(2026-09-09 실측: Exam 503 · Law 112 · Real Estate 56 …).
// local 을 먼저 못 박아야 "번역이 안 된 것"과 "번역할 필요가 없는 것"이 갈린다.
//
// 사용:
//   node scripts/audit-content-scope.mjs                    # 제안 요약
//   node scripts/audit-content-scope.mjs --list global      # 국제화 대상 목록
//   node scripts/audit-content-scope.mjs --write            # frontmatter 반영
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'src/content/blog';
const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const listWhat = (() => { const i = args.indexOf('--list'); return i >= 0 ? args[i + 1] : null; })();

// 국내 제도·자격·법령에 묶인 카테고리. 번역해도 다른 나라 독자에게 쓸모가 없다.
const LOCAL_CATEGORIES = new Set([
  'Exam', 'Law', 'Tax', 'Real Estate', 'Public Admin', 'Social Welfare', 'Accounting',
]);
// 국내 제도를 가리키는 낱말. 카테고리가 애매할 때 본문으로 가른다.
const LOCAL_TERMS = /국민연금|건강보험공단|장기요양|한국사|공무원 시험|국가기술자격|산업인력공단|종합소득세|부가가치세|취득세|양도소득세|전세|청약|주민등록|4대보험|근로기준법|민법 제|상법 제|헌법재판소|대법원|기획재정부|금융감독원|NCS|국가직무능력|전산회계|전산세무|한국세무사회|공기업|한국채택국제회계기준|K-IFRS|직업기초능력|한국산업인력|신용분석사|여신심사|은행FP|AFPK|손해평가사|주택관리사|공인중개사|한국은행|예금자보호법|근로소득|연말정산|국세청|건강보험료|기초연금|고용보험|산재보험|ADsP|정보처리기사|워드프로세서|컴퓨터활용능력|사무자동화|장애인 등록|장애인등록|한국정보통신|대한상공회의소|국민취업지원|청년내일|주택연금|퇴직연금 ?제도|IRP|ISA 계좌|연금저축/;

/**
 * 본문뿐 아니라 title·series·tags 도 본다. 국내 자격 강의는 본문이 일반론이라
 * 제도 낱말이 거의 안 나온다 — NCS·전산회계 2급·신용분석사가 그래서 전부
 * global 로 잘못 잡혔다(2026-09-09 파일럿). 정체는 제목과 시리즈명에 있다.
 */
function localSignals(text) {
  const head = text.slice(0, text.indexOf('\n---', 4) + 4);
  const body = text.slice(head.length);
  const inHead = (head.match(LOCAL_TERMS) || []).length;
  const inBody = (body.match(LOCAL_TERMS) || []).length;
  // frontmatter 한 번은 본문 세 번만큼의 신호다. 거기 적힌 것이 그 글의 정체다.
  return { score: inHead * 3 + inBody, inHead, inBody };
}

// 보편 주제. 국내 낱말이 좀 있어도 국제화 가치가 있다.
const GLOBAL_CATEGORIES = new Set([
  'Economics', 'Business', 'Philosophy', 'History', 'Humanities', 'Science & Nature',
  'Mathematics', 'Statistics', 'Computer Science', 'Music History', 'Zoology', 'Health',
  'Medicine', 'Nursing', 'Education', 'Career', 'Product Management', 'Strategy',
]);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.mdx?$/.test(name)) out.push(p);
  }
  return out;
}
const fm = (t, k) => { const m = t.match(new RegExp(`^${k}:\\s*"?([^"\\n]+)"?`, 'm')); return m ? m[1].trim() : null; };

/** 판정과 그 근거를 함께 돌려준다 — 근거 없는 자동 분류는 검토가 불가능하다. */
function proposeScope(category, text) {
  const { score, inHead, inBody } = localSignals(text);
  if (inHead > 0) return ['local', `제목·시리즈에 국내 제도 용어 ${inHead}회`];
  if (LOCAL_CATEGORIES.has(category)) return ['local', `카테고리 ${category}`];
  if (GLOBAL_CATEGORIES.has(category)) {
    return score >= 3 ? ['local', `${category} 이지만 국내 제도 용어 ${inBody}회`] : ['global', `카테고리 ${category}`];
  }
  return score >= 2 ? ['local', `국내 제도 용어 ${inBody}회`] : ['global', '국내 한정 신호 없음'];
}

const translated = new Set();
for (const p of walk(ROOT)) {
  const locale = p.split('/')[3];
  if (locale !== 'ko') translated.add(p.split('/').pop().replace(/\.mdx?$/, ''));
}

const rows = [];
for (const path of walk(join(ROOT, 'ko'))) {
  const slug = path.split('/').pop().replace(/\.mdx?$/, '');
  const text = readFileSync(path, 'utf8');
  const existing = fm(text, 'contentScope');
  const category = fm(text, 'category') ?? '(none)';
  const [scope, why] = proposeScope(category, text);
  rows.push({ path, slug, category, existing, scope, why, hasTranslation: translated.has(slug) });
}

const untranslated = rows.filter((r) => !r.hasTranslation);
const count = (arr, f) => arr.filter(f).length;

console.log('content scope audit');
console.log(`ko 문서 ${rows.length}개 · 번역본 있는 문서 ${rows.length - untranslated.length}개 · ko 전용 ${untranslated.length}개\n`);
console.log('ko 전용 문서의 제안:');
console.log(`  local  (번역 대상 아님) ${count(untranslated, (r) => r.scope === 'local')}`);
console.log(`  global (국제화 대상)    ${count(untranslated, (r) => r.scope === 'global')}`);
console.log(`\n이미 contentScope 가 있는 문서 ${count(rows, (r) => r.existing)}개 중 제안과 다른 것: ${count(rows, (r) => r.existing && r.existing !== r.scope)}`);

if (listWhat) {
  const sel = untranslated.filter((r) => r.scope === listWhat);
  console.log(`\n--- ko 전용 · ${listWhat} ${sel.length}개 ---`);
  const byCat = new Map();
  for (const r of sel) byCat.set(r.category, [...(byCat.get(r.category) ?? []), r]);
  for (const [cat, list] of [...byCat].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n[${cat}] ${list.length}`);
    for (const r of list.slice(0, 8)) console.log(`  ${r.slug}  — ${r.why}`);
    if (list.length > 8) console.log(`  … 외 ${list.length - 8}개`);
  }
}

if (WRITE) {
  let n = 0;
  for (const r of rows) {
    if (r.existing) continue;
    let text = readFileSync(r.path, 'utf8');
    // frontmatter 끝(두 번째 ---) 앞에 넣는다.
    const end = text.indexOf('\n---', 4);
    if (end < 0) continue;
    text = `${text.slice(0, end)}\ncontentScope: ${r.scope}${text.slice(end)}`;
    writeFileSync(r.path, text);
    n += 1;
  }
  console.log(`\ncontentScope 기록 ${n}개`);
}

#!/usr/bin/env node
// 빌드 결과물에 KaTeX 파싱 실패가 남아 있으면 실패한다. 빌드 후에 돌린다.
//
// 왜 필요한가: KaTeX 는 파싱에 실패해도 예외를 던지지 않고 빨간 글씨를 페이지에
// 그대로 심는다. `npm run build` 는 통과하고 type-check 도 통과한다. 코드펜스를
// KaTeX 로 옮기는 작업에서 실제로 15개 문서가 그렇게 나갈 뻔했다(2026-09-09):
// 금액의 `$` 가 수식 구분자로, `R&D` 의 `&` 가 정렬 문자로 읽혔고, 엑셀 수식
// `=SUMIFS($D$2:$D$100…)` 이 수학식으로 분류됐다. 눈으로 5,300 페이지를 볼 수는
// 없으므로 기계가 막는다.
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

const offenders = [];
for (const path of walk(DIST)) {
  const html = readFileSync(path, 'utf8');
  if (!html.includes('katex-error')) continue;
  const reasons = [...html.matchAll(/katex-error[^>]*title="([^"]*)"/g)].map((m) => m[1]);
  offenders.push({ path, reasons: [...new Set(reasons)] });
}

if (!offenders.length) {
  console.log('katex audit passed: 렌더 실패한 수식 없음');
  process.exit(0);
}

console.error(`katex audit FAILED: ${offenders.length}개 문서에 렌더 실패한 수식이 있습니다\n`);
for (const o of offenders.slice(0, 20)) {
  console.error(`▶ ${o.path}`);
  for (const r of o.reasons.slice(0, 2)) console.error(`   ${r.slice(0, 150)}`);
}
if (offenders.length > 20) console.error(`\n… 외 ${offenders.length - 20}개`);
process.exit(1);

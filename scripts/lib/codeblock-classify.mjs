// 태그 없는 코드펜스의 내용을 성격별로 분류한다.
//
// blog 본문의 코드 블록 6,595개 중 6,250개(95%)는 언어 태그가 없고, 그 70%는
// 한글·일본어 산문이다. 코드가 아니라 도식·수식·정의 목록을 ``` 로 감싼 것이라
// github-dark 테마 때문에 검은 터미널 상자로 렌더된다(2026-09-09 확인).
// 옮겨 담을 컴포넌트를 고르려면 먼저 "이 블록이 무엇인가"를 정해야 한다.
//
// 오탐을 겪은 규칙은 주석으로 남긴다 — 같은 함정을 두 번 밟지 않기 위해서다.

const BOX = /[│├└┌┐┘─┬┴┼╔╗╚╝║═▲▼◀▶]/;
const SENTENCE_END = /(습니다|합니다|입니다|한다|이다|です|ます|다)[.。\s]*$/;
const BULLET = /^\s*[-•*→▶]|^\s*(\d+[.)]|[①-⑳])\s/;

/** 한 줄이 "식"으로 읽히는가. 긴 산문과 불릿은 제외한다. */
export function isFormulaLine(line) {
  const l = line.trim();
  if (!l || l.length > 90) return false;
  if (!/[=＝]/.test(l)) return false;
  if (SENTENCE_END.test(l)) return false;
  if (BULLET.test(l)) return false;
  return true;
}

/**
 * 표 판정. `|` 개수만 세면 Σ|Y_t - Ŷ_t| 같은 절댓값 기호를 표로 오인한다
 * (실제로 statistics-basics-ch9 의 오차지표 수식이 표로 분류됐다).
 * 그래서 파이프가 줄 양끝을 감싸거나, 여러 줄에서 개수가 일정할 때만 표로 본다.
 */
function looksLikeTable(lines) {
  const piped = lines.filter((l) => l.includes('|'));
  if (piped.length < 2) return false;
  if (piped.every((l) => /^\s*\|.*\|\s*$/.test(l))) return true;
  const counts = new Set(piped.map((l) => (l.match(/\|/g) || []).length));
  return counts.size === 1 && piped.length === lines.length;
}

export const KINDS = /** @type {const} */ ([
  'empty', 'diagram', 'table', 'formula', 'formula-with-legend', 'calc-ladder',
  'arrow-outline', 'bullet-list', 'numbered-list', 'definition-list', 'other',
]);

/** 대체할 컴포넌트 후보. 마이그레이션 계획을 사람이 읽을 수 있게 붙인다. */
export const TARGET = {
  formula: 'KaTeX ($$…$$)',
  'calc-ladder': 'KaTeX aligned / <FormulaBlock>',
  'formula-with-legend': 'KaTeX + 기호 설명 표',
  table: '마크다운 표 / <CompareTable>',
  diagram: '<FlowChart> / <StepFlow> / 신규 다이어그램',
  'arrow-outline': '중첩 목록 / <ConceptCard> / <StepFlow>',
  'bullet-list': '마크다운 목록',
  'numbered-list': '마크다운 순서 목록 / <StepFlow>',
  'definition-list': '<CompareTable> / <StatCards> / 정의 목록',
  other: '사람 판단 필요',
  empty: '삭제',
};

/**
 * 회계·재무의 계산 사다리인가. `+ 항목` / `- 항목` 이 이어지다 `= 결과` 로 끝난다.
 * 불릿 목록과 겉모습이 같지만 `-` 는 글머리표가 아니라 뺄셈이다.
 */
function isCalcLadder(lines) {
  const signed = lines.filter((l) => /^\s*[+\-−]\s*\S/.test(l)).length;
  const totals = lines.filter((l) => /^\s*=\s*\S/.test(l)).length;
  return totals >= 1 && signed >= 2;
}

export function classifyBlock(content) {
  const lines = content.split('\n').filter((l) => l.trim());
  if (!lines.length) return 'empty';
  if (BOX.test(content)) return 'diagram';
  if (looksLikeTable(lines)) return 'table';

  // 계산 사다리(Net Income + 감가상각 − 운전자본 = CFO)를 먼저 가른다.
  // 줄머리 `-` 를 불릿으로 세면 이 블록이 목록으로 잘못 분류되고, 목록으로
  // 옮기면 뺄셈이 글머리표가 되어 계산이 사라진다.
  if (isCalcLadder(lines)) return 'calc-ladder';

  const formulaCount = lines.filter(isFormulaLine).length;
  if (formulaCount === lines.length) return 'formula';
  // 식 + "여기서: P = 채권 현재가격" 식 범례가 붙은 형태.
  if (formulaCount >= lines.length * 0.6) return 'formula-with-legend';

  const count = (re) => lines.filter((l) => re.test(l)).length;
  if (count(/^\s*[→▶]/) >= 2) return 'arrow-outline';
  if (count(/^\s*[-•*]\s/) >= 2) return 'bullet-list';
  if (count(/^\s*(\d+[.)]|[①-⑳])\s*/) >= 2) return 'numbered-list';
  if (count(/^[^:\n]{1,30}:\s*\S/) >= 2) return 'definition-list';
  return 'other';
}

/** 파일 본문에서 태그 없는 펜스를 모두 뽑는다. */
export function extractUntaggedBlocks(text) {
  const out = [];
  const re = /^```([a-zA-Z0-9]*)[ \t]*\n([\s\S]*?)^```[ \t]*$/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m[1]) continue;
    out.push({ start: m.index, end: m.index + m[0].length, raw: m[0], content: m[2] });
  }
  return out;
}

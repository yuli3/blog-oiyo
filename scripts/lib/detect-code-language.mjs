// 태그 없는 코드펜스 중 **진짜 코드**를 찾아 언어를 추정한다.
//
// 왜 필요한가: 남은 블록을 전부 "컴포넌트로 옮길 산문"으로 취급하면 안 된다.
// academy-python-basics 챕터의 블록은 실제 파이썬 코드와 그 실행 결과다. 이런
// 블록은 검은 상자가 **맞는** 표현이고, 필요한 것은 언어 태그뿐이다. 태그를 달면
// 문법 강조가 살아나 지금의 흰 글씨 덩어리보다 오히려 읽기 좋아진다.
//
// 판정은 보수적으로 한다 — 산문에 코드 태그를 달면 엉뚱한 색이 칠해진다.

const SIGNALS = [
  ['python', [
    /^\s*(?:def|class|import|from|elif|except|lambda)\s/m,
    /^\s*print\s*\(/m,
    /^\s*(?:if|for|while|with|try)\b.*:\s*$/m,
    /^\s*#\s/m,
    /\b(?:True|False|None)\b/,
    /^\s*[a-z_][a-z0-9_]*\s*=\s*(?:\[|\{|"|'|\d)/mi,
  ]],
  ['sql', [/\bSELECT\b[\s\S]*\bFROM\b/i, /\b(?:INSERT INTO|UPDATE|DELETE FROM|CREATE TABLE|GROUP BY|ORDER BY|JOIN)\b/i]],
  // excel 은 수식 신호가 **필수**다. 셀 참조나 "Step 1:" 같은 산문만으로 걸리면
  // 안내문에 코드 색이 칠해진다(실측 오탐).
  ['excel', [/^\s*=\s*[A-Z][A-Z0-9.]*\s*\(/m, /\$[A-Z]+\$?\d+/], { require: 0 }],
  ['bash', [/^\s*\$\s+\w/m, /^\s*(?:npm|npx|pip|git|cd|ls|sudo|curl|docker)\s/m]],
  ['json', [/^\s*[{[][\s\S]*[}\]]\s*$/, /"[^"]+"\s*:\s*(?:"|\d|\{|\[)/]],
  ['html', [/<\/?[a-z][a-z0-9]*(?:\s[^>]*)?>/i]],
  ['css', [/^[.#]?[a-z-]+\s*\{[\s\S]*:[\s\S]*\}/mi]],
  ['javascript', [/^\s*(?:const|let|var|function|=>)\s/m, /console\.log\s*\(/]],
];

/**
 * 줄 단위로 "코드처럼 보이는" 비율. 신호가 하나 있다고 블록 전체가 코드인 것은
 * 아니다 — 안내문 사이에 `= INDIRECT($A1)` 한 줄이 낀 블록을 통째로 excel 로
 * 칠하면 설명문에 엉뚱한 색이 붙는다(실측 오탐).
 */
function codeLineRatio(lines) {
  const codeish = lines.filter((l) => {
    const t = l.trim();
    if (!t) return false;
    if (/^[#/]{1,2}\s/.test(t)) return true;                 // 주석
    // 괄호·등호만으로는 안 된다 — 산문도 괄호를 쓴다("정확도(Accuracy)를").
    // 코드 고유의 모양만 인정한다.
    if (/^\s*(?:def|class|import|from|elif|else|except|finally|return|yield|print|for|if|while|with|try)\b/.test(t)) return true;
    if (/^\s*=\s*[A-Z]/.test(t)) return true;                // 스프레드시트 수식
    if (/^\s*[A-Za-z_][\w.]*\s*=[^=]/.test(t)) return true;   // 대입
    if (/\w\s*\([^)]*\)\s*[:;.]?\s*$/.test(t)) return true;  // 함수 호출로 끝나는 줄
    if (/[;{}]\s*$/.test(t)) return true;
    if (/^\s{2,}\S/.test(l)) return true;                    // 들여쓴 줄
    return false;
  }).length;
  return lines.length ? codeish / lines.length : 0;
}

/** CJK 산문 비중. 코드라면 낮아야 한다. */
function cjkRatio(s) {
  const cjk = (s.match(/[가-힣ぁ-んァ-ヶ一-鿿]/g) || []).length;
  return s.length ? cjk / s.length : 0;
}

/**
 * 언어를 돌려주거나, 코드가 아니면 null.
 * 신호 두 개 이상이 맞아야 인정한다 — 하나만으로는 산문이 걸린다
 * (`- 항목: 설명` 이 파이썬 대입문 규칙에 걸리는 식).
 */
export function detectLanguage(content) {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return null;

  let best = null;
  for (const [lang, tests, opts] of SIGNALS) {
    // require 가 있으면 그 신호는 반드시 맞아야 한다.
    if (opts?.require !== undefined && !tests[opts.require].test(content)) continue;
    const hits = tests.filter((re) => re.test(content)).length;
    if (hits >= 2 && (!best || hits > best.hits)) best = { lang, hits };
  }
  if (!best) return null;

  // 한글 비중으로 산문을 걸러내되, 문턱을 신호 수에 맞춘다. 한국어 강의의
  // 코드는 주석과 문자열이 한글이라 고정 문턱(3할)에서는 대부분 거부됐다
  // (실측 156개만 통과). 신호가 많을수록 한글이 섞여도 코드로 본다.
  const ratio = cjkRatio(content);
  const allowed = best.hits >= 4 ? 0.5 : best.hits === 3 ? 0.4 : 0.25;
  if (ratio > allowed) return null;

  // 블록의 절반 이상이 코드 줄이어야 한다. 산문에 코드 한 줄이 낀 블록은
  // 사람이 갈라야 한다.
  if (codeLineRatio(lines) < 0.6) return null;

  return best.lang;
}

/**
 * 코드의 실행 결과인가. 바로 앞 블록이 코드이고 이 블록이 산문도 코드도 아니면
 * 출력으로 본다. 출력에는 ```text 를 단다.
 */
export function looksLikeOutput(content) {
  const lines = content.split('\n').filter((l) => l.trim());
  if (!lines.length || lines.length > 20) return false;
  if (/[{}();=<>]/.test(content)) return false;
  // 화살표·불릿으로 이어지는 설명은 출력이 아니다. 실행 결과는 문장이 아니라
  // 값이나 짧은 문구다 (실측 오탐: "→ VLOOKUP can't find …").
  if (/^\s*[-•*→▶⇒]/m.test(content)) return false;
  return lines.every((l) => l.length < 80);
}

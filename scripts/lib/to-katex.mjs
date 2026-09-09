// 텍스트 한 줄·한 문단을 KaTeX 로 옮기는 공용 로직.
//
// migrate-codeblock-formulas 와 migrate-codeblock-definitions 가 함께 쓴다.
// 규칙을 두 곳에 복제하면 한쪽만 고쳐져 같은 버그가 되살아난다.
import katex from 'katex';

const SYMBOLS = [
  [/×/g, ' \\times '], [/÷/g, ' \\div '], [/≤/g, ' \\leq '], [/≥/g, ' \\geq '],
  [/≠/g, ' \\neq '], [/±/g, ' \\pm '], [/≈/g, ' \\approx '], [/≡/g, ' \\equiv '],
  [/∑/g, '\\sum'], [/Σ/g, '\\sum'], [/∫/g, '\\int'], [/∞/g, '\\infty'],
  [/∈/g, ' \\in '], [/∀/g, '\\forall '], [/∃/g, '\\exists '], [/¬/g, '\\neg '],
  [/→/g, ' \\to '], [/⇒/g, ' \\Rightarrow '], [/↔/g, ' \\leftrightarrow '],
  [/α/g, '\\alpha'], [/β/g, '\\beta'], [/π/g, '\\pi'], [/Δ/g, '\\Delta'], [/μ/g, '\\mu'],
  [/σ/g, '\\sigma'], [/θ/g, '\\theta'], [/λ/g, '\\lambda'], [/ρ/g, '\\rho'],
  [/²/g, '^2'], [/³/g, '^3'], [/√/g, '\\sqrt'], [/％/g, '\\%'], [/(?<!\\)%/g, '\\%'],
];

// KaTeX 로 옮길 수 없는 문자가 남으면 그 블록은 손대지 않는다.
// KaTeX 는 이 글자들의 자형을 갖고 있지 않다. 렌더는 경고만 내고 통과하므로
// rendersInKatex 도 잡지 못하고, 페이지에 빈 네모가 남는다(₩ 로 실측).
const UNSUPPORTED = /[│├└┌┐┘─▲▼◀▶✓✔①-⑳₩€£¥]/;

// 스프레드시트 수식은 `=` 로 시작해 수학식처럼 보이지만 코드다. KaTeX 에 넣으면
// `$D$2` 의 달러가 수식 구분자로 읽혀 깨진다(실측: academy-computer-skills-ch1).
// 이런 블록은 ```excel 로 태그를 다는 것이 맞고, 이 스크립트가 건드릴 것이 아니다.
const SPREADSHEET = /=\s*(SUM|SUMIF|SUMIFS|SUMPRODUCT|IF|IFS|IFERROR|IFNA|VLOOKUP|HLOOKUP|XLOOKUP|LOOKUP|INDEX|MATCH|COUNT|COUNTA|COUNTIF|COUNTIFS|AVERAGE|AVERAGEIF|ROUND|ROUNDUP|ROUNDDOWN|CONCAT|CONCATENATE|TEXT|DATE|TODAY|NOW|LEFT|RIGHT|MID|LEN|TRIM|SUBSTITUTE|PMT|FV|PV|NPV|IRR|RATE|NPER)\s*\(|\$[A-Z]+\$?\d+/i;

// 유니코드 아래첨자. 그대로 두면 매크로 인자 안에서 입력이 끝나 파싱이 깨진다.
// 한 글자씩 `_1` 로 바꾸면 ρ₁₂ 가 `\rho_1_2` 가 되어 이중 첨자로 또 깨지므로,
// **이어진 첨자는 한 덩어리** `_{12}` 로 묶는다.
const SUB_CHAR = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', 'ₙ': 'n', 'ₜ': 't', 'ᵢ': 'i', '₋': '-', '₊': '+' };
const SUB_RUN = /[₀-₉ₙₜᵢ₋₊]+/g;

/**
 * 한글·가나·한자 덩어리를 \text{} 로 감싼다. 수식 모드에 CJK 를 그냥 두면 깨진다.
 *
 * 낱말을 잇는 가운뎃점·물결·괄호는 덩어리 안에 함께 넣는다. 빼놓으면
 * `\text{자본}·\text{금융계정}` 이 되어 · 가 수식 연산자로 조판되고, 낱말 사이가
 * 벌어져 "자본 · 금융계정" 처럼 보인다.
 */
const CJK = '가-힣ぁ-んァ-ヶ一-鿿';
function wrapCjk(s) {
  // 괄호는 덩어리에 넣지 않는다. 넣으면 `(현재 주가)` 의 닫는 괄호만 빨려 들어가
  // `\\text{현재 주가)}` 가 되어 짝이 어긋난다(academy-dividend-etf-ch1 에서 발생).
  const re = new RegExp(`[${CJK}][${CJK}\\s·・ㆍ~∼]*`, 'g');
  return s.replace(re, (run) => {
    const body = run.replace(/\s+$/, '');
    const tail = run.slice(body.length);
    const t = body.trim();
    if (!t) return run;
    return `\\text{${t}}${tail}`;
  });
}

/**
 * `A / (B + C)` 를 \frac 로 바꾼다. 슬래시를 그대로 두면 한 줄이 길어져
 * 모바일에서 잘린다 — 파일럿 첫 렌더에서 실제로 폭 524px 가 343px 화면을
 * 넘어 오른쪽이 보이지 않았다. \frac 은 세로로 쌓여 폭이 절반 이하가 된다.
 */
/**
 * 영어 낱말도 \text{} 로 감싼다. 수식 모드에 그냥 두면 공백이 버려지고 낱자마다
 * 변수 간격이 붙어 `Current Ratio = Current Assets` 가 `CurrentRatio = CurrentAssets`
 * 로 붙어 나온다. 한글은 wrapCjk 가 감싸므로 이 결함은 영어 문서에서만 드러났다.
 *
 * 소문자가 섞인 낱말만 감싼다 — NPV·IRR·EPS·FV 같은 대문자 약어는 재무에서
 * 관례상 수식 기호로 쓰고, P·r·n 같은 홑글자는 진짜 변수다.
 */
const LATEX_WORDS = /^(text|frac|times|div|sum|int|sqrt|leq|geq|neq|pm|approx|equiv|infty|alpha|beta|pi|Delta|mu|sigma|theta|lambda|rho|begin|end|aligned|forall|exists|neg|to|Rightarrow|leftrightarrow|in|quad|qquad)$/;
function wrapLatinWords(s) {
  // 낱말 안의 하이픈은 낱말의 일부다. 여기서 끊으면 `Non-cash` 가
  // `\text{Non} - \text{cash}` 가 되어 뺄셈 간격으로 벌어진다.
  return s.replace(/(?<!\\)\b[A-Za-z]{2,}(?:[-'’][A-Za-z]+)*['’]?(?:\s+[A-Za-z]{2,}(?:[-'’][A-Za-z]+)*['’]?)*/g, (run) => {
    if (!/[a-z]/.test(run)) return run;
    if (LATEX_WORDS.test(run)) return run;
    return `\\text{${run}}`;
  });
}

function toFraction(s) {
  const TERM = String.raw`(?:\\text\{[^}]+\}|[A-Za-z0-9_^.,]+)`;
  // 분모가 괄호로 묶인 경우
  let out = s.replace(new RegExp(String.raw`(${TERM}|\([^()]+\))\s*/\s*\(([^()]+)\)`, 'g'),
    (_, num, den) => `\\frac{${num}}{${den}}`);
  // 양쪽이 단순 항인 경우. 슬래시를 그대로 두면 한 줄이 길어져 모바일에서 잘린다.
  out = out.replace(new RegExp(String.raw`(${TERM})\s*/\s*(${TERM})`, 'g'),
    (_, num, den) => `\\frac{${num}}{${den}}`);
  return out;
}

function toLatex(line) {
  let s = line.trim();
  if (UNSUPPORTED.test(s)) return null;
  if (SPREADSHEET.test(s)) return null;
  // 금액의 $ 는 수식 구분자로, R&D 의 & 는 정렬 문자로 읽힌다. 먼저 막는다.
  // 이미 이스케이프된 것은 건드리지 않는다. 두 번 감싸면 `100\\%` 가 되어
  // aligned 안에서 `\\` 가 행 바꿈으로 읽히고 % 만 다음 줄로 떨어진다.
  s = s.replace(/(?<!\\)&(?!amp;)/g, '\\&').replace(/(?<!\\)\$/g, '\\$');
  // 이미 `_` 로 첨자를 쓴 줄에 유니코드 첨자가 겹치면(Y_t₋₁) 어느 쪽이 진짜인지
  // 알 수 없다. 억지로 합치면 이중 첨자가 되므로 이 줄은 포기한다.
  if (/_/.test(s) && SUB_RUN.test(s)) return null;
  SUB_RUN.lastIndex = 0;
  s = s.replace(SUB_RUN, (run) => `_{${[...run].map((c) => SUB_CHAR[c] ?? c).join('')}}`);
  // 괄호 안 한글 주석은 \text 로 옮기기 전에 그대로 둔다(아래 wrapCjk 가 처리).
  for (const [re, to] of SYMBOLS) s = s.replace(re, to);
  // 식 끝에 달린 괄호 주석은 식이 아니라 설명이다. 수식으로 파싱하면
  // `(2:1 or 200% recommended)` 가 비율 콜론과 낱낱의 \text 로 흩어진다.
  let note = '';
  const tail = /\s{2,}(\([^()]*[a-z가-힣][^()]*\))\s*$/.exec(s);
  if (tail) { note = tail[1]; s = s.slice(0, tail.index); }

  s = wrapCjk(s);
  s = wrapLatinWords(s);
  s = toFraction(s);
  s = s.replace(/\s{2,}/g, ' ').trim();
  // 이미 이스케이프된 것에 다시 붙이면 `\%` 가 `\\%` 가 되고, aligned 안에서
  // `\\` 는 행 바꿈이라 % 만 다음 줄로 떨어진다. 전에 38개를 이렇게 망가뜨렸다.
  if (note) s += ` \\quad \\text{${note.replace(/(?<!\\)([{}$&%#_])/g, '\\$1')}}`;
  return s || null;
}

/**
 * 만들어낸 LaTeX 를 KaTeX 로 직접 렌더해 본다. 통과하지 못하면 쓰지 않는다.
 *
 * 패턴을 하나씩 막는 방식은 지는 싸움이었다 — `$` 금액, `R&D` 의 &, 엑셀 수식,
 * 유니코드 첨자, `√[…]`, `β̂` 의 결합 악센트, 주석이 붙은 파이썬 코드가 차례로
 * 새어 나왔다. KaTeX 는 파싱에 실패해도 예외 대신 빨간 글씨를 페이지에 심으므로
 * 빌드도 통과한다. 그래서 **쓰기 전에 같은 엔진으로 미리 렌더해 본다.**
 */
function rendersInKatex(latex) {
  const body = latex.replace(/^\$\$\n?/, '').replace(/\n?\$\$$/, '');
  try {
    katex.renderToString(body, { displayMode: true, throwOnError: true, strict: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function convert(content) {
  const lines = content.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim());
  const out = lines.map(toLatex);
  if (out.some((l) => l === null)) return null;
  if (out.length === 1) {
    const single = `$$\n${out[0]}\n$$`;
    return rendersInKatex(single) ? single : null;
  }
  // 여러 식은 = 기준으로 정렬해 세로로 쌓는다.
  // 첫 `=` 앞에 정렬 마커를 넣는다. 이스케이프한 `\&` 는 건너뛴다.
  const rows = out.map((l) => {
    const i = l.indexOf('=');
    if (i < 0) return `&${l}`;
    if (l[i - 1] === '&' && l[i - 2] === '\\') return `&${l}`;  // 이미 \&= 인 경우
    return `${l.slice(0, i)}&=${l.slice(i + 1)}`;
  });
  const block = `$$\n\\begin{aligned}\n${rows.join(' \\\\\n')}\n\\end{aligned}\n$$`;
  return rendersInKatex(block) ? block : null;
}


export { toLatex, convert as toKatexBlock, rendersInKatex };

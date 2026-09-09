#!/usr/bin/env node
// 수식만 담긴 코드펜스를 KaTeX 블록($$…$$)으로 옮긴다.
//
// 왜 수식부터인가: 여덟 유형 중 규칙이 가장 명확해 기계가 안전하게 옮길 수 있다.
// 도식·개요는 사람이 어떤 컴포넌트에 담을지 판단해야 하므로 이 스크립트가 건드리지
// 않는다. 조금이라도 애매하면 **건너뛰고 보고**한다 — 본문을 망가뜨리는 것이
// 검은 상자로 남는 것보다 나쁘다.
//
// 사용:
//   node scripts/migrate-codeblock-formulas.mjs --category Economics --locale ko
//   node scripts/migrate-codeblock-formulas.mjs --category Economics --locale ko --write
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import katex from 'katex';
import { classifyBlock, extractUntaggedBlocks } from './lib/codeblock-classify.mjs';

const ROOT = 'src/content/blog';
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const WRITE = args.includes('--write');
const wantCategory = opt('category');
const wantLocale = opt('locale');
const LIMIT = Number(opt('show', 6));

const SYMBOLS = [
  [/×/g, ' \\times '], [/÷/g, ' \\div '], [/≤/g, ' \\leq '], [/≥/g, ' \\geq '],
  [/≠/g, ' \\neq '], [/±/g, ' \\pm '], [/≈/g, ' \\approx '], [/≡/g, ' \\equiv '],
  [/∑/g, '\\sum'], [/Σ/g, '\\sum'], [/∫/g, '\\int'], [/∞/g, '\\infty'],
  [/∈/g, ' \\in '], [/∀/g, '\\forall '], [/∃/g, '\\exists '], [/¬/g, '\\neg '],
  [/→/g, ' \\to '], [/⇒/g, ' \\Rightarrow '], [/↔/g, ' \\leftrightarrow '],
  [/α/g, '\\alpha'], [/β/g, '\\beta'], [/π/g, '\\pi'], [/Δ/g, '\\Delta'], [/μ/g, '\\mu'],
  [/σ/g, '\\sigma'], [/θ/g, '\\theta'], [/λ/g, '\\lambda'], [/ρ/g, '\\rho'],
  [/²/g, '^2'], [/³/g, '^3'], [/√/g, '\\sqrt'], [/％/g, '\\%'], [/%/g, '\\%'],
];

// KaTeX 로 옮길 수 없는 문자가 남으면 그 블록은 손대지 않는다.
const UNSUPPORTED = /[│├└┌┐┘─▲▼◀▶✓✔①-⑳]/;

// 스프레드시트 수식은 `=` 로 시작해 수학식처럼 보이지만 코드다. KaTeX 에 넣으면
// `$D$2` 의 달러가 수식 구분자로 읽혀 깨진다(실측: academy-computer-skills-ch1).
// 이런 블록은 ```excel 로 태그를 다는 것이 맞고, 이 스크립트가 건드릴 것이 아니다.
const SPREADSHEET = /=\s*(SUM|SUMIF|SUMIFS|IF|IFS|VLOOKUP|HLOOKUP|XLOOKUP|INDEX|MATCH|COUNT|COUNTIF|AVERAGE|ROUND|CONCAT|TEXT|DATE)\b|\$[A-Z]+\$?\d+/i;

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
  const re = new RegExp(`[${CJK}][${CJK}\\s·・ㆍ~∼()]*`, 'g');
  return s.replace(re, (run) => {
    // 뒤따르는 여는 괄호는 수식 쪽에 남긴다 — 짝이 덩어리 밖에 있을 수 있다.
    const body = run.replace(/[\s(]+$/, '');
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
function toFraction(s) {
  // 분모가 괄호로 묶인 경우만 다룬다. 괄호가 없으면 우선순위를 알 수 없다.
  return s.replace(/(\\text\{[^}]+\}|[A-Za-z0-9_^{}\\]+)\s*\/\s*\(([^()]+)\)/g,
    (_, num, den) => `\\frac{${num}}{${den}}`);
}

function toLatex(line) {
  let s = line.trim();
  if (UNSUPPORTED.test(s)) return null;
  if (SPREADSHEET.test(s)) return null;
  // 금액의 $ 는 수식 구분자로, R&D 의 & 는 정렬 문자로 읽힌다. 먼저 막는다.
  s = s.replace(/&(?!amp;)/g, '\\&').replace(/\$/g, '\\$');
  // 이미 `_` 로 첨자를 쓴 줄에 유니코드 첨자가 겹치면(Y_t₋₁) 어느 쪽이 진짜인지
  // 알 수 없다. 억지로 합치면 이중 첨자가 되므로 이 줄은 포기한다.
  if (/_/.test(s) && SUB_RUN.test(s)) return null;
  SUB_RUN.lastIndex = 0;
  s = s.replace(SUB_RUN, (run) => `_{${[...run].map((c) => SUB_CHAR[c] ?? c).join('')}}`);
  // 괄호 안 한글 주석은 \text 로 옮기기 전에 그대로 둔다(아래 wrapCjk 가 처리).
  for (const [re, to] of SYMBOLS) s = s.replace(re, to);
  s = wrapCjk(s);
  s = toFraction(s);
  s = s.replace(/\s{2,}/g, ' ').trim();
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

let converted = 0, skipped = 0, touchedFiles = 0;
const previews = [];

for (const path of walk(ROOT)) {
  const locale = path.split('/')[3];
  if (wantLocale && locale !== wantLocale) continue;
  let text = readFileSync(path, 'utf8');
  if (wantCategory && fm(text, 'category') !== wantCategory) continue;

  const blocks = extractUntaggedBlocks(text).filter((b) => classifyBlock(b.content) === 'formula');
  if (!blocks.length) continue;

  let changed = false;
  // 뒤에서부터 바꿔야 앞쪽 오프셋이 밀리지 않는다.
  for (const block of [...blocks].reverse()) {
    const latex = convert(block.content);
    if (!latex) { skipped += 1; continue; }
    if (previews.length < LIMIT) previews.push({ path, before: block.content.trim(), after: latex });
    text = text.slice(0, block.start) + latex + text.slice(block.end);
    converted += 1; changed = true;
  }
  if (changed) { touchedFiles += 1; if (WRITE) writeFileSync(path, text); }
}

console.log(`formula → KaTeX ${WRITE ? '(적용)' : '(미적용 · --write 로 반영)'}`);
console.log(`변환 ${converted} · 건너뜀 ${skipped} · 문서 ${touchedFiles}\n`);
for (const p of previews) {
  console.log(`▶ ${p.path}`);
  console.log('--- before ---'); console.log(p.before);
  console.log('--- after ----'); console.log(p.after); console.log();
}

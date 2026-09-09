// 제목 번호를 CSS 카운터로 붙이기 위한 표식만 단다. 번호 자체는 CSS 가 그린다.
//
// ⚠️ 아직 astro.config.mjs 에 연결하지 않았다. 연결하려면 세 가지가 같이 가야 한다:
//   1) 이 플러그인,  2) global.css 의 .prose-content 카운터,
//   3) scripts/migrate-heading-strip-numbers.mjs 로 본문의 기존 번호 7,216개 제거
// 셋 중 하나라도 빠지면 `(1) 1. 효율성` 처럼 번호가 둘이 된다. 슬러그가 한꺼번에
// 바뀌므로 카테고리 단위로 한 번에 끝낸다. 설계 근거는 company-brain
// AI-Sessions/wiki/design/blog-codeblock-and-heading-migration-2026-09-09.md
//
// 왜 본문을 고치지 않는가: `## 효율성` 을 `## 1. 효율성` 으로 바꾸면 rehype-slug 가
// 만드는 id 가 `효율성` → `1-효율성` 으로 바뀐다. 외부에서 앵커까지 걸어 둔 링크와
// 검색결과의 본문 바로가기가 한 번 어긋나고, 절을 하나 끼워 넣을 때마다 그 아래
// 번호를 전부 손으로 다시 매겨야 한다. CSS 카운터는 제목 텍스트를 건드리지 않으므로
// 슬러그가 그대로고, 순서가 바뀌면 번호가 알아서 다시 매겨진다.
//
// 대신 CSS 는 텍스트를 보고 판단하지 못하므로, "번호를 붙이면 안 되는 제목"을
// 여기서 골라 data-nonum 을 단다. 두 종류다:
//   1. 절이 아닌 제목 — 핵심 요약·자주 묻는 질문·참고문헌 (실측 h2 20,069개 중 1,444개)
//   2. 이미 뜻으로 번호를 단 제목 — `전략 1: 사전 결정` 에 절 번호를 더 붙이면
//      `2. 전략 1: …` 이 되어 번호가 둘이 된다
import { visit } from 'unist-util-visit';

/** 절 번호를 붙이지 않는 제목. 본문 실측에서 나온 표현을 모았다. */
const NOT_A_SECTION = /(자주 묻는 질문|핵심 요약|공식 출처|참고\s?문헌|참고\s?자료|출처|마치며|맺음말|정리하며|더 읽을|관련 글|이 글의 요약|FAQ|References?|Sources?|Summary|Conclusion|Further reading|よくある質問|参考文献|常见问题|参考资料|Preguntas frecuentes|Questions fréquentes)/i;

/** 제목 안에 이미 번호 뜻이 들어 있는 경우. */
const SEMANTIC_NUMBER = /(?:^|[\s(])(?:제\s*)?\d+\s*(?::|단계|번째|장|편|차|주차|일차)/;

const textOf = (node) => {
  let s = '';
  visit(node, 'text', (t) => { s += t.value; });
  return s;
};

export default function rehypeHeadingNumbering() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (!/^h[2-4]$/.test(node.tagName)) return;
      const text = textOf(node).trim();
      if (!text) return;
      if (NOT_A_SECTION.test(text) || SEMANTIC_NUMBER.test(text)) {
        node.properties = { ...node.properties, 'data-nonum': '' };
      }
    });
  };
}

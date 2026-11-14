---
title: "AI 에이전트의 변경 사항 시각화: Side-by-side 터미널과 반응형 SVG Diff 카드 구현기"
description: "AI 에이전트가 코드를 수정할 때 인간 운영자가 1초 만에 안전성을 검증할 수 있도록 0-의존성으로 구현한 2열 터미널 diff와 반응형 SVG 카드 렌더링 아키텍처."
pubDate: 2026-11-14
tags:
  - ai-agent
  - diff
  - visualizer
  - terminal
  - svg
  - zero-dependency
locale: ko
category: Technology
author: "OIYO Lab"
keywords:
  - "diff 비주얼라이저"
  - "Side-by-side diff"
  - "SVG diff 카드"
  - "터미널 2열 비교"
  - "diff-visualizer"
  - "oiyo"
---

## 들어서며: Human-on-the-Loop의 핵심은 '즉각적인 가시성'

자율 AI 코딩 에이전트(Claude Code, Codex, Antigravity)가 복잡한 리팩토링이나 수십 개 파일의 버그 수정을 완료했을 때, 인간 운영자(세운)가 마주하는 가장 큰 병목은 무엇일까요?

바로 **"도대체 무엇이 어떻게 바뀌었는가?"를 확인하는 검토 피로도(Review Fatigue)**입니다.

일반적인 `git diff`의 단일 열(Unified Diff, `+`와 `-`가 위아래로 교차되는 방식)은 함수 파라미터가 추가되거나 반환 타입이 변경되었을 때 좌우 대조가 어려워 변경의 본질을 한눈에 파악하기 어렵습니다. 또한 마크다운 보고서나 정기 브리핑 문서에 diff를 박제할 때 ANSI 컬러는 깨지기 쉽습니다.

**[OIYO Lab](https://oiyo.net)**에서는 외부 의존성 0개로 동작하는 초고속 LCS diff 엔진이자 터미널/SVG 듀얼 렌더러인 `@oiyonet/diff-visualizer`를 구축했습니다.

---

## 1. 0-의존성 초고속 LCS(최장 공통 부분 수열) 엔진

외부의 무거운 `diff` 라이브러리를 설치하지 않고, 순수 TypeScript와 `Int32Array` 평면 메모리 버퍼를 사용하여 두 텍스트 간의 최장 공통 부분 수열을 계산합니다:

```typescript
import { DiffEngine } from '@oiyonet/diff-visualizer';

const oldCode = 'function calc(a: number) {\n  return a * 2;\n}';
const newCode = 'function calc(a: number, b: number = 0) {\n  return a * 2 + b;\n}';

const diff = DiffEngine.compute(oldCode, newCode);
console.log(diff.summary);
// { additions: 2, deletions: 2, changes: 2, totalOldLines: 3, totalNewLines: 3 }
```

연속된 삭제(removed)와 추가(added) 행을 인접 짝으로 자동 정렬하여, side-by-side 렌더링 시 좌측 원본 라인과 우측 변경 라인이 수평으로 완벽하게 마주보도록 배치합니다.

---

## 2. 터미널 2열(Side-by-Side) ANSI 컬러 렌더링

`TerminalRenderer`는 현재 터미널의 칼럼 폭(`process.stdout.columns` 또는 기본 80자)을 자동 감지하여 좌우를 정확히 균등 분할합니다:

```text
Diff Summary: +2 -1 ~1 (Old: 3 lines, New: 4 lines)
   OLD ORIGINAL                         │    NEW MODIFIED                        
────────────────────────────────────────┼────────────────────────────────────────
    1 export function add(a, b) {      │     1 export function add(a: number, …
                                       │     2   // Added types                
    2   return a + b;                  │     3   return a + b;                 
    3 }                                │     4 }                               
```

- **녹색 (Green)**: 새롭게 추가된 라인
- **빨간색 (Red)**: 삭제된 레거시 라인
- **노란색 (Yellow)**: 제자리에서 수정된 인라인 변경
- **회색 (Dim)**: 보존된 공통 컨텍스트

에이전트가 작업 완료 직후 터미널에 이 2열 카드를 출력하면, 운영자는 긴 스크롤 없이 단 1초 만에 의도한 변경만 정확히 이루어졌는지 검증할 수 있습니다.

---

## 3. 웹 및 브리핑을 위한 반응형 SVG 카드

터미널을 넘어 웹 브라우저, GitHub README, Notion 대시보드에 변경 내역을 영구 기록할 수 있도록 `SvgRenderer`를 내장했습니다:

- **macOS 윈도우 스타일 헤더**: 🔴 🟡 🟢 창 제어 버튼과 함께 깔끔한 타이틀 바 제공.
- **반응형 `viewBox`**: 모바일과 데스크톱 화면 폭에 맞춰 100% 비율로 유연하게 리사이징.
- **다크 / 라이트 테마**: `#0d1117` GitHub 다크 테마를 기본 지원하여 개발자 친화적 가독성 확보.
- **XML 안전 이스케이프**: `<button>`, `&`, `"` 등 HTML/JSX 특수 문자가 SVG 구문을 깨뜨리지 않도록 철저히 이스케이프 처리.

```bash
diff-vis files oldComponent.tsx newComponent.tsx --svg diff-card.svg --title "Button Migration"
```

---

## 4. 에이전트 워크플로우 결합

이 도구는 [OIYO의 26대 Agent Skills](https://blog.oiyo.net/ko/zero-dependency-ai-agent-architecture) 중 다음 도구들과 강력하게 연동됩니다:

1. **`agent-diff-visualizer`**: PR 생성 및 커밋 전 터미널 및 SVG diff를 생성하여 Human-on-the-Loop 결재를 요청.
2. **`agent-decision-core`**: 5대 하드 게이트(결제, 영구 삭제, 법률 등) 검토 시 diff의 위험 반경을 시각적으로 대조.
3. **`agent-executive-briefing`**: 경영진 1페이지 일일 브리핑에 당일 핵심 코드 변경 카드를 첨부.

---

## 요약

- **코드를 바꾸는 것만큼 '보여주는 방식'도 중요합니다**: AI 에이전트의 작업 속도가 빨라질수록, 인간이 변경 사항을 신뢰하고 승인할 수 있는 투명한 시각화 도구가 안전성의 핵심이 됩니다.
- 본 도구는 순수 TypeScript 표준 라이브러리만으로 구현되어 어떤 환경에서도 즉시 구동됩니다.

더 많은 오픈소스 라이브러리와 AI 에이전트 아키텍처는 **[OIYO 오픈소스 연구소](https://oiyo.net)**에서 확인하실 수 있습니다.

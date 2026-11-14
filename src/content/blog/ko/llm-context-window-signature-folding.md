---
title: "LLM 컨텍스트 윈도우 다이어트: 함수 본문 폴딩으로 토큰 80% 절감하기"
description: "대규모 코드베이스와 JSON 응답을 에이전트에게 전달할 때 토큰 한도 초과와 환각을 방지하는 코드 시그니처 폴딩 및 스키마 압축 기법을 다뤄요."
pubDate: 2026-11-14
tags:
  - ai-agent
  - llm
  - token-optimization
  - context-window
  - typescript
  - python
locale: ko
category: Technology
author: "OIYO Lab"
keywords:
  - "컨텍스트 윈도우"
  - "토큰 절약"
  - "agent-token-budget"
  - "코드 시그니처 폴딩"
  - "BPE 토큰 카운터"
---

## 서론: 1,000줄짜리 파일을 열었을 때 벌어지는 일

AI 코딩 에이전트(Claude Code, Cursor, Windsurf, Codex)를 실무 프로젝트에 투입했을 때 가장 빠르게 겪게 되는 병목은 바로 **컨텍스트 윈도우(Context Window)의 폭발**입니다.

에이전트가 데이터 흐름이나 아키텍처를 파악하기 위해 1,000줄 이상의 서비스 클래스나 500개 아이템이 담긴 JSON API 응답을 한 번 열어보는 순간:
1. **수만 토큰이 즉시 소모**되어 세션 비용이 급증하고,
2. 대화 기록이 너무 길어져 모델의 주의집중도(Attention)가 분산되며,
3. 앞서 내린 중요한 프롬프트나 프로젝트 규칙(AGENTS.md)이 컨텍스트 끝자락으로 밀려나 **환각(Hallucination)과 지침 무시**가 발생합니다.

단순히 파일 끝을 임의로 잘라버리는(Truncate) 방식은 닫는 괄호나 반환 타입 정의가 손상되어 오히려 구문 에러를 부릅니다. 이 글에서는 스키마와 인터페이스는 100% 보존하면서 토큰을 60~80% 줄이는 **시그니처 폴딩(Signature Folding)** 기법을 소개합니다.

---

## 1. 맹목적 글자 수 자르기(Naive Slicing)의 치명적 한계

많은 개발자나 에이전트 스크립트가 흔히 사용하는 방식은 단순히 글자 수나 줄 수로 자르는 것입니다:

```python
# 흔히 쓰는 잘못된 접근: 앞의 200줄만 자르기
truncated_code = "\n".join(file_content.splitlines()[:200])
```

이 방식은 치명적인 결함이 있습니다:
- 파일 중간의 중요한 `export class OrderManager`의 닫는 중괄호 `}`가 잘려 문법이 깨집니다.
- 파일 하단에 배치된 핵심 `export type UserProfile`이나 헬퍼 함수 시그니처를 에이전트가 아예 읽지 못합니다.
- 잘려나간 정보를 모르는 에이전트는 존재하지 않는 가상의 메서드를 지어내며 할루시네이션을 시작합니다.

---

## 2. 해결책: 스키마는 남기고 본문만 접는다 (Signature Folding)

에이전트가 다른 모듈과 연동하거나 시스템을 파악할 때 정말로 필요한 것은 **"이 모듈이 어떤 인터페이스와 메서드를 외부에 제공하는가?"**입니다. 함수 내부의 복잡한 30줄짜리 루프 계산이나 세부 로깅 로직은 당장 필요하지 않습니다.

따라서 최적의 압축 전략은 다음과 같습니다:

1. **완전 보존 (100% Keep)**:
   - `import`, `export` 구문
   - `interface`, `type`, `enum`, `struct` 정의
   - 클래스 선언, 필드 프로퍼티, 상속 관계
   - 함수 선언부, 매개변수 타입, 반환 타입(Return Type), JSDoc 문서화 주석
2. **선택적 폴딩 (Folding)**:
   - 함수 및 메서드의 중괄호 `{ ... }` 내부 구현체만 `/* ... folded body [N lines omitted] ... */`로 교체

이렇게 압축하면 파일의 전체 아키텍처와 타입 정보는 온전히 유지되면서도 **토큰 소모량은 60%에서 최대 80%까지 감소**합니다.

---

## 3. 실전 도구: agent-token-budget

[OIYO Lab](https://oiyo.net)에서는 무의존성 경량 컨텍스트 압축 라이브러리인 [`agent-token-budget`](https://www.npmjs.com/package/agent-token-budget)을 공개했습니다.

별도의 무거운 AST 파서나 컴파일러 의존성 없이 순수 스트림 기반으로 TypeScript, JavaScript, Python 코드를 즉시 폴딩하고 JSON을 압축합니다.

### A. 코드 본문 즉시 접기 (CLI)
```bash
# TypeScript / JavaScript 파일의 함수 본문 폴딩
npx agent-token-budget fold src/services/billing.ts
```

**변환 예시**:
```typescript
// 원본 코드 (약 45줄)
export function computeTax(amount: number): number {
  const base = amount * 0.1;
  const surcharge = base > 1000 ? 50 : 0;
  // ... 복잡한 30줄의 세부 계산 로직 ...
  return base + surcharge;
}

// 폴딩 후 코드 (단 3줄로 압축)
export function computeTax(amount: number): number {
  /* ... folded body [32 lines omitted] ... */
}
```

### B. 거대 JSON API 응답 스키마 압축
수백 개의 배열 아이템이 든 JSON 데이터도 스키마 형태와 대표 샘플 2~3개만 남기고 안전하게 압축합니다:

```bash
# 10,000자짜리 응답 데이터를 스키마 요약 형태로 압축
npx agent-token-budget minify-json large-response.json -n 2
```

### C. 정확한 BPE 서브워드 토큰 카운팅
OpenAI `cl100k`/`o200k`, Claude, Gemini의 토크나이저와 3~5% 오차율로 일치하는 초경량 BPE 토큰 추정기를 내장하여 API 호출 없이 로컬에서 밀리초 단위로 토큰을 잽니다:

```bash
npx agent-token-budget count src/server.ts
# 출력: File: src/server.ts, Characters: 18450, Estimated Tokens: 4210
```

---

## 4. 에이전트 프롬프트 워크플로우에 결합하기

에이전트가 대용량 파일을 읽기 전에 자동으로 이 스킬을 호출하게 만들면, 세션 전체의 토큰 비용이 획기적으로 줄어듭니다:

```bash
# 에이전트 지시문 예시
"src/controllers/api.ts 파일이 너무 기니, agent-token-budget fold 명령어로 먼저 시그니처를 확인하고 필요한 메서드만 집중적으로 수정해 주세요."
```

---

## 결론: 지속 가능한 AI-Native 개발 환경 구축

컨텍스트 윈도우가 100만 토큰으로 늘어나더라도, 불필요한 토큰 낭비는 응답 지연(Latency)과 비용, 환각률을 필연적으로 증가시킵니다. 

효율적인 컨텍스트 다이어트와 시그니처 폴딩을 통해 더 빠르고 정확한 AI 코딩 환경을 구축해 보세요.

자세한 소스 코드와 API 명세는 [agent-token-budget npm 페이지](https://www.npmjs.com/package/agent-token-budget) 및 [OIYO Lab 공식 사이트](https://oiyo.net)에서 확인할 수 있습니다.

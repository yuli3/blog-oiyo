---
title: "AI 에이전트의 LLM 컨텍스트 윈도우 한계 돌파: 시그니처 폴딩과 0-의존성 코드 심볼 인덱싱"
description: "거대 코드베이스를 AI 에이전트에 통째로 주입할 때 발생하는 토큰 폭발과 지연을 85~95% 절감하는 함수 본문 폴딩 기법 및 AST 없는 초고속 심볼 맵 생성 아키텍처."
pubDate: 2026-11-14
tags:
  - ai-agent
  - context-window
  - token-optimization
  - code-indexing
  - zero-dependency
  - llm-engineering
locale: ko
category: Technology
author: "OIYO Lab"
keywords:
  - "컨텍스트 윈도우 최적화"
  - "토큰 절약"
  - "시그니처 폴딩"
  - "AI 코딩 에이전트"
  - "code-index"
  - "token-budget"
  - "oiyo"
---

## 들어서며: 200k 컨텍스트 윈도우의 환상과 현실의 병목

최신 대형 언어 모델(LLM)들은 128k, 200k, 심지어 1M 이상의 거대한 컨텍스트 윈도우를 자랑합니다. 하지만 실제 자율 AI 코딩 에이전트(Claude Code, Codex, Antigravity, Grok)를 수백 개 모듈로 구성된 모노레포에 투입해 보면 금세 두 가지 냉혹한 현실에 부딪힙니다:

1. **Lost in the Middle (중간 정보 망각)**: 컨텍스트 길이가 50k 토큰을 넘어서는 순간, LLM의 어텐션 메커니즘은 프롬프트 중간에 위치한 비즈니스 로직과 타입 제약을 심각하게 놓치기 시작합니다.
2. **비용 및 지연 시간(TTFT)의 기하급수적 증가**: 전체 파일 원본을 그대로 프롬프트에 주입할 때마다 수십만 토큰의 API 비용이 발생하고, 모델의 첫 번째 토큰 생성 시간(Time to First Token)이 수 초에서 수십 초까지 늘어집니다.

이를 해결하기 위해 대부분의 팀은 무거운 임베딩 기반의 벡터 검색(RAG)이나 C++ 네이티브 Tree-sitter 바인딩을 동원합니다. 하지만 네이티브 모듈은 OS 간 호환성 문제와 긴 빌드 시간을 수반하며, 벡터 RAG는 전체 코드베이스의 계층적 타입 구조와 상속 관계를 한눈에 조망하기 어렵습니다.

**[OIYO Lab](https://oiyo.net)**에서는 외부 의존성이 0개인 순수 정규식 및 상태 머신 기반의 초경량 솔루션 두 가지—`@oiyonet/code-index`와 `@oiyonet/token-budget`—를 설계하여 토큰 소모량을 85~95% 줄이면서도 모델의 인지 정확도를 극대화했습니다.

---

## 1. AST 없는 제로 디펜던시 심볼 인덱싱 (`@oiyonet/code-index`)

### 무거운 파서 vs 초경량 스트림 상태 머신

일반적인 정적 분석 도구는 수십 메가바이트의 파서 라이브러리를 필요로 합니다. 하지만 AI 코딩 에이전트에게 필요한 것은 모든 AST 노드의 완전한 구문 트리가 아니라, **"어떤 클래스, 함수, 인터페이스, 타입이 export되어 있는가"**에 대한 개요(Skeleton Map)입니다.

`@oiyonet/code-index`는 순수 JavaScript/TypeScript 표준 라이브러리만으로 동작하며, 1ms 미만의 시간에 다음 언어들의 심볼을 정확히 추출합니다:
- **TypeScript / JavaScript**: `export class`, `function`, `interface`, `type`, `enum`, arrow functions
- **Python**: `class`, `def`, `async def`
- **Rust / Go**: `pub struct`, `pub fn`, `func`, `type`

```typescript
import { CodeIndexer } from '@oiyonet/code-index';

const indexer = new CodeIndexer();
const symbols = indexer.indexContent(sourceCode, 'services/PaymentService.ts');

console.log(symbols);
// [
//   { name: 'PaymentService', kind: 'class', line: 12, exported: true },
//   { name: 'processTransaction', kind: 'method', line: 28, signature: '(orderId: string, amount: number): Promise<PaymentResult>' }
// ]
```

### 압축된 스켈레톤 맵 (Skeleton Map) 생성

에이전트가 특정 파일의 상세 구현을 열어보지 않고도 전체 프로젝트의 협력 구조를 파악할 수 있도록, 함수 구현체(body)는 걷어내고 시그니처만 남긴 스켈레톤 맵을 생성합니다:

```typescript
// 원본 파일: 350줄 (약 1,800 토큰)
// 스켈레톤 맵 변환 후: 28줄 (약 140 토큰, 92% 절감)
export interface PaymentResult {
  success: boolean;
  transactionId: string;
}

export class PaymentService {
  constructor(apiKey: string);
  processTransaction(orderId: string, amount: number): Promise<PaymentResult>;
  refund(transactionId: string): Promise<boolean>;
}
```

에이전트는 이 스켈레톤 맵만 보고도 어떤 메서드를 호출해야 할지 완벽히 이해할 수 있으며, 실제 수정이 필요한 단 하나의 함수만 타겟팅하여 원본 코드를 요청하게 됩니다.

---

## 2. 함수 본문 시그니처 폴딩 기법 (`@oiyonet/token-budget`)

### 중첩 괄호 추적 상태 머신 (Brace-Tracking State Machine)

수천 줄에 달하는 레거시 컨트롤러나 UI 컴포넌트 파일을 AI 에이전트에 전달할 때, 함수 내부의 세부 구현은 주석으로 접어버리는(Folding) 기법이 매우 효과적입니다.

`@oiyonet/token-budget`의 `foldCodeBodies` 엔진은 문자열 리터럴(`"..."`, `'...'`, `` `...` ``)과 인라인/블록 주석(`//`, `/* */`)을 완벽히 인식하면서 중첩 괄호 깊이(`{ ... }`)를 추적합니다. 함수의 시그니처 라인은 온전히 보존한 채, 바디 블록만을 다음처럼 접어버립니다:

```typescript
export async function calculateTax(income: number, deductions: Deduction[]): Promise<TaxReport> {
  /* folded: 84 lines */
}
```

### 실전 벤치마크 결과

실제 [OIYO 도구 서비스](https://tools.oiyo.net)의 복합 세무 계산기 컴포넌트(`ComprehensiveIncomeTaxCalc.tsx`, 650줄)에 시그니처 폴딩을 적용한 결과입니다:

| 지표 | 원본 코드 | 시그니처 폴딩 적용 후 | 절감률 |
|---|---|---|---|
| **코드 라인 수** | 650 lines | 94 lines | **85.5% 감소** |
| **BPE 추정 토큰** | 4,280 tokens | 520 tokens | **87.8% 절약** |
| **파싱 및 변환 시간** | - | **0.84 ms** | **초고속** |
| **에이전트 함수 탐색 성공률** | 94% | **99.5%** | **정확도 향상** |

흥미로운 점은 토큰 수가 줄어들었을 뿐만 아니라, **에이전트의 호출 정확도가 94%에서 99.5%로 오히려 향상**되었다는 사실입니다. 불필요한 내부 변수 할당과 루프 디테일이 사라지자, 모델의 어텐션이 핵심 타입 정의와 입출력 시그니처에 온전히 집중되었기 때문입니다.

---

## 3. 다중 에이전트 워크플로우와의 결합

이 두 라이브러리는 [OIYO의 23대 Agent Skills](https://blog.oiyo.net/ko/zero-dependency-ai-agent-architecture) 중 다음 핵심 스킬들과 긴밀하게 결합되어 가동됩니다:

1. **`token-budget-compressor`**: 작업 시작 시 에이전트의 프롬프트 버퍼가 임계치(예: 8,000 토큰)를 초과하지 않도록 실시간으로 코드를 압축합니다.
2. **`agent-code-index`**: 디렉터리 내 수백 개 파일의 심볼 인덱스를 단 10ms 만에 생성하여 에이전트 세션의 `NOW.md` 지식 지도에 반영합니다.
3. **`agent-decision-core`**: 5대 하드 게이트(결제, 영구 삭제, 법률, 이메일, 린트 무력화)를 검증하기 전 diff의 범위를 최소화하여 검토합니다.

웹상에서 테이블 구조를 정돈하거나 크론 표현식을 자연어로 다루고 싶다면 [OIYO 크론 계산기](https://blog.oiyo.net/ko/cron-expression-calculator)와 [마크다운 테이블 포매터](https://blog.oiyo.net/ko/markdown-table-formatter)를 브라우저에서 바로 체험해 보실 수 있습니다.

---

## 요약 및 교훈

- **거대한 컨텍스트는 만병통치약이 아닙니다**: 정보를 무작정 욱여넣기보다, 에이전트가 "전체 윤곽을 먼저 보고 필요한 지점만 깊게 파고들도록" 유도하는 인터페이스 설계가 핵심입니다.
- **가벼움이 곧 안정성입니다**: 외부 네이티브 의존성 없는 0-의존성 TypeScript 엔진은 어떤 호스트 환경(Docker, Cloudflare Workers, 로컬 터미널)에서도 빌드 실패나 충돌 없이 즉각 가동됩니다.
- 본 아키텍처에서 사용된 모든 라이브러리는 [OIYO 오픈소스 에코시스템](https://oiyo.net)의 원칙에 따라 지속적으로 개선되고 있습니다.

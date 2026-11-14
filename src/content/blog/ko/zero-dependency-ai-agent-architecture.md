---
title: "0-의존성으로 구축한 AI 에이전트 30대 인프라와 Human-on-the-Loop 운영 철학"
description: "LangChain과 무거운 C-바인딩을 걷어내고, 100% 무의존성 TypeScript 엔진과 5대 하드 게이트로 다중 에이전트 자율 운영 체계를 구축한 실전 아키텍처와 엔지니어링 기록."
pubDate: 2026-11-14
tags:
  - ai-agent
  - architecture
  - engineering
  - multi-agent
  - zero-dependency
  - devops
locale: ko
category: Technology
author: "OIYO Lab"
keywords:
  - "AI 에이전트 아키텍처"
  - "Human-on-the-Loop"
  - "0-의존성"
  - "AI 코딩 에이전트"
  - "멀티 에이전트 조율"
  - "agent-skills"
  - "oiyo"
---

## 서론: 프레임워크의 홍수 속에서 마주한 벽

2026년 AI 엔지니어링 생태계는 수많은 오케스트레이션 프레임워크와 무거운 라이브러리로 넘쳐납니다. LangChain, LlamaIndex, AutoGen, CrewAI 등 수많은 도구가 에이전트 개발을 돕는다고 자처하지만, 실제 프로덕션 현장에서 여러 AI 에이전트(Claude Code, Cursor, Codex, Gemini, Grok)를 동시에 가동하며 시스템을 운영해 보면 예상치 못한 심각한 병목들에 직면하게 됩니다:

1. **무거운 의존성 트리와 취약점**: 수백 개의 중첩 `node_modules`와 네이티브 C/Rust 컴파일 바인딩(Tree-sitter, SQLite 네이티브 빌드 등)이 샌드박스 실행과 CI 배포를 가로막습니다.
2. **컨텍스트 윈도우 토큰 낭비**: 에이전트가 코드베이스를 탐색하기 위해 수만 줄의 파일을 그대로 읽어 들이며 수십만 토큰이 허공으로 날아갑니다.
3. **인간 감독관의 피로도 (Human-in-the-Loop의 한계)**: 에이전트가 파일 하나 바꿀 때마다 사람에게 승인을 요구하면 개발자는 하루 종일 "Yes/No"만 누르다가 지쳐버립니다.
4. **다중 에이전트 동시 충돌과 HTTP 429**: 여러 에이전트가 동시에 API를 쏘면서 발생하는 Rate Limit 폭풍과 파일 덮어쓰기 레이스 컨디션.

OIYO Lab에서는 이러한 문제를 근본적으로 해결하기 위해 **"외부 의존성 0 (Zero-Dependency)", "단위 테스트 1ms", "점진적 공개(Progressive Disclosure) 스킬 체계", "Human-on-the-Loop 5대 하드 게이트"** 원칙을 정립하고, 30개의 경량 도구와 22개의 에이전트 스킬을 직접 설계·구축했습니다.

이 글에서는 우리가 왜 무거운 프레임워크를 버리고 순수 수학과 파일 기반 원장으로 돌아갔는지, 그리고 사람이 개입하지 않고도 시스템이 안전하게 자율 주행하는 아키텍처의 비밀을 공개합니다.

---

## 1. Zero-Dependency 원칙: 가벼움이 곧 지능이다

우리가 만든 30개의 도구(`@oiyonet/*`)는 단 하나의 외부 npm 런타임 의존성도 가지지 않습니다 (`dependencies: {}`). 모든 패키지가 10KB 미만이며, Node.js 순수 표준 라이브러리(`fs`, `path`, `crypto`, `http`)와 순수 수학 알고리즘만으로 구동됩니다.

### 왜 0-의존성인가?
- **즉시 실행 (Sub-millisecond Cold Start)**: 번들이 5~10KB에 불과하므로 `npx` 호출이나 서브프로세스 기동 시 콜드 스타트 지연이 5ms 미만입니다.
- **격리된 샌드박스 완벽 호환**: 네이티브 C-바인딩이 없으므로 macOS, Linux, 도커 컨테이너, Cloudflare Workers 등 어떤 환경에서도 단 한 번의 빌드 실패 없이 100% 동일하게 실행됩니다.
- **공급망 보안 (Supply Chain Security)**: 의존성 패키지가 없으므로 npm 취약점 공격이나 악의적 코드 주입 리스크가 0%입니다.

```typescript
// 예시: @oiyonet/hangul-math의 유니코드 오프셋 수학 연산
// 외부 한국어 형태소 분석기 없이 8KB 순수 수학으로 조사(은/는, 이/가, 을/를, 으로/로) 완벽 판정
export function attachJosa(word: string, josaType: JosaType): string {
  const lastChar = word.charCodeAt(word.length - 1);
  if (lastChar < 0xac00 || lastChar > 0xd7a3) return word + getFallback(josaType);
  const jongseongIndex = (lastChar - 0xac00) % 28;
  const hasJongseong = jongseongIndex !== 0;
  // '으로/로'의 'ㄹ' 받침(jongseongIndex === 8) 예외 처리
  if (josaType === '로/으로' && jongseongIndex === 8) return word + '로';
  return word + (hasJongseong ? getWithJongseong(josaType) : getWithoutJongseong(josaType));
}
```

---

## 2. 토큰 예산 다이어트: AST 없는 스켈레톤 인덱싱

에이전트가 10만 줄짜리 대형 레포지토리를 탐색할 때 일반적인 접근법은 파일을 통째로 읽는 것입니다. 하지만 10개의 파일만 읽어도 3만 토큰이 소모되어 모델의 추론 능력이 급격히 저하됩니다.

우리는 `@oiyonet/code-index`와 `@oiyonet/token-budget`을 통해 **스켈레톤(Skeleton) 인덱싱 기법**을 도입했습니다:
- AST를 파싱하는 무거운 언어 서버 대신 정규식 기반 패턴 스캐너로 TS, JS, Python, Go, Rust, C# 심볼을 **30ms 이내에 색인**합니다.
- 함수의 구현 본문(Implementation Body)을 접고 시그니처만 추출하여 `<1 token/symbol`의 초압축 스켈레톤 맵을 생성합니다.

```text
// @oiyonet/code-index --skeleton 출력 예시 (단 30토큰으로 파일 전체 구조 파악)
cli.ts[f:printHelp f:main]
extractor.ts[f:getLanguage f:extractSymbols f:parseTypeScriptSymbol]
indexer.ts[f:indexDirectory f:formatTree f:formatSkeleton]
types.ts[t:SymbolKind i:CodeSymbol i:FileIndex]
```

이를 통해 에이전트는 코드베이스 전체의 지도를 단 500토큰 내외로 머릿속에 담은 뒤, 실제로 수정이 필요한 특정 함수의 10줄만 핀포인트로 읽어 작업할 수 있게 되었습니다.

---

## 3. Human-on-the-Loop: 5대 하드 게이트와 완전 자율의 분리

우리가 채택한 운영 원칙의 핵심은 **"사람을 작업 루프 중간(In-the-loop)에 두지 말고, 루프 바깥의 관제탑(On-the-loop)에 두라"**는 것입니다.

### 자율성 티어 구분 (Decision Core)
- **Tier 0 (완전 자율 실행)**: 코드 작성, 리팩토링, 단위 테스트 작성, 마크다운 문서 정리, 로컬 빌드 등. 에이전트가 질문 없이 스스로 판단하고 커밋합니다.
- **Tier 1 (카나리 자가 치유 배포)**: CI가 초록불이고 작성자가 아닌 독립 에이전트(Verifier)가 검증을 통과하면 에이전트가 스스로 배포합니다. 단, 배포 후 `@oiyonet/canary-guard`가 24시간 실시간 감시하여 3회 연속 실패 시 **에이전트 스스로 `git revert HEAD`를 실행하여 롤백**합니다.
- **Tier 2 (인간 결재 필수 - 5대 하드 게이트)**:
  1. 💰 **돈 (Money)**: 유료 인프라 증설, 결제 코드 변경.
  2. 🗑️ **비가역 삭제 (Irreversible Deletion)**: 데이터베이스 드롭, 원격 브랜치 강제 삭제.
  3. ⚖️ **법·계정 위험 (Legal/Account Risk)**: 약관, 라이선스, 개인정보 처리방침 수정.
  4. ✉️ **제3자 메시지 (External Messaging)**: 실사용자 이메일 일괄 발송, 외부 API 웹훅 트리거.
  5. 🔓 **검사 무르기 (Quality Gate Relaxation)**: 린터 규칙 비활성화, 테스트 임계값 낮추기.

이 5가지 외의 모든 개발 작업은 AI 에이전트가 100% 자율 집행하며, 인간은 하루 5분 `@oiyonet/executive-briefing`이 생성하는 1페이지 요약 보고만 확인합니다.

---

## 4. 다중 에이전트 조율: SHA-256 머클 원장과 지터 레이트 가드

여러 런타임(Claude Code, Codex, Gemini CLI)이 동일한 작업트리에서 일할 때 발생하는 레이스 컨디션을 막기 위해, 우리는 무거운 분산 락 서버 대신 **암호학적 태스크 원장(`@oiyonet/task-ledger`)**을 도입했습니다:

- 작업 시작 시 `agent-ledger claim --task <id> --as <runtime>`으로 작업 소유권을 선언합니다.
- 이전 이벤트의 해시와 결합되는 SHA-256 머클 체인을 통해 변조 여부를 0.1ms 만에 검증합니다 (`agent-ledger verify`).
- 동시에 `@oiyonet/rate-guard`가 토큰 버킷과 AWS 표준 Jitter(Full / Equal / Decorrelated) 알고리즘을 로컬 파일 단위로 동기화하여, 4대의 에이전트가 동시에 API를 호출해도 HTTP 429 에러 없이 매끄럽게 트래픽을 분산시킵니다.

---

## 결론: 복잡함을 덜어낼 때 드러나는 자율의 본질

AI 에이전트를 위한 인프라는 무거울 필요가 없습니다. 오히려 에이전트에게 필요한 것은 수만 줄의 프레임워크 코드가 아니라, **"빠르고, 부서지지 않으며, 결정론적인 작은 도구들의 조합"**입니다.

우리가 구축한 30개의 도구와 스킬들은 누구나 자신의 로컬 머신에서 즉시 실행해 볼 수 있습니다:

```bash
# 공식 에이전트 스킬 번들 설치
npx skills add yuli3/agent-skills

# 무의존성 코드 심볼 색인기 실행
npx @oiyonet/code-index ./src --tree

# 유니코드 블록 스파크라인 차트 생성
npx @oiyonet/sparkline "10,25,40,80,50,95" --unicode
```

더 많은 실전 도구와 대화형 유틸리티는 **[OIYO Lab 공식 허브](https://oiyo.net)**와 **[OIYO 도구 모음](https://tools.oiyo.net)**에서 확인하실 수 있습니다. 가벼운 도구들이 만들어내는 완전한 자율 운영의 미래를 계속해서 열어가겠습니다.

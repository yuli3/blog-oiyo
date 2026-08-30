# Blog 작업 규칙

시작·안전·승인 계약은 `/Users/seuncho/coding/AGENTS.md`, 현재 작업은 `/Users/seuncho/coding/company-brain/NOW.md`를 따른다. 이 파일은 Blog 고유 작성·렌더링 규칙만 다룬다.

## 콘텐츠·데이터

- `academy`는 series/chapter가 있는 학습 흐름, `magazine`은 제한된 설명 surface, `interactive`는 읽기와 실행이 결합된 문서다. 명시적 track을 사용하고 필요한 series/chapter/embeddedTools를 누락하지 않는다.
- 새 MDX는 `data/catalog/content-inventory.master.csv` 행과 함께 변경한다. 카테고리는 `data/catalog/category-registry.yaml`에 먼저 등록하고 `npm run verify:harness`로 확인한다.
- 마이그레이션 후보는 기존 audit/revisit-later 카탈로그와 연결한다. 불확실한 후보는 보류하고 기존 정본을 우선한다.
- interactive는 첫 컴포넌트 전 산문 400자 이상을 기준으로 한다. 제목·import·컴포넌트·표는 산문에서 제외한다. `config/prose-min-baseline.json`의 기존 위반 기준을 높여 새 위반을 통과시키지 않는다.
- 실제 콘텐츠가 있는 로케일만 hreflang에 포함한다. `availableLocales` 흐름을 우회하거나 한국어 전용 문서의 외국어 alternate를 하드코딩하지 않는다.

## 렌더링

- MDX 컴포넌트는 route 파일에 직접 확장하지 않고 `src/lib/mdx-component-registry.ts`에서 관리한다. magazine의 허용 범위를 academy/interactive처럼 넓히지 않는다.
- 기존 호환 bridge는 실제 호환성이 필요할 때만 유지한다. 이미지 위주 콘텐츠를 전제로 새 구조를 만들지 않는다.
- 한 문서의 두 번째 이후 컴포넌트는 `client:load` 대신 `client:visible`을 사용한다. 사용자 입력 HTML은 DOMPurify 등 검증된 정화 없이 `dangerouslySetInnerHTML`에 넣지 않는다.

## 검증·참조

- 코드·콘텐츠 변경: `npm run type-check`, `npm run validate:i18n`, `npm run verify:harness`, `npm run build`, 빌드 후 `npm run audit:seo`·`npm run audit:links`.
- 콘텐츠/컴포넌트 범위에 따라 `npm run audit:content-quality`, `npm run audit:magazine-compat`, `npm run validate:personality`도 실행한다. 실제 명령 목록은 package.json이 정본이다.
- 작성 스키마·허용 컴포넌트의 경위가 필요할 때만 `/Users/seuncho/coding/company-brain/AI-Sessions/raw/project-docs/blog/docs/`의 mdoc-authoring-spec, component-allowlist/disallowlist, component-registry-by-track, content-schema-implementation-draft를 조회한다. 과거 implementation-control-board를 현재 작업판으로 사용하지 않는다.
- 완료 시 검증 결과, metadata/카탈로그 정합, 잔여·경고를 기록한다. 페이지 수·옛 로드맵은 여기에 복제하지 않는다.

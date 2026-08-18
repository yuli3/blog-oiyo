# blog academy slop 퇴장 — 2026-08-18

세운의 지시로 blog.oiyo.net에서 걷어낸 academy 3시리즈다. `git rm` 대신 이 폴더로 옮겼다.
`_redirects`에는 규칙을 넣지 않는다. GSC 신호가 거의 없어 404 자연 퇴장으로 둔다.

## 범위 — 정확 24파일, ko only

| 시리즈 | 파일 | series 필드 |
| --- | --- | --- |
| AIEO AI 엔진 최적화 | `academy-aieo-optimization-ch{1-8}.mdx` | `AIEO AI 엔진 최적화` |
| 데이터 리터러시 | `academy-data-literacy-ch{1-8}.mdx` | `데이터 리터러시` |
| 프롬프트 엔지니어링 실전 | `academy-prompt-engineering-ch{1-8}.mdx` | `프롬프트 엔지니어링 실전` |

다른 로케일 파일은 원래 없었다.

## 판정 근거

- **세운**: `https://blog.oiyo.net/ko/academy-aieo-optimization-ch8/` 는 도움 없는 AI slop. 노출·클릭 없으면 삭제.
- **Planner 실측 동의**. ch8만 빼면 같은 템플릿 7강이 남고 Progress 8/8이 깨지므로 시리즈 단위로 퇴장.
- 본문 ~1,000–1,600자, 출처 없음, 실행 예 없음, H2+표+요약 템플릿. 라이브 ch8은 “약 2분”.
- GSC 결합 감사(2026-08-12 inventory · 2026-08-14 family-catalog): 24강 클릭 0. 노출은 `academy-data-literacy-ch5`만 3회·순위 95. 나머지 0.
- ko-only. route-ownership / topics.json 미등록. `content-inventory.master.csv` 행도 없음.
- 내부 교차 링크 0건(2026-08-18 Planner 실측, Builder 재검색 동일).

## 건드리지 않은 이웃

- `academy-ai-automation-ch{1-5}.mdx` — 제목에 프롬프트가 있어도 **다른 시리즈**.
- `magazine-ai-tools-productivity-guide.mdx` 등 매거진·자동화 가이드.
- wiki / oiyo / news. 이 배치에서 열지 않았다.

## 같이 하지 않은 것

- `_redirects` 추가 없음. 그 파일은 #303 부근부터 잘린다.
- `content-manifest.json` 손편집 없음. 빌드가 재생한다.
- 신규 URL·재작성 없음. 생성 모라토리엄 + slop 재생성 금지.
- `AI-Sessions/raw/journal/2026-08-15.md` 수정 없음. raw는 불변이다.

저널 26번은 이 URL을 취소선 처리했지만 페이지는 살아 있었다. 그 줄은 완료 기록이 아니다.

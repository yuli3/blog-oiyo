# tool-* 중복 정리 — 2026-08-17

세운 지시: "blog의 tool- 로 시작하는 페이지들은 대체적으로 oiyo로 가져가는 것이 좋거나,
blog의 다른 매거진이나 도구에 비슷한 것들이 있는 것 같습니다."

앞서 [보고서](../../../../company-brain/projects/oiyo-ecosystem/traffic-reports/2026-08-17-tool-and-type-page-consolidation-plan.md)에서
`tool-*` 59 slug를 4분류(A blog 내부 중복 33·B oiyo 중복 6·C 허브형 7·D 고유 13)했고, 이 배치에서 A·B·C **46 slug·256파일**을 처리했다.

## 판정 방법이 한 번 뒤집힌 경위

처음엔 GSC로 로케일별 승자를 갈랐다(180일). 결과: 충돌 0건, `.astro`가 신호를 가진 로케일 15개,
**MDX만 신호를 가진 로케일 27개.** 이대로면 "`.astro`가 대체로 진다"였다.

그런데 노출 신호 대부분이 로케일 1~2회짜리라 우연에 가깝고, 진짜 질문은 "어느 쪽 페이지가 더 나은가"였다.
빌드 산출물 바이트 크기로 다시 보니 이번엔 반대로 MDX가 거의 다 이겼다 — 그런데 이것도 착시였다.
MDX는 블로그 아티클 레이아웃(TOC·관련글·작성자 박스)을 두르고 있어 크롬이 본문처럼 잡혔다.

소스 코드에서 한국어 산문만 직접 세어서야 실측이 안정됐다: **32개 중 27개는 `.astro`가 더 두껍다.**
`.astro` 32개 전부가 이미 FAQPage JSON-LD·6로케일 intro/formula/howTo/FAQ 구조를 갖추고 있었다 —
"위젯 껍데기"로 보였던 건 미니파이(공백 제거)일 뿐 구조 자체는 완성돼 있었다.

## 처리 내역

| 폴더 | slug 수 | 파일 수 | 내용 |
|---|--:|--:|---|
| (루트) | 32 | 171 | A분류 — `.astro` 정본이 이미 있는 blog 내부 중복 |
| `b-oiyo-duplicates/` | 8 | 44 | B분류 — oiyo에 같은 도구가 있음(saju·chinese-zodiac·numerology·biorhythm·zodiac×2 + tarot-daily-card·blood-type-calculator, 실측 확인 후 추가) |
| `c-hub-roundups/` | 7 | 41 | C분류 — `/tools` 카탈로그와 중복되는 링크 모음 글 |

합계 **46 slug · 256파일** 아카이브. 잔여 `tool-*`는 42파일(D분류: lostark 2종·세금계산기류·pomodoro·countdown 등 + `tool-daily-horoscope`는 `daily-horoscope.astro`가 oiyo 리다이렉트 스텁이라 유지).

## 고유 내용을 잃지 않은 방법

27개 중 `.astro`가 이겼어도 5개(calorie·menstrual-cycle·sleep·tip·water-intake)는 근소한 차이였고
MDX에만 있는 실제 섹션이 있었다(크로노타입, 국가별 팁 문화, PMS 대처, 탈수 신호, BMR/TDEE 구분).
버리지 않고 **해당 `.astro`의 FAQ 배열에 6로케일 항목 하나씩 흡수**했다. 원문을 그대로 옮기지 않고
FAQ 형식에 맞춰 다시 썼다(질문형 제목 + 3~4문장 답).

## 301을 걸지 않은 이유

blog `public/_redirects`는 **303번째 규칙에서 잘리는 것이 실측 확정**돼 있다(699줄인 현재 상태에서
추가 규칙을 append하면 조용히 무효가 된다). 이번 배치는 `git mv` 아카이브만 하고 리다이렉트는 걸지 않았다.
90~180일 노출이 1~2회 수준이라 클릭 손실은 사실상 없고, 404 자체가 얇은 콘텐츠 제거의 정직한 신호다.

## 검증

type-check 0 errors(880 files) · build **9,051 pages**(직전 오라클 배치 9,380에서 -329).
흡수한 FAQ가 빌드 산출물에 렌더됐는지 확인(`sleep-calculator`에 "크로노타입" 2회, `tip-calculator`(en)에 "gratuity" 1회 등장).

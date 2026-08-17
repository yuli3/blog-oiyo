# Codex 대기분 정리 — 2026-08-18

Codex의 `agent/business-wiki-retirement` blog worktree에는 커밋되지 않은 diff만 있었다.
2026-08-11 기준(main 1d1f7f74)으로 만든 것이라, 그 뒤 이 세션이 blog main을 여러 커밋으로
옮기면서 같은 기준점이 낡았고, 그중 일부는 이 세션이 이미 처리한 것과 실제로 겹쳤다.

## 세운 판정 (2026-08-18)

blog `/tools` 카탈로그에서 **psychology(15종)·games(11종) 카테고리 전체를 제거**하기로
결정(Codex 원안대로). 근거: "심리테스트는 oiyo.net, 게임은 game.oiyo.net에서 하는 것이 맞다."
이번 세션 앞부분에서는 mystic(운세) 부분만 뺐었는데, 이번 판정으로 범위가 넓어졌다.

**조사 결과 추가 작업이 필요 없었다**: 큐레이션된 15개 심리테스트·11개 게임 slug **전부**가
이미 2026-07-04에 oiyo.net/game.oiyo.net으로 이관되어 **리다이렉트 스텁**(meta-refresh +
canonical, noindex) 상태였다. 콘텐츠를 새로 옮기거나 아카이브할 게 없었다 — 카탈로그
목록에서 빼는 것만으로 충분하다. 유일한 예외 2개(`depression-screening-test`,
`anxiety-screening-test`)는 애초에 대응 페이지 파일 자체가 없어 조용히 404였던 버그였는데,
카테고리 삭제로 같이 사라진다.

## 겹침 재구성 (Codex 원본 diff와 이 세션의 앞선 작업)

Codex의 diff는 2026-08-11 기준이라, 이 세션이 그 이후 archive/tool-mdx-consolidation-2026-08-17/
로 옮긴 파일들(tool-saju-calculator, tool-tarot-daily-card, tool-fortune-tools,
tool-anniversary-calculator)을 여전히 살아있는 것처럼 수정하려 했다. 세 종류로 나눠 처리:

1. **완전히 무효(내가 이미 옮김) → Codex의 수정 버림**: `tool-saju-calculator.mdx`,
   `tool-fortune-tools.mdx`, `tool-tarot-daily-card.mdx`, `tool-anniversary-calculator.mdx`.
   네 파일 모두 이미 다른 위치에 아카이브돼 있어, 이 커밋에는 포함되지 않는다.
2. **Codex가 못 잡은 2차 죽은 링크 → 추가로 고침**: `tool-daily-horoscope.mdx`의
   "운세 도구 모음"(`/ko/tool-fortune-tools`) 링크와 "사주 계산기" 링크,
   `tarot-beginners-complete-guide.mdx`의 "타로 리딩 도구"(`/ko/tool-fortune-tools`) 링크.
   Codex의 diff가 쓰인 시점엔 아직 안 죽어 있던 링크라 놓쳤다.
3. **그대로 적용**: `tool-countdown-timer.mdx`·`tool-dday-calculator.mdx`
   (D-Day 카운터·기념일 계산기 링크를 canonical slug로 정정), `cert-guide-hub.mdx`
   (AICE 링크 제거), `academy-management-core-ch11/12.mdx`(경영학 ch19·ch20 흡수 내용 보강).

## 하드 삭제 → 아카이브 전환

Codex가 `git rm`한 것 중 GSC 90일 노출·클릭이 전부 0으로 확인된 11개를 archive로 전환:

- `academy-aice-ch1~8`(8편) — AICE 자격증 강의. 사용자 gate로 이미 삭제가 결정된 항목(2026-08-14
  판정 계승)을 지금 실행.
- `meeting-cost-productivity` — `meeting-cost-corporate-efficiency`로 중복 정리.
- `tool-dday-counter`, `tool-pet-age-calculator` — 각각 `dday-counter`,
  `pet-age-human-comparison` canonical slug로 이미 대체 존재.

## `_redirects` 302건 추가를 걷어낸 이유

Codex의 diff는 이 아카이브 대상들에 대해 `public/_redirects`에 신규 규칙 4쌍(8줄)을
추가했다. **적용하지 않았다** — blog `_redirects`는 라이브에서 규칙 #303 부근부터 조용히
잘리는 것이 실측 확정돼 있고(`feedback_cloudflare_redirects_limit` 메모리), 지금 파일이
이미 699줄이라 새로 append하는 규칙은 그 컷오프보다 한참 뒤에 붙는다 — 죽은 규칙을 하나 더
늘리는 것과 같다. 넷 다 GSC 90일 노출·클릭 0이라 리다이렉트 없이 404로 자연 퇴장해도
손실이 없다는 이 세션의 기존 정책(오라클·tool-* 아카이브와 동일 기준)을 그대로 적용했다.
도메인 재타게팅(`blog.oiyo.net`→`oiyo.net`, 여러 심리테스트 slug)과 `/cn/`→`zh` 정리는
기존 규칙의 순수 수정(추가 아님)이라 그대로 적용했다.

## 검증

type-check·build는 이 배치를 새 main에 리베이스한 뒤 한 번에 돌린다(리베이스 전 이 커밋
단독으로는 파생 파일이 낡은 base 기준이라 의미가 없다). 파생 파일(`CONTENT_INDEX.md`·
`content-inventory.master.csv`·`content-manifest.json`)은 리베이스 후 별도 커밋으로
재생성한다.

# 260516 Next Goals and Operating Plan

## 1. Checkpoint Summary

As of 2026-05-16, `blog-oiyo` has moved past the fragile transition stage.

The repository is now in a state where **controlled expansion can resume**.

### What is confirmed

1. `blog.oiyo.net` remains the confirmed primary destination strategy
2. build is green
3. type-check is green
4. harness verification is green
5. i18n completeness audit passes
6. intent-first browse work has started
7. academy metadata and interactive metadata are much more normalized than before
8. content inventory is actively maintained

### Current operating signal

1. inventory file: `1895` rows
2. recent quick wins show continued series expansion, series deduplication, and interactive quality improvement
3. Korean remains the strongest and correct first-class content layer

### Important caution

One verification edge still needs attention:

1. `npm run validate:personality` still does not run cleanly in the current local environment because `tsx` is not available in the shell path used during verification

This is no longer a blocker for content direction, but it is still a systems item that should be cleaned up.

---

## 2. Current State Judgment

### Overall judgment

The project is now ready for:

1. content expansion
2. content correction
3. selective migration
4. interactive curation

But the mode should be:

**expand under structure, not expand under momentum**

### What has improved enough to trust

1. track system
2. MDX surface control
3. academy and interactive metadata discipline
4. inventory-backed execution
5. one-site product direction

### What still needs active management

1. intent-first browse UX is not finished yet
2. near-duplicate series still need continued review
3. interactive surface still needs ranking and curation, not just accumulation
4. localization should follow Korean stabilization, not race ahead of it

---

## 3. Next Strategic Goal

The next goal is no longer “make the system possible”.

The next goal is:

**make `blog.oiyo.net` feel like the obvious first destination for Korean users with concrete needs**

That means the next wave should optimize for:

1. high-intent Korean search value
2. repeat visit value
3. internal link depth
4. destination-worthiness of interactive pages
5. browse clarity for first-time visitors

---

## 4. Priority Order

## Priority 1 — Korean High-Intent Dominance

This should be the main content goal for the next wave.

Focus clusters:

1. 시험 준비
2. 자격증 로드맵
3. 세금과 금융
4. 노동과 실무 권리
5. 심리와 자기이해
6. 공부법과 사고력

### Success signal

A Korean visitor should be able to land on `blog.oiyo.net` and immediately find:

1. what to study
2. what to calculate
3. what to read
4. what to test
5. what to do next

## Priority 2 — Intent-First Browse Completion

The content surface is now large enough that browse UX matters as much as raw content count.

The next UX goal:

1. reduce chip-first scanning
2. increase intent-first entry points
3. highlight bundles, not just categories

This is how the site stops feeling like a collection and starts feeling like a product.

## Priority 3 — Interactive Top 20 Curation

Not all interactive pages need the same level of polish.

Create a ranked “must-win” Korean interactive set and polish those first.

Recommended top families:

1. VAT / tax
2. year-end settlement
3. salary / severance / pension
4. freelancer tax
5. capital gains / property
6. psychology self-understanding tests
7. thinking games tied to educational framing

## Priority 4 — Controlled Ahoxy Migration Wave

Migration can continue, but only under editorial control.

Good migration candidates are:

1. high-intent Korean utility content
2. tools that become stronger with article framing
3. pages that can connect to academy, magazine, and interactive simultaneously

Avoid migration for its own sake.

## Priority 5 — Localization Preparation, Not Full Localization Expansion

Localization should now be treated as:

1. metadata-safe
2. structure-aware
3. bundle-aware

The right question is not “what can be translated next?”

It is:

“Which Korean winners are worth localizing after they prove their information architecture and editorial shape?”

---

## 5. Recommended Work Bundles

## Bundle A — Exam and Qualification Core

Goal:

Turn `academy` into the strongest structured Korean study surface.

Work types:

1. finish 10-chapter standards for incomplete series
2. deepen qualification roadmap pages
3. add internal links from roadmap → series → chapter → interactive support pages

Best target families:

1. 세무사
2. 공인노무사
3. 감정평가사
4. 법무사
5. 변리사
6. 공인중개사
7. 행정사
8. NCS

## Bundle B — Korean Money and Tax Life

Goal:

Own practical Korean “money tasks” that users repeatedly search for.

Work types:

1. calculator article upgrades
2. scenario-based guides
3. internal links between practical tools and learning content

Best target clusters:

1. 부가가치세
2. 원천징수
3. 연말정산
4. 퇴직금
5. 4대보험
6. 국민연금
7. 양도세
8. 취득세
9. 프리랜서 세금

## Bundle C — Psychology and Self-Understanding

Goal:

Make the psychology section feel useful, not just broad.

Work types:

1. improve framing pages for test families
2. add “which test should I take?” pathways
3. connect results pages to reflective articles

Best target clusters:

1. career values
2. burnout
3. self-esteem
4. anxiety / depression screening
5. attachment / boundaries / relationship style
6. work-life balance

## Bundle D — Learn Through Play

Goal:

Make games and logic tools feel educational and distinctive, not incidental.

Work types:

1. pair each meaningful game with a strong Korean article
2. connect game pages to logic / economics / strategy / psychology series
3. promote only the most differentiated ones

Best target clusters:

1. 오목
2. 체스
3. 스도쿠
4. 텐트와 나무
5. 워드류 사고력 게임

## Bundle E — Utility and Health Support

Goal:

Keep the utility layer helpful without letting it dominate the brand.

Work types:

1. polish only utilities with repeat-use value
2. avoid low-value tool sprawl
3. connect practical tools to explanation pages where useful

Best target clusters:

1. BMI / calorie / water / sleep
2. age / GPA / pregnancy / pet age
3. word counter / lorem / base64 only if strategically justified

---

## 6. Management System for the Next Wave

## Rule 1 — Expansion only through bundles

Do not expand randomly.

Every new page should belong to one of the current work bundles:

1. Exam and Qualification Core
2. Korean Money and Tax Life
3. Psychology and Self-Understanding
4. Learn Through Play
5. Utility and Health Support

## Rule 2 — New content must update operating files

For any meaningful addition:

1. update `data/catalog/content-inventory.master.csv`
2. update `data/catalog/workboard.yaml` if it changes bundle status
3. update the control board if a milestone is genuinely completed

## Rule 3 — No new sibling series before checking duplicates

Before creating a new series:

1. confirm the subject does not already exist under `basic`, `basics`, `intro`, `core`, `guide`, or similar naming
2. prefer expanding the canonical series over creating a nearby one

## Rule 4 — Interactive pages must justify their place

Every interactive page should have:

1. editorial framing
2. a clear Korean use case
3. `embeddedTools`
4. internal links to related academy or magazine content
5. a reason to exist beyond “we have the tool”

## Rule 5 — Korean winners first, localization later

A page should only become a localization candidate if:

1. the Korean version is structurally stable
2. it belongs to a valuable bundle
3. it has meaningful internal links
4. it has proven destination value

---

## 7. Suggested Next Milestones

## Milestone M1 — Browse UX Maturity

Definition:

1. intent bundles become the primary entry pattern
2. category chip scanning is no longer the default experience
3. first-time discovery feels directed

## Milestone M2 — Top 20 Interactive Curation

Definition:

1. top Korean interactive pages are explicitly ranked
2. all top pages have strong article framing and CTA paths
3. weak or redundant tool pages are downgraded or deprioritized

## Milestone M3 — Qualification Authority Layer

Definition:

1. key qualification families feel complete enough to trust
2. roadmap pages, chapter series, and practical support pages are connected
3. internal link depth supports long-session study behavior

## Milestone M4 — Korean Destination Lock-In

Definition:

1. a Korean visitor can solve major study, tax, psychology, and practical-life intents without needing `ahoxy` or `oiyo`
2. `blog.oiyo.net` feels like the main property, not the blog branch

---

## 8. Final Recommendation

Yes, the project should now continue with:

1. content strengthening
2. content creation
3. content migration
4. interactive curation

But the next wave should be organized around:

1. Korean high-intent dominance
2. bundle-based execution
3. browse UX completion
4. curated migration

The question is no longer “can we expand?”

The right question now is:

**which bundle most increases the chance that users can stay on `blog.oiyo.net` and not need the other sites?**

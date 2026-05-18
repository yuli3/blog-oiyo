# 260515 FAANG-Level Audit — blog-oiyo

## 1. Executive Summary

This audit is a **repository-based audit** of `blog-oiyo` as of **2026-05-15**.

It focuses on the stated strategic shift:

1. make `blog.oiyo.net` the primary destination
2. reduce dependence on `ahoxy.com` and `oiyo.net`
3. prioritize **Korean completeness first**
4. treat localization as the next wave after Korean stabilization

### Bottom-line judgment

`blog-oiyo` is **substantially stronger than before**, but it is **not yet in a “more-than-enough” state**.

The project has crossed from concept into real platform-building. That is a success.
However, it has **not yet reached production-grade completeness** in the areas that matter most for a one-site strategy:

1. build reliability
2. metadata discipline
3. information architecture clarity
4. interactive verification
5. alignment between docs, code, and operating status

### Final score

**Overall: 6.8 / 10**

This is a strong transitional score, not a finishing score.

### Can `blog.oiyo.net` replace `ahoxy.com` and `oiyo.net` today?

**Not fully yet.**

It is increasingly plausible as the long-term destination, but today the repo still shows:

1. unresolved code and build errors
2. uneven metadata normalization
3. UI/UX patterns that still carry old friction
4. broad interactive expansion without enough proof of stability

The direction is right. The finish is not there yet.

---

## 2. Scorecard

| Area | Score | Judgment |
| --- | --- | --- |
| Strategy and platform direction | 9.0 | Very strong |
| Korean-first content coverage | 8.8 | Strong |
| Information architecture | 6.5 | Improved, still noisy |
| UI/UX clarity and browsing efficiency | 6.2 | Better intent than execution |
| Content quality and editorial consistency | 7.1 | Good breadth, uneven normalization |
| Interactive product quality | 5.9 | Valuable, not fully proven |
| Localization readiness | 6.7 | Structurally decent, not operationally complete |
| Code quality and verification reliability | 5.6 | Real progress, still failing core checks |
| Operating-system maturity (harness, docs, workflow) | 8.4 | Strong foundation |

---

## 3. High-Severity Findings

### F1. The repository does not currently meet production-grade verification standards

This is the biggest blocker to calling the platform “complete”.

Evidence:

1. `npm run type-check` fails with **13 errors**
2. `npm run validate:personality` fails because `tsx` is not available
3. `npm run build` fails on MDX parsing

Relevant files:

1. [package.json](/Users/seuncho/coding/blog-oiyo/package.json)
2. [src/components/Hero.astro](/Users/seuncho/coding/blog-oiyo/src/components/Hero.astro:39)
3. [src/pages/[...lang]/courses.astro](/Users/seuncho/coding/blog-oiyo/src/pages/[...lang]/courses.astro:337)
4. [src/content/blog/ko/academy-cpa-exam-ch6.mdx](/Users/seuncho/coding/blog-oiyo/src/content/blog/ko/academy-cpa-exam-ch6.mdx:112)

What this means:

1. the site may be conceptually improved, but it is not yet technically trustworthy
2. CI is not a fully reliable gate while one of its own validation commands is broken
3. content expansion has outrun verification discipline

### F2. Metadata normalization is still behind content growth

The content system is far more ambitious than the metadata quality currently guarantees.

Measured from the repository:

1. total blog files: `3756`
2. files with explicit `track`: `2176`
3. files without explicit `track`: `1580`
4. academy files: `1193`
5. academy files missing `series`: `770`
6. academy files missing `chapter`: `771`
7. interactive files: `116`
8. interactive files missing `embeddedTools`: `116`

Relevant files:

1. [src/content/config.ts](/Users/seuncho/coding/blog-oiyo/src/content/config.ts)
2. [src/lib/taxonomy.ts](/Users/seuncho/coding/blog-oiyo/src/lib/taxonomy.ts)

What this means:

1. the schema exists, but enforcement is still partial
2. `academy` is not yet consistently series-aware and chapter-aware
3. `interactive` content exists, but the metadata does not yet describe the embedded experience well enough
4. content operations remain more fragile than they look

### F3. The one-site strategy is real, but the information architecture is not fully under control

The repository now includes a very broad surface:

1. lectures
2. magazine essays
3. tests
4. calculators
5. games
6. image tools
7. utilities

Relevant files:

1. [src/pages/[...lang]/tools.astro](/Users/seuncho/coding/blog-oiyo/src/pages/[...lang]/tools.astro)
2. [src/pages/[...lang]/interactive.astro](/Users/seuncho/coding/blog-oiyo/src/pages/[...lang]/interactive.astro)
3. [src/components/CategoryCloud.astro](/Users/seuncho/coding/blog-oiyo/src/components/CategoryCloud.astro)

What this means:

1. `blog.oiyo.net` is becoming a hub
2. but breadth is arriving faster than hierarchy and curation
3. the platform risks becoming “everything everywhere” unless the browse model is tightened

This is especially important because the original product pain point was **horizontal browsing fatigue**. That is not fully resolved yet:

1. [src/components/CategoryCloud.astro](/Users/seuncho/coding/blog-oiyo/src/components/CategoryCloud.astro) still relies on horizontal overflow chips
2. the home list in [src/pages/[...lang]/index.astro](/Users/seuncho/coding/blog-oiyo/src/pages/[...lang]/index.astro) is still mostly chronological rather than intent-first

### F4. There is drift between the official control board and the actual execution board

Evidence:

1. [docs/implementation-control-board.md](/Users/seuncho/coding/blog-oiyo/docs/implementation-control-board.md) still describes several key areas as in progress or at risk
2. [data/catalog/workboard.yaml](/Users/seuncho/coding/blog-oiyo/data/catalog/workboard.yaml) marks many of those same initiatives as done

What this means:

1. the execution engine is moving faster than the operating narrative
2. handoff quality is still good, but “single source of truth” is not fully true yet
3. future agents may make wrong assumptions about what is stabilized

---

## 4. Medium-Severity Findings

### F5. The Korean-first strategy is working, but duplication and naming drift are appearing

Korean coverage is clearly the strongest language layer right now.

Measured from the repo:

1. Korean content files: `1682`
2. English content files: `883`

That is strategically good.

However, some series naming and slug patterns suggest duplication or parallel growth without enough canonical collapse.

Examples:

1. [src/content/blog/ko/academy-tax-law-basic-ch1.mdx](/Users/seuncho/coding/blog-oiyo/src/content/blog/ko/academy-tax-law-basic-ch1.mdx)
2. [src/content/blog/ko/academy-tax-law-basics-ch1.mdx](/Users/seuncho/coding/blog-oiyo/src/content/blog/ko/academy-tax-law-basics-ch1.mdx)

These are close enough in concept to create editorial confusion unless one naming standard wins.

### F6. Interactive pages exist, but “reading-first” is only partially realized

The track strategy says:

1. `interactive` should be reading-first
2. tools should support the article, not replace it

Some content does this well. Some of it still reads more like “tool page + explanatory wrapper”.

Example:

1. [src/content/blog/ko/svg-studio-vector-design-tool.mdx](/Users/seuncho/coding/blog-oiyo/src/content/blog/ko/svg-studio-vector-design-tool.mdx)

This is not bad content. But at platform level, there is still a gap between:

1. deeply integrated editorial experiences
2. useful tool pages with surrounding prose

That gap matters because your stated goal is not just tool aggregation. It is destination-worthiness.

### F7. The image-light design direction and the current browse surfaces are not fully aligned

Relevant file:

1. [src/components/BlogList.astro](/Users/seuncho/coding/blog-oiyo/src/components/BlogList.astro)

Current behavior:

1. card layout still reserves large image space
2. non-image posts render a `No image` placeholder

What this means:

1. the platform is still structurally designed as if hero images are normal
2. this conflicts with the explicit direction toward image-light publishing
3. the result is serviceable, but not polished

---

## 5. What Is Going Very Well

### S1. The strategic model is much clearer than before

This is the strongest win in the whole project.

Relevant files:

1. [AGENTS.md](/Users/seuncho/coding/blog-oiyo/AGENTS.md)
2. [docs/content-charter.md](/Users/seuncho/coding/blog-oiyo/docs/content-charter.md)
3. [docs/mdoc-authoring-spec.md](/Users/seuncho/coding/blog-oiyo/docs/mdoc-authoring-spec.md)
4. [docs/component-allowlist.md](/Users/seuncho/coding/blog-oiyo/docs/component-allowlist.md)
5. [docs/component-disallowlist.md](/Users/seuncho/coding/blog-oiyo/docs/component-disallowlist.md)

The project now has:

1. a vocabulary
2. a track system
3. operational rules
4. cross-agent continuity

That is a real advantage.

### S2. The harness and agent-readability are strong

Relevant files:

1. [AGENTS.md](/Users/seuncho/coding/blog-oiyo/AGENTS.md)
2. [.github/workflows/ci.yml](/Users/seuncho/coding/blog-oiyo/.github/workflows/ci.yml)
3. [scripts/verify-harness.mjs](/Users/seuncho/coding/blog-oiyo/scripts/verify-harness.mjs)
4. [data/catalog/workboard.yaml](/Users/seuncho/coding/blog-oiyo/data/catalog/workboard.yaml)

This means:

1. the repo is easier for Claude Code, Codex, Cursor, or future agents to continue
2. work has become more auditable
3. the project is less dependent on one agent’s memory

### S3. The Korean content layer already looks like the true primary surface

This is exactly the right tactical choice.

You asked for Korean completeness first, and the repository reflects that priority.
That is a better strategy than shallowly pretending to be complete in many locales at once.

### S4. The project has genuine destination potential

The combination of:

1. academy
2. magazine
3. interactive
4. qualification systems
5. tools
6. tests

can absolutely become a one-stop property.

That potential is real.
The remaining work is not about inventing the idea. It is about finishing the operating discipline.

---

## 6. UI/UX Audit Notes

### Current UI/UX grade: 6.2 / 10

#### What improved

1. track-aware surfaces now exist
2. `interactive` has its own browse page
3. academy vs magazine vs interactive visual distinction is emerging

#### What still feels sub-FAANG

1. horizontal chip browsing remains a primary browsing mechanism in [src/components/CategoryCloud.astro](/Users/seuncho/coding/blog-oiyo/src/components/CategoryCloud.astro)
2. the home feed in [src/pages/[...lang]/index.astro](/Users/seuncho/coding/blog-oiyo/src/pages/[...lang]/index.astro) is still not intent-first enough for a very broad product
3. the tool hub is broad, but still catalog-like rather than guided
4. image placeholders reduce polish in [src/components/BlogList.astro](/Users/seuncho/coding/blog-oiyo/src/components/BlogList.astro)

#### FAANG-level recommendation

Move from:

1. category chips first
2. chronology first
3. all-tools browse

to:

1. user-intent browse
2. domain entry pages
3. featured pathways
4. guided bundles

Examples of better top-level entry bundles:

1. 시험 준비
2. 자격증 로드맵
3. 세금과 금융
4. 심리와 자기이해
5. 게임으로 배우는 사고력
6. 실무 문서 작성

That is the difference between “large site” and “destination product”.

---

## 7. Content Audit Notes

### Current content grade: 7.1 / 10

#### What is strong

1. breadth is now serious
2. Korean content is no longer thin
3. there are real structured series and not just isolated essays
4. qualification and lecture ambitions are visible in the corpus

#### What still needs work

1. academy normalization is incomplete
2. some series look duplicated or near-duplicated
3. some articles feel generated at scale faster than they feel editorially unified
4. metadata is not yet carrying enough of the organizational load

#### FAANG-level recommendation

Treat the next phase as **editorial consolidation**, not expansion.

Specifically:

1. every `academy` post should belong to a canonical series model
2. every `interactive` post should state what tool or game it embeds
3. every priority Korean article should be reviewed for title discipline, intro quality, and internal-link value
4. duplicate concept families should be merged before new siblings are created

---

## 8. Interactive Audit Notes

### Current interactive grade: 5.9 / 10

#### Why the score is not higher

The problem is not lack of ambition.
The problem is lack of proof.

Current reality:

1. there are many interactive routes
2. the component registry is large
3. the site now includes tests, calculators, games, and utilities

But:

1. not all of them are represented richly in metadata
2. build currently fails before we can call the whole surface stable
3. there is not yet evidence in this audit of systematic route-by-route QA

#### What “complete” would require

For each major interactive family:

1. build passes
2. page renders
3. keyboard and mobile behaviors work
4. copy matches the tool
5. the article meaningfully frames the experience
6. the result feels worth visiting, not just available

That bar has not yet been met across the full surface.

---

## 9. Localization Audit Notes

### Current localization grade: 6.7 / 10

#### Good

1. Korean is clearly the priority language
2. locale files exist and are structurally audited
3. `npm run validate:i18n` passes for completeness

#### Not yet good enough

The i18n audit still reports warnings where some locale values are identical to English.

This is acceptable during transition, but not yet “localized”.

Relevant signal:

1. [package.json](/Users/seuncho/coding/blog-oiyo/package.json)
2. `npm run validate:i18n`

#### Recommendation

The current strategy is correct:

1. finish Korean quality first
2. freeze canonical content structures
3. localize after structure and metadata stop moving

Do not reverse that order.

---

## 10. Coding and System Audit Notes

### Current engineering grade: 5.6 / 10

#### What is strong

1. harness thinking is strong
2. registry-driven organization is much better than before
3. CI exists
4. audit scripts exist
5. cross-agent handoff quality is strong

#### What is weak

1. verification is currently red, not green
2. route and template correctness still have gaps
3. some scripts are configured but not fully install-safe
4. source-of-truth drift still exists between docs and workboard

This is the classic pattern of a good system entering scale faster than its stabilization loop.

---

## 11. Recommended Next Moves

## Priority A — Stop calling the surface complete until verification is green

Do this first.

1. fix [src/components/Hero.astro](/Users/seuncho/coding/blog-oiyo/src/components/Hero.astro:39)
2. fix [src/pages/[...lang]/courses.astro](/Users/seuncho/coding/blog-oiyo/src/pages/[...lang]/courses.astro:344)
3. fix the MDX syntax issue in [src/content/blog/ko/academy-cpa-exam-ch6.mdx](/Users/seuncho/coding/blog-oiyo/src/content/blog/ko/academy-cpa-exam-ch6.mdx:112)
4. make `validate:personality` runnable in a clean environment

Completion signal:

1. `npm run type-check` passes
2. `npm run build` passes
3. `npm run validate:personality` passes

## Priority B — Normalize the academy layer

This is the highest-value content cleanup.

1. backfill `series` for all academy content that should belong to a series
2. backfill `chapter` where chapter structure exists
3. identify and merge near-duplicate series such as `basic` vs `basics`

Completion signal:

1. academy metadata becomes operationally trustworthy

## Priority C — Make browse UX intent-first

Do not just add more pages.

1. replace horizontal category discovery as the main browse model
2. create domain landing pages for major Korean use cases
3. rank featured bundles by user intent, not by raw chronology

Completion signal:

1. a new visitor can find the right surface without horizontal scanning fatigue

## Priority D — Curate the interactive layer

1. explicitly describe embedded experience in metadata
2. identify top 20 Korean interactive pages worth polishing first
3. audit tool pages that are useful but not destination-worthy

Completion signal:

1. `interactive` feels curated, not accumulated

## Priority E — Reconcile the operating narrative

1. update [docs/implementation-control-board.md](/Users/seuncho/coding/blog-oiyo/docs/implementation-control-board.md)
2. align it with [data/catalog/workboard.yaml](/Users/seuncho/coding/blog-oiyo/data/catalog/workboard.yaml)
3. mark clearly what is complete, transitional, and unverified

Completion signal:

1. the official story matches the actual repo state

---

## 12. Final Verdict

The project is **not yet FAANG-level finished**.

But it **is** FAANG-like in one important respect already:

1. it has ambition
2. it has system thinking
3. it has operational scaffolding
4. it is building a platform, not just pages

That is rare, and it matters.

The missing piece is not imagination.
The missing piece is **stabilization under scale**.

If the next phase is:

1. green verification
2. metadata normalization
3. browse simplification
4. interactive curation

then `blog.oiyo.net` can absolutely become the primary destination you want.

Today, it is **close enough to believe in** and **not yet complete enough to declare victory**.

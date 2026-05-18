# Implementation Control Board

**Last updated: 2026-05-16**
**Synced with:** `data/catalog/workboard.yaml`

## 1. Purpose

This document is the operating board for the current implementation phase.

It exists to prevent drift between:

1. planning documents
2. active code changes
3. content migration
4. editorial expansion

## 2. Source of Truth

Use these files in this order:

1. [Content Charter](./content-charter.md)
2. [MDOC Authoring Spec](./mdoc-authoring-spec.md)
3. [Category and Track Map](./category-and-track-map.md)
4. [data/catalog/workboard.yaml](/Users/seuncho/coding/blog-oiyo/data/catalog/workboard.yaml)
5. [data/catalog/content-inventory.master.csv](/Users/seuncho/coding/blog-oiyo/data/catalog/content-inventory.master.csv)
6. [reports/260515-faang-audit-blog-oiyo.md](/Users/seuncho/coding/blog-oiyo/reports/260515-faang-audit-blog-oiyo.md)

## 3. Current Operational Status

| Area | Status | Meaning |
| --- | --- | --- |
| Strategy definition | complete | One-site strategy confirmed: blog.oiyo.net is the primary destination |
| Build pipeline | **complete** | `npm run build` passes, `npm run type-check` 0 errors |
| Schema transition | **complete** | All academy files have `series:`, all interactive have `embeddedTools:` |
| Taxonomy transition | complete | `interactive`, `academy`, `magazine` tracks all established and enforced |
| Rendering control | stable | MDX component registry is track-aware, build is green |
| Content migration | complete | 1,834+ pieces across all tracks, Korean-first, 7 locales |
| Content governance | in progress | Series normalization done; near-duplicate merging is next |
| Browse UX | **in progress** | Intent-first navigation being built to replace category chip browsing |
| Analytics review | planned | Checklist exists but routine review loop not yet active |

## 4. Completed Phases

### Phase 1 — Foundation (QW-1 through QW-9)

All foundational quick wins complete:

- canonical category registry
- control board established
- real inventory file active
- centralized MDX component registry
- interactive locale keys
- track-aware registry split
- cross-agent harness files
- CI harness checks and magazine compatibility audit

### Phase 2 — Content Expansion

Status: complete

Summary:

- 713 academy files in Korean, 1,834+ total content pieces
- Interactive surface: 104 interactive pages across games, calculators, tests, tools, image tools, utilities
- Psychology tests: 71+ tests built
- Tax/Finance calculators: 21 tools
- Health tools: 13 tools
- Image tools: 12 tools
- Games: 25 standalone Astro pages
- Tax academy series: 5 chapters
- Tools hub page: tools.astro (72 tools in 6 categories)

### Phase 3 — Build Pipeline Fixes (2026-05-16)

Status: **complete**

What was fixed:

1. `Hero.astro` — 13 TypeScript errors from `Record<string, string>` in template JSX context → moved to frontmatter
2. 78 Astro page TypeScript errors — `TS2440` import name conflicts fixed with `XComp` pattern; `TS2322` locale narrowing fixed
3. `academy-cpa-exam-ch6.mdx` and 7 other MDX files — unescaped `<` before Korean/math characters causing MDX parse failures → escaped as `&lt;`
4. `StatCards.astro` — component crashed when called with `stats=` prop instead of `items=` → now accepts both, with `note` → `description` alias
5. `Timeline.astro` — component crashed when called with `items=` instead of `events=` → now accepts both, with `label`/`content` → `year`/`title`/`description` normalization

Completion signals met:

- `npm run type-check` → 0 errors, 0 warnings ✅
- `npm run build` → Complete ✅

### Phase 4 — Metadata Normalization (2026-05-16)

Status: **complete**

What was done:

1. **Series backfill for 300 academy files** — all `education-*` files (256 files across 29 series families) and NCS/standalone clusters
2. **embeddedTools backfill for 104 interactive files** — every interactive article now declares which tool(s) it embeds

Completion signals met:

- `grep -rL 'series:' src/content/blog/ko/ | xargs grep -l 'track: academy' | wc -l` → 0 ✅
- `grep -rl 'track: interactive' | xargs grep -L 'embeddedTools:' | wc -l` → 0 ✅

## 5. Active Priority Queue

### P-BROWSE — Intent-First Browse UX

Status: **in progress**

Priority: high

What this means:

- replace horizontal category chips (`CategoryCloud.astro`) as the primary discovery mechanism
- build domain entry pages for major Korean use case clusters
- rank featured bundles by user intent, not chronology

Target user flows to support:

1. 시험 준비 → qualification series
2. 자격증 로드맵 → exam roadmap pages
3. 세금과 금융 → tax/finance calculators + academy
4. 심리와 자기이해 → psychology tests
5. 건강 도구 → health calculators
6. 게임으로 배우는 사고력 → games

Completion signal:

1. a new visitor can find the right surface without horizontal scanning fatigue

### P-SERIES-DEDUP — Near-Duplicate Series Consolidation

Status: planned

Priority: medium

Known duplicates to resolve:

1. `academy-tax-law-basic-*` vs `academy-tax-law-basics-*` — merge into one canonical slug pattern
2. Verify other `basic` vs `basics` patterns across qualification exam series

Completion signal:

1. no two series exist that cover the same subject under slightly different names

### P-INTERACTIVE-QUALITY — Interactive Curation

Status: planned

Priority: medium

What this means:

- embeddedTools metadata is now in place (Phase 4)
- next step: quality review — top 20 interactive pages identified, article framing reviewed
- tool pages that are useful but not destination-worthy flagged for improvement

Completion signal:

1. `interactive` surface feels curated, not accumulated

## 6. Red Flags

Pause expansion and re-align if any of the following happens:

1. `npm run build` fails
2. `npm run type-check` reports new errors
3. new categories appear without registry entries
4. new content appears without `track` and `series` where required
5. interactive pages are added without a clear editorial explanation layer
6. near-duplicate series names proliferate without deduplication

## 7. Working Rule

From this point forward:

1. build green before content expansion
2. metadata complete before new series
3. intent-first browse before more page types
4. deduplication before new siblings

# Inventory Survey Report

## 1. Purpose

This report records the current real-data snapshot used to drive planning.

It is not a full semantic audit of every page, but it is a real inventory baseline rather than a purely imagined plan.

## 2. Blog Oiyo Snapshot

Observed article counts in `src/content/blog` during this survey:

1. `ko`: 1024
2. `en`: 883
3. `ja`: 864
4. `cn`: 105
5. `es`: 103
6. `fr`: 102
7. `zh`: 17

This confirms that `blog-oiyo` already has a large multilingual surface and needs tighter governance before further scaling.

## 3. Ahoxy Snapshot

Observed Ahoxy message-namespace slug count during this survey:

1. total Ahoxy message slugs: `302`

Generated current first-pass migration distribution:

1. `interactive`: 102
2. `magazine`: 124
3. `academy`: 5
4. `cross-link-only`: 57
5. `hold`: 14

## 4. Ahoxy Domain Breakdown

Current first-pass domain grouping after practical misc reclassification:

1. `finance-tax`: 58
2. `games-puzzles`: 31
3. `psychology-self-discovery`: 54
4. `study-productivity`: 68
5. `legal-public-admin`: 8
6. `lifestyle-everyday`: 16
7. `image-media-design-dev`: 60
8. `lostark-game-specific`: 7

## 5. What the Counts Mean

### Strong immediate migration families

1. finance and tax
2. games and puzzles
3. psychology and self-discovery
4. study and productivity

These already align well with `blog-oiyo` goals.

### Strong cross-link or hold families

1. image/dev utilities
2. Lost Ark-specific assets

These should not be treated as immediate content priorities.

## 6. Manual Review Priority

The crude `misc` bucket used in the earliest pass has now been pragmatically redistributed into broader operational families such as psychology, games, finance, study, and utility.

The next manual review priority is no longer “everything misc.” It is:

1. validate the `hold` bucket
2. validate the `cross-link-only` utility bucket
3. promote the best `study-productivity` candidates into concrete article plans
4. confirm whether a few borderline finance/game items should become `interactive` or stay supporting links
5. maintain a separate `revisit-later` queue for ambiguous but potentially promising items

Representative manual-check examples now include:

1. `ai`
2. `metadata`
3. `blackjack`
4. `market-backtest`
5. `age-calculator`
6. `digital-balance`
7. `early-repayment`
8. `personapath`

These are not unclassified anymore, but they still deserve editorial judgment.

## 7. Deferred Review Principle

From this point forward, uncertain items do not need forced resolution.

Use a deferred queue when:

1. the migration value is plausible but not immediate
2. the surrounding content system is not ready yet
3. better editorial ideas may emerge later

This keeps planning practical without throwing away good future options.

## 8. Output Files Created from This Survey

1. [data/catalog/ahoxy-migration.audit.csv](/Users/seuncho/coding/blog-oiyo/data/catalog/ahoxy-migration.audit.csv)
2. [data/catalog/ahoxy-migration.audit.summary.txt](/Users/seuncho/coding/blog-oiyo/data/catalog/ahoxy-migration.audit.summary.txt)
3. [data/catalog/ahoxy-migration.template.csv](/Users/seuncho/coding/blog-oiyo/data/catalog/ahoxy-migration.template.csv)
4. [data/catalog/ahoxy-migration.revisit-later.csv](/Users/seuncho/coding/blog-oiyo/data/catalog/ahoxy-migration.revisit-later.csv)

## 9. Practical Implication

The project is now past vague planning. It has:

1. a real source inventory
2. a first-pass migration classification with misc redistribution
3. a track strategy
4. a documentation system that can absorb further manual review
5. a deferred-review principle for unresolved but interesting candidates

That is enough structure to move from conceptual planning into implementation-ready planning.

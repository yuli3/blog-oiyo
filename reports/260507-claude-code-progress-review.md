# 260507 Claude Code Progress Review

## 1. Compact Summary

This project has already moved beyond a simple blog cleanup.

The current direction is to turn `blog-oiyo` into a structured content platform with three first-class tracks:

1. `academy`
2. `magazine`
3. `interactive`

The planning layer is already substantial. Strategy, schema, migration, qualification catalog, lecture registry, allowlist/disallowlist, and Ahoxy migration mapping documents have been written under `/Users/seuncho/coding/blog-oiyo/docs`.

The data layer has also started to take shape. Structured inventory and migration files exist under `/Users/seuncho/coding/blog-oiyo/data/catalog`, including Ahoxy audit and revisit-later queues.

Implementation has also begun:

1. `/Users/seuncho/coding/blog-oiyo/src/content/config.ts` now includes extended metadata fields such as `track`, `series`, `chapter`, `sourceProject`, `embeddedTools`, and `layoutVariant`.
2. `/Users/seuncho/coding/blog-oiyo/src/lib/taxonomy.ts` now recognizes `interactive` as a real track.
3. `/Users/seuncho/coding/blog-oiyo/src/pages/[...lang]/magazine.astro`, `/Users/seuncho/coding/blog-oiyo/src/pages/[...lang]/courses.astro`, and category pages have been partially moved to track-aware queries.
4. `/Users/seuncho/coding/blog-oiyo/src/pages/[...lang]/interactive.astro` now exists as a dedicated browse surface.

At the same time, the repository has expanded quickly. There are now very large numbers of modified and newly created content files, new MDX components, new interactive routes, and a widening gap between planning documents and verified production readiness.

In short:

1. the direction is strong
2. the system design is getting clearer
3. the implementation has real momentum
4. the project now needs tighter control, validation, and sequencing

## 2. Assessment of Current Progress

### Overall judgment

The work direction is good.

Claude Code has been effective at:

1. creating momentum
2. building an architecture vocabulary
3. turning vague editorial goals into explicit standards
4. starting the actual schema and route changes needed to support those standards

However, the current work style is entering a risk zone:

1. too much content is being created in parallel
2. renderer and component policy are not yet tight enough
3. the codebase is starting to outpace the validation process

This is not a failure state. It is a scale-transition state.

### What is going well

#### A. Strategy quality is high

The most important success so far is that the project now has a coherent editorial and technical identity.

Evidence:

1. `/Users/seuncho/coding/blog-oiyo/docs/content-charter.md`
2. `/Users/seuncho/coding/blog-oiyo/docs/mdoc-authoring-spec.md`
3. `/Users/seuncho/coding/blog-oiyo/docs/execution-roadmap.md`
4. `/Users/seuncho/coding/blog-oiyo/docs/cross-project-standardization-manual.md`

This is valuable because it reduces future thrash. The user is not just adding pages. The user is building a reusable publishing system.

#### B. Data-minded planning is strong

The project is not trapping important knowledge only inside prose.

Evidence:

1. `/Users/seuncho/coding/blog-oiyo/data/catalog/professional-credentials.schema.json`
2. `/Users/seuncho/coding/blog-oiyo/data/catalog/professional-credentials.template.yaml`
3. `/Users/seuncho/coding/blog-oiyo/data/catalog/content-inventory.template.csv`
4. `/Users/seuncho/coding/blog-oiyo/data/catalog/ahoxy-migration.audit.csv`

This is exactly the right direction for qualifications, lecture systems, and multi-project migration.

#### C. Ahoxy migration is becoming manageable

The audit pass produced a real migration landscape instead of intuition-only planning.

Current Ahoxy audit summary:

1. `ahoxy_slugs=302`
2. `track::interactive=102`
3. `track::magazine=124`
4. `track::academy=5`
5. `track::cross-link-only=57`
6. `track::hold=14`

Source:

`/Users/seuncho/coding/blog-oiyo/data/catalog/ahoxy-migration.audit.summary.txt`

This is a major strength. It means migration decisions can now be made from a list rather than from memory.

#### D. Core schema implementation has started correctly

The changes in `/Users/seuncho/coding/blog-oiyo/src/content/config.ts` and `/Users/seuncho/coding/blog-oiyo/src/lib/taxonomy.ts` are directionally correct because they are additive and transition-friendly rather than destructive.

That matters in a content-heavy repository.

### What is risky right now

#### A. The repository is ahead of its validation layer

There are many modified files and many new content files, routes, and components. The project is no longer in a purely conceptual phase, even though some planning documents still describe it that way.

Evidence:

1. `docs/execution-roadmap.md` still says the project is not yet in large-scale implementation
2. the worktree already contains new routes, many new content files, and many new interactive components

This mismatch creates operational ambiguity. People may think they are still planning, while the repository is already accumulating production-shaped debt.

#### B. Content growth is faster than content governance

There are many new MDX files and interactive pages appearing at once. That can work only if all of the following are already enforced:

1. frontmatter completeness
2. track correctness
3. series correctness
4. locale correctness
5. internal linking rules
6. rendering allowlist discipline

Right now, those rules are documented, but not yet fully enforced in code or linting.

#### C. The MDX surface is still too broad

`/Users/seuncho/coding/blog-oiyo/src/pages/[...lang]/[...slug].astro` imports a very large number of MDX and calculator components directly. This is the opposite of the long-term MDOC direction.

This does not mean the file is wrong. It means it still reflects the old “open component surface” model.

That file is one of the highest-priority control points for the next stage.

#### D. Taxonomy is improved, but not yet canonical enough

`interactive` now exists in code, which is excellent.

But `taxonomy.ts` still largely falls back to category inference, and category lists remain hand-maintained arrays. That is acceptable for transition, but not yet good enough for long-term consistency.

What is still missing:

1. a canonical category registry
2. category-to-track ownership rules
3. domain grouping rules
4. validation of disallowed category-track combinations

#### E. The progress reporting layer is stale

`/Users/seuncho/coding/blog-oiyo/reports/PROGRESS_REPORT.md` is out of sync with the current strategy.

It tracks a different mental model:

1. batch-style feature progress
2. ad hoc interactive additions
3. older implementation themes

It is not wrong, but it is no longer the primary source of truth.

## 3. Assessment of Current Direction

### Direction score: positive, with one major correction needed

The current direction should continue.

The correction is this:

Move from expansion mode to controlled system-building mode.

Right now, Claude Code appears to have been very good at:

1. drafting standards
2. spinning up structures
3. producing breadth quickly

But from this point onward, the highest-value behavior is different:

1. reduce ambiguity
2. formalize constraints
3. verify before multiplying
4. backfill structure before mass migration

If this correction is made now, the work remains healthy.
If not, the repository may become impressive-looking but expensive to normalize later.

## 4. Recommended Path Forward

## Phase 3A — Freeze and Align

### Goal

Stop uncontrolled expansion long enough to make the current foundation reliable.

### Actions

1. treat the current docs set as the authoritative planning baseline
2. mark `/Users/seuncho/coding/blog-oiyo/reports/PROGRESS_REPORT.md` as legacy or superseded
3. confirm the current implementation build status
4. produce one canonical implementation tracker tied to the new track system

### Completion signal

There is one clear source of truth for:

1. planning
2. implementation status
3. migration status

## Phase 3B — Renderer and Metadata Control

### Goal

Make sure content cannot drift away from the standard faster than we can review it.

### Actions

1. tighten `/Users/seuncho/coding/blog-oiyo/src/pages/[...lang]/[...slug].astro`
2. split component access into a smaller registered surface
3. introduce track-aware and layout-aware rendering conventions
4. define which components remain globally available and which must be explicitly mapped
5. verify locale fallbacks and translation key coverage for new interactive UI

### Completion signal

Writers and generators can only use a narrower, more intentional authoring surface.

## Phase 3C — Canonical Taxonomy and Inventory

### Goal

Replace implicit classification with explicit registries.

### Actions

1. create a canonical category registry file
2. define allowed category-to-track pairings
3. define allowed series-to-category pairings
4. define a content inventory file that can act as the operational backlog
5. keep undecided items in `revisit-later` rather than forcing classification

### Completion signal

The system can answer, from data, not memory:

1. what this content is
2. where it belongs
3. what it links to
4. what still needs review

## Phase 3D — Content Backfill Before New Expansion

### Goal

Normalize the most valuable existing content before adding hundreds more pages.

### Actions

1. backfill frontmatter for priority content families
2. standardize chapter naming to `Ch1. ...`
3. add `track`, `series`, `chapter`, `chapterTitleShort`, `sourceProject`, and `layoutVariant` to priority content
4. normalize interactive pages first, because they represent the new differentiation strategy
5. normalize lecture pages second, because they need the highest structural discipline

### Completion signal

The highest-traffic or highest-priority content families comply with the new schema and naming standard.

## Phase 3E — Ahoxy Migration in Controlled Waves

### Goal

Migrate only what fits the new editorial architecture.

### Actions

1. migrate `interactive` candidates first
2. migrate `magazine` candidates second
3. leave `hold` and `revisit-later` items out of the active roadmap unless a specific editorial angle appears
4. do not mass-port content only because it exists
5. rewrite for search intent, internal linking, and Cloudflare-friendly content structure

### Completion signal

Migrated content strengthens the system instead of bloating it.

## 5. Practical Evaluation of Claude Code Usage

Claude Code has been productive for this project, but the best usage pattern is changing.

### Good fit for Claude Code right now

1. standard writing
2. schema definition
3. migration mapping
4. content registry drafting
5. batch metadata normalization
6. implementation checklists

### Lower-fit behavior right now

1. creating too many new pages before schema enforcement is complete
2. adding many new interactive components before the renderer contract is reduced
3. growing multiple content families in parallel without a canonical inventory-led backlog

### Recommendation

Continue using Claude Code, but shift the prompt pattern from:

`make more things`

to:

`normalize, validate, constrain, then expand`

That is the right maturity move for the current state of this repository.

## 6. Immediate Next Actions

### Priority 1

Verify and stabilize the current implementation layer:

1. build status
2. route integrity
3. track query correctness
4. locale fallback correctness

### Priority 2

Create the operational control files:

1. canonical category registry
2. content inventory master file
3. implementation tracker aligned to `academy / magazine / interactive`

### Priority 3

Normalize priority content families:

1. management lectures
2. economics lectures
3. NCS lecture system
4. tax and qualification overview content
5. Ahoxy interactive migration candidates

## 7. Final Conclusion

Current progress is better than “early draft” and not yet stable enough to call “systematized production”.

The project is in the most important middle phase:

1. the vision is now real
2. the structure is visible
3. the risk is manageable
4. the next success depends on discipline, not just speed

The current direction is worth continuing.

The strongest next move is not broader generation.

The strongest next move is to make the emerging system stricter, more canonical, and easier to trust.

# 260507 Conversation Compact

## Core Goal

Turn `blog-oiyo` into a structured content platform centered on:

1. `academy`
2. `magazine`
3. `interactive`

while using `ahoxy-nextjs` as a migration source and keeping Cloudflare Pages as the main platform direction.

## Main Decisions Already Agreed

1. move toward a safer, more restricted MDOC-style authoring model
2. do not solve markdown rendering issues by recommending raw HTML everywhere
3. use `interactive` as the dedicated track for reading-plus-island content
4. avoid reliance on newly produced image assets
5. keep uncertain migration items in hold or revisit-later queues
6. pre-plan lectures, qualifications, categories, content inventory, and migration rules before scaling further

## What Has Been Produced

### Documentation

Planning and governance documents now exist for:

1. brand and project roles
2. content charter
3. MDOC authoring rules
4. component allowlist and disallowlist
5. lecture registry
6. qualification family map
7. execution roadmap
8. content schema draft
9. cross-project standardization manual
10. interactive migration map
11. category and track map
12. internal linking playbook
13. GA4 review checklist
14. inventory survey report

### Structured data

Structured files now exist for:

1. qualification schema
2. qualification templates
3. content inventory template
4. Ahoxy migration audit
5. Ahoxy migration summary
6. revisit-later queue

### Implementation started

Actual code changes already began in:

1. `/Users/seuncho/coding/blog-oiyo/src/content/config.ts`
2. `/Users/seuncho/coding/blog-oiyo/src/lib/taxonomy.ts`
3. `/Users/seuncho/coding/blog-oiyo/src/pages/[...lang]/magazine.astro`
4. `/Users/seuncho/coding/blog-oiyo/src/pages/[...lang]/courses.astro`
5. `/Users/seuncho/coding/blog-oiyo/src/pages/[...lang]/category/[category]/index.astro`
6. `/Users/seuncho/coding/blog-oiyo/src/pages/[...lang]/category/[category]/[page].astro`
7. `/Users/seuncho/coding/blog-oiyo/src/layouts/BaseLayout.astro`
8. `/Users/seuncho/coding/blog-oiyo/src/pages/[...lang]/interactive.astro`

## Current State

The project is no longer only planning.

It is now in a mixed state:

1. planning is strong
2. schema transition has started
3. migration logic exists
4. content and component growth is accelerating
5. governance and validation now need to catch up

## Immediate Operating Principle

Proceed with implementation, but:

1. keep uncertain items in revisit-later
2. prioritize normalization over expansion
3. strengthen taxonomy, metadata, and rendering control before mass migration

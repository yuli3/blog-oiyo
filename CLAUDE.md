# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at localhost:4321
npm run build      # Production build (static output)
npm run preview    # Preview built site locally
```

No test or lint commands are configured.

## Architecture Overview

This is a **multilingual educational blog** built with **Astro 5** (static output) deployed on **Cloudflare Pages**.

### Routing

All public routes live under `src/pages/[...lang]/`. The root `src/pages/index.astro` detects the browser locale and redirects accordingly. Supported locales: `en`, `ko`, `ja`, `fr`, `es`, `zh`, `cn`.

Blog post slugs are stored in Astro Content Collections under `src/content/blog/[locale]/` as `.mdx` files.

### Content Collections

Schema defined in `src/content/config.ts`. Required frontmatter fields:
- `title` (10–100 chars), `description` (10–200 chars)
- `pubDate`, `tags`, `category`, `locale`
- Optional: `updatedDate`, `heroImage`, `draft`, `featured`

### i18n

- Manual routing (not Astro's built-in i18n) via `[...lang]` dynamic segments
- Translation JSON files in `src/locales/[locale].json`
- Utilities in `src/lib/i18n.ts`

### Key Paths

| Purpose | Path |
|---|---|
| Site-wide config | `src/config/site.config.ts` |
| Route helpers | `src/lib/routes.ts` |
| Category/track logic | `src/lib/taxonomy.ts` |
| Global styles | `src/styles/global.css` |
| Base layout | `src/layouts/BaseLayout.astro` |
| Blog post route | `src/pages/[...lang]/[...slug].astro` |

### MDX Components

Rich educational components live in `src/components/mdx/` (charts, quizzes, callouts, timelines, formula boxes, etc.) and feature-specific components in `src/features/education-*/`. These are imported and used directly inside `.mdx` files.

### Static Data

Non-blog data (glossary, vocab, celebrities, lostark, AI) is stored as JSON under `public/data/` and fetched client-side.

### Styling

Tailwind v4 (vite plugin). OKLCH color space. Path alias `@/*` maps to `src/*`.

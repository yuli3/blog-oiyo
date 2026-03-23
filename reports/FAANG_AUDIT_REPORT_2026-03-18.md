# FAANG-Level Final Audit Report — blog-oiyo
**Date:** 2026-03-18
**Auditor:** Claude Code (Sonnet 4.6)
**Stack:** Astro 5 + React 19 + Cloudflare Pages

---

## Executive Summary

**blog-oiyo** is an Astro 5 + React 19 educational blog with 1,970 MDX posts across 7 locales. The project has strong SEO infrastructure and rich MDX components, but contains critical i18n inconsistencies, placeholder chart implementations, and gaps in automation that need immediate attention.

**Key Metrics:**
- Build size: 146MB (dist/)
- Total posts: 1,970 MDX files
- Build time: ~34 seconds
- Locales: 7 (en, ko, ja, fr, es + zh, cn extended)
- Posts by locale: KO 661 | EN 626 | JA 380 | CN 99 | ES 96 | FR 96 | ZH 11

---

## Critical Issues (P0/P1)

### [P0] Missing zh.json Translation File
**File:** `src/locales/zh.json` (empty, 0 lines)

Routes render for `/zh/` but the translation file is empty. Any page calling i18n strings throws a runtime error.

**Additional conflict:** Three different locale definitions in the project:
1. `astro.config.mjs`: `["en", "ko", "ja", "fr", "es"]`
2. `src/lib/i18n.ts`: `['en', 'ko', 'ja', 'fr', 'es', 'zh', 'cn']`
3. `src/config/site.config.ts`: `["en", "ko", "ja", "fr", "es"]`

**Fix:** Copy `en.json` to `zh.json` and translate, OR remove `zh` from routing entirely.

---

### [P0] Chart Components Are Placeholders — Educational Content Broken
**Files:**
- `src/features/education-finance/FinanceCharts.tsx`
- `src/features/education-common/components/LectureVisuals.tsx`

```typescript
export function OptionPayoffChart() {
  return <div>📈 Option Payoff Chart (Placeholder)</div>;
}
export function FrontierChart() {
  return <div>📊 Efficient Frontier Chart (Placeholder)</div>;
}
export function NPVChart() { return <div>📉 NPV Chart (Placeholder)</div>; }
export function SMLChart() { return <div>📈 SML Chart (Placeholder)</div>; }
```

These are used in finance education MDX content. Interactive learning is broken.

**Fix:** Implement with Recharts, Plotly.js, or Chart.js.

---

### [P1] RSS Feed Broken for Non-English Locales
**File:** `src/pages/rss.xml.ts:18`

```typescript
link: `/blog/${post.slug}/`,  // slug includes locale → "/blog/ko/my-post/" (wrong)
```

Should either generate per-locale feeds (`/en/rss.xml`, `/ko/rss.xml`) or fix link generation.

---

### [P1] Content Collection Schema Missing Required Fields

**File:** `src/content/config.ts`

```typescript
locale: z.enum(['en', 'ko', 'ja', 'fr', 'es', 'zh', 'cn']).optional(),
// ↑ optional — posts without locale are silently excluded, no build error
```

**Fix:**
```typescript
locale: z.enum(['en', 'ko', 'ja', 'fr', 'es', 'zh', 'cn']),  // required
tags: z.array(z.string()).min(1),
category: z.enum([...ACADEMY_CATEGORIES, ...MAGAZINE_CATEGORIES]),
```

---

## High Priority Issues (P2)

### [P2] No Linting, Type Checking, or CI/CD
`package.json` has no `lint` or `type-check` scripts. No `.github/workflows`. No pre-commit hooks. TypeScript strict mode is on, but nothing enforces it.

**Fix:**
```json
"lint": "astro check && eslint src/",
"type-check": "astro check",
"ci": "npm run type-check && npm run build"
```

---

### [P2] Analytics IDs Hardcoded in Source
**File:** `src/config/site.config.ts:33-34`

```typescript
googleAnalyticsId: "G-915L6V38X6",
googleAdsenseId: "ca-pub-9541920090543312",
```

Meanwhile `.env.example` has placeholder vars that are never read. Conflates config with code.

**Fix:** Use `import.meta.env.PUBLIC_GA_ID` and update `.env.example`.

---

### [P2] Fuse.js Loaded from CDN on Every Search
**File:** `src/pages/[...lang]/search.astro:72`

```typescript
const Fuse = (await import("https://cdn.jsdelivr.net/npm/fuse.js@7/dist/fuse.esm.min.mjs")).default;
```

Network round-trip on every first search. No caching.

**Fix:** `npm install fuse.js` and import locally.

---

### [P2] Hreflang Generation Logic Fragile
**File:** `src/components/SEO.astro:50-62`

Complex manual string manipulation for locale URLs under `routing: "manual"` mode. `getRelativeLocaleUrl()` is for Astro's automatic routing, not manual.

**Fix:** Commit to one approach. Either migrate to Astro automatic i18n routing, or rewrite hreflang with clean URL construction. Validate with Google Search Console.

---

### [P2] Inconsistent Locale Configuration (3 Sources of Truth)

```
astro.config.mjs: ["en", "ko", "ja", "fr", "es"]
src/lib/i18n.ts:  ['en', 'ko', 'ja', 'fr', 'es', 'zh', 'cn']
site.config.ts:   ["en", "ko", "ja", "fr", "es"]
```

**Fix:** Create `src/config/locales.ts`:
```typescript
export const SUPPORTED_LOCALES = ["en", "ko", "ja", "fr", "es"] as const;
export const EXTENDED_LOCALES = ["zh", "cn"] as const;
export const ALL_LOCALES = [...SUPPORTED_LOCALES, ...EXTENDED_LOCALES] as const;
```
Import everywhere else.

---

### [P2] Empty Middleware (Dead Code)
**File:** `src/middleware.ts`

```typescript
export const onRequest = defineMiddleware((context, next) => {
  return next();  // Does nothing
});
```

**Fix:** Implement security headers (CSP, X-Frame-Options, etc.) or delete.

---

### [P2] No Content Security Policy

No CSP headers in Cloudflare Pages config. Mermaid diagrams use inline scripts; AdSense/GA are third-party scripts. XSS attack surface is unmitigated.

**Fix:** Add `_headers` file for Cloudflare Pages:
```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.googletagmanager.com; img-src 'self' data: https:;
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
```

---

## Medium Priority Issues (P3)

### [P3] Build Output Size: 146MB
- `dist/img/`: 45MB — unoptimized images
- Per-locale dirs: ~25MB each

No `<Image />` from `astro:assets`. No WebP/AVIF. No responsive srcset. Risk of poor LCP Core Web Vitals.

**Fix:**
```typescript
import { Image } from 'astro:assets';
<Image src={heroImage} alt={title} width={1200} height={630} format="webp" />
```

---

### [P3] Pagination Not Implemented Despite Being Configured
**File:** `src/pages/[...lang]/index.astro:29-36`

```typescript
const page = {
  data: posts.slice(0, postsPerPage),  // Only page 1 ever renders
  currentPage: 1,
  lastPage: totalPages,  // calculated but unused
};
```

`siteConfig.features.pagination = true` but no `[page].astro` route exists.

---

### [P3] Category Taxonomy Not Validated Against Schema
**File:** `src/content/config.ts`

`taxonomy.ts` defines `ACADEMY_CATEGORIES` and `MAGAZINE_CATEGORIES`, but content schema uses `z.string().optional()` — no enum enforcement.

---

### [P3] OG Image Not Used Per Post
**File:** `src/components/SEO.astro:18`

`heroImage` in frontmatter is not automatically used as OG image. All posts share the same default OG image.

**Fix:**
```typescript
const finalImage = image || (post?.data?.heroImage) || siteConfig.seo.ogImage;
```

---

### [P3] Breadcrumb Schema Uses Raw URL Segments
**File:** `src/components/SEO.astro:186-203`

```typescript
name: segment.charAt(0).toUpperCase() + segment.slice(1),  // "my-post" → "My-post"
```

Should use actual page titles from frontmatter.

---

### [P3] Feature Folders Mostly Empty
**File:** `src/features/` (8 subdirectories)

Most are stubs. Actual components live in `src/components/mdx/` (29 chart/viz components). Either populate features or flatten to `src/components/`.

---

### [P3] Font Loading Not Optimized
Google Fonts loaded from CDN (`fonts.googleapis.com`). Two round-trips add ~50-100ms latency.

**Fix:** Self-host fonts via `@fontsource` packages.

---

### [P3] No Dark Mode

Colors hardcoded in inline styles. No `prefers-color-scheme` handling. Accessibility gap.

---

### [P3] Deprecated punycode Warning in Build

```
(node:78100) [DEP0040] DeprecationWarning: The `punycode` module is deprecated.
```

Update `@astrojs/sitemap` and `@astrojs/rss` to remove dependency.

---

### [P3] Meta Description Max Length Too Long
Schema: `description: z.string().min(10).max(200)` — Google SERP shows 155-160 chars.

**Fix:** `max(160)`.

---

### [P3] Translation Parity Gap

| Locale | Posts | Status |
|--------|-------|--------|
| KO | 661 | ✅ Primary |
| EN | 626 | ✅ Complete |
| JA | 380 | ⚠️ 60% |
| CN | 99 | ❌ 15% |
| ES | 96 | ❌ 15% |
| FR | 96 | ❌ 15% |
| ZH | 11 | ❌ 2% |

No automated sync workflow documented.

---

## Performance Audit

| Area | Status | Grade |
|------|--------|-------|
| Static generation | All routes pre-rendered | A+ |
| Build time | ~34s for 1,970 posts | A |
| Image optimization | None (unoptimized) | D |
| Font loading | CDN, 2 round-trips | C |
| Bundle size | 146MB dist | C |
| JS loading | CDN import for Fuse.js | C |
| Core Web Vitals (predicted) | LCP at risk from images | B- |

---

## SEO Audit

| Area | Status |
|------|--------|
| JSON-LD structured data | ✅ Present |
| Sitemap | ✅ Auto-generated |
| RSS feed | ⚠️ Broken locale links |
| Hreflang | ⚠️ Complex logic, unvalidated |
| x-default hreflang | ✅ Present |
| Canonical URLs | ✅ Next.js handles |
| OG image per post | ❌ All share default |
| Meta description length | ⚠️ Max 200 (should be 160) |
| Breadcrumb schema | ⚠️ Uses raw URL segments |

---

## Architecture Audit

**Strengths:**
- Clear content collection structure (academy vs magazine)
- Comprehensive MDX component library (30+ components)
- Good SEO infrastructure foundation
- Fast static build pipeline

**Weaknesses:**
- Three locale sources of truth
- Mixed i18n patterns (manual routing + `getRelativeLocaleUrl()` conflict)
- Feature folders pattern not fully implemented
- No automation (lint, type-check, CI/CD)

---

## Roadmap

### Phase 1 — Immediate (This Sprint)
- [ ] Fix `zh.json` — copy en.json and translate or remove zh routing
- [ ] Implement placeholder chart components (Recharts/Chart.js)
- [ ] Fix RSS link generation for non-English locales
- [ ] Add `type-check` and `lint` scripts to `package.json`
- [ ] Unify locale config into single `src/config/locales.ts`

### Phase 2 — Short-term (Next Sprint)
- [ ] Move analytics IDs to environment variables
- [ ] Install fuse.js locally (remove CDN import)
- [ ] Implement CSP headers via Cloudflare Pages `_headers` file
- [ ] Fix content collection schema (require `locale`, validate `category`)
- [ ] Use `astro:assets` `<Image />` for all post images

### Phase 3 — Medium-term (Q2)
- [ ] Implement full pagination (`[page].astro`)
- [ ] Add dark mode toggle
- [ ] Fix hreflang generation (validate with Google Search Console)
- [ ] Add GitHub Actions CI (build + type-check on PR)
- [ ] Improve CN/ES/FR/ZH translation parity

### Phase 4 — Long-term (Q3+)
- [ ] Add comment system (Giscus)
- [ ] Implement collaborative translation workflow (Crowdin)
- [ ] Content scheduling (future `publishDate`)
- [ ] Email newsletter integration (Buttondown already configured)
- [ ] Consider CMS integration if editorial team grows

---

## Quick Wins (< 1 hour each)

1. `src/middleware.ts` — delete empty middleware or add security headers (5 min)
2. `src/content/config.ts` — change `locale` from `.optional()` to required, tighten description max to 160 (15 min)
3. `package.json` — add `"type-check": "astro check"` and `"lint": "astro check"` (5 min)
4. `src/pages/rss.xml.ts:18` — fix locale link construction (30 min)
5. `src/config/locales.ts` — create single source of truth for locales (30 min)
6. `src/config/site.config.ts:33-34` — move GA/AdSense IDs to `.env` (30 min)
7. `src/content/config.ts` — add category enum validation from taxonomy.ts (20 min)
8. `npm install fuse.js` — replace CDN import (10 min)

---

*Report generated 2026-03-18 | Next audit recommended: 2026-06-18*

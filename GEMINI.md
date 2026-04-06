# GEMINI.md - blog-oiyo

## Project Overview
**blog-oiyo** is a high-performance, multi-language blog and educational platform built with **Astro**, **React**, and **Tailwind CSS**. It is designed for static site generation (SSG) and is deployed on **Cloudflare Pages**.

The platform supports internationalization (i18n) across seven languages and features advanced MDX capabilities, including LaTeX math rendering and wiki-style internal linking.

### Key Technologies
- **Framework:** Astro 5.x (Static Output)
- **UI Components:** React 19.x, Lucide React
- **Styling:** Tailwind CSS 4.x (via Vite plugin)
- **Content:** MDX, Remark/Rehype plugins (Math, Wiki-links, Slug, Autolink headings)
- **Deployment:** Cloudflare Pages
- **i18n:** Custom implementation with JSON locale files (`src/locales/`) and manual routing.

## Building and Running

### Development
```bash
npm run dev
```
Starts the Astro development server.

### Build
```bash
npm run build
```
Generates the static site in the `dist/` directory. This includes a pre-build step (`scripts/generate-og.mjs`) to generate Open Graph images.

### Preview
```bash
npm run preview
```
Previews the production build locally using the Cloudflare adapter emulator if configured, or Astro's internal server.

### Type Checking & Linting
```bash
npm run type-check  # Runs 'astro check'
npm run lint        # Alias for 'astro check'
```

### Specialized Scripts
- **i18n Audit:** `npm run validate:i18n` (checks for missing translations).
- **Personality Data Validation:** `npm run validate:personality` (validates JSON data in `public/data/`).
- **Translation:** `scripts/translate-all.ts` (uses Google Translate API for batch content translation).
- **OG Image Generation:** `scripts/generate-og.mjs` (automatically runs before building).

## Development Conventions

### Content Management
- **Collections:** The primary content collection is `blog` (defined in `src/content/config.ts`).
- **Frontmatter:** All blog posts must include `title`, `description`, `pubDate`, and `locale`.
- **Locale Enforcement:** Each post is language-specific. Use the `locale` field in MDX frontmatter to associate it with one of the supported languages (`en`, `ko`, `ja`, `fr`, `es`, `zh`, `cn`).

### Internationalization (i18n)
- **Locale Files:** Translation strings are stored in `src/locales/*.json`.
- **Translation Helper:** Use `src/lib/i18n.ts` for path localization and translation retrieval.
- **Routing:** The site uses manual routing (`[...lang]/` pattern in `src/pages/`). Ensure new pages respect the language prefix.

### Styling & Components
- **Tailwind v4:** Uses the `@tailwindcss/vite` plugin. Directives are managed in `src/styles/global.css`.
- **React vs Astro:** Use Astro components for static layouts and React for client-side interactivity (e.g., calculators, quizzes).
- **UI Library:** A local `src/components/ui/` directory likely contains reusable primitive components (similar to shadcn/ui pattern).

### Best Practices
- **Performance:** Keep client-side JS to a minimum. Use Astro's partial hydration (`client:load`, `client:visible`) only where necessary.
- **Accessibility:** Use semantic HTML and ensure interactive components are keyboard-accessible.
- **SEO:** Always include a `description` and `heroImage` (if available) for better social sharing metadata.

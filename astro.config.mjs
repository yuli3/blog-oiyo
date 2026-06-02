// @ts-check

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import robotsTxt from "astro-robots-txt";
import wikiLinkPlugin from "remark-wiki-link";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

// https://astro.build/config
export default defineConfig({
  site: "https://blog.oiyo.net",
  output: "static",
  integrations: [
    react(),
    mdx(),
    sitemap({
      // Exclude dev/utility paths and underscore-prefixed routes
      filter: (page) => {
        const url = new URL(page);
        const path = url.pathname;
        // Exclude paths with underscore segments
        if (path.split("/").some((seg) => seg.startsWith("_"))) return false;
        // Exclude /index duplicate (trailing slash version is canonical)
        if (path.endsWith("/index/") || path === "/index") return false;
        return true;
      },
      // Set lastmod to today's build date
      lastmod: new Date(),
      // Use serialize for per-URL priority and changefreq
      serialize: (item) => {
        const url = new URL(item.url);
        const path = url.pathname;
        // Homepage — highest priority
        if (path === "/" || path === "") {
          return { ...item, priority: 1.0 };
        }
        // Locale homepages (e.g. /ko/, /ja/, /fr/)
        if (/^\/(ko|ja|fr|es|zh|cn)\/$/.test(path)) {
          return { ...item, priority: 0.9 };
        }
        // Blog article pages
        if (/^\/(en|ko|ja|fr|es|zh|cn)\/[^/]+\/$/.test(path)) {
          return { ...item, priority: 0.8 };
        }
        // Pagination pages (/2/, /3/, …)
        if (/\/\d+\/$/.test(path)) {
          return { ...item, priority: 0.4 };
        }
        // Everything else
        return { ...item, priority: 0.6 };
      },
    }),
    robotsTxt(),
  ],
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
    },
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ko", "ja", "fr", "es", "zh", "cn"],
    routing: "manual",
  },
  build: {
    format: "directory",
    concurrency: 1,
  },
  vite: {
    plugins: [/** @type {any} */ (tailwindcss())],
  },
  markdown: {
    // Disable built-in GFM so we can re-apply it with singleTilde: false.
    // Korean content uses ~ as a range character (e.g. "1~2번 12일~13일"),
    // which MDX would otherwise parse as strikethrough.
    // Intentional strikethrough should use <del>text</del> instead.
    gfm: false,
    shikiConfig: {
      theme: "github-dark",
      wrap: true,
    },
    remarkPlugins: [
      [remarkGfm, { singleTilde: false }],
      remarkMath,
      [
        wikiLinkPlugin,
        { hrefTemplate: (/** @type {string} */ permalink) => `/${permalink}` },
      ],
    ],
    rehypePlugins: [
      [rehypeKatex, { strict: "ignore" }],
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap" }],
    ],
  },
});

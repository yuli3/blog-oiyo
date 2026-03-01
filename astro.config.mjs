// @ts-check

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import robotsTxt from "astro-robots-txt";
import wikiLinkPlugin from "remark-wiki-link";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://blog.oiyo.net",
  output: "static",
  adapter: cloudflare({
    imageService: "compile",
  }),
  integrations: [react(), mdx(), sitemap(), robotsTxt()],
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
    locales: ["en", "ko", "ja", "fr", "es"],
    routing: "manual",
  },
  build: {
    format: "directory",
  },
  vite: {
    plugins: [/** @type {any} */ (tailwindcss())],
  },
  markdown: {
    shikiConfig: {
      theme: "github-dark",
      wrap: true,
    },
    remarkPlugins: [
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

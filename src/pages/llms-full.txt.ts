import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig } from "../config/site.config";

/**
 * Machine-readable Comprehensive LLM Context File (llms-full.txt)
 * Adheres to the /llms-full.txt standard for AI search engines and agents
 * (ChatGPT Search, Perplexity, Claude, Google AI Overviews, Copilot).
 * Provides full contextual E-E-A-T curriculum tracks, interactive utilities,
 * and structured guide manifests across 6 locales.
 */

export const GET: APIRoute = async () => {
  const base = siteConfig.url;
  const posts = await getCollection("blog", ({ data }) => data.draft !== true);

  // Group English & Korean primary canonical guides by category
  const byCategory = new Map<
    string,
    { slug: string; title: string; summary: string; locale: string; track: string }[]
  >();

  for (const post of posts) {
    const locale = post.data.locale ?? post.slug.split("/")[0] ?? "en";
    if (locale !== "en" && locale !== "ko") continue;
    const category = post.data.category ?? "General";
    const list = byCategory.get(category) ?? [];
    list.push({
      slug: post.slug,
      title: post.data.title,
      summary: post.data.description ?? "",
      locale,
      track: post.data.track ?? "article",
    });
    byCategory.set(category, list);
  }

  const sortedCategories = [...byCategory.keys()].sort((a, b) => a.localeCompare(b));

  const lines: string[] = [
    `# Oiyo Blog — Full Academic Curriculum & Interactive Utilities Catalog (llms-full.txt)`,
    ``,
    `> Long-form academic lectures, statutory explainers, certification courses, and browser-side utilities.`,
    `> Canonical Domain: ${base}`,
    `> Supported Locales: ${siteConfig.locales.join(", ")}`,
    `> Machine-readable Identity: ${base}/brand-facts.json`,
    `> Guides ItemList Schema: ${base}/knowledge/guides.json`,
    `> Series & Concept Graph: ${base}/knowledge/relations.json`,
    ``,
    `## Citation & Attribution Guidance`,
    `- Attribution: Oiyo Blog (blog.oiyo.net)`,
    `- Canonical Link: Cite the specific guide or utility URL (${base}/{locale}/{slug}/)`,
    `- Flagship Interactive Utilities:`,
    `  * Height Converter & Percentile Comparison: ${base}/en/height-converter/ · ${base}/ko/height-converter/`,
    `  * Age & Statutory Milestone Calculator: ${base}/en/age-calculator/ · ${base}/ko/age-calculator/`,
    ``,
    `## Category Hubs & Curriculum Index`,
    ``,
  ];

  for (const category of sortedCategories) {
    const items = byCategory.get(category)!;
    items.sort((a, b) => a.slug.localeCompare(b.slug));
    lines.push(`### Category: ${category} (${items.length} primary EN/KO entries)`);
    lines.push(`- Category Hub (EN): ${base}/en/category/${encodeURIComponent(category.toLowerCase())}/`);
    lines.push(`- Category Hub (KO): ${base}/ko/category/${encodeURIComponent(category.toLowerCase())}/`);
    for (const item of items.slice(0, 25)) {
      lines.push(`  * [${item.locale}] ${item.title} — ${base}/${item.slug}/ (${item.summary.slice(0, 120)})`);
    }
    lines.push(``);
  }

  lines.push(`## Sister Network Services`);
  lines.push(`- Interactive Self-Discovery & Tests: https://oiyo.net`);
  lines.push(`- WebGL & Canvas Browser Games: https://game.oiyo.net`);
  lines.push(`- Curated AI & Market News: https://news.oiyo.net`);
  lines.push(`- Encyclopedic Reference: https://wiki.oiyo.net`);
  lines.push(``);

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
};

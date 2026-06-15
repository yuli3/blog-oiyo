import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig } from "../../config/site.config";

/**
 * Public machine-citable catalog of blog guides/articles (explanation layer).
 * Output: /knowledge/guides.json — a schema.org ItemList of Articles.
 *
 * Complements wiki's /knowledge/topics.json (definitions). Additive endpoint.
 */
export const GET: APIRoute = async () => {
  const posts = await getCollection("blog", ({ data }) => data.draft !== true);

  const guides = posts
    .map((p) => {
      const localeFromSlug = p.slug.split("/")[0];
      const concept = p.slug.split("/").slice(1).join("/");
      const modified = p.data.updatedDate ?? p.data.pubDate;
      return {
        id: p.slug,
        concept,
        url: new URL(`/${p.slug}/`, siteConfig.url).href,
        title: p.data.title,
        summary: p.data.description,
        track: p.data.track ?? null,
        category: p.data.category ?? null,
        series: p.data.series ?? null,
        chapter: p.data.chapter ?? null,
        locale: p.data.locale ?? localeFromSlug,
        tags: p.data.tags ?? [],
        author: p.data.author ?? "Oiyo",
        datePublished: p.data.pubDate?.toISOString().slice(0, 10) ?? null,
        dateModified: modified?.toISOString().slice(0, 10) ?? null,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const body = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${siteConfig.name} Blog — Guides Catalog`,
    url: `${siteConfig.url}/knowledge/guides.json`,
    description:
      "Catalog of long-form guides, lectures and explainers (astrology, saju, personality, finance, certifications). Stable URLs for human and machine citation.",
    publisher: { "@type": "Organization", name: siteConfig.seo.organization.name },
    dateModified: new Date().toISOString(),
    count: guides.length,
    itemListElement: guides,
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};

import type { APIRoute } from "astro";
import { siteConfig } from "../../config/site.config";

/**
 * Discovery manifest for the blog knowledge layer + the Oiyo knowledge network.
 * Output: /knowledge/index.json
 */
export const GET: APIRoute = async () => {
  const base = siteConfig.url;
  const body = {
    name: `${siteConfig.name} Blog — Knowledge Layer`,
    role: "explanation",
    description:
      "Long-form guides, lectures and explainers. The explanation layer of the Oiyo knowledge network.",
    publisher: { name: siteConfig.seo.organization.name, url: base },
    locales: siteConfig.locales,
    resources: {
      guides: {
        url: `${base}/knowledge/guides.json`,
        description: "ItemList of guides/articles with summary, track, locale, stable URL.",
      },
      relations: {
        url: `${base}/knowledge/relations.json`,
        description: "Series clusters and cross-locale translations.",
      },
      feed: { url: `${base}/rss.xml`, description: "Recent updates feed." },
      sitemap: { url: `${base}/sitemap-index.xml`, description: "Full URL index." },
    },
    network: {
      description: "Part of the Oiyo knowledge network (definitions · explanations · tools).",
      sites: [
        { role: "definition", name: "Oiyo Wiki", url: "https://wiki.oiyo.net", knowledge: "https://wiki.oiyo.net/knowledge/index.json" },
        { role: "explanation", name: "Oiyo Blog", url: "https://blog.oiyo.net", knowledge: "https://blog.oiyo.net/knowledge/index.json" },
        { role: "execution", name: "Oiyo", url: "https://oiyo.net", knowledge: "https://oiyo.net/knowledge/index.json" },
      ],
    },
    citation: "Cite individual guides by their stable URL (see guides.json `url`). Attribution: Oiyo (blog.oiyo.net).",
    dateModified: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};

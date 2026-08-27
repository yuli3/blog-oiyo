import type { APIRoute } from "astro";
import { siteConfig } from "../../config/site.config";

/**
 * Discovery manifest for Blog publishing and utilities + the Oiyo network.
 * Output: /knowledge/index.json
 */
export const GET: APIRoute = async () => {
  const base = siteConfig.url;
  const body = {
    name: `${siteConfig.name} Blog — Publishing and Utilities`,
    role: "publishing-and-utility",
    description:
      "Long-form guides, lectures, references, explainers, and established utilities.",
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
      description: "Part of the Oiyo network. Canonical route owners are selected per user intent rather than by content format.",
      sites: [
        { role: "reference-and-knowledge", name: "Oiyo Wiki", url: "https://wiki.oiyo.net", knowledge: "https://wiki.oiyo.net/knowledge/index.json" },
        { role: "publishing-and-utility", name: "Oiyo Blog", url: "https://blog.oiyo.net", knowledge: "https://blog.oiyo.net/knowledge/index.json" },
        { role: "interactive-tools", name: "Oiyo", url: "https://oiyo.net", knowledge: "https://oiyo.net/knowledge/index.json" },
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

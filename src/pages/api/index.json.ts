import type { APIRoute } from "astro";
import { siteConfig } from "../../config/site.config";
import manifest from "../../data/content-manifest.json";

/**
 * Oiyo data API root — discovery + schema.org Dataset descriptor.
 * Output: /api/index.json   (intended home of api.oiyo.net)
 */
export const GET: APIRoute = async () => {
  const base = siteConfig.url;
  const body = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Oiyo Content Dataset",
    description:
      "Machine-readable registry of Oiyo Blog content (guides, lectures, tools) with track, category, locale, series, and stable URLs. The data layer of the Oiyo knowledge network.",
    url: `${base}/api/index.json`,
    creator: { "@type": "Organization", name: siteConfig.seo.organization.name, url: base },
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    dateModified: manifest.generatedAt,
    measurementTechnique: "Generated from MDX frontmatter (npm run content:manifest).",
    distribution: [
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${base}/api/content.json`, description: `All ${manifest.counts?.total ?? manifest.items.length} content entries.` },
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${base}/api/categories.json`, description: "Canonical categories + counts." },
    ],
    counts: manifest.counts,
    citation: "Attribution: Oiyo (blog.oiyo.net). Cite individual entries by their stable URL.",
    relatedNetwork: [
      { role: "definition", url: "https://wiki.oiyo.net/knowledge/index.json" },
      { role: "explanation", url: "https://blog.oiyo.net/knowledge/index.json" },
    ],
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

import type { APIRoute } from "astro";
import manifest from "../../data/content-manifest.json";

/**
 * Full content manifest as a machine-readable data API.
 * Output: /api/content.json  (api.oiyo.net can CNAME/proxy this)
 * CORS-open so external sites and AI agents can consume it.
 */
export const GET: APIRoute = async () => {
  const body = {
    generatedAt: manifest.generatedAt,
    count: manifest.counts?.total ?? manifest.items.length,
    license: "Attribution to Oiyo (blog.oiyo.net).",
    items: manifest.items,
  };
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

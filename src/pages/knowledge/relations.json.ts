import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig } from "../../config/site.config";

/**
 * Concept graph for blog guides.
 * Output: /knowledge/relations.json
 *  - sets:    series cluster memberships (per locale)
 *  - sameAs:  cross-locale translation tuples (same concept, different language)
 */
export const GET: APIRoute = async () => {
  const posts = await getCollection("blog", ({ data }) => data.draft !== true);
  const url = (slug: string) => new URL(`/${slug}/`, siteConfig.url).href;

  const setMap = new Map<
    string,
    { id: string; kind: "series"; locale: string; name: string; members: string[] }
  >();
  const sameAsMap = new Map<string, Record<string, string>>();

  for (const p of posts) {
    const locale = p.data.locale ?? p.slug.split("/")[0];
    const concept = p.slug.split("/").slice(1).join("/");

    if (p.data.series) {
      const key = `series:${locale}:${p.data.series}`;
      let s = setMap.get(key);
      if (!s) {
        s = { id: key, kind: "series", locale, name: p.data.series, members: [] };
        setMap.set(key, s);
      }
      s.members.push(p.slug);
    }

    const tuple = sameAsMap.get(concept) ?? {};
    tuple[locale] = url(p.slug);
    sameAsMap.set(concept, tuple);
  }

  const sets = [...setMap.values()]
    .filter((s) => s.members.length >= 2)
    .map((s) => ({ ...s, members: s.members.sort() }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const sameAs = [...sameAsMap.entries()]
    .filter(([, urls]) => Object.keys(urls).length >= 2)
    .map(([concept, urls]) => ({ concept, urls }))
    .sort((a, b) => a.concept.localeCompare(b.concept));

  const body = {
    "@context": "https://schema.org",
    name: `${siteConfig.name} Blog — Concept Graph`,
    url: `${siteConfig.url}/knowledge/relations.json`,
    description: "Series cluster memberships and cross-locale translation links for blog guides.",
    dateModified: new Date().toISOString(),
    setCount: sets.length,
    sameAsCount: sameAs.length,
    sets,
    sameAs,
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};

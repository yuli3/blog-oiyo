import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig } from "../../config/site.config";
// In-repo copy of the route-ownership seed (SSOT: docs/knowledge/topics.json,
// synced via docs/knowledge/sync-seed.sh). Imported so it bundles at build —
// Cloudflare builds each repo independently and cannot read outside files.
import seedData from "../../data/knowledge-seed.json";

/**
 * Concept graph for blog guides.
 * Output: /knowledge/relations.json
 *  - sets:    series cluster memberships (per locale)
 *  - sameAs:  cross-locale translation tuples (same concept, different language)
 *  - hubs:    cross-site concept ownership graph (from the shared route-ownership
 *             seed) + this site's explanation depth per topic (explanationCounts).
 */

type SeedTopic = {
  id: string;
  name?: Record<string, string>;
  primaryOwner?: string;
  definitionOwner?: string;
  explanationOwner?: string;
  marketPolicy?: string;
  aliases?: string[];
  routeIds?: string[];
  relatedTopicIds?: string[];
};

function readAllSeedTopics(): SeedTopic[] {
  return (seedData as { topics?: SeedTopic[] }).topics ?? [];
}

// Unicode-aware: keep letters/numbers of any script (CJK, Hangul) so non-latin
// tags/aliases (e.g. 해몽, 태몽) don't all collapse to the same token.
const norm = (s: string) => s.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");

export const GET: APIRoute = async () => {
  const posts = await getCollection("blog", ({ data }) => data.draft !== true);
  const url = (slug: string) => new URL(`/${slug}/`, siteConfig.url).href;

  const seedTopics = readAllSeedTopics();
  const seedIds = new Set(seedTopics.map((t) => t.id));
  // normalized tag/alias → topic id, for matching blog guides to hub topics
  const tagToTopic = new Map<string, string>();
  for (const t of seedTopics) {
    for (const token of [t.id, ...(t.aliases ?? [])]) tagToTopic.set(norm(token), t.id);
  }
  // topic id → { locale → count } of guides that explain it
  const explanationCounts = new Map<string, Record<string, number>>();

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

    // count this guide toward any hub topic it is tagged with (once per topic)
    const matched = new Set<string>();
    for (const tag of p.data.tags ?? []) {
      const topicId = tagToTopic.get(norm(tag));
      if (topicId) matched.add(topicId);
    }
    for (const topicId of matched) {
      const byLocale = explanationCounts.get(topicId) ?? {};
      byLocale[locale] = (byLocale[locale] ?? 0) + 1;
      explanationCounts.set(topicId, byLocale);
    }
  }

  const sets = [...setMap.values()]
    .filter((s) => s.members.length >= 2)
    .map((s) => ({ ...s, members: s.members.sort() }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const sameAs = [...sameAsMap.entries()]
    .filter(([, urls]) => Object.keys(urls).length >= 2)
    .map(([concept, urls]) => ({ concept, urls }))
    .sort((a, b) => a.concept.localeCompare(b.concept));

  const hubs = seedTopics
    .map((t) => ({
      concept: t.id,
      names: t.name ?? {},
      primaryOwner: t.primaryOwner ?? null,
      definitionOwner: t.definitionOwner ?? null,
      explanationOwner: t.explanationOwner ?? null,
      marketPolicy: t.marketPolicy ?? null,
      routeIds: t.routeIds ?? [],
      related: (t.relatedTopicIds ?? []).filter((r) => seedIds.has(r)),
      explanationCounts: explanationCounts.get(t.id) ?? {},
    }))
    .sort((a, b) => a.concept.localeCompare(b.concept));

  const hubEdgeSet = new Set<string>();
  const hubEdges: { from: string; to: string; type: "related" }[] = [];
  for (const h of hubs) {
    for (const r of h.related) {
      const key = [h.concept, r].sort().join("::");
      if (hubEdgeSet.has(key)) continue;
      hubEdgeSet.add(key);
      hubEdges.push({ from: h.concept, to: r, type: "related" });
    }
  }

  const body = {
    "@context": "https://schema.org",
    name: `${siteConfig.name} Blog — Concept Graph`,
    url: `${siteConfig.url}/knowledge/relations.json`,
    description:
      "Series clusters and cross-locale translation links for blog guides, plus the cross-site hub ownership graph (with this site's explanation depth per topic).",
    dateModified: new Date().toISOString(),
    setCount: sets.length,
    sameAsCount: sameAs.length,
    hubCount: hubs.length,
    hubEdgeCount: hubEdges.length,
    sets,
    sameAs,
    hubs,
    hubEdges: hubEdges.sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to)),
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};

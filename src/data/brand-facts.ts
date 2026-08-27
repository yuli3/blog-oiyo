export const brandFacts = {
  "$schema": "https://oiyo.net/schemas/brand-facts.schema.json",
  brand: {
    name: "Oiyo",
    canonicalName: "OIYO",
    canonicalUrl: "https://oiyo.net/",
    organizationId: "https://oiyo.net/#organization",
    logo: "https://oiyo.net/icon-512.png",
    description:
      "Oiyo is a network of canonical knowledge, publishing, and interactive routes. Each URL owner is chosen by user intent, existing authority, product adjacency, and maintenance cost.",
  },
  currentSite: {
    name: "Oiyo Blog",
    url: "https://blog.oiyo.net/",
    role: "publishing-and-utility",
    contentRole: "Long-form guides, lessons, references, comparisons, practical context, and established utilities.",
    knowledgeManifest: "https://blog.oiyo.net/knowledge/index.json",
    primaryCatalog: "https://blog.oiyo.net/knowledge/guides.json",
    llms: "https://blog.oiyo.net/llms.txt",
  },
  network: [
    {
      name: "OIYO Arcade",
      url: "https://game.oiyo.net/",
      role: "gaming",
      knowledgeManifest: null,
    },
    {
      name: "OIYO News",
      url: "https://news.oiyo.net/",
      role: "curation",
      knowledgeManifest: null,
    },
    {
      name: "OIYO AI",
      url: "https://ai.oiyo.net/",
      role: "ax-showcase",
      knowledgeManifest: null,
    },
    {
      name: "Oiyo Wiki",
      url: "https://wiki.oiyo.net/",
      role: "reference-and-knowledge",
      knowledgeManifest: "https://wiki.oiyo.net/knowledge/index.json",
    },
    {
      name: "Oiyo Blog",
      url: "https://blog.oiyo.net/",
      role: "publishing-and-utility",
      knowledgeManifest: "https://blog.oiyo.net/knowledge/index.json",
    },
    {
      name: "OIYO",
      url: "https://oiyo.net/",
      role: "interactive-tools",
      knowledgeManifest: "https://oiyo.net/knowledge/index.json",
    },
  ],
  locales: ["ko", "en", "ja", "zh", "fr", "es"],
  retiredLocales: ["cn"],
  citation: {
    attribution: "Oiyo Blog",
    preferredUrl: "https://blog.oiyo.net/",
    machineReadableEntryPoints: [
      "https://blog.oiyo.net/llms.txt",
      "https://blog.oiyo.net/knowledge/index.json",
      "https://blog.oiyo.net/knowledge/guides.json",
    ],
  },
};

export function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

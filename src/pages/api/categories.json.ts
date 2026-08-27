import type { APIRoute } from "astro";
import manifest from "../../data/content-manifest.json";

/**
 * Canonical categories + live counts.
 * Output: /api/categories.json
 */
const CANONICAL = [
  "Mind & Psychology", "Mysticism", "Finance", "Tax", "Real Estate", "Law",
  "Exam", "Public Admin", "Business", "Career", "Computer Science", "Education",
  "Science & Nature", "Health", "Beauty", "Lifestyle", "Myth & Culture",
  "Humanities", "Philosophy & Spirit", "Insights", "Strategy", "Design",
  "Sports", "Society & Wealth",
];

export const GET: APIRoute = async () => {
  const counts: Record<string, number> = {};
  for (const it of manifest.items) {
    if (it.category) counts[it.category] = (counts[it.category] ?? 0) + 1;
  }
  const categories = CANONICAL.map((label) => ({
    label,
    slug: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    count: counts[label] ?? 0,
    canonical: true,
  }));
  const nonCanonical = Object.entries(counts)
    .filter(([c]) => !CANONICAL.includes(c))
    .map(([label, count]) => ({ label, slug: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"), count, canonical: false }));

  return new Response(
    JSON.stringify({ generatedAt: manifest.generatedAt, categories: [...categories, ...nonCanonical] }),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
};

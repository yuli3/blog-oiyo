import type { CollectionEntry } from "astro:content";
import { getTrackFromData } from "./taxonomy";

/**
 * Wikidocs-style landing / drawer helpers.
 *
 * A "series" is derived the same way [...lang]/courses.astro does:
 * academy-style slugs end in -ch<N>; the slug prefix is the series key.
 * data.series (frontmatter) is used as an additional grouping signal when
 * present, but the slug prefix stays canonical because it maps 1:1 to URLs.
 */

export interface SeriesEntry {
  key: string;
  category: string;
  posts: CollectionEntry<"blog">[];
  firstPost: CollectionEntry<"blog">;
  chapterCount: number;
  lastUpdated: Date;
}

const chapterOf = (post: CollectionEntry<"blog">): number =>
  parseInt(post.slug.match(/-ch(\d+)$/)?.[1] ?? "0", 10);

export function seriesKeyOf(post: CollectionEntry<"blog">): string {
  // frontmatter series is authoritative when present (e.g. myth-dictionary
  // chapters live under meaning-of-myth-* slugs); slug prefix otherwise.
  return post.data.series || post.slug.split("/").slice(1).join("/").replace(/-ch\d+$/, "");
}

export function buildSeriesIndex(
  posts: CollectionEntry<"blog">[],
): Map<string, SeriesEntry> {
  const map = new Map<string, SeriesEntry>();
  for (const post of posts) {
    const key = seriesKeyOf(post);
    const existing = map.get(key);
    if (existing) {
      existing.posts.push(post);
      existing.chapterCount += 1;
      const d = post.data.updatedDate ?? post.data.pubDate;
      if (d > existing.lastUpdated) existing.lastUpdated = d;
      if (chapterOf(post) < chapterOf(existing.firstPost)) existing.firstPost = post;
    } else {
      const d = post.data.updatedDate ?? post.data.pubDate;
      map.set(key, {
        key,
        category: post.data.category ?? "",
        posts: [post],
        firstPost: post,
        chapterCount: 1,
        lastUpdated: d,
      });
    }
  }
  for (const s of map.values()) s.posts.sort((a, b) => chapterOf(a) - chapterOf(b));
  return map;
}

/** category label → series list, sorted by chapter count desc */
export function groupSeriesByCategory(
  series: SeriesEntry[],
): [string, SeriesEntry[]][] {
  const byCat = new Map<string, SeriesEntry[]>();
  for (const s of series) {
    const arr = byCat.get(s.category) ?? [];
    arr.push(s);
    byCat.set(s.category, arr);
  }
  for (const arr of byCat.values())
    arr.sort((a, b) => b.chapterCount - a.chapterCount || a.key.localeCompare(b.key));
  return Array.from(byCat.entries()).sort(
    ([a, la], [b, lb]) => sumChapters(lb) - sumChapters(la) || a.localeCompare(b),
  );
}

const sumChapters = (list: SeriesEntry[]) =>
  list.reduce((n, s) => n + s.chapterCount, 0);

export function trackOfLocale(posts: CollectionEntry<"blog">[], locale: string) {
  return posts.filter(
    (p) => p.data.locale === locale && p.data.draft !== true,
  );
}

export { getTrackFromData };

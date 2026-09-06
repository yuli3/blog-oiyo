import { getCollection, type CollectionEntry } from "astro:content";
import { getTrackFromData } from "./taxonomy";
import { isRedirectStub } from "./redirect-stub";

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

export { isRedirectStub } from "./redirect-stub";

const publishedCollectionFilter = ({
  data,
}: CollectionEntry<"blog">): boolean =>
  data.draft !== true && !isRedirectStub(data);

const chapterOf = (post: CollectionEntry<"blog">): number =>
  parseInt(post.slug.match(/-ch(\d+)$/)?.[1] ?? "0", 10);

export function seriesKeyOf(post: CollectionEntry<"blog">): string {
  // frontmatter series is authoritative when present (e.g. myth-dictionary
  // chapters live under meaning-of-myth-* slugs); slug prefix otherwise.
  return post.data.series || post.slug.split("/").slice(1).join("/").replace(/-ch\d+$/, "");
}

/**
 * A slug-derived key is always URL-safe (real file slugs are ASCII by this
 * repo's convention). A frontmatter `series:` override is free text, though
 * — some older batches used a human-readable/non-ASCII string there (e.g.
 * "세법 핵심") that was never meant to be a URL segment. Only keys that are
 * already a clean slug get a /series/{key}/ page; the rest still render as
 * ordinary articles, they just don't get a dedicated hub.
 */
export function isUrlSafeSeriesKey(key: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(key);
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

type CategorySeriesGroups = [string, SeriesEntry[]][];

let publishedPostsPromise: Promise<CollectionEntry<"blog">[]> | undefined;
const drawerGroupsByLocale = new Map<string, Promise<CategorySeriesGroups>>();

/**
 * BaseLayout renders the drawer on every generated page. Keep the collection
 * read and grouping work process-wide instead of repeating it per page.
 */
export function getDrawerSeriesGroups(locale: string): Promise<CategorySeriesGroups> {
  const cached = drawerGroupsByLocale.get(locale);
  if (cached) return cached;

  publishedPostsPromise ??= getCollection(
    "blog",
    publishedCollectionFilter,
  );

  const groups = publishedPostsPromise.then((allPosts) => {
    const posts = allPosts.filter((post) => post.data.locale === locale);
    return groupSeriesByCategory(Array.from(buildSeriesIndex(posts).values()))
      .filter(([, list]) => list.length > 0)
      .slice(0, 12);
  });
  drawerGroupsByLocale.set(locale, groups);
  return groups;
}

const multiChapterKeysByLocale = new Map<string, Promise<Set<string>>>();

/**
 * Series keys with 2+ chapters in this locale — the only ones that get a
 * dedicated /series/{key}/ page (a lone article's "series" is itself, so a
 * hub page for it would just duplicate the article).
 */
export function getMultiChapterSeriesKeys(locale: string): Promise<Set<string>> {
  const cached = multiChapterKeysByLocale.get(locale);
  if (cached) return cached;

  publishedPostsPromise ??= getCollection(
    "blog",
    publishedCollectionFilter,
  );

  const keys = publishedPostsPromise.then((allPosts) => {
    const posts = allPosts.filter((post) => post.data.locale === locale);
    const series = buildSeriesIndex(posts);
    return new Set(
      Array.from(series.values())
        .filter((s) => s.chapterCount >= 2 && isUrlSafeSeriesKey(s.key))
        .map((s) => s.key),
    );
  });
  multiChapterKeysByLocale.set(locale, keys);
  return keys;
}

export { getTrackFromData };

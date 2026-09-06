import assert from "node:assert/strict";
import test from "node:test";
import {
  firstChapterSlugs,
  localeFreeSlug,
  resolveCuratedPosts,
  scoreRelatedPosts,
} from "./related-next.ts";

test("localeFreeSlug strips locale prefix", () => {
  assert.equal(localeFreeSlug("en/academy-economics-basics-ch1"), "academy-economics-basics-ch1");
  assert.equal(localeFreeSlug("height-converter"), "height-converter");
});

test("resolveCuratedPosts resolves curated slugs in order for locale", () => {
  const posts = [
    { slug: "en/a-ch1", data: { title: "A", draft: false } },
    { slug: "en/b-ch1", data: { title: "B", draft: false } },
    { slug: "ko/a-ch1", data: { title: "A ko", draft: false } },
    { slug: "en/c-ch1", data: { title: "C draft", draft: true } },
  ];
  const got = resolveCuratedPosts(posts, "en", ["b-ch1", "a-ch1", "missing"], 3);
  assert.deepEqual(got.map((p) => p.slug), ["en/b-ch1", "en/a-ch1"]);
  const noDraft = resolveCuratedPosts(posts, "en", ["c-ch1", "a-ch1"], 3);
  assert.deepEqual(noDraft.map((p) => p.slug), ["en/a-ch1"]);
});

test("scoreRelatedPosts ranks by tag overlap then category bonus", () => {
  const posts = [
    { slug: "en/current", data: { title: "Cur", tags: ["t1"], category: "cat", draft: false } },
    { slug: "en/same-cat", data: { title: "Same", tags: [], category: "cat", draft: false } },
    { slug: "en/tag-hit", data: { title: "Tag", tags: ["t1", "t2", "t3"], category: "other", draft: false } },
    { slug: "ko/tag-hit", data: { title: "Ko", tags: ["t1"], category: "cat", draft: false } },
  ];
  const got = scoreRelatedPosts(posts, {
    locale: "en",
    currentSlug: "en/current",
    tags: ["t1", "t2", "t3"],
    category: "cat",
    maxItems: 3,
  });
  assert.deepEqual(got.map((p) => p.slug), ["en/tag-hit", "en/same-cat"]);
});

test("firstChapterSlugs takes first N series firstPost slugs", () => {
  assert.deepEqual(
    firstChapterSlugs(
      [
        { firstPost: { slug: "en/zoology-basics-ch1" } },
        { firstPost: { slug: "en/economics-basics-ch1" } },
        { firstPost: { slug: "en/music-history-ch1" } },
      ],
      2,
    ),
    ["zoology-basics-ch1", "economics-basics-ch1"],
  );
});

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
    { id: "en/a-ch1", data: { title: "A", draft: false } },
    { id: "en/b-ch1", data: { title: "B", draft: false } },
    { id: "ko/a-ch1", data: { title: "A ko", draft: false } },
    { id: "en/c-ch1", data: { title: "C draft", draft: true } },
  ];
  const got = resolveCuratedPosts(posts, "en", ["b-ch1", "a-ch1", "missing"], 3);
  assert.deepEqual(got.map((p) => p.id), ["en/b-ch1", "en/a-ch1"]);
  const noDraft = resolveCuratedPosts(posts, "en", ["c-ch1", "a-ch1"], 3);
  assert.deepEqual(noDraft.map((p) => p.id), ["en/a-ch1"]);
});

test("scoreRelatedPosts ranks by tag overlap then category bonus", () => {
  const posts = [
    { id: "en/current", data: { title: "Cur", tags: ["t1"], category: "cat", draft: false } },
    { id: "en/same-cat", data: { title: "Same", tags: [], category: "cat", draft: false } },
    { id: "en/tag-hit", data: { title: "Tag", tags: ["t1", "t2", "t3"], category: "other", draft: false } },
    { id: "ko/tag-hit", data: { title: "Ko", tags: ["t1"], category: "cat", draft: false } },
  ];
  const got = scoreRelatedPosts(posts, {
    locale: "en",
    currentSlug: "en/current",
    tags: ["t1", "t2", "t3"],
    category: "cat",
    maxItems: 3,
  });
  assert.deepEqual(got.map((p) => p.id), ["en/tag-hit", "en/same-cat"]);
});

test("firstChapterSlugs takes first N series firstPost slugs", () => {
  assert.deepEqual(
    firstChapterSlugs(
      [
        { firstPost: { id: "en/zoology-basics-ch1" } },
        { firstPost: { id: "en/economics-basics-ch1" } },
        { firstPost: { id: "en/music-history-ch1" } },
      ],
      2,
    ),
    ["zoology-basics-ch1", "economics-basics-ch1"],
  );
});

import { getCollection } from "astro:content";

/**
 * TestCTA가 가리키는 테스트 슬러그가 실제로 존재하는 페이지인지 해석한다.
 *
 * 기존 TestCTA는 `/${locale}/${test}`를 존재 확인 없이 만들어, 번역된 es/fr 아티클이
 * 그 로케일에 없는(혹은 아예 없는) 슬러그를 가리켜 깨진 내부 링크를 만들었다
 * (Weekly Link Audit 2026-06-30~ 실패의 원인). 여기서 실존 타깃만 링크로 돌려주고,
 * 어디에도 없으면 null을 돌려 CTA 자체를 렌더하지 않게 한다.
 *
 * 유효 타깃 = blog 콘텐츠 엔트리(`<locale>/<slug>`) 또는 `[...lang]/<slug>.astro` 페이지
 * (후자는 모든 로케일로 생성되므로 로케일 무관하게 유효).
 */
let cache: { entries: Set<string>; pages: Set<string> } | null = null;

async function load() {
  if (cache) return cache;
  const blog = await getCollection("blog");
  const entries = new Set(blog.map((e) => e.id.replace(/\.mdx?$/, "")));
  const pages = new Set(
    Object.keys(import.meta.glob("/src/pages/**/*.astro"))
      .filter((p) => p.includes("[...lang]/"))
      .map((p) => p.split("/").pop()!.replace(".astro", ""))
  );
  cache = { entries, pages };
  return cache;
}

/** 링크 가능한 경로. 어떤 로케일에도 대상이 없으면 null. */
export async function resolveTestHref(test: string, locale: string): Promise<string | null> {
  const { entries, pages } = await load();
  const has = (loc: string) => entries.has(`${loc}/${test}`) || pages.has(test);
  const resolved = has(locale) ? locale : has("en") ? "en" : has("ko") ? "ko" : null;
  return resolved ? `/${resolved}/${test}` : null;
}

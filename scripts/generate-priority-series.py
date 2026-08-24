#!/usr/bin/env python3
"""
generate-priority-series.py — rank blog series by trailing-90-day GSC clicks
and rewrite src/data/priority-series.ts's PRIORITY_SERIES export.

Re-runnable data refresh (see npm run priority-series:sync). Uses the same
GSC service-account auth as the traffic-audit skill's pull.py — see
/Users/seuncho/coding/API_CREDENTIALS.md. Never copies that credential file
into this repo; it's read from its fixed out-of-repo path.

Series key derivation mirrors src/lib/wiki-index.ts's seriesKeyOf() exactly:
frontmatter `series` is authoritative when present, else the slug with a
trailing -ch<N> stripped. content-manifest.json (already build-time
generated from frontmatter) is the source for this mapping — this script
does not re-parse MDX.
"""
import json
import re
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, "/Users/seuncho/coding/.claude/skills/traffic-audit/scripts")
from pull import svc, query, LAG_DAYS  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src/data/content-manifest.json"
PRIORITY_FILE = ROOT / "src/data/priority-series.ts"
BLOG_PROP = "https://blog.oiyo.net/"
TOP_N = 8
DAYS = 90

CH_SUFFIX = re.compile(r"-ch\d+$")
URL_SAFE_KEY = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def series_key_of(slug: str, series: str | None) -> str:
    if series:
        return series
    return CH_SUFFIX.sub("", slug)


def is_url_safe_series_key(key: str) -> bool:
    # Mirrors src/lib/wiki-index.ts's isUrlSafeSeriesKey() exactly — only
    # keys that are already a clean ASCII slug get a /series/{key}/ page,
    # so only those are eligible to be pinned in PRIORITY_SERIES.
    return bool(URL_SAFE_KEY.match(key))


def main():
    manifest = json.loads(MANIFEST.read_text())

    # First pass: count chapters per (locale, series key) — buildSeriesIndex()
    # groups within one locale's posts, so two locale editions of the same
    # standalone article (e.g. "negativity-bias-brain" in both ko and en)
    # must not look like a 2-chapter series just because the raw key repeats
    # across locales. A key only qualifies if SOME locale has 2+ chapters of
    # it (matching the /series/[key]/ route's own getStaticPaths filter,
    # which is per-locale) — that's the only case where a real hub page
    # exists anywhere to pin a sidebar entry to.
    chapter_counts: dict[tuple[str, str], int] = {}
    for item in manifest["items"]:
        key = series_key_of(item["slug"], item.get("series"))
        ck = (item["locale"], key)
        chapter_counts[ck] = chapter_counts.get(ck, 0) + 1
    multi_chapter_keys = {
        key for (_, key), n in chapter_counts.items() if n >= 2 and is_url_safe_series_key(key)
    }

    # url (path, e.g. "/ko/economics-basics-ch3/") -> series key
    url_to_series: dict[str, str] = {}
    for item in manifest["items"]:
        key = series_key_of(item["slug"], item.get("series"))
        if key in multi_chapter_keys:
            url_to_series[item["url"]] = key

    end = date.today() - timedelta(days=LAG_DAYS)
    start = end - timedelta(days=DAYS - 1)

    s = svc()
    rows = query(s, BLOG_PROP, start.isoformat(), end.isoformat(), ["page"], limit=25000)

    # Rank by impressions, not clicks. blog.oiyo.net's total GSC volume right
    # now is ~125 clicks / 2,870 impressions over 90 days across 673 pages —
    # at that scale, per-series clicks are almost all 0-1 (ties, no real
    # signal). Impressions are ~23x denser and give actual differentiation
    # between series (verified 2026-08-25: clicks-ranked top-8 was mostly
    # 0-1-click noise; impressions-ranked top-8 showed a real spread and
    # doesn't even include myth-dictionary, the largest series by chapter
    # count — chapter count and actual search demand are not the same
    # thing). Re-run this script once click volume grows enough to be
    # non-sparse and switch the metric back if it becomes the better signal.
    impr_by_series: dict[str, int] = {}
    clicks_by_series: dict[str, int] = {}
    matched_urls = 0
    for row in rows:
        url = row["keys"][0]
        path = re.sub(r"^https://blog\.oiyo\.net", "", url)
        key = url_to_series.get(path)
        if key is None:
            continue
        matched_urls += 1
        impr_by_series[key] = impr_by_series.get(key, 0) + int(row.get("impressions", 0))
        clicks_by_series[key] = clicks_by_series.get(key, 0) + int(row.get("clicks", 0))

    ranked = sorted(
        impr_by_series.items(),
        key=lambda kv: (-kv[1], -clicks_by_series.get(kv[0], 0), kv[0]),
    )
    top = ranked[:TOP_N]

    print(f"# GSC {start.isoformat()}..{end.isoformat()} — {len(rows)} page rows, {matched_urls} matched to a series")
    print(f"# Top {TOP_N} by impressions (clicks in parens):")
    for key, impr in top:
        print(f"  {impr:>5} impr ({clicks_by_series.get(key, 0)} clicks)  {key}")

    # ── rewrite priority-series.ts ──
    src = PRIORITY_FILE.read_text()
    old_names_match = re.search(
        r"export const PRIORITY_SERIES_NAMES:.*?^};\n", src, re.MULTILINE | re.DOTALL
    )
    old_names_block = old_names_match.group(0) if old_names_match else ""
    new_keys = [k for k, _ in top]
    covered = set(re.findall(r'^\s*"([a-z0-9-]+)":\s*\{', old_names_block, re.MULTILINE))
    uncovered = [k for k in new_keys if k not in covered]

    array_lines = "\n".join(f'  "{k}",' for k in new_keys)
    new_array = f"export const PRIORITY_SERIES = [\n{array_lines}\n] as const;"

    doc_comment = f"""/**
 * Curated priority series for the wikidocs-style landing sidebar/sections.
 *
 * Selection basis: GSC (Google Search Console) impressions over the trailing
 * {DAYS} days for blog.oiyo.net, aggregated per series across all chapters
 * and locales (clicks as tiebreak). Impressions, not clicks, because at
 * blog's current traffic (~125 clicks / 2,870 impressions per 90d across
 * 673 pages) per-series clicks are almost all 0-1 ties with no real signal;
 * impressions are ~23x denser and actually differentiate. Only series whose
 * key is already a clean URL-safe slug are eligible (matches the
 * /series/{{key}}/ route's own filter — see isUrlSafeSeriesKey() in
 * src/lib/wiki-index.ts). Generated {date.today().isoformat()} by
 * scripts/generate-priority-series.py (re-run: npm run priority-series:sync).
 * Supersedes the earlier static chapter-count proxy.
 */"""

    src = re.sub(
        r"/\*\*\n \* Curated priority series.*?\*/\nexport const PRIORITY_SERIES = \[.*?\] as const;",
        doc_comment + "\n" + new_array,
        src,
        count=1,
        flags=re.DOTALL,
    )
    PRIORITY_FILE.write_text(src)

    if uncovered:
        print(f"\n# NOT in PRIORITY_SERIES_NAMES (will fall back to prettifySlug()): {uncovered}")


if __name__ == "__main__":
    main()

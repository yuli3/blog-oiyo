#!/usr/bin/env python3
"""Broken-internal-link & orphan-page audit over the built dist/ (#27).

Usage: python3 scripts/link-audit.py [dist-dir]
- Broken link: an internal href whose target page does not exist in dist.
- Orphan page: a content page with zero inbound internal links
  (hubs, sitemaps, nav/footer links all count as inbound).
Exit 1 only on broken links; orphans are reported as warnings.
Output is GitHub-flavored markdown (suitable for $GITHUB_STEP_SUMMARY).
"""
import re
import sys
from collections import defaultdict
from pathlib import Path

DIST = Path(sys.argv[1] if len(sys.argv) > 1 else "dist")
HREF_RE = re.compile(r'href="(/[^"#?]*)')

IGNORE_PREFIXES = ("/~partytown", "/_astro", "/assets")
IGNORE_EXACT = {"/rss.xml", "/sitemap-index.xml", "/robots.txt", "/favicon.svg", "/manifest.json"}


def norm(path: str) -> str:
    """Normalize an internal href to a dist key (no trailing slash, no /index.html)."""
    path = path.split("#")[0].split("?")[0]
    if path.endswith("/index.html"):
        path = path[: -len("/index.html")]
    elif path.endswith(".html"):
        path = path[: -len(".html")]
    return path.rstrip("/") or "/"



def load_redirect_sources(dist: Path) -> list[str]:
    """Load both Pages residuals and the canonical Bulk Redirect SSOT."""
    sources = []
    for f in (dist / "_redirects", Path("data/redirects/canonical-redirects.txt")):
        if not f.exists():
            continue
        for line in f.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            sources.append(line.split()[0])
    return sources


def redirect_covers(sources: list[str], path: str) -> bool:
    for src in sources:
        if src.endswith("*"):
            # Match wildcard prefixes that may also contain placeholder segments,
            # e.g. /:lang/learning-style-test*.
            prefix = src[:-1].rstrip("/")
            pattern = re.escape(prefix).replace(r"\:", ":")
            pattern = re.sub(r":[A-Za-z][A-Za-z0-9_]*", r"[^/]+", pattern)
            if re.match(rf"^{pattern}(?:/.*)?$", path):
                return True
        elif ":" in src:
            # Placeholder segments (e.g. /:lang/foo) match any single segment.
            s_seg = norm(src).split("/")
            p_seg = path.split("/")
            if len(s_seg) == len(p_seg) and all(
                a.startswith(":") or a == b for a, b in zip(s_seg, p_seg)
            ):
                return True
        elif norm(src) == path:
            return True
    return False


def main() -> None:
    pages: dict[str, Path] = {}
    for html in DIST.rglob("index.html"):
        key = norm("/" + str(html.relative_to(DIST)))
        pages[key] = html

    inbound: dict[str, int] = defaultdict(int)
    broken: list[tuple[str, str]] = []
    redirect_sources = load_redirect_sources(DIST)

    for key, html in pages.items():
        text = html.read_text(errors="ignore")
        for href in set(HREF_RE.findall(text)):
            if href.startswith(IGNORE_PREFIXES) or href in IGNORE_EXACT:
                continue
            if re.search(r"\.(xml|txt|png|jpe?g|svg|webp|ico|json|js|css|pdf|woff2?)$", href):
                continue
            target = norm(href)
            if target == key:
                continue
            if target in pages:
                inbound[target] += 1
            elif not redirect_covers(redirect_sources, target):
                broken.append((key, href))

    # Redirect/noindex shells deliberately have no inbound blog links: catalogs
    # should point straight to their canonical owner instead of bouncing through
    # these compatibility URLs. They are not content orphans.
    orphans = [
        k for k in pages
        if inbound[k] == 0
        and re.match(r"^/(en|ko|ja|zh|fr|es)/.+", k)
        and not k.endswith(("/404",))
        and not re.search(
            r'<meta name="robots" content="[^\"]*noindex',
            pages[k].read_text(errors="ignore"),
            re.IGNORECASE,
        )
    ]

    print("## Link audit\n")
    print(f"- pages scanned: **{len(pages)}**")
    print(f"- broken internal links: **{len(broken)}**")
    print(f"- orphan pages (no inbound links): **{len(orphans)}**\n")

    if broken:
        print("### ❌ Broken links\n")
        print("| from | href |")
        print("|---|---|")
        for src, href in sorted(broken)[:100]:
            print(f"| {src} | {href} |")
        if len(broken) > 100:
            print(f"\n…and {len(broken) - 100} more")

    if orphans:
        print("\n### ⚠️ Orphan pages (first 50)\n")
        for k in sorted(orphans)[:50]:
            print(f"- {k}")
        if len(orphans) > 50:
            print(f"- …and {len(orphans) - 50} more")

    if broken:
        sys.exit(1)


if __name__ == "__main__":
    main()

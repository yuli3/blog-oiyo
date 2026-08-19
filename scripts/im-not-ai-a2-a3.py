#!/usr/bin/env python3
"""Surgical A-2 / A-3 replacements. Skip code fences and inline code."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path("/Users/seuncho/coding/blog/src/content/blog/ko")
SKIP = {
    "academy-economics-core-ch2.mdx",
    "academy-economics-core-ch3.mdx",
    "academy-economics-core-ch4.mdx",
    "academy-economics-core-ch5.mdx",
    "academy-economics-core-ch6.mdx",
    "academy-economics-core-ch7.mdx",
    "academy-economics-core-ch8.mdx",
    "academy-economics-core-ch9.mdx",
    "academy-economics-core-ch10.mdx",
}

REPLACERS = (
    ("을 통하여서", "으로"),
    ("를 통하여서", "로"),
    ("을 통해서", "으로"),
    ("를 통해서", "로"),
    ("을 통하여", "으로"),
    ("를 통하여", "로"),
    ("을 통해", "으로"),
    ("를 통해", "로"),
    ("에 있어서", "에서"),
)


def split_protect(text: str) -> list[tuple[str, bool]]:
    """Yield (chunk, editable)."""
    parts: list[tuple[str, bool]] = []
    fence = re.split(r"(```[\s\S]*?```)", text)
    for i, block in enumerate(fence):
        if i % 2 == 1:
            parts.append((block, False))
            continue
        inline = re.split(r"(`[^`]+`)", block)
        for j, chunk in enumerate(inline):
            parts.append((chunk, j % 2 == 0))
    return parts


def rewrite_plain(s: str) -> str:
    out = s
    for old, new in REPLACERS:
        out = out.replace(old, new)
    out = re.sub(r"에 있어(?=[ \n\t.,!?;:」』])", "에서", out)
    return out


def rewrite_file(path: Path) -> tuple[int, int]:
    raw = path.read_text(encoding="utf-8")
    pieces = split_protect(raw)
    new_parts = []
    for chunk, editable in pieces:
        new_parts.append(rewrite_plain(chunk) if editable else chunk)
    new = "".join(new_parts)
    if new == raw:
        return 0, 0
    path.write_text(new, encoding="utf-8")
    return len(raw), len(new)


def main() -> None:
    changed = []
    for path in sorted(ROOT.rglob("*.mdx")):
        if path.name in SKIP:
            continue
        before, after = rewrite_file(path)
        if before:
            changed.append((path.relative_to(ROOT).as_posix(), before, after, abs(after - before)))
    print("changed", len(changed))
    total_b = sum(b for _, b, _, _ in changed)
    total_a = sum(a for _, _, a, _ in changed)
    if total_b:
        print(f"char {total_b} -> {total_a} delta {total_a-total_b} rate {abs(total_a-total_b)/total_b:.4%}")
    for name, b, a, d in changed[:8]:
        print(f"  {name} {d}")


if __name__ == "__main__":
    main()

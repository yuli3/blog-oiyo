#!/usr/bin/env python3
"""I-1 for 하다체 것이다. Skip code fences and 일 것이다."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path("/Users/seuncho/coding/blog/src/content/blog/ko")

FIRST = (
    ("다는 것이다", "다는 뜻이다"),
    ("라는 것이다", "라는 뜻이다"),
    ("필요한 것이다", "필요하다"),
    ("중요한 것이다", "중요하다"),
)


def split_protect(text: str) -> list[tuple[str, bool]]:
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
    for old, new in FIRST:
        out = out.replace(old, new)
    out = re.sub(r"(는|한) 것이다", r"\1 일이다", out)
    return out


def main() -> None:
    changed = []
    for path in sorted(ROOT.rglob("*.mdx")):
        raw = path.read_text(encoding="utf-8")
        new = "".join(rewrite_plain(c) if e else c for c, e in split_protect(raw))
        if new == raw:
            continue
        path.write_text(new, encoding="utf-8")
        changed.append(path.name)
    print("changed", len(changed))


if __name__ == "__main__":
    main()

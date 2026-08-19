#!/usr/bin/env python3
"""Surgical I-1 replacements. Skip code fences, inline code, 일 것입니다."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path("/Users/seuncho/coding/blog/src/content/blog/ko")
SKIP = {f"academy-economics-core-ch{i}.mdx" for i in range(2, 11)}

FIRST = (
    ("다는 것입니다", "다는 뜻입니다"),
    ("라는 것입니다", "라는 뜻입니다"),
    ("필요한 것입니다", "필요합니다"),
    ("중요한 것입니다", "중요합니다"),
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
    out = re.sub(r"(는|한) 것입니다", r"\1 일입니다", out)
    return out


def main() -> None:
    changed = []
    for path in sorted(ROOT.rglob("*.mdx")):
        if path.name in SKIP:
            continue
        raw = path.read_text(encoding="utf-8")
        new = "".join(rewrite_plain(c) if e else c for c, e in split_protect(raw))
        if new == raw:
            continue
        path.write_text(new, encoding="utf-8")
        changed.append(path.name)
    print("changed", len(changed))


if __name__ == "__main__":
    main()

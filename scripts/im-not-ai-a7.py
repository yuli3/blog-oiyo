#!/usr/bin/env python3
"""A-7: abstract '가지고 있' → '이/가 있'. Literal possessions stay."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path("/Users/seuncho/coding/blog/src/content/blog/ko")
SKIP = {f"academy-economics-core-ch{i}.mdx" for i in range(2, 11)}

# Longer first.
NOUNS = (
    "자기상관성",
    "자기 개념",
    "재량권",
    "인정욕구",
    "수익인식 기준",
    "공통된 구조",
    "뿌리 깊은 본능",
    "강력한 욕구",
    "J-커브' 특성",
    "사명",
    "전제",
    "본능",
    "특성",
    "패턴",
    "욕구",
    "능력",
    "개념",
    "구조",
    "결핍",
    "기준",
    "체계",
    "지식",
    "의미",
    "특징",
    "가치",
    "권리",
    "자아",
    "힘",
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
    for noun in NOUNS:
        out = out.replace(f"{noun}을 가지고 있", f"{noun}이 있")
        out = out.replace(f"{noun}를 가지고 있", f"{noun}가 있")
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
    for name in changed:
        print(" ", name)


if __name__ == "__main__":
    main()

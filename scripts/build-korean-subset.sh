#!/usr/bin/env bash
# 한글 서브셋 재생성 — 2026-09-02.
#
# 글에 실제로 쓰인 글자만 담아 원본 8.2MB 를 140KB 로 줄인다.
# `npm run audit:korean-subset` 이 FAIL 할 때(= 새 글에 없던 글자가 들어왔을 때)
# 돌린다. CI 에서는 돌지 않는다 — 감사는 문자 목록만 비교하므로 Python 이 필요 없다.
#
# 필요: python3, fonttools, brotli
set -euo pipefail
cd "$(dirname "$0")/.."

VENV="${TMPDIR:-/tmp}/oiyo-fontsubset-venv"
[ -d "$VENV" ] || python3 -m venv "$VENV"
"$VENV/bin/pip" install --quiet fonttools brotli

SRC="${TMPDIR:-/tmp}/GowunBatang-Regular.ttf"
[ -f "$SRC" ] || curl -sL -o "$SRC" \
  "https://github.com/google/fonts/raw/main/ofl/gowunbatang/GowunBatang-Regular.ttf"

CHARS="scripts/data/GowunBatang-corpus-400.chars.txt"
python3 - "$CHARS" <<'PY'
import io, glob, sys
# 원문 전체를 본다. frontmatter 의 title 은 h1 으로 렌더되고, 자르는 규칙을
# 생성기와 감사에 각각 두면 갈라진다.
chars = set()
for f in sorted(glob.glob("src/content/blog/ko/*.mdx")):
    chars |= set(io.open(f, encoding="utf-8").read())
chars = {c for c in chars if c.isprintable() or c == " "}
io.open(sys.argv[1], "w", encoding="utf-8").write("".join(sorted(chars)))
print(f"  문자 {len(chars)}자")
PY

# 한글은 완성형이라 복잡한 shaping 이 필요 없다 — layout feature 를 버려도 된다.
"$VENV/bin/pyftsubset" "$SRC" \
  --text-file="$CHARS" \
  --flavor=woff2 \
  --layout-features= --no-hinting --desubroutinize \
  --output-file=public/fonts/GowunBatang-corpus-400.woff2

ls -la public/fonts/GowunBatang-corpus-400.woff2 | awk '{printf "  → %.0f KB\n", $5/1024}'

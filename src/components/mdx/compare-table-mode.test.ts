import assert from "node:assert/strict";
import test from "node:test";
import { isGridCompareTable } from "./compare-table-mode.ts";

test("treats headers + array rows as a grid, not a left/right compare", () => {
  assert.equal(
    isGridCompareTable(
      ["비율", "공식", "의미", "기준값"],
      [["유동비율", "유동자산/유동부채×100", "단기 채무 상환 능력", "≥200% 우수"]],
    ),
    true,
  );
});

test("keeps object rows as a compare table even if headers are missing", () => {
  assert.equal(
    isGridCompareTable(undefined, [
      { label: "정의", left: "기회비용", right: "매몰비용" },
    ]),
    false,
  );
});

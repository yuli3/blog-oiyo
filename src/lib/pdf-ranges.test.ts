import assert from "node:assert/strict";
import { test } from "node:test";
import { baseName, everyN, everyPage, pagesOf, parsePageRanges, rangeLabel } from "./pdf-ranges.ts";

test("reads ranges the way people type them", () => {
  assert.deepEqual(parsePageRanges("1-3, 5, 8-10", 10), { ok: true, ranges: [{ from: 1, to: 3 }, { from: 5, to: 5 }, { from: 8, to: 10 }] });
  assert.deepEqual(parsePageRanges("2~4 7", 10), { ok: true, ranges: [{ from: 2, to: 4 }, { from: 7, to: 7 }] });
  assert.deepEqual(parsePageRanges("5-2", 10), { ok: true, ranges: [{ from: 2, to: 5 }] });
  assert.deepEqual(parsePageRanges("3,3", 10), { ok: true, ranges: [{ from: 3, to: 3 }, { from: 3, to: 3 }] });
});

test("refuses what it cannot honour instead of guessing", () => {
  assert.deepEqual(parsePageRanges("", 10), { ok: false, error: "empty" });
  assert.deepEqual(parsePageRanges(" , ", 10), { ok: false, error: "empty" });
  assert.deepEqual(parsePageRanges("1-3, x", 10), { ok: false, error: "syntax", part: "x" });
  assert.deepEqual(parsePageRanges("1-", 10), { ok: false, error: "syntax", part: "1-" });
  assert.deepEqual(parsePageRanges("0-2", 10), { ok: false, error: "out-of-range", part: "0-2" });
  assert.deepEqual(parsePageRanges("9-11", 10), { ok: false, error: "out-of-range", part: "9-11" });
});

test("lists the pages of a range and splits a document evenly", () => {
  assert.deepEqual(pagesOf({ from: 3, to: 6 }), [3, 4, 5, 6]);
  assert.deepEqual(pagesOf({ from: 4, to: 4 }), [4]);
  assert.deepEqual(everyPage(3), [{ from: 1, to: 1 }, { from: 2, to: 2 }, { from: 3, to: 3 }]);
  assert.deepEqual(everyN(7, 3), [{ from: 1, to: 3 }, { from: 4, to: 6 }, { from: 7, to: 7 }]);
  assert.deepEqual(everyN(4, 0), everyPage(4));
  assert.equal(everyN(10, 5).flatMap(pagesOf).length, 10);
});

test("names the output files", () => {
  assert.equal(rangeLabel({ from: 2, to: 2 }), "2");
  assert.equal(rangeLabel({ from: 2, to: 9 }), "2-9");
  assert.equal(baseName("Report.PDF"), "Report");
  assert.equal(baseName(".pdf"), "document");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { equivalentSeconds, formatTime, parseTime, ratioFor, RECORDS } from "./running-gender-equivalent.ts";

const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`);

test("pins the record ratios so a changed record is a deliberate edit", () => {
  close(ratioFor("5k"), 834 / 769);
  close(ratioFor("10k"), 1726 / 1591);
  close(ratioFor("half"), 3772 / 3411);
  close(ratioFor("marathon"), 7796 / 7170);
  for (const row of RECORDS) assert.ok(row.women.seconds > row.men.seconds);
});

test("converts both ways and back", () => {
  const fourHours = 4 * 3600;
  const women = equivalentSeconds(fourHours, "marathon", "toWomen");
  assert.equal(formatTime(women), "4:20:57");
  close(equivalentSeconds(women, "marathon", "toMen"), fourHours);
  assert.equal(formatTime(equivalentSeconds(25 * 60, "5k", "toWomen")), "27:07");
  assert.equal(formatTime(equivalentSeconds(50 * 60, "10k", "toWomen")), "54:15");
});

test("reads h:mm:ss, mm:ss and bare seconds, and rejects the rest", () => {
  assert.equal(parseTime("1:23:45"), 5025);
  assert.equal(parseTime(" 25:00 "), 1500);
  assert.equal(parseTime("90"), 90);
  assert.equal(parseTime("25:61"), null);
  assert.equal(parseTime("abc"), null);
  assert.equal(parseTime("0:00"), null);
  assert.equal(parseTime("1:2:3:4"), null);
});

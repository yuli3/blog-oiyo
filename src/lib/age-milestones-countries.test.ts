import assert from "node:assert/strict";
import { test } from "node:test";
import { exactAge, japanSchoolStartYear, reachDate } from "./age-milestones-countries.ts";

const d = (s: string) => new Date(`${s}T00:00:00`);

test("Japan ages up on the day before the birthday, other countries on the birthday", () => {
  assert.equal(exactAge(d("2008-05-15"), d("2026-05-14"), "jp"), 18);
  assert.equal(exactAge(d("2008-05-15"), d("2026-05-14"), "fr"), 17);
  assert.equal(exactAge(d("2008-05-15"), d("2026-05-15"), "fr"), 18);
});

test("Japanese 4/1 births start school a year before 4/2 births", () => {
  assert.equal(japanSchoolStartYear(d("2020-04-01")), 2026);
  assert.equal(japanSchoolStartYear(d("2020-04-02")), 2027);
  assert.equal(japanSchoolStartYear(d("2020-01-10")), 2026);
});

test("reach dates", () => {
  assert.equal(reachDate(d("2000-03-01"), 20, "jp").getDate(), 29); // 2020-02-29
  assert.equal(reachDate(d("2000-03-01"), 18, "es").getFullYear(), 2018);
});

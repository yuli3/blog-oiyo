import assert from "node:assert/strict";
import { test } from "node:test";
import { equivalentWeight, formatWeight, matchingStandards, RATIO, roundToStep, STANDARDS } from "./crossfit-weight-equivalent.ts";

test("pins the mean ratio so a changed standard is a deliberate edit", () => {
  assert.equal(RATIO.toFixed(4), "0.6898");
  for (const row of STANDARDS) {
    assert.ok(row.lb.women < row.lb.men);
    assert.ok(row.kg.women < row.kg.men);
  }
});

test("converts both ways and rounds to plates", () => {
  assert.equal(roundToStep(equivalentWeight(95, "toWomen"), "lb"), 65);
  assert.equal(roundToStep(equivalentWeight(225, "toWomen"), "lb"), 155);
  assert.equal(roundToStep(equivalentWeight(65, "toMen"), "lb"), 95);
  assert.equal(roundToStep(equivalentWeight(100, "toWomen"), "kg"), 70);
  const back = equivalentWeight(equivalentWeight(135, "toWomen"), "toMen");
  assert.ok(Math.abs(back - 135) < 1e-9);
});

test("finds the published pair when the input is a standard load", () => {
  assert.deepEqual(matchingStandards(135, "lb", "toWomen").map((row) => row.id), ["grace", "isabel"]);
  assert.deepEqual(matchingStandards(16, "kg", "toMen").map((row) => row.id), ["kettlebell"]);
  assert.equal(matchingStandards(100, "lb", "toWomen").length, 0);
  assert.equal(formatWeight(22.5), "22.5");
  assert.equal(formatWeight(70), "70");
});

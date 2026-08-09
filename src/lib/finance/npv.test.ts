import assert from "node:assert/strict";
import test from "node:test";

import { calculateNpv, parseCashFlows, validateNpvInput } from "./npv.ts";

test("parses comma-separated cash flows", () => {
  assert.deepEqual(parseCashFlows("300000, 400000, 400000"), [300000, 400000, 400000]);
  assert.equal(parseCashFlows("300000, nope"), null);
  assert.equal(parseCashFlows("300000,"), null);
});

test("keeps the existing NPV formula", () => {
  const result = calculateNpv({
    initialInvestment: 1_000_000,
    discountRate: 10,
    cashFlows: "300000, 400000, 400000, 400000",
  });

  assert.equal(Math.round(result ?? 0), 177037);
});

test("rejects inputs that cannot produce a meaningful NPV", () => {
  assert.equal(validateNpvInput({ initialInvestment: -1, discountRate: 10, cashFlows: "100" }), "initialInvestment");
  assert.equal(validateNpvInput({ initialInvestment: 1, discountRate: -100, cashFlows: "100" }), "discountRate");
  assert.equal(validateNpvInput({ initialInvestment: 1, discountRate: 10, cashFlows: "" }), "cashFlows");
});

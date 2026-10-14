import assert from "node:assert/strict";
import { test } from "node:test";
import { applianceKwh, ELECTRICITY, electricityBill, parseElectricityText, seasonOf } from "./kr-electricity-2026.ts";

test("pins the residential low-voltage tariff so a change is a deliberate edit", () => {
  assert.deepEqual(ELECTRICITY.basic, [910, 1_600, 7_300]);
  assert.deepEqual(ELECTRICITY.energy, [120.0, 214.6, 307.3]);
  assert.deepEqual(ELECTRICITY.otherLimits, [200, 400]);
  assert.deepEqual(ELECTRICITY.summerLimits, [300, 450]);
  assert.equal(ELECTRICITY.climate, 9.0);
  assert.equal(ELECTRICITY.fuelAdjustment, 5.0);
});

test("350kWh in an ordinary month lands in tier 2", () => {
  const r = electricityBill(350, "other");
  assert.equal(r.tier, 2);
  assert.equal(r.basic, 1_600);
  assert.equal(r.energy, 56_190); // 200 × 120 + 150 × 214.6
  assert.equal(r.climate, 3_150);
  assert.equal(r.fuel, 1_750);
  assert.equal(r.subtotal, 62_690);
  assert.equal(r.vat, 6_269);
  assert.equal(r.fund, 1_690); // 1,692.6 → 10원 미만 절사
  assert.equal(r.total, 70_640);
});

test("the same 350kWh in August stays in tier 2 of the wider summer bands", () => {
  const r = electricityBill(350, "summer");
  assert.equal(r.tier, 2);
  assert.equal(r.energy, Math.floor(300 * 120 + 50 * 214.6));
  assert.ok(r.total < electricityBill(350, "other").total);
});

test("tier boundaries are inclusive", () => {
  assert.equal(electricityBill(200, "other").tier, 1);
  assert.equal(electricityBill(201, "other").tier, 2);
  assert.equal(electricityBill(400, "other").tier, 2);
  assert.equal(electricityBill(401, "other").tier, 3);
  assert.equal(electricityBill(300, "summer").tier, 1);
  assert.equal(electricityBill(450, "summer").tier, 2);
});

test("super-user rate applies only above 1,000kWh in summer and winter", () => {
  const winter = electricityBill(1_100, "winter");
  assert.deepEqual(winter.bands.at(-1), { kwh: 100, rate: 736.2 });
  const spring = electricityBill(1_100, "other");
  assert.equal(spring.bands.at(-1)?.rate, 307.3);
  assert.equal(spring.bands.at(-1)?.kwh, 700);
});

test("zero use still pays the tier-1 basic charge", () => {
  const r = electricityBill(0, "other");
  assert.equal(r.subtotal, 910);
  assert.equal(r.total, 1_020); // 910 + 91 + 20 = 1,021 → 10원 미만 절사
});

test("seasons by month", () => {
  assert.equal(seasonOf(7), "summer");
  assert.equal(seasonOf(1), "winter");
  assert.equal(seasonOf(10), "other");
});

test("appliance energy and one-line parsing", () => {
  assert.equal(applianceKwh(300, 8, 30), 72);
  assert.deepEqual(parseElectricityText("8월 350kWh 에어컨 700W 하루 8시간"), { kwh: 350, month: 8, watts: 700, hours: 8 });
  assert.deepEqual(parseElectricityText("1월 히터 1.5kW 3시간"), { month: 1, watts: 1500, hours: 3 });
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { franceTaxeFonciere, japanPropertyTax, shanghaiPilotTax, spainIbi } from "./property-tax-countries.ts";

test("Japan 固定資産税・都市計画税 with 住宅用地特例 and 新築減額", () => {
  const r = japanPropertyTax({ landValue: 30_000_000, landArea: 300, residential: true, dwellings: 1, buildingValue: 10_000_000, floorArea: 100, newHouseRelief: true, fixedRate: 0.014, cityPlanRate: 0.003 });
  assert.equal(r.landFixedBase, 6_666_000); // 200㎡ × 1/6 + 100㎡ × 1/3
  assert.equal(r.landCityBase, 13_333_000); // 200㎡ × 1/3 + 100㎡ × 2/3
  assert.equal(r.relief, 70_000);
  assert.equal(r.fixedAssetTax, 163_300);
  assert.equal(r.cityPlanningTax, 69_900);
  assert.equal(r.total, 233_200);
});

test("Japan non-residential land has no 特例; 免税点 applies below 30万/20万", () => {
  const r = japanPropertyTax({ landValue: 10_000_000, landArea: 100, residential: false, dwellings: 1, buildingValue: 150_000, floorArea: 50, newHouseRelief: false, fixedRate: 0.014, cityPlanRate: 0.003 });
  assert.equal(r.fixedAssetTax, 140_000);
  assert.equal(r.cityPlanningTax, 30_000);
});

test("Shanghai pilot: 60㎡ per person, 70% base, 0.6% / 0.4%", () => {
  assert.equal(shanghaiPilotTax({ price: 6_000_000, area: 100, existingArea: 80, members: 3, lowPrice: false, resident: true }).tax, 0);
  const r = shanghaiPilotTax({ price: 6_000_000, area: 100, existingArea: 120, members: 3, lowPrice: false, resident: true });
  assert.equal(r.taxableArea, 40);
  assert.equal(r.tax, 10_080);
  assert.equal(shanghaiPilotTax({ price: 6_000_000, area: 100, existingArea: 0, members: 1, lowPrice: true, resident: false }).tax, 16_800);
});

test("France taxe foncière = VLC × 50% × taux", () => {
  assert.deepEqual(franceTaxeFonciere(4_000, 40), { base: 2_000, tax: 800 });
});

test("Spain IBI = valor catastral × tipo", () => {
  assert.equal(spainIbi(150_000, 0.5).tax, 750);
  assert.equal(spainIbi(150_000, 1.3).inLegalRange, false);
});

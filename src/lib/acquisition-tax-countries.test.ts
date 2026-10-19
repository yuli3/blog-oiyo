import assert from "node:assert/strict";
import { test } from "node:test";
import { chinaDeedTax, franceTransferDuties, japanAcquisitionTax, spainPurchaseTax } from "./acquisition-tax-countries.ts";

const jpBase = { landValue: 20_000_000, landArea: 100, takuchi: true, buildingValue: 15_000_000, floorArea: 90, kind: "new" as const, houseDeduction: 12_000_000, qualifies: true };

test("Japan new home: 宅地 1/2, 住宅用土地の減額, 1,200万 控除, 登録免許税 1.5% + 0.15%", () => {
  const r = japanAcquisitionTax(jpBase);
  assert.equal(r.landBase, 10_000_000);
  assert.equal(r.landTax, 0); // relief 100,000/㎡ × 100㎡ × 3% = 300,000 wipes the land tax
  assert.equal(r.buildingTax, 90_000);
  assert.equal(r.registrationLand, 300_000);
  assert.equal(r.registrationBuilding, 22_500);
  assert.equal(r.total, 412_500);
});

test("Japan rounding follows the 滋賀県 example (千円・百円 切捨て)", () => {
  const r = japanAcquisitionTax({ ...jpBase, landValue: 8_566_234, buildingValue: 0, qualifies: false });
  assert.equal(r.landBase, 4_283_000);
  assert.equal(r.landTax, 128_400);
});

test("Japan used home without the 住宅 requirements: no 控除, 移転 2%", () => {
  const r = japanAcquisitionTax({ ...jpBase, landValue: 0, kind: "used", buildingValue: 10_000_000, qualifies: false });
  assert.equal(r.buildingTax, 300_000);
  assert.equal(r.registrationBuilding, 200_000);
});

test("China 契税: 2024年第16号公告 1%/1.5% first, 1%/2% second, local rate after", () => {
  assert.equal(chinaDeedTax(3_000_000, 120, "first", 0.03).tax, 30_000);
  assert.equal(chinaDeedTax(3_000_000, 150, "first", 0.03).tax, 45_000);
  assert.equal(chinaDeedTax(3_000_000, 140, "second", 0.03).tax, 30_000);
  assert.equal(chinaDeedTax(3_000_000, 150, "second", 0.03).tax, 60_000);
  assert.equal(chinaDeedTax(3_000_000, 90, "other", 0.03).tax, 90_000);
});

test("France DMTO: 5% + 1.2% + 2.37% of departmental; primo-accédant keeps 4.5%; neuf 0.715%", () => {
  assert.equal(franceTransferDuties(300_000, "ancien", 0.05, false).total, 18_955.5);
  assert.equal(franceTransferDuties(300_000, "ancien", 0.05, true).total, 17_419.95);
  assert.equal(franceTransferDuties(300_000, "ancien", 0.045, false).total, 17_419.95);
  assert.equal(franceTransferDuties(300_000, "neuf", 0.05, false).total, 2_145);
});

test("Spain ITP by comunidad, obra nueva IVA 10% + AJD", () => {
  assert.equal(spainPurchaseTax(1_000_000, "cataluna", "usada").total, 105_000);
  assert.equal(spainPurchaseTax(1_200_000, "valenciana", "usada").total, 112_000);
  assert.equal(spainPurchaseTax(250_000, "andalucia", "usada").total, 17_500);
  const n = spainPurchaseTax(300_000, "madrid", "nueva");
  assert.equal(n.iva, 30_000);
  assert.equal(n.ajd, 2_250);
  assert.equal(spainPurchaseTax(200_000, "otra", "usada", 0.08).total, 16_000);
});

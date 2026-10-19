import assert from "node:assert/strict";
import { test } from "node:test";
import {
  chinaCapitalGainsTax,
  franceAbattementIR,
  franceAbattementPS,
  franceCapitalGainsTax,
  franceSurtaxe,
  japanCapitalGainsTax,
  spainCapitalGainsTax,
} from "./capital-gains-tax-countries.ts";

const jp = { salePrice: 30_000_000, acquisitionCost: 20_000_000, estimatedCost: false, sellingCosts: 0, acquisitionYear: 2015, saleYear: 2026, residence: false, reducedRate: false };

test("Japan: 長期 20.315%, 短期 39.63%, 5年超 is judged at 1月1日 of the sale year", () => {
  assert.equal(japanCapitalGainsTax(jp).total, 2_031_500);
  assert.equal(japanCapitalGainsTax({ ...jp, acquisitionYear: 2021 }).regime, "short");
  assert.equal(japanCapitalGainsTax({ ...jp, acquisitionYear: 2021 }).total, 3_963_000);
  assert.equal(japanCapitalGainsTax({ ...jp, acquisitionYear: 2020 }).regime, "long");
});

test("Japan 居住用: 3,000万円控除 + 10年超の軽減税率 14.21%", () => {
  const r = japanCapitalGainsTax({ ...jp, salePrice: 100_000_000, acquisitionCost: 30_000_000, sellingCosts: 3_000_000, residence: true, reducedRate: true });
  assert.equal(r.taxable, 37_000_000);
  assert.equal(r.regime, "reduced");
  assert.equal(r.total, 5_257_700);
  assert.equal(japanCapitalGainsTax({ ...jp, salePrice: 20_000_000, estimatedCost: true }).cost, 1_000_000);
});

test("China: 20% of gain, 核定 % of price, 满五唯一 exempt", () => {
  const base = { salePrice: 3_000_000, originalValue: 2_000_000, expenses: 100_000, method: "actual" as const, deemedRate: 0.01, fiveYearsOnly: false };
  assert.equal(chinaCapitalGainsTax(base).tax, 180_000);
  assert.equal(chinaCapitalGainsTax({ ...base, method: "deemed" }).tax, 30_000);
  assert.equal(chinaCapitalGainsTax({ ...base, fiveYearsOnly: true }).tax, 0);
});

test("France abattements: IR exempt after 22 years, PS after 30", () => {
  assert.equal(franceAbattementIR(5), 0);
  assert.ok(Math.abs(franceAbattementIR(21) - 0.96) < 1e-9);
  assert.equal(franceAbattementIR(22), 1);
  assert.ok(Math.abs(franceAbattementPS(22) - 0.28) < 1e-9);
  assert.ok(Math.abs(franceAbattementPS(23) - 0.37) < 1e-9);
  assert.equal(franceAbattementPS(30), 1);
});

test("France: forfaits 7.5% / 15%, IR 19% + PS 17.2%, surtaxe with lissage", () => {
  const r = franceCapitalGainsTax({ salePrice: 300_000, purchasePrice: 200_000, acquisitionFees: 0, forfaitAcquisition: true, works: 0, forfaitTravaux: true, years: 10, residencePrincipale: false });
  assert.equal(r.gross, 55_000);
  assert.equal(r.netIR, 38_500);
  assert.equal(r.ir, 7_315);
  assert.equal(r.surtaxe, 0);
  assert.equal(franceSurtaxe(50_000), 0);
  assert.equal(franceSurtaxe(55_000), 850);
  assert.equal(franceSurtaxe(60_000), 1_200);
  assert.equal(franceSurtaxe(300_000), 18_000);
  assert.equal(franceCapitalGainsTax({ salePrice: 300_000, purchasePrice: 200_000, acquisitionFees: 0, forfaitAcquisition: true, works: 0, forfaitTravaux: true, years: 3, residencePrincipale: true }).total, 0);
});

test("Spain: base del ahorro 19/21/23/27/30, reinvestment and over-65 exemption", () => {
  const base = { salePrice: 300_000, saleCosts: 0, purchasePrice: 200_000, purchaseCosts: 0, reinvested: 0, viviendaHabitual: false, over65: false };
  assert.equal(spainCapitalGainsTax(base).tax, 21_880);
  assert.equal(spainCapitalGainsTax({ ...base, salePrice: 600_000 }).tax, 101_880);
  assert.equal(spainCapitalGainsTax({ ...base, viviendaHabitual: true, reinvested: 150_000 }).taxable, 50_000);
  assert.equal(spainCapitalGainsTax({ ...base, viviendaHabitual: true, over65: true }).tax, 0);
});

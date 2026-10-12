import assert from "node:assert/strict";
import { test } from "node:test";
import { addMonths, daysBetween, deemedRent, nextWeekday, parseKrAmount, parsePenaltyText, parseRentText, VAT_RATES, vatPenalty } from "./kr-vat-2026.ts";

const base = { filing: "none", tax: 0, fraud: false, deadline: "2026-07-27", filed: "2026-07-27", invoice: "none", supply: 0 } as const;

test("pins the 2026 rates so a rule change is a deliberate edit", () => {
  assert.equal(VAT_RATES.noFiling, 0.2);
  assert.equal(VAT_RATES.underFiling, 0.1);
  assert.equal(VAT_RATES.fraud, 0.4);
  assert.equal(VAT_RATES.latePaymentPerDay, 0.00022);
  assert.equal(VAT_RATES.deemedRentInterest, 0.031);
});

test("date helpers count days, clamp month ends, and skip weekends", () => {
  assert.equal(daysBetween("2026-07-27", "2026-08-10"), 14);
  assert.equal(addMonths("2026-01-31", 1), "2026-02-28");
  assert.equal(addMonths("2026-07-27", 18), "2028-01-27");
  assert.equal(nextWeekday("2026-07-25"), "2026-07-27"); // Saturday → Monday
  assert.equal(nextWeekday("2026-10-25"), "2026-10-26"); // Sunday → Monday
  assert.equal(nextWeekday("2026-07-27"), "2026-07-27");
});

test("late filing: 20% with the 1/3/6-month relief, plus 0.022% a day", () => {
  const r = vatPenalty({ ...base, filing: "late", tax: 3_000_000, filed: "2026-08-10" });
  assert.equal(r.lines[0].gross, 600_000);
  assert.equal(r.reliefRate, 0.5);
  assert.equal(r.lines[0].amount, 300_000);
  assert.equal(r.lines[1].amount, 9_240); // 3,000,000 × 14 × 0.022%
  assert.equal(r.total, 309_240);

  assert.equal(vatPenalty({ ...base, filing: "late", tax: 1_000_000, filed: "2026-08-27" }).reliefRate, 0.5); // exactly one month
  assert.equal(vatPenalty({ ...base, filing: "late", tax: 1_000_000, filed: "2026-08-28" }).reliefRate, 0.3);
  assert.equal(vatPenalty({ ...base, filing: "late", tax: 1_000_000, filed: "2027-01-28" }).reliefRate, 0);
});

test("amended filing: 10% (40% for fraud) with relief down to 10% at two years", () => {
  const r = vatPenalty({ ...base, filing: "under", tax: 1_000_000, filed: "2026-11-30" });
  assert.equal(r.reliefRate, 0.5);
  assert.equal(r.lines[0].amount, 50_000);
  assert.equal(r.daysLate, 126);
  assert.equal(r.lines[1].amount, 27_720);

  const fraud = vatPenalty({ ...base, filing: "under", tax: 1_000_000, fraud: true, filed: "2026-08-01" });
  assert.equal(fraud.lines[0].gross, 400_000);
  assert.equal(fraud.reliefRate, 0.9);
  assert.equal(vatPenalty({ ...base, filing: "under", tax: 1_000_000, filed: "2028-07-01" }).reliefRate, 0.1);
});

test("invoice penalties are a share of the supply value and get no relief", () => {
  const supply = 10_000_000;
  const amount = (invoice: "missing" | "late" | "paper" | "lateSend" | "noSend") => vatPenalty({ ...base, invoice, supply }).total;
  assert.equal(amount("missing"), 200_000);
  assert.equal(amount("late"), 100_000);
  assert.equal(amount("paper"), 100_000);
  assert.equal(amount("lateSend"), 30_000);
  assert.equal(amount("noSend"), 50_000);
});

test("deemed rent: deposit × days × rate ÷ 365 (366 in a leap year)", () => {
  const second = deemedRent({ deposit: 100_000_000, start: "2026-07-01", end: "2026-12-31" });
  assert.equal(second.days, 184);
  assert.equal(second.deemedRent, Math.floor((100_000_000 * 184 * 0.031) / 365));
  assert.equal(second.vat, Math.floor(second.deemedRent * 0.1));
  assert.equal(deemedRent({ deposit: 100_000_000, start: "2028-01-01", end: "2028-06-30" }).yearDays, 366);
});

test("reads amounts with 억·천만·만 units and one-line descriptions", () => {
  assert.equal(parseKrAmount("3억"), 300_000_000);
  assert.equal(parseKrAmount("1억 5천만"), 150_000_000);
  assert.equal(parseKrAmount("1만1천원"), 11_000);
  assert.equal(parseKrAmount("10,000,000"), 10_000_000);
  assert.equal(parseKrAmount("abc"), null);

  assert.deepEqual(parsePenaltyText("1기 확정 기한후신고 세액 300만원 8월 10일 신고"), {
    filing: "late",
    tax: 3_000_000,
    deadline: "2026-07-27",
    filed: "2026-08-10",
  });
  assert.deepEqual(parsePenaltyText("종이 세금계산서 공급가액 1000만원"), { invoice: "paper", supply: 10_000_000 });
  assert.deepEqual(parsePenaltyText("매출 누락 수정신고 세액 100만원 2026-07-27 기한, 2026-11-30 신고"), {
    filing: "under",
    tax: 1_000_000,
    deadline: "2026-07-27",
    filed: "2026-11-30",
  });
  assert.equal(parsePenaltyText("1기 확정 무신고 세액 50만원 3개월 늦게").filed, "2026-10-27");

  assert.deepEqual(parseRentText("보증금 1억 2기"), { deposit: 100_000_000, start: "2026-07-01", end: "2026-12-31" });
  assert.deepEqual(parseRentText("보증금 3억 7월 1일부터 9월 30일까지 이자율 3.1%"), {
    deposit: 300_000_000,
    start: "2026-07-01",
    end: "2026-09-30",
    rate: 0.031,
  });
});

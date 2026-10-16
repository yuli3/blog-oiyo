import assert from "node:assert/strict";
import test from "node:test";
import {
  shoeSizeFromMm,
  shoeSizeFromMenUs,
  shoeSizeFromWomenUs,
  shoeSizePages,
} from "./shoe-size-equivalent.ts";

test("shoeSizeFromMm converts 250mm correctly", () => {
  const res = shoeSizeFromMm(250);
  assert.equal(res.cm, 25);
  assert.equal(res.mm, 250);
  assert.equal(res.menUs, 5.5); // Brannock formula
  assert.equal(res.womenBrannock, 7);
  assert.equal(res.womenRetail, 7.5);
  assert.equal(res.uk, 4.5);
  assert.equal(res.eu, 37.5);
});

test("shoeSizeFromMenUs converts US Men 9.0 correctly", () => {
  const res = shoeSizeFromMenUs(9.0);
  assert.equal(res.menUs, 9.0);
  assert.equal(res.womenBrannock, 10.5);
  assert.equal(res.womenRetail, 11.0);
  assert.equal(res.uk, 8.0);
  assert.equal(res.cm, 27.9); // (9 + 24)/3 * 2.54 = 11 * 2.54 = 27.94
});

test("shoeSizeFromWomenUs converts US Women 8.0 correctly", () => {
  const res = shoeSizeFromWomenUs(8.0);
  assert.equal(res.womenBrannock, 8.0);
  assert.equal(res.menUs, 6.5);
  assert.equal(res.womenRetail, 8.5);
  assert.equal(res.uk, 5.5);
});

test("shoeSizePages generates expected count for ko and en", () => {
  const koPages = shoeSizePages("ko");
  assert.equal(koPages.length, 17); // 220 to 300 by 5 = 17 sizes
  assert.equal(koPages[0].slug, "220mm");
  assert.equal(koPages[koPages.length - 1].slug, "300mm");

  const enPages = shoeSizePages("en");
  // Men: 6.0 to 13.0 step 0.5 = 15 sizes
  // Women: 5.0 to 12.0 step 0.5 = 15 sizes
  assert.equal(enPages.length, 30);
  assert.equal(enPages[0].slug, "men-us-6");
  assert.equal(enPages[1].slug, "men-us-6-5");
});

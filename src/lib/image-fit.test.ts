import assert from "node:assert/strict";
import { test } from "node:test";
import { FIT_MAX_QUALITY, FIT_MIN_QUALITY, fitToBytes, formatBytes, isHeic, outputName } from "./image-fit.ts";

// A pretend JPEG: size grows with quality and with area.
const fake = (full: number) => async (quality: number, scale: number) => Math.round(full * scale * scale * (0.15 + 0.85 * quality));

test("keeps the best quality when the image already fits", async () => {
  const r = await fitToBytes(fake(100_000), 200_000);
  assert.equal(r.met, true);
  assert.equal(r.quality, FIT_MAX_QUALITY);
  assert.equal(r.scale, 1);
  assert.equal(r.attempts, 1);
});

test("lowers quality before it touches the dimensions", async () => {
  const r = await fitToBytes(fake(100_000), 70_000);
  assert.equal(r.met, true);
  assert.equal(r.scale, 1);
  assert.ok(r.bytes <= 70_000 && r.bytes > 66_000, `bytes ${r.bytes}`);
  assert.ok(r.quality > FIT_MIN_QUALITY && r.quality < FIT_MAX_QUALITY);
});

test("shrinks the image only when the lowest quality is still too big", async () => {
  const r = await fitToBytes(fake(1_000_000), 50_000);
  assert.equal(r.met, true);
  assert.ok(r.scale < 1);
  assert.ok(r.bytes <= 50_000);
});

test("returns the closest result when the target cannot be reached", async () => {
  const r = await fitToBytes(async () => 9_000, 1_000);
  assert.equal(r.met, false);
  assert.equal(r.bytes, 9_000);
  assert.ok(r.attempts < 80);
});

test("recognises HEIC by type, by name and by its header", () => {
  const header = (brand: string) => Uint8Array.from([0, 0, 0, 24, ...[..."ftyp" + brand].map((c) => c.charCodeAt(0))]);
  assert.equal(isHeic("a.jpg", "image/heic", new Uint8Array()), true);
  assert.equal(isHeic("IMG_0001.HEIC", "", new Uint8Array()), true);
  assert.equal(isHeic("noext", "", header("heic")), true);
  assert.equal(isHeic("noext", "", header("mif1")), true);
  assert.equal(isHeic("noext", "", header("isom")), false);
  assert.equal(isHeic("a.png", "image/png", Uint8Array.from([0x89, 0x50, 0x4e, 0x47])), false);
});

test("names and sizes read the way people expect", () => {
  assert.equal(outputName("IMG_0001.HEIC", "jpg"), "IMG_0001.jpg");
  assert.equal(outputName("photo.final.png", "webp"), "photo.final.webp");
  assert.equal(outputName(".hidden", "jpg"), "image.jpg");
  assert.equal(formatBytes(512), "512 B");
  assert.equal(formatBytes(1536), "1.5 KB");
  assert.equal(formatBytes(51_200), "50 KB");
  assert.equal(formatBytes(2 * 1024 * 1024), "2.00 MB");
});

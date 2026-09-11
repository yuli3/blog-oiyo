import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  seriesDisplayName,
  prioritySeriesName,
  deriveSeriesLabel,
} from "./priority-series.ts";

const here = dirname(fileURLToPath(import.meta.url));

test("B1: business-basics KO → 공기업 경영학, EN → Public Enterprise Management", () => {
  assert.equal(prioritySeriesName("business-basics", "ko"), "공기업 경영학");
  assert.equal(prioritySeriesName("business-basics", "en"), "Public Enterprise Management");
  assert.equal(seriesDisplayName("business-basics", "ko"), "공기업 경영학");
  assert.equal(seriesDisplayName("business-basics", "en"), "Public Enterprise Management");
});

test("B1: JA/ZH/FR/ES left for Translator (unchanged legacy map)", () => {
  assert.equal(prioritySeriesName("business-basics", "ja"), "経営学");
  assert.equal(prioritySeriesName("business-basics", "zh"), "管理学");
  assert.equal(prioritySeriesName("business-basics", "fr"), "Gestion");
  assert.equal(prioritySeriesName("business-basics", "es"), "Gestión");
});

test("B3: non-URL-safe FM key uses key itself, not ch1 derive", () => {
  const ch1 = "경영학 개론 — 조직과 관리";
  assert.equal(deriveSeriesLabel(ch1, "경영학 핵심"), "경영학 개론");
  assert.equal(seriesDisplayName("경영학 핵심", "ko", ch1), "경영학 핵심");
  assert.equal(
    seriesDisplayName("Management Core", "en", "Introduction to Management — orgs"),
    "Management Core",
  );
});

test("B3: URL-safe key without map still derives from title", () => {
  assert.equal(
    seriesDisplayName("zoology-basics", "ko", "동물학 — intro"),
    "동물학",
  );
});

test("source lock: seriesDisplayName exported and B1 strings present", () => {
  const src = readFileSync(join(here, "priority-series.ts"), "utf8");
  assert.match(src, /export function seriesDisplayName/);
  assert.match(src, /"business-basics"[\s\S]*?ko:\s*"공기업 경영학"/);
  assert.match(src, /"business-basics"[\s\S]*?en:\s*"Public Enterprise Management"/);
});

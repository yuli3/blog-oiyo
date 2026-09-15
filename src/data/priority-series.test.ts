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

test("B1: management-principles KO → 경영학원론, EN → Principles of Management", () => {
  assert.equal(prioritySeriesName("management-principles", "ko"), "경영학원론");
  assert.equal(prioritySeriesName("management-principles", "en"), "Principles of Management");
  assert.equal(seriesDisplayName("management-principles", "ko"), "경영학원론");
  assert.equal(seriesDisplayName("management-principles", "en"), "Principles of Management");
});

test("B1: JA/ZH/FR/ES for 경영학원론", () => {
  assert.equal(prioritySeriesName("management-principles", "ja"), "経営学原論");
  assert.equal(prioritySeriesName("management-principles", "zh"), "管理学原理");
  assert.equal(prioritySeriesName("management-principles", "fr"), "Principes de gestion");
  assert.equal(prioritySeriesName("management-principles", "es"), "Principios de administración");
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

test("source lock: seriesDisplayName exported and 경영학원론 map present", () => {
  const src = readFileSync(join(here, "priority-series.ts"), "utf8");
  assert.match(src, /export function seriesDisplayName/);
  assert.match(src, /"management-principles"[\s\S]*?ko:\s*"경영학원론"/);
  assert.match(src, /"management-principles"[\s\S]*?en:\s*"Principles of Management"/);
});

test("accounting-principles KO → 회계원리", () => {
  assert.equal(prioritySeriesName("accounting-principles", "ko"), "회계원리");
  assert.equal(seriesDisplayName("accounting-principles", "ko"), "회계원리");
});

test("civil-law KO → 민법", () => {
  assert.equal(prioritySeriesName("civil-law", "ko"), "민법");
  assert.equal(seriesDisplayName("civil-law", "ko"), "민법");
});

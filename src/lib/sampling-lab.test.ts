import { test } from "node:test";
import assert from "node:assert/strict";
import { drawSampleRates } from "./sampling-lab.ts";

test("같은 입력·시드는 같은 표본 (SSR과 hydration 일치)", () => {
  assert.deepEqual(drawSampleRates(55, 30, 50, 1), drawSampleRates(55, 30, 50, 1));
});

test("시드가 바뀌면 다시 뽑힌다", () => {
  assert.notDeepEqual(drawSampleRates(55, 30, 50, 1), drawSampleRates(55, 30, 50, 2));
});

test("입력 범위를 제한해 큰 값에도 멈추지 않는다", () => {
  const r = drawSampleRates(150, 1e9, 1e9, 1);
  assert.equal(r.length, 200);
  assert.ok(r.every((v) => v === 100));
});

test("표본이 크면 평균이 모집단 비율에 가깝다", () => {
  const r = drawSampleRates(55, 2000, 100, 3);
  const avg = r.reduce((a, v) => a + v, 0) / r.length;
  assert.ok(Math.abs(avg - 55) < 1, String(avg));
});

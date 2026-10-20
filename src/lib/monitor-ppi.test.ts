import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateMonitorPpi } from './monitor-ppi.ts';

test('a 300 by 400 pixel, 5-inch display reports the 3-4-5 geometry', () => {
  const result = calculateMonitorPpi({ widthPixels: 300, heightPixels: 400, diagonalInches: 5 });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error('Expected valid geometry');
  assert.equal(result.ppi, 100);
  assert.equal(result.pixelPitchMm, 0.254);
  assert.ok(Math.abs(result.widthCm - 7.62) < 1e-10);
  assert.ok(Math.abs(result.heightCm - 10.16) < 1e-10);
});

test('invalid or non-pixel dimensions produce no misleading result', () => {
  for (const widthPixels of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.deepEqual(calculateMonitorPpi({ widthPixels, heightPixels: 400, diagonalInches: 5 }), {
      ok: false, reason: 'invalid-input',
    });
  }
});

test('height and diagonal also require valid dimensions', () => {
  for (const heightPixels of [0, -1, 1.5, NaN, Infinity]) {
    assert.deepEqual(calculateMonitorPpi({ widthPixels: 300, heightPixels, diagonalInches: 5 }), {
      ok: false, reason: 'invalid-input',
    });
  }
  for (const diagonalInches of [0, -1, NaN, Infinity]) {
    assert.deepEqual(calculateMonitorPpi({ widthPixels: 300, heightPixels: 400, diagonalInches }), {
      ok: false, reason: 'invalid-input',
    });
  }
});

test('unrepresentable geometry is an error, not Infinity or a zero measurement', () => {
  for (const diagonalInches of [Number.MIN_VALUE, Number.MAX_VALUE]) {
    assert.deepEqual(calculateMonitorPpi({ widthPixels: 300, heightPixels: 400, diagonalInches }), {
      ok: false, reason: 'unrepresentable-result',
    });
  }
});

test('the optional one-arcminute geometry is a distance, not a vision rating', () => {
  const result = calculateMonitorPpi({ widthPixels: 300, heightPixels: 400, diagonalInches: 5 });
  if (!result.ok) throw new Error('Expected valid geometry');
  assert.ok(Math.abs(result.oneArcminuteDistanceCm - 87.3188) < 0.0001);
});

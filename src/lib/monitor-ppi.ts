export interface MonitorPpiInput {
  widthPixels: number;
  heightPixels: number;
  diagonalInches: number;
}

export type MonitorPpiResult =
  | { ok: false; reason: 'invalid-input' | 'unrepresentable-result' }
  | { ok: true; ppi: number; pixelPitchMm: number; widthCm: number; heightCm: number; oneArcminuteDistanceCm: number };

export function calculateMonitorPpi(input: MonitorPpiInput): MonitorPpiResult {
  if (!Number.isSafeInteger(input.widthPixels) || input.widthPixels <= 0 ||
      !Number.isSafeInteger(input.heightPixels) || input.heightPixels <= 0 ||
      !Number.isFinite(input.diagonalInches) || input.diagonalInches <= 0) {
    return { ok: false, reason: 'invalid-input' };
  }
  const diagonalPixels = Math.hypot(input.widthPixels, input.heightPixels);
  const ppi = diagonalPixels / input.diagonalInches;
  const pixelPitchMm = 25.4 / ppi;
  const widthCm = (input.widthPixels / diagonalPixels) * input.diagonalInches * 2.54;
  const heightCm = (input.heightPixels / diagonalPixels) * input.diagonalInches * 2.54;
  // A centred, face-on pixel subtends one arcminute here. This chosen angle is
  // geometric only: it is not an acuity test or a Retina guarantee (2026-10-19).
  const oneArcminuteDistanceCm = pixelPitchMm / (20 * Math.tan(Math.PI / 21600));
  // Positive finite inputs can still overflow/underflow floating-point output;
  // hiding that as an ordinary measurement would mislead the UI (2026-10-19).
  if (![ppi, pixelPitchMm, widthCm, heightCm, oneArcminuteDistanceCm].every(value => Number.isFinite(value) && value > 0)) {
    return { ok: false, reason: 'unrepresentable-result' };
  }
  // Exact inch conversion (NIST); this models a flat rectangle with square pixels,
  // not visible bezel dimensions or a perceptual sharpness rating (2026-10-19).
  return {
    ok: true,
    ppi,
    pixelPitchMm,
    widthCm,
    heightCm,
    oneArcminuteDistanceCm,
  };
}

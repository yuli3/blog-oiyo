/** 시드 고정 난수(mulberry32). 서버와 브라우저가 같은 표본을 그려 hydration이 어긋나지 않는다. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);

/** 표본 비율(%) 목록. 같은 입력·시드면 늘 같은 결과. */
export function drawSampleRates(populationRate: number, sampleSize: number, trials: number, seed: number): number[] {
  const p = clamp(populationRate, 0, 100) / 100;
  const n = Math.round(clamp(sampleSize, 1, 5000));
  const t = Math.round(clamp(trials, 1, 200));
  const rand = seededRandom(seed * 2654435761 + n * 97 + t * 31 + Math.round(p * 1000));
  const out: number[] = [];
  for (let k = 0; k < t; k += 1) {
    let success = 0;
    for (let i = 0; i < n; i += 1) if (rand() < p) success += 1;
    out.push((success / n) * 100);
  }
  return out;
}

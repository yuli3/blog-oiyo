/**
 * Rung 도표 3종(F1 Rung Bars · F6 Paired Rungs · F9 Rung Waterfall)이 공유하는
 * 눈금 계산.
 *
 * lieflat-charts 원본은 갤러리라서 눈금 단위가 "1 rung = $1k" 로 박혀 있다.
 * 우리 데이터는 그렇게 고정할 수 없어(실측 n=171, 중앙값 30, 최대 225) 단위를
 * 데이터에서 유도한다. 그리고 유도한 단위로 **정직하게 못 그리면 그리지
 * 않는다** — 셀 수 없는 눈금은 이 도표들의 존재 이유를 부순다.
 */

/** 원본 `rnd(i,k)` — 두 정수를 섞어 0~1 을 낸다. 결정적이라 SSR 과 어긋나지 않는다. */
export function jitter(a: number, b: number): number {
  return Math.abs(((a * 73856093) ^ (b * 19349663)) % 1000) / 1000;
}

const NICE_UNITS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];

/** 가장 큰 값이 TARGET_MAX 칸 안에 들어오는 가장 작은 "깔끔한" 단위. */
export const TARGET_MAX = 38;
export const HARD_MAX = 40;

export function pickUnit(max: number): number | null {
  for (const u of NICE_UNITS) {
    if (Math.ceil(max / u) <= TARGET_MAX) return u;
  }
  return null;
}

/** 이 단위로 값들을 정직하게 셀 수 있는가. */
function unitFits(magnitudes: number[], unit: number): number[] | null {
  const counts = magnitudes.map((v) => Math.round(v / unit));
  if (Math.max(...counts) > HARD_MAX) return null;
  if (magnitudes.some((v, i) => v > 0 && counts[i] === 0)) return null;
  if (magnitudes.some((v, i) => v > 0 && Math.abs(counts[i] * unit - v) / v > MAX_REL_ERROR)) return null;
  return counts;
}

/** 칸 수를 세어 나온 값이 실제 값과 이만큼 넘게 어긋나면 그리지 않는다. */
export const MAX_REL_ERROR = 0.1;

/**
 * 값들을 눈금으로 정직하게 표현할 수 있는 단위를 고른다.
 * 못 고르면 null — 호출부는 다른 표현으로 넘어간다.
 *
 * 막는 경우:
 *   - 값이 없거나 전부 0
 *   - 유한하지 않거나 음수(부호는 호출부가 처리한다 — 여기엔 크기만 넘긴다)
 *   - 어떤 단위로도 HARD_MAX 칸 안에 못 들어옴
 *   - 0 이 아닌 값이 0칸이 됨
 *   - 세어 얻은 값이 실제와 MAX_REL_ERROR 넘게 어긋남
 */
export function planScale(magnitudes: number[]): { unit: number; counts: number[] } | null {
  if (!magnitudes.length) return null;
  if (magnitudes.some((v) => !Number.isFinite(v) || v < 0)) return null;

  const max = Math.max(...magnitudes);
  if (max <= 0) return null;

  // 후보 단위를 **전부** 시도한다. 가장 작은 것 하나만 보고 정확도 검사에서
  // 떨어뜨리면 멀쩡한 데이터를 놓친다 — 실측: [500, 200, 300, 250, 50] 은
  // 단위 20 에서 50 이 3칸(60)이 되어 20% 어긋나지만, 단위 25 면 전부 딱
  // 맞는다(20·8·12·10·2칸). 큰 단위 쪽이 칸은 적어도 거짓이 없다.
  for (const unit of NICE_UNITS) {
    if (Math.ceil(max / unit) > TARGET_MAX) continue;
    const counts = unitFits(magnitudes, unit);
    if (counts) return { unit, counts };
  }
  return null;
}

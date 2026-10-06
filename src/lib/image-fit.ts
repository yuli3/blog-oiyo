/**
 * "Make this image at most N kilobytes."
 *
 * The browser only offers a quality knob, not a size knob, so the size is found by
 * search: first over quality at full resolution, and only if the lowest acceptable
 * quality is still too big, over smaller dimensions. Kept apart from the canvas code so
 * the search can be tested with a pretend encoder. 2026-10-07
 */
export interface FitAttempt { quality: number; scale: number; bytes: number }
export interface FitResult extends FitAttempt { met: boolean; attempts: number }

/** Encodes at a quality (0..1) and a scale (0..1 of the original side length) and reports the size. */
export type FitEncoder = (quality: number, scale: number) => Promise<number>;

export const FIT_MIN_QUALITY = 0.4;
export const FIT_MAX_QUALITY = 0.95;
const QUALITY_STEPS = 7;
const SCALE_STEP = 0.85;
const MIN_SCALE = 0.1;

export async function fitToBytes(encode: FitEncoder, targetBytes: number): Promise<FitResult> {
  let attempts = 0;
  const measure = async (quality: number, scale: number): Promise<FitAttempt> => {
    attempts += 1;
    return { quality, scale, bytes: await encode(quality, scale) };
  };

  // Best quality that fits at a given scale, or null when even the floor quality is too big.
  const searchQuality = async (scale: number): Promise<FitAttempt | null> => {
    const top = await measure(FIT_MAX_QUALITY, scale);
    if (top.bytes <= targetBytes) return top;
    const floor = await measure(FIT_MIN_QUALITY, scale);
    if (floor.bytes > targetBytes) return null;
    let low = FIT_MIN_QUALITY;
    let high = FIT_MAX_QUALITY;
    let best = floor;
    for (let i = 0; i < QUALITY_STEPS; i++) {
      const mid = (low + high) / 2;
      const tried = await measure(mid, scale);
      if (tried.bytes <= targetBytes) { best = tried; low = mid; } else { high = mid; }
    }
    return best;
  };

  let smallest: FitAttempt | null = null;
  for (let scale = 1; scale >= MIN_SCALE; scale *= SCALE_STEP) {
    const found = await searchQuality(scale);
    if (found) return { ...found, met: true, attempts };
    // Remember the smallest file seen so a target nothing can reach still returns the closest result.
    const floor = await measure(FIT_MIN_QUALITY, scale);
    if (!smallest || floor.bytes < smallest.bytes) smallest = floor;
  }
  return { ...(smallest as FitAttempt), met: false, attempts };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const HEIC_BRANDS = ["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"];

/** HEIC files often arrive with an empty or wrong MIME type, so the container header decides. */
export function isHeic(name: string, type: string, head: Uint8Array): boolean {
  if (/heic|heif/i.test(type) || /\.(heic|heif)$/i.test(name)) return true;
  if (head.length < 12) return false;
  const text = (from: number) => String.fromCharCode(head[from], head[from + 1], head[from + 2], head[from + 3]);
  return text(4) === "ftyp" && HEIC_BRANDS.includes(text(8));
}

export const outputName = (name: string, ext: string) => `${name.replace(/\.[^.]+$/, "") || "image"}.${ext}`;

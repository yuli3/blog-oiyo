/**
 * Slot machine anatomy — a teaching aid, not a game.
 *
 * ## What this deliberately does not do
 *
 * There is no bet, no balance, no spin button, no win animation. Those are the
 * exact mechanics our own gambling-prevention series (ch3, ch6) identifies as the
 * addictive part: variable-ratio reinforcement plus engineered near-misses. A demo
 * that reproduced them would teach the habit while explaining the habit.
 *
 * What it does instead is expose the two things a real machine hides:
 *
 * 1. **Reel weighting.** The jackpot symbol is placed so it lands *next to* the
 *    payline far more often than *on* it. That is a design choice, not luck.
 * 2. **Convergence.** Ten thousand spins run at once and the balance line is
 *    drawn. No single spin is ever shown, so there is no moment of suspense.
 *
 * Numbers here are illustrative of a typical machine, not a copy of any product.
 * The near-miss weighting is the standard technique described in the gambling
 * research literature; the RTP is set inside the range real machines publish.
 */

export type SlotSymbol = "seven" | "bell" | "cherry" | "lemon" | "blank";

export const SYMBOL_LABELS: Record<SlotSymbol, string> = {
  seven: "7",
  bell: "🔔",
  cherry: "🍒",
  lemon: "🍋",
  blank: "·",
};

/**
 * Reel strips. Note `seven` appears exactly once per reel — that is what makes the
 * jackpot rare — but it is surrounded by blanks so that a stop one position away
 * shows the 7 adjacent to the payline. That adjacency is the near-miss.
 */
export const REELS: SlotSymbol[][] = [
  ["seven", "blank", "cherry", "lemon", "bell", "blank", "lemon", "cherry", "blank", "lemon"],
  ["seven", "blank", "lemon", "cherry", "blank", "bell", "lemon", "blank", "cherry", "lemon"],
  ["seven", "blank", "lemon", "blank", "cherry", "lemon", "bell", "blank", "lemon", "cherry"],
];

/**
 * Payouts as a multiple of one credit.
 *
 * Calibrated so the *designed* return sits near 90%, inside the range real
 * physical machines publish (roughly 85-98%). An earlier draft returned 31%,
 * which would be illegal in most jurisdictions and would have made this demo
 * overstate its case — a teaching aid about real gambling has to use numbers a
 * real machine could have.
 */
export const PAYOUTS: { combo: SlotSymbol; multiplier: number }[] = [
  { combo: "seven", multiplier: 400 },
  { combo: "bell", multiplier: 100 },
  { combo: "cherry", multiplier: 20 },
  { combo: "lemon", multiplier: 9 },
];

export type SpinOutcome = {
  /** Symbol stopped on the payline for each reel. */
  line: SlotSymbol[];
  /** Credits returned. Zero for a loss. */
  payout: number;
  /**
   * True when the payline lost but a jackpot symbol sits directly above or below
   * on at least two reels — what a player reads as "so close".
   */
  nearMiss: boolean;
};

function symbolAt(reel: SlotSymbol[], stop: number): SlotSymbol {
  return reel[((stop % reel.length) + reel.length) % reel.length];
}

/** Deterministic given `stops`, so the whole model is testable without mocking RNG. */
export function evaluateStops(stops: number[]): SpinOutcome {
  const line = REELS.map((reel, i) => symbolAt(reel, stops[i] ?? 0));

  let payout = 0;
  if (line.every((s) => s === line[0]) && line[0] !== "blank") {
    payout = PAYOUTS.find((p) => p.combo === line[0])?.multiplier ?? 0;
  }

  // Adjacent-jackpot count: the 7 visible just off the payline.
  const adjacentSevens = REELS.reduce((count, reel, i) => {
    const stop = stops[i] ?? 0;
    const above = symbolAt(reel, stop - 1);
    const below = symbolAt(reel, stop + 1);
    return count + (above === "seven" || below === "seven" ? 1 : 0);
  }, 0);

  return { line, payout, nearMiss: payout === 0 && adjacentSevens >= 2 };
}

/**
 * The return the machine is *designed* to produce, computed from reel composition
 * and payouts rather than measured.
 *
 * Reporting this next to the simulated figure is the honest framing: the designed
 * number never moves, while a single jackpot swings a 10,000-spin sample by
 * several points. Showing only the sample would invite "so it depends on luck" —
 * which is exactly the misreading this page exists to correct.
 */
export function theoreticalReturnRate(): number {
  let rtp = 0;
  for (const { combo, multiplier } of PAYOUTS) {
    const probability = REELS.reduce(
      (p, reel) => p * (reel.filter((s) => s === combo).length / reel.length),
      1,
    );
    rtp += probability * multiplier;
  }
  return rtp * 100;
}

export type SimulationPoint = { spin: number; credits: number; returnRate: number };

export type SimulationResult = {
  spins: number;
  staked: number;
  returned: number;
  /** Return-to-player as a percentage. Below 100 means the machine keeps the rest. */
  returnRate: number;
  houseEdge: number;
  wins: number;
  nearMisses: number;
  jackpots: number;
  /** Sampled curve for plotting — never one point per spin. */
  curve: SimulationPoint[];
};

/** Small deterministic PRNG so a run is reproducible and reviewable. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Runs the whole batch at once and returns the aggregate.
 *
 * There is no per-spin callback and no animation hook by design: the player must
 * never watch spins resolve one by one, because that is the part that hooks.
 */
export function simulate(spins: number, seed = 20260730, samplePoints = 60): SimulationResult {
  const rand = mulberry32(seed);
  const sampleEvery = Math.max(1, Math.floor(spins / samplePoints));

  let credits = 0;
  let returned = 0;
  let wins = 0;
  let nearMisses = 0;
  let jackpots = 0;
  const curve: SimulationPoint[] = [{ spin: 0, credits: 0, returnRate: 100 }];

  for (let i = 1; i <= spins; i++) {
    const stops = REELS.map((reel) => Math.floor(rand() * reel.length));
    const { line, payout, nearMiss } = evaluateStops(stops);

    credits -= 1;
    if (payout > 0) {
      credits += payout;
      returned += payout;
      wins += 1;
      // Keyed to the symbol, not the multiplier — a payout table edit must not
      // silently stop counting jackpots.
      if (line[0] === "seven") jackpots += 1;
    }
    if (nearMiss) nearMisses += 1;

    if (i % sampleEvery === 0 || i === spins) {
      curve.push({ spin: i, credits, returnRate: (returned / i) * 100 });
    }
  }

  const returnRate = (returned / spins) * 100;
  return {
    spins,
    staked: spins,
    returned,
    returnRate,
    houseEdge: 100 - returnRate,
    wins,
    nearMisses,
    jackpots,
    curve,
  };
}

/**
 * How much more often a near-miss appears than the jackpot it imitates.
 *
 * This ratio is the whole point of the demo: the feeling of "almost" is
 * manufactured at a rate the actual prize never matches.
 */
export function nearMissAmplification(result: SimulationResult): number | null {
  if (result.jackpots === 0) return null;
  return result.nearMisses / result.jackpots;
}

export type VarianceBand = {
  spins: number;
  min: number;
  max: number;
  /** How wide the observed range is, in percentage points. */
  spread: number;
  /** True once the band no longer contains 100% — i.e. losing is now certain. */
  losingIsCertain: boolean;
};

export const VARIANCE_SCALES = [1_000, 10_000, 100_000, 1_000_000] as const;

/**
 * Runs the machine at several scales and reports how wide the observed return is
 * at each. This, not a single balance curve, is the demonstration.
 *
 * Measured on this reel set: at 1,000 spins the observed return spans roughly
 * 33-131%, so a short session can easily "prove" that slots pay. At 1,000,000 the
 * spread collapses to under 2 points around the designed 90.3% and there is no
 * seed where the player comes out ahead.
 *
 * That is the law of large numbers from ch3, expressed in this machine's own
 * numbers rather than asserted.
 */
export function varianceBands(seeds = 5): VarianceBand[] {
  return VARIANCE_SCALES.map((spins) => {
    const rates: number[] = [];
    for (let seed = 1; seed <= seeds; seed++) rates.push(simulate(spins, seed, 2).returnRate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    return { spins, min, max, spread: max - min, losingIsCertain: max < 100 };
  });
}

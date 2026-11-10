// Illustrative tide + slipway model for the launch-conditions cluster.
//
// Heights are metres above mean sea level. The tide is a plain harmonic model (12h25 cycle, anchored to a
// Portsmouth high water, Lepe ~65 min later) and the slipway is an EXAMPLE 1:10 ramp, so every number here is a
// guide, not a tide table. The same assumptions feed the verdict, the tide chart and the cross-section so they
// can never disagree.
export const TIDE = {
  REF_HW: Date.parse('2026-11-04T06:17:00Z') + 65 * 60000,
  CYCLE: 745 * 60000,
  AMP: 2.0,      // half the tidal range (HW +2.0 m, LW -2.0 m, illustrative)
  TOE: 0.4,      // height of the ramp end (toe)
  NEED: 0.6,     // water needed over the toe to float a boat off
  GRADIENT: 0.1, // 1:10
  RAMP_TOP: 3.3, // height of the top of the ramp
} as const;

/** Tide height in metres above mean sea level at time t (ms). */
export const heightAt = (t: number) => TIDE.AMP * Math.cos((2 * Math.PI * (t - TIDE.REF_HW)) / TIDE.CYCLE);

/** Depth of water over the ramp end. Negative means the end of the ramp is dry. */
export const depthOverToe = (t: number) => heightAt(t) - TIDE.TOE;

export const usable = (t: number) => depthOverToe(t) >= TIDE.NEED;

/** Contiguous usable spans overlapping [from, to]. */
export function usableSpans(from: number, to: number, stepMin = 5): [number, number][] {
  const spans: [number, number][] = [];
  let start: number | null = null;
  const step = stepMin * 60000;
  for (let t = from; t <= to; t += step) {
    if (usable(t)) { if (start === null) start = t; }
    else if (start !== null) { spans.push([start, t]); start = null; }
  }
  if (start !== null) spans.push([start, to]);
  return spans;
}

/** Next time the usable/unusable state flips after t (within 14 h), or null. */
export function nextFlip(t: number): number | null {
  const now = usable(t);
  for (let k = 1; k <= 14 * 12; k++) {
    const x = t + k * 5 * 60000;
    if (usable(x) !== now) return x;
  }
  return null;
}

export function nextHighLow(t: number) {
  const phase = (((t - TIDE.REF_HW) % TIDE.CYCLE) + TIDE.CYCLE) % TIDE.CYCLE;
  const toHigh = (TIDE.CYCLE - phase) % TIDE.CYCLE;
  const toLow = (TIDE.CYCLE / 2 - phase + TIDE.CYCLE) % TIDE.CYCLE;
  return { rising: phase > TIDE.CYCLE / 2, nextHigh: t + toHigh, nextLow: t + toLow };
}

/** Ground height at distance x metres along the section (x = 0 is the top of the ramp). */
export function groundAt(x: number): number {
  const rampLen = (TIDE.RAMP_TOP - TIDE.TOE) / TIDE.GRADIENT;
  if (x <= 0) return TIDE.RAMP_TOP;
  if (x <= rampLen) return TIDE.RAMP_TOP - TIDE.GRADIENT * x;
  return TIDE.TOE - (x - rampLen) / 15; // the seabed beyond the ramp falls away at about 1:15
}
export const rampLength = (TIDE.RAMP_TOP - TIDE.TOE) / TIDE.GRADIENT;

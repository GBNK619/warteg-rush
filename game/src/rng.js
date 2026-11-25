// rng.js — a tiny seeded random generator for Warteg Rush.
// mulberry32: one 32-bit state word, fast and good enough for dealing orders.
// The same seed always deals the same day, which is what makes the
// ?shot= screenshot scenes repeatable frame for frame.

export function createRng(seed) {
  let state = (seed >>> 0) || 1;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one item from a list with the given generator. */
export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

/** An integer from min to max, both included. */
export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

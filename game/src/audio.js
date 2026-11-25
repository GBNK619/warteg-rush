// audio.js — tiny WebAudio bleeps for Warteg Rush, all synthesised in code.
// The context is created lazily on the first user gesture (browsers refuse
// one before that), and every call is guarded: in a headless load, or a
// browser without WebAudio, the game simply stays silent and never throws.

let context = null;
let muted = false;

function ensureContext() {
  if (context !== null) return context;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  } catch (err) {
    context = null;
  }
  return context;
}

/** Call from any click or key press so later bleeps are allowed to sound. */
export function unlockAudio() {
  const ctx = ensureContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

/** One short sine/triangle blip; when `slide` is set the pitch glides to it. */
function blip(freq, seconds, type, volume, slide) {
  if (muted) return;
  const ctx = ensureContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, now + seconds);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + seconds + 0.02);
  } catch (err) {
    /* silence is always safe */
  }
}

/** A soft pop when an ingredient lands on the plate. */
export function soundPop() {
  blip(520, 0.07, 'triangle', 0.12, 760);
}

/** The bright two-note ding of a dish served. */
export function soundServe() {
  blip(880, 0.09, 'sine', 0.16);
  setTimeout(() => blip(1318, 0.14, 'sine', 0.16), 70);
}

/** A low buzz when the wrong ingredient goes on the plate. */
export function soundError() {
  blip(160, 0.18, 'sawtooth', 0.1, 110);
}

/** A dull thud when a customer walks away angry. */
export function soundAngry() {
  blip(220, 0.22, 'square', 0.08, 90);
}

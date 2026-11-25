// main.js — boots Warteg Rush: reads ?seed= and ?shot= from the address,
// wires input, runs the day loop and speaks the sound events the rules
// produce. With ?shot= the staged scene is drawn frozen and never advances,
// so a screenshot of it is the same frame every time.

import { attachInput } from './input.js';
import { draw } from './render.js';
import { stageShot } from './shots.js';
import { soundAngry, soundError, soundPop, soundServe } from './audio.js';
import {
  EVENT_ANGRY, EVENT_ERROR, EVENT_OVER, EVENT_POP, EVENT_SERVE, createGame, update,
} from './state.js';

const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam > 0 ? seedParam : (Date.now() % 90000) + 1;
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');
const state = createGame(seed);

if (shot) stageShot(shot, state);
attachInput(canvas, state);

/** Turn the events the rules raised since the last frame into sound + text. */
function speakEvents() {
  const events = state.events;
  if (events === 0) return;
  state.events = 0;
  if (events & EVENT_POP) soundPop();
  if (events & EVENT_ERROR) soundError();
  if (events & EVENT_SERVE) soundServe();
  if (events & EVENT_ANGRY) soundAngry();
  if (status && state.flash) status.textContent = state.flash;
  if (events & EVENT_OVER && status) {
    status.textContent = `Day over. Final score ${state.score}. ${state.served} dishes served.`;
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (!shot) {
    update(state, dt);
    speakEvents();
  }
  draw(ctx, state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

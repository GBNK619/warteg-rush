// input.js — mouse and keyboard for Warteg Rush. The mouse can do
// everything: click an order card to select it, a counter station to add
// that ingredient, a ready plate on the pass to serve it. The keyboard
// mirrors it: 1–8 pick a station, Tab/Q/E change the selected order,
// Enter serves, Esc pauses, M mutes.

import { INGREDIENTS } from './menu.js';
import { orderBox, passPlateBox, stationBox } from './render.js';
import { toggleMute, unlockAudio } from './audio.js';
import {
  SCREEN_PLAY, SCREEN_TITLE, addIngredient, cycleOrder, selectOrder, serveReady, startDay,
} from './state.js';

function inside(x, y, b) {
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

/** Convert a mouse event to the game's fixed 1280x720 coordinates. */
function toView(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 1280,
    y: ((event.clientY - rect.top) / rect.height) * 720,
  };
}

export function attachInput(canvas, state) {
  canvas.addEventListener('click', (event) => {
    unlockAudio();
    if (state.screen !== SCREEN_PLAY) {
      startDay(state);
      return;
    }
    if (state.paused) return;
    const { x, y } = toView(canvas, event);
    for (let i = 0; i < state.orders.length; i += 1) {
      if (inside(x, y, orderBox(i))) { selectOrder(state, i); return; }
    }
    for (let i = 0; i < Math.min(4, state.pass.length); i += 1) {
      if (inside(x, y, passPlateBox(i))) { serveReady(state, state.pass[i].orderId); return; }
    }
    for (let i = 0; i < INGREDIENTS.length; i += 1) {
      if (inside(x, y, stationBox(i))) { addIngredient(state, INGREDIENTS[i].name); return; }
    }
  });

  window.addEventListener('keydown', (event) => {
    unlockAudio();
    if (state.screen !== SCREEN_PLAY) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        startDay(state);
      }
      return;
    }
    if (event.key === 'Escape') {
      state.paused = !state.paused;
      return;
    }
    if (event.key === 'm' || event.key === 'M') {
      toggleMute();
      return;
    }
    if (state.paused) return;
    if (event.key === 'Tab') {
      event.preventDefault();
      cycleOrder(state, event.shiftKey ? -1 : 1);
    } else if (event.key === 'q' || event.key === 'Q') {
      cycleOrder(state, -1);
    } else if (event.key === 'e' || event.key === 'E') {
      cycleOrder(state, 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      serveReady(state, null);
    } else if (event.key >= '1' && event.key <= '8') {
      addIngredient(state, INGREDIENTS[Number(event.key) - 1].name);
    }
  });
}

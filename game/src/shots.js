// shots.js — the frozen scenes behind ?shot=start|play|end&seed=N.
// Each scene is staged from the game's own rules with the seeded day, so
// the frame is a real moment of Warteg Rush and the same seed always
// stages the same frame: the play scene is played forward by hand (one
// dish finished to the pass, one served for points, one half-built),
// never drawn specially for the camera.

import {
  SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, addIngredient, selectOrder, serveReady, startDay, update,
} from './state.js';

/** Build one order's whole recipe on its plate so it lands on the pass. */
function cookOrder(state, index) {
  selectOrder(state, index);
  const order = state.orders[index];
  for (const step of order.dish.steps) addIngredient(state, step);
}

/**
 * Stage the named scene into `state`. Anything but play/end is the title.
 * The play scene shows the full checklist of a working kitchen: an order
 * board with three orders, the ingredient counter, one dish mid-assembly
 * on the plate, the day timer running, and one ready plate on the pass.
 */
export function stageShot(name, state) {
  if (name === 'end') {
    startDay(state);
    state.screen = SCREEN_OVER;
    state.score = 1240;
    state.best = 1240;
    state.served = 9;
    state.lost = 2;
    state.timeLeft = 0;
    return;
  }
  if (name !== 'play') {
    state.screen = SCREEN_TITLE;
    return;
  }
  startDay(state);
  // First order: cooked through, so its plate waits on the pass.
  cookOrder(state, 0);
  // Second order: cooked and served, so the score and combo are real.
  cookOrder(state, 1);
  serveReady(state, state.orders[1].id);
  // Let the replacement customer walk in, then set the clock mid-rush.
  update(state, 0.9);
  state.timeLeft = 57;
  // The order now selected is caught mid-assembly: two steps on the plate.
  const current = state.orders[state.selected];
  addIngredient(state, current.dish.steps[0]);
  addIngredient(state, current.dish.steps[1]);
  state.flash = '';
  state.flashTime = 0;
  state.events = 0;
  state.screen = SCREEN_PLAY;
}

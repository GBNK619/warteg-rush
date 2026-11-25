// state.js — the rules of Warteg Rush: the day clock, the order board, the
// plate being built, the pass of ready dishes, scoring and the rush ramp.
// No drawing and no DOM here; render.js reads this state, input.js calls the
// action functions, and shots.js stages frozen scenes from the same pieces.

import { CUSTOMERS, DISHES } from './menu.js';
import { createRng, pick } from './rng.js';

export const DAY_SECONDS = 90;
export const MAX_ORDERS = 3;
export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

// Events the last action or update produced, so main.js can play sounds and
// update the screen-reader status line without state.js touching the DOM.
export const EVENT_NONE = 0;
export const EVENT_POP = 1;
export const EVENT_ERROR = 2;
export const EVENT_SERVE = 4;
export const EVENT_ANGRY = 8;
export const EVENT_OVER = 16;

/** Patience a fresh order starts with; it shrinks as the day wears on. */
function startingPatience(state) {
  const progress = 1 - state.timeLeft / DAY_SECONDS;
  return 46 - progress * 22; // 46s early in the day, 24s near closing
}

/** Deal one fresh order onto the board. */
function dealOrder(state) {
  const progress = 1 - state.timeLeft / DAY_SECONDS;
  // Early orders are the short recipes; the long ones join as the rush builds.
  const pool = progress < 0.25
    ? DISHES.filter((d) => d.steps.length <= 4)
    : DISHES;
  const dish = pick(state.rng, pool);
  const patience = startingPatience(state);
  state.orders.push({
    id: state.nextOrderId,
    customer: pick(state.rng, CUSTOMERS),
    dish,
    patience,
    patienceMax: patience,
    built: [], // ingredients already on this order's plate, in recipe order
  });
  state.nextOrderId += 1;
}

export function createGame(seed) {
  const state = {
    rng: createRng(seed),
    screen: SCREEN_TITLE,
    paused: false,
    timeLeft: DAY_SECONDS,
    score: 0,
    best: 0,
    combo: 0,
    served: 0,
    lost: 0,
    orders: [],
    selected: 0,
    pass: [], // ready dishes: { orderId, dish }
    nextOrderId: 1,
    spawnIn: 0, // seconds until a replacement order walks in
    flash: '', // a short banner message ("+240!", "Wrong ingredient!")
    flashTime: 0,
    events: EVENT_NONE,
  };
  return state;
}

/** Start (or restart) the day: a fresh board of three orders, clock full. */
export function startDay(state) {
  state.screen = SCREEN_PLAY;
  state.paused = false;
  state.timeLeft = DAY_SECONDS;
  state.score = 0;
  state.combo = 0;
  state.served = 0;
  state.lost = 0;
  state.orders = [];
  state.selected = 0;
  state.pass = [];
  state.spawnIn = 0;
  state.flash = '';
  state.flashTime = 0;
  for (let i = 0; i < MAX_ORDERS; i += 1) dealOrder(state);
}

/** The combo multiplier: grows by one every 3 combo, capped at x5. */
export function multiplier(state) {
  return Math.min(5, 1 + Math.floor(state.combo / 3));
}

export function selectedOrder(state) {
  if (state.orders.length === 0) return null;
  const index = Math.min(state.selected, state.orders.length - 1);
  return state.orders[index];
}

export function selectOrder(state, index) {
  if (index >= 0 && index < state.orders.length) state.selected = index;
}

export function cycleOrder(state, step) {
  if (state.orders.length === 0) return;
  const n = state.orders.length;
  state.selected = (((state.selected + step) % n) + n) % n;
}

function removeOrder(state, order) {
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.pass = state.pass.filter((p) => p.orderId !== order.id);
  if (state.selected >= state.orders.length) {
    state.selected = Math.max(0, state.orders.length - 1);
  }
  state.spawnIn = Math.max(state.spawnIn, 0.8);
}

/**
 * Put one ingredient on the selected order's plate. It must be the next step
 * of the recipe: a correct pick lands on the plate, a wrong one clears the
 * plate, resets the combo and costs two seconds of the customer's patience.
 * A completed plate moves to the pass as a ready dish.
 */
export function addIngredient(state, name) {
  if (state.screen !== SCREEN_PLAY || state.paused) return;
  const order = selectedOrder(state);
  if (!order) return;
  const nextStep = order.dish.steps[order.built.length];
  if (name !== nextStep) {
    order.built = [];
    state.combo = 0;
    order.patience = Math.max(1, order.patience - 2);
    state.flash = 'Wrong ingredient — plate cleared!';
    state.flashTime = 1.4;
    state.events |= EVENT_ERROR;
    return;
  }
  order.built.push(name);
  state.events |= EVENT_POP;
  if (order.built.length === order.dish.steps.length) {
    state.pass.push({ orderId: order.id, dish: order.dish });
    order.built = [];
    state.flash = `${order.dish.name} is ready on the pass!`;
    state.flashTime = 1.4;
  }
}

/**
 * Serve one ready dish from the pass (the oldest when `orderId` is null).
 * Points are 100 plus a patience bonus, times the combo multiplier.
 */
export function serveReady(state, orderId) {
  if (state.screen !== SCREEN_PLAY || state.paused) return;
  const index = orderId === null || orderId === undefined
    ? (state.pass.length > 0 ? 0 : -1)
    : state.pass.findIndex((p) => p.orderId === orderId);
  if (index < 0) return;
  const ready = state.pass[index];
  const order = state.orders.find((o) => o.id === ready.orderId);
  state.pass.splice(index, 1);
  if (!order) return; // the customer already left; the dish is binned
  const patienceBonus = Math.round((order.patience / order.patienceMax) * 100);
  const points = (100 + patienceBonus) * multiplier(state);
  state.score += points;
  state.combo += 1;
  state.served += 1;
  state.flash = `Served ${order.dish.name}  +${points}`;
  state.flashTime = 1.4;
  state.events |= EVENT_SERVE;
  removeOrder(state, order);
}

/** Advance the day by dt seconds: patience, the clock, new arrivals. */
export function update(state, dt) {
  if (state.screen !== SCREEN_PLAY || state.paused) return;
  state.timeLeft -= dt;
  if (state.flashTime > 0) state.flashTime -= dt;
  // Patience drains faster as closing time nears.
  const progress = 1 - Math.max(0, state.timeLeft) / DAY_SECONDS;
  const drain = 1 + progress * 0.9;
  const expired = [];
  for (const order of state.orders) {
    order.patience -= dt * drain;
    if (order.patience <= 0) expired.push(order);
  }
  for (const order of expired) {
    state.score = Math.max(0, state.score - 150);
    state.combo = 0;
    state.lost += 1;
    state.flash = `${order.customer} left angry!  -150`;
    state.flashTime = 1.6;
    state.events |= EVENT_ANGRY;
    removeOrder(state, order);
  }
  if (state.orders.length < MAX_ORDERS) {
    state.spawnIn -= dt;
    if (state.spawnIn <= 0) {
      dealOrder(state);
      state.spawnIn = 0.8;
    }
  }
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.screen = SCREEN_OVER;
    if (state.score > state.best) state.best = state.score;
    state.events |= EVENT_OVER;
  }
}

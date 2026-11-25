// render.js — every pixel of Warteg Rush: the kitchen, the order board, the
// counter of eight ingredient stations, the plate being built and the pass.
// Pure canvas 2D with flat colours and drawn shapes; the layout boxes are
// exported so input.js hit-tests against exactly what is drawn here.

import { INGREDIENTS, ingredientIndex } from './menu.js';
import {
  DAY_SECONDS, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, multiplier, selectedOrder,
} from './state.js';

export const VIEW_W = 1280;
export const VIEW_H = 720;

// --- layout boxes (single source of truth for drawing and clicking) ---
export function orderBox(i) {
  return { x: 20 + i * 420, y: 78, w: 400, h: 162 };
}
export function stationBox(i) {
  return { x: 20 + i * 156, y: 502, w: 148, h: 128 };
}
export const PLATE_AREA = { x: 20, y: 254, w: 676, h: 216 };
export const PASS_AREA = { x: 712, y: 254, w: 548, h: 216 };
export function passPlateBox(i) {
  return { x: PASS_AREA.x + 36 + i * 128, y: PASS_AREA.y + 58, w: 108, h: 108 };
}

const FONT = 'system-ui, "Segoe UI", Arial, sans-serif';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, colour, align = 'left', weight = 'bold') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- one ingredient, drawn three ways -------------------------------------

/** The blob of food an ingredient becomes once it is on a plate. */
function drawFoodOnPlate(ctx, name, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  if (name === 'Nasi') {
    ctx.fillStyle = '#f7f2df';
    ctx.beginPath(); ctx.ellipse(0, 4, 26, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -3, 18, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d9cdb0'; ctx.lineWidth = 2; ctx.stroke();
  } else if (name === 'Mie') {
    ctx.strokeStyle = '#f6cd45'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let k = -1; k <= 1; k += 1) {
      ctx.beginPath();
      ctx.moveTo(-24, k * 8);
      ctx.bezierCurveTo(-10, k * 8 - 9, 10, k * 8 + 9, 24, k * 8);
      ctx.stroke();
    }
  } else if (name === 'Telur') {
    ctx.fillStyle = '#fffdf4';
    ctx.beginPath(); ctx.ellipse(0, 0, 24, 16, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffb340';
    ctx.beginPath(); ctx.arc(2, -1, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffc978';
    ctx.beginPath(); ctx.arc(-1, -4, 3.5, 0, Math.PI * 2); ctx.fill();
  } else if (name === 'Ayam') {
    ctx.fillStyle = '#c07a2e';
    ctx.beginPath(); ctx.ellipse(-2, 0, 22, 14, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f3e2c6';
    ctx.beginPath(); ctx.arc(16, 9, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(21, 13, 4, 0, Math.PI * 2); ctx.fill();
  } else if (name === 'Bakso') {
    ctx.fillStyle = '#9c6a45';
    for (const [bx, by] of [[-13, 3], [2, -7], [13, 6]]) {
      ctx.beginPath(); ctx.arc(bx, by, 10, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#b98a5f';
    ctx.beginPath(); ctx.arc(-15, 0, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -10, 3.5, 0, Math.PI * 2); ctx.fill();
  } else if (name === 'Sayur') {
    ctx.fillStyle = '#5cbf60';
    for (const rot of [-0.6, 0, 0.6]) {
      ctx.save(); ctx.rotate(rot);
      ctx.beginPath(); ctx.ellipse(0, -6, 8, 17, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = '#357a38'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, -16); ctx.stroke();
  } else if (name === 'Sambal') {
    ctx.fillStyle = '#e04a35';
    ctx.beginPath(); ctx.ellipse(0, 5, 17, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -2, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff7a5c';
    ctx.beginPath(); ctx.arc(-3, -5, 3, 0, Math.PI * 2); ctx.fill();
  } else { // Kerupuk
    ctx.fillStyle = '#f3e2c6';
    ctx.beginPath(); ctx.arc(0, 0, 21, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#cdb08a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.strokeStyle = '#e2cba2'; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.restore();
}

/** The pan of one ingredient on the counter. */
function drawStation(ctx, ing, i) {
  const b = stationBox(i);
  ctx.fillStyle = '#5d4037';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
  ctx.fillStyle = '#3e2723';
  roundRect(ctx, b.x + 8, b.y + 8, b.w - 16, 62, 10); ctx.fill();
  ctx.fillStyle = ing.counter;
  ctx.beginPath(); ctx.ellipse(b.x + b.w / 2, b.y + 40, 52, 22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = ing.rim; ctx.lineWidth = 3; ctx.stroke();
  drawFoodOnPlate(ctx, ing.name, b.x + b.w / 2, b.y + 38, 0.62);
  text(ctx, ing.name, b.x + b.w / 2, b.y + 88, 21, '#ffe9c9', 'center');
  // the number key that picks this station
  ctx.fillStyle = '#ffb340';
  ctx.beginPath(); ctx.arc(b.x + 20, b.y + 106, 13, 0, Math.PI * 2); ctx.fill();
  text(ctx, String(i + 1), b.x + 20, b.y + 107, 16, '#3e2723', 'center');
}

// --- the pieces of the play screen ----------------------------------------

function drawHud(ctx, state) {
  ctx.fillStyle = '#2e1a12';
  ctx.fillRect(0, 0, VIEW_W, 60);
  text(ctx, `SCORE  ${state.score}`, 20, 31, 26, '#ffe9c9');
  const combo = state.combo;
  text(ctx, combo > 0 ? `COMBO x${multiplier(state)}  (streak ${combo})` : 'COMBO x1', 470, 31, 22, '#ffb340');
  // the day timer, big and centre-right; it turns red near closing
  const secs = Math.ceil(state.timeLeft);
  const label = `DAY  ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  ctx.fillStyle = state.timeLeft <= 15 ? '#a82618' : '#4e342e';
  roundRect(ctx, 800, 8, 220, 44, 10); ctx.fill();
  text(ctx, label, 910, 31, 30, '#ffffff', 'center');
  text(ctx, `BEST  ${state.best}`, 1260, 31, 20, '#cbbfa3', 'right');
}

function drawOrderCard(ctx, state, order, i) {
  const b = orderBox(i);
  const isSelected = i === state.selected;
  ctx.fillStyle = isSelected ? '#fff6e0' : '#efe3cb';
  roundRect(ctx, b.x, b.y, b.w, b.h, 14); ctx.fill();
  ctx.lineWidth = isSelected ? 5 : 2;
  ctx.strokeStyle = isSelected ? '#ffb340' : '#b8a67e';
  roundRect(ctx, b.x, b.y, b.w, b.h, 14); ctx.stroke();
  text(ctx, order.customer, b.x + 16, b.y + 22, 17, '#8d6e63');
  if (isSelected) {
    ctx.fillStyle = '#ffb340';
    roundRect(ctx, b.x + b.w - 118, b.y + 8, 104, 26, 8); ctx.fill();
    text(ctx, 'SELECTED', b.x + b.w - 66, b.y + 22, 14, '#3e2723', 'center');
  }
  text(ctx, order.dish.name, b.x + 16, b.y + 50, 25, '#3e2723');
  text(ctx, order.dish.tag, b.x + 16, b.y + 74, 14, '#8d6e63', 'left', 'normal');
  // recipe chips, in order; built steps are ticked dark, the next one ringed
  const chipW = 68; const chipH = 30; const gap = 6;
  for (let s = 0; s < order.dish.steps.length; s += 1) {
    const name = order.dish.steps[s];
    const ing = INGREDIENTS[ingredientIndex(name)];
    const cx = b.x + 16 + s * (chipW + gap);
    const cy = b.y + 92;
    const done = s < order.built.length;
    const isNext = s === order.built.length;
    ctx.fillStyle = done ? '#357a38' : ing.counter;
    roundRect(ctx, cx, cy, chipW, chipH, 8); ctx.fill();
    if (isNext) { ctx.lineWidth = 3; ctx.strokeStyle = '#d63c2a'; roundRect(ctx, cx, cy, chipW, chipH, 8); ctx.stroke(); }
    text(ctx, done ? `${name} ✓` : name, cx + chipW / 2, cy + chipH / 2 + 1, 13.5, done ? '#ffffff' : '#3e2723', 'center');
  }
  // patience bar
  const frac = Math.max(0, order.patience / order.patienceMax);
  const barY = b.y + 134;
  ctx.fillStyle = '#d8c9a8';
  roundRect(ctx, b.x + 16, barY, b.w - 32, 14, 7); ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#4caf50' : frac > 0.25 ? '#f2c230' : '#d63c2a';
  if (frac > 0.01) { roundRect(ctx, b.x + 16, barY, (b.w - 32) * frac, 14, 7); ctx.fill(); }
  text(ctx, 'patience', b.x + b.w - 16, barY - 12, 12, '#8d6e63', 'right', 'normal');
}

function drawPlate(ctx, state) {
  const a = PLATE_AREA;
  ctx.fillStyle = '#4e342e';
  roundRect(ctx, a.x, a.y, a.w, a.h, 14); ctx.fill();
  const order = selectedOrder(state);
  text(ctx, order ? `PLATE — building ${order.dish.name} for ${order.customer}` : 'PLATE', a.x + 18, a.y + 24, 20, '#ffe9c9');
  // the plate itself
  const cx = a.x + 150; const cy = a.y + 128;
  ctx.fillStyle = '#eceff1';
  ctx.beginPath(); ctx.ellipse(cx, cy, 108, 62, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 4; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx, cy, 78, 42, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 2; ctx.stroke();
  if (order) {
    const slots = [[0, 0], [-42, -8], [42, -8], [-24, 16], [26, 16]];
    for (let s = 0; s < order.built.length; s += 1) {
      const [dx, dy] = slots[s % slots.length];
      drawFoodOnPlate(ctx, order.built[s], cx + dx, cy + dy, 0.8);
    }
    if (order.built.length === 0) {
      text(ctx, 'empty plate', cx, cy, 16, '#90a4ae', 'center', 'normal');
    }
    // progress line: the recipe with the next step called out
    const px = a.x + 300;
    text(ctx, 'Recipe, in order:', px, a.y + 66, 16, '#cbbfa3');
    for (let s = 0; s < order.dish.steps.length; s += 1) {
      const done = s < order.built.length;
      const isNext = s === order.built.length;
      const label = `${s + 1}. ${order.dish.steps[s]}${done ? '  ✓' : isNext ? '  ← next' : ''}`;
      text(ctx, label, px, a.y + 96 + s * 24, 17, done ? '#8bc34a' : isNext ? '#ffb340' : '#e8dcc0');
    }
  } else {
    text(ctx, 'no order selected', cx, cy, 16, '#90a4ae', 'center', 'normal');
  }
}

function drawPass(ctx, state) {
  const a = PASS_AREA;
  ctx.fillStyle = '#37474f';
  roundRect(ctx, a.x, a.y, a.w, a.h, 14); ctx.fill();
  text(ctx, 'THE PASS — ready to serve', a.x + 18, a.y + 24, 20, '#ffe9c9');
  if (state.pass.length === 0) {
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = '#78909c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(a.x + 90, a.y + 112, 54, 32, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'finished dishes land here — click one to serve it', a.x + 168, a.y + 112, 16, '#b0bec5', 'left', 'normal');
    return;
  }
  for (let i = 0; i < Math.min(4, state.pass.length); i += 1) {
    const ready = state.pass[i];
    const b = passPlateBox(i);
    ctx.fillStyle = '#eceff1';
    ctx.beginPath(); ctx.ellipse(b.x + b.w / 2, b.y + 44, 52, 32, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffb340'; ctx.lineWidth = 4; ctx.stroke();
    const steps = ready.dish.steps;
    drawFoodOnPlate(ctx, steps[0], b.x + b.w / 2 - 14, b.y + 40, 0.55);
    drawFoodOnPlate(ctx, steps[steps.length - 1], b.x + b.w / 2 + 16, b.y + 46, 0.55);
    ctx.fillStyle = '#4caf50';
    roundRect(ctx, b.x + 8, b.y + 80, b.w - 16, 24, 8); ctx.fill();
    text(ctx, 'READY', b.x + b.w / 2, b.y + 93, 14, '#ffffff', 'center');
    text(ctx, ready.dish.name, b.x + b.w / 2, b.y + 122, 13.5, '#ffe9c9', 'center');
  }
  text(ctx, 'click a ready plate (or press Enter) to serve', a.x + 18, a.y + 200, 14, '#b0bec5', 'left', 'normal');
}

function drawPlay(ctx, state) {
  // kitchen wall and counter top
  ctx.fillStyle = '#6d4c41'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#795548'; ctx.fillRect(0, 60, VIEW_W, 428);
  ctx.fillStyle = '#4e342e'; ctx.fillRect(0, 488, VIEW_W, VIEW_H - 488);
  drawHud(ctx, state);
  for (let i = 0; i < state.orders.length; i += 1) drawOrderCard(ctx, state, state.orders[i], i);
  if (state.orders.length === 0) {
    text(ctx, 'No customers right now…', 24, 150, 22, '#ffe9c9');
  }
  drawPlate(ctx, state);
  drawPass(ctx, state);
  text(ctx, 'INGREDIENT COUNTER — click a station, or press its number', 20, 494, 15, '#cbbfa3');
  for (let i = 0; i < INGREDIENTS.length; i += 1) drawStation(ctx, INGREDIENTS[i], i);
  text(ctx, 'Keys: 1–8 ingredient · Tab/Q/E change order · Enter serve · Esc pause · M mute', 20, 688, 17, '#e8dcc0');
  text(ctx, 'Serve fast for the patience bonus. A wrong ingredient clears the plate!', 20, 710, 15, '#cbbfa3', 'left', 'normal');
  if (state.flashTime > 0 && state.flash) {
    ctx.fillStyle = 'rgba(38, 24, 16, 0.88)';
    const w = 560;
    roundRect(ctx, (VIEW_W - w) / 2, 640, w, 36, 12); ctx.fill();
    text(ctx, state.flash, VIEW_W / 2, 659, 19, '#ffb340', 'center');
  }
  if (state.paused) {
    ctx.fillStyle = 'rgba(20, 12, 8, 0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text(ctx, 'PAUSED', VIEW_W / 2, VIEW_H / 2 - 16, 54, '#ffe9c9', 'center');
    text(ctx, 'Press Esc to keep cooking', VIEW_W / 2, VIEW_H / 2 + 34, 20, '#cbbfa3', 'center', 'normal');
  }
}

// --- the title and game-over screens ---------------------------------------

function drawKitchenBackdrop(ctx) {
  ctx.fillStyle = '#6d4c41'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#4e342e'; ctx.fillRect(0, 560, VIEW_W, 160);
  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    const x = 90 + i * 138;
    ctx.fillStyle = '#3e2723';
    roundRect(ctx, x, 578, 118, 96, 10); ctx.fill();
    ctx.fillStyle = INGREDIENTS[i].counter;
    ctx.beginPath(); ctx.ellipse(x + 59, 606, 44, 18, 0, 0, Math.PI * 2); ctx.fill();
    drawFoodOnPlate(ctx, INGREDIENTS[i].name, x + 59, 604, 0.55);
    text(ctx, INGREDIENTS[i].name, x + 59, 650, 15, '#ffe9c9', 'center');
  }
}

function drawTitle(ctx, state) {
  drawKitchenBackdrop(ctx);
  ctx.fillStyle = '#ffb340';
  roundRect(ctx, 290, 92, 700, 128, 20); ctx.fill();
  ctx.fillStyle = '#3e2723';
  roundRect(ctx, 302, 104, 676, 104, 14); ctx.fill();
  text(ctx, 'WARTEG RUSH', VIEW_W / 2, 157, 64, '#ffb340', 'center');
  text(ctx, 'Ninety seconds. Three hungry customers. One very small kitchen.', VIEW_W / 2, 258, 22, '#ffe9c9', 'center', 'normal');
  text(ctx, 'Read the order board, tap the ingredients in recipe order,', VIEW_W / 2, 316, 20, '#e8dcc0', 'center', 'normal');
  text(ctx, 'and serve each plate before its patience bar runs dry.', VIEW_W / 2, 344, 20, '#e8dcc0', 'center', 'normal');
  ctx.fillStyle = '#4caf50';
  roundRect(ctx, 440, 396, 400, 62, 14); ctx.fill();
  text(ctx, 'CLICK OR PRESS ENTER TO START', VIEW_W / 2, 428, 21, '#ffffff', 'center');
  if (state.best > 0) text(ctx, `Best score so far: ${state.best}`, VIEW_W / 2, 500, 19, '#ffb340', 'center');
  text(ctx, 'Mouse does everything · keys 1–8 pick ingredients · Enter serves', VIEW_W / 2, 536, 15, '#cbbfa3', 'center', 'normal');
}

function drawOver(ctx, state) {
  drawKitchenBackdrop(ctx);
  ctx.fillStyle = 'rgba(30, 18, 12, 0.92)';
  roundRect(ctx, 340, 110, 600, 330, 20); ctx.fill();
  ctx.strokeStyle = '#ffb340'; ctx.lineWidth = 3;
  roundRect(ctx, 340, 110, 600, 330, 20); ctx.stroke();
  text(ctx, 'DAY OVER!', VIEW_W / 2, 168, 46, '#ffb340', 'center');
  text(ctx, `Final score   ${state.score}`, VIEW_W / 2, 232, 30, '#ffe9c9', 'center');
  text(ctx, `Dishes served: ${state.served}      Customers lost: ${state.lost}`, VIEW_W / 2, 282, 20, '#e8dcc0', 'center', 'normal');
  text(ctx, `Best score: ${state.best}`, VIEW_W / 2, 322, 20, '#ffb340', 'center');
  ctx.fillStyle = '#4caf50';
  roundRect(ctx, 470, 356, 340, 54, 12); ctx.fill();
  text(ctx, 'CLICK OR PRESS ENTER TO PLAY AGAIN', VIEW_W / 2, 384, 16, '#ffffff', 'center');
}

/** Draw the whole scene for the state's current screen. */
export function draw(ctx, state) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (state.screen === SCREEN_TITLE) drawTitle(ctx, state);
  else if (state.screen === SCREEN_OVER) drawOver(ctx, state);
  else drawPlay(ctx, state);
}

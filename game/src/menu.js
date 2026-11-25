// menu.js — the Warteg Rush menu: the eight counter ingredients and the
// dishes customers order. Everything on the counter is one of these eight;
// every recipe is an ordered run of 3 to 5 of them, built in order.

// Each ingredient: its counter colour, the darker shade for its rim, and the
// colour its blob takes when it lands on a plate.
export const INGREDIENTS = [
  { name: 'Nasi',    counter: '#f5efe0', rim: '#cbbfa3', plate: '#f7f2df' },
  { name: 'Mie',     counter: '#f2c230', rim: '#c79a1b', plate: '#f6cd45' },
  { name: 'Telur',   counter: '#ffb340', rim: '#d18a1d', plate: '#ffb340' },
  { name: 'Ayam',    counter: '#b5651d', rim: '#8a4a12', plate: '#c07a2e' },
  { name: 'Bakso',   counter: '#8d5a3b', rim: '#6b4127', plate: '#9c6a45' },
  { name: 'Sayur',   counter: '#4caf50', rim: '#357a38', plate: '#5cbf60' },
  { name: 'Sambal',  counter: '#d63c2a', rim: '#a82618', plate: '#e04a35' },
  { name: 'Kerupuk', counter: '#f0dcc0', rim: '#cdb08a', plate: '#f3e2c6' },
];

export function ingredientIndex(name) {
  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    if (INGREDIENTS[i].name === name) return i;
  }
  return -1;
}

// The dishes of the house. `steps` is the recipe, in the order the cook must
// add the ingredients to the plate. `price` flavour text is shown on the
// order card so the board reads like a real warteg menu.
export const DISHES = [
  { name: 'Nasi Goreng',      steps: ['Nasi', 'Telur', 'Ayam', 'Sambal'],            tag: 'fried rice, house style' },
  { name: 'Mie Goreng',       steps: ['Mie', 'Telur', 'Sayur', 'Bakso'],             tag: 'fried noodles' },
  { name: 'Sate Ayam',        steps: ['Ayam', 'Sambal', 'Kerupuk'],                  tag: 'chicken satay skewers' },
  { name: 'Bakso Kuah',       steps: ['Bakso', 'Mie', 'Sayur'],                      tag: 'meatball soup' },
  { name: 'Nasi Campur',      steps: ['Nasi', 'Ayam', 'Telur', 'Sayur', 'Kerupuk'],  tag: 'mixed rice, a bit of all' },
  { name: 'Mie Bakso Spesial', steps: ['Mie', 'Bakso', 'Telur', 'Sambal'],           tag: 'special noodle meatball' },
];

// The regulars who queue at the stall.
export const CUSTOMERS = [
  'Bu Sari', 'Pak Budi', 'Mbak Rina', 'Mas Andi', 'Bu Tini',
  'Pak Joko', 'Mbak Dewi', 'Mas Rudi', 'Bu Ani', 'Pak Dedi',
  'Mbak Fitri', 'Mas Bambang',
];

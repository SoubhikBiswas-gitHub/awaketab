import { load } from './ProLib.mjs';
const { Component } = load('Main.dc.html');
for (const L of ['phone','small','landscape','tablet','tabletLandscape','desktop','xl']) { const v = new Component({ layout: L, status: 'awake' }).renderVals(); console.log(L, v.W, v.H, 'scale', v.scale, 'kicker px', (12 * v.scale).toFixed(1), 'meta px', (15 * v.scale).toFixed(1)); }

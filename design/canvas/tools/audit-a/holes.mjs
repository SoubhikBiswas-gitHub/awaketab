import { load, missing } from './ProLib.mjs';
const [file, props] = process.argv.slice(2);
const { Component, markup } = load(file);
const c = new Component(JSON.parse(props || '{}'));
if (c.componentDidMount) try { c.componentDidMount(); } catch (e) { console.log('didMount err', e.message); }
const v = c.renderVals();
console.log('missing', missing(markup, v));
process.exit(0);

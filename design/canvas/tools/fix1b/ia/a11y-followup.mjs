import { readFileSync, writeFileSync } from 'node:fs';
const p = new URL('../../directions/project/A11y.dc.html', import.meta.url);
let s = readFileSync(p, 'utf8');
const rep = (x, y) => { const n = s.split(x).length - 1; if (n !== 1) throw new Error(n + ' x ' + x.slice(0, 80)); s = s.replace(x, y); };
rep('min-width: 24px; height: 24px; padding: 0 6px; box-sizing: border-box; border-radius: 8px; border: 1px solid {{t.line2}}; background: {{t.raised}};', 'min-width: 24px; height: 24px; padding: 0 8px; box-sizing: border-box; border-radius: 8px; border: 1px solid {{t.line2}}; background: {{t.raised}};');
// O-65: tabs first in the DOM on phones, last on desktop (DOM order follows visual order)
const a = s.indexOf('      <div style="grid-area: tabs;');
const b = s.indexOf('      <div style="grid-area: pill;');
const blk = s.slice(a, b);
s = s.slice(0, a) + '      <sc-if value="{{tabsTop}}" hint-placeholder-val="{{true}}">\n' + blk + '      </sc-if>\n\n' + s.slice(b);
rep('        </sc-if>\n      </div>\n    </main>', '        </sc-if>\n      </div>\n\n      <sc-if value="{{tabsEnd}}" hint-placeholder-val="{{false}}">\n' + blk + '      </sc-if>\n    </main>');
// O-64 shipped cadence + O-08 60 s grace
const a2 = s.indexOf('// Scripted announcement timeline'); const b2 = s.indexOf('];', a2) + 2;
s = s.slice(0, a2) + `// Scripted announcement timeline: "Until 10:30 PM" started 9:43 PM (47 min). Shipped cadence (O-64): multiples of
// 5 minutes left (45, 40 … 5), then 1 minute, then Time's up with the 60 s grace (O-08), then complete.
const SR = [
  ['9:43:00 PM', 'Starting…', 'Pill', 'starting', 2820],
  ['9:43:01 PM', 'Screen awake', 'Pill', 'awake', 2819],
  ['9:45:00 PM', '45 minutes left', 'Timer', 'awake', 2700],
  ['9:50:00 PM', '40 minutes left', 'Timer', 'awake', 2400],
  ['9:55:00 PM', '35 minutes left', 'Timer', 'awake', 2100],
  ['10:00:00 PM', '30 minutes left', 'Timer', 'awake', 1800],
  ['10:05:00 PM', '25 minutes left', 'Timer', 'awake', 1500],
  ['10:10:00 PM', '20 minutes left', 'Timer', 'awake', 1200],
  ['10:15:00 PM', '15 minutes left', 'Timer', 'awake', 900],
  ['10:20:00 PM', '10 minutes left', 'Timer', 'awake', 600],
  ['10:25:00 PM', '5 minutes left', 'Timer', 'awake', 300],
  ['10:29:00 PM', '1 minute left', 'Timer', 'awake', 60],
  ['10:30:00 PM', "Time's up. Keep going?", 'Prompt', 'timesup', 0],
  ['10:31:00 PM', 'Session complete', 'Timer', 'ended', 0],
  ['10:31:00 PM', 'Ready', 'Pill', 'ended', 0]
];` + s.slice(b2);
rep('>Stops in 30 s</span>', '>Stops in 60 s</span>');
rep("liveText: srE[2] === 'Timer' ? srE[1] : '(empty until the next five-minute mark)',", "liveText: srE[2] === 'Timer' ? srE[1] : '(empty until the next multiple of 5 minutes left)',");
rep("'Cadence shown: every 5 min after start, as requested. Shipped code speaks on multiples of 5 min left (45, 40 … 5). Owner to pick one.'", "'Cadence (O-64, as shipped): the timer line speaks on multiples of 5 minutes left (45, 40 … 5), then at 1 minute; Time\\'s up and Session complete follow.'");
rep("'On desktop the clock face tabs sit last in the right column, so they come last in the markup too. Main renders them first; the desktop build must reorder them.'", "'On desktop the clock face tabs sit last in the right column, so they come last in the markup too (O-65). On phones they lead the column, first in both.'");
rep("if (ended) { kicker = 'Session complete'; metaA = 'ended at'; metaB = '10:30 PM'; }", "if (ended) { kicker = 'Session complete'; metaA = 'ended at'; metaB = '10:31 PM'; }");
rep("      W: (W + railW) + 'px', H: H + 'px', S, t, r, fz, f, navs, tabs, presets,", "      W: (W + railW) + 'px', H: H + 'px', S, t, r, fz, f, navs, tabs, presets, tabsTop: !desk, tabsEnd: desk,");
writeFileSync(p, s);
console.log('ok');

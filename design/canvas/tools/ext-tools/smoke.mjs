// Smoke test for Ext* and Embed* boards: every {{hole}} resolves across prop combos, handlers work, tags balance.
import { readFileSync, readdirSync } from 'node:fs';
const dir = '/home/user/awaketab/design/canvas/project/';
globalThis.window = { matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) };
Object.defineProperty(globalThis, 'navigator', { value: { clipboard: { writeText: () => Promise.resolve() } }, configurable: true });
class DCLogic { constructor(p) { this.props = p; } setState(u) { this.state = { ...this.state, ...(typeof u === 'function' ? u(this.state) : u) }; } }
const load = (f) => {
  const src = readFileSync(dir + f, 'utf8');
  const js = src.split('data-dc-script')[1].split("}'>")[1].split('</script>')[0];
  const Component = new Function('DCLogic', js + '\nreturn Component;')(DCLogic);
  const markup = src.split('<script type="text/x-dc"')[0];
  return { src, markup, Component };
};
const get = (v, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), v);
let bad = 0, checks = 0;

function holes(markup) {
  // Loop scopes: collect `as` names so item paths are checked per item.
  return [...new Set([...markup.matchAll(/\{\{\s*([\w.$]+)\s*\}\}/g)].map((m) => m[1]))];
}
function loops(markup) {
  const out = {};
  for (const m of markup.matchAll(/<sc-for list="\{\{\s*([\w.$]+)\s*\}\}" as="(\w+)"/g)) out[m[2]] = m[1];
  return out;
}
function check(file, v, markup, label) {
  // Scope-aware: scan tokens in order, pushing/popping sc-for scopes, and resolve each hole against every item.
  const re = /<sc-for list="\{\{\s*([\w.$]+)\s*\}\}" as="(\w+)"[^>]*>|<\/sc-for>|\{\{\s*([\w.$]+)\s*\}\}/g;
  const stack = [];
  const resolve = (scopes, path) => {
    const [root, ...rest] = path.split('.');
    for (let i = stack.length - 1; i >= 0; i--) if (stack[i].as === root) return scopes.map((sc) => (rest.length ? get(sc[root], rest.join('.')) : sc[root]));
    return scopes.map((sc) => get(sc, path));
  };
  let scopes = [v];
  const scopeHistory = [];
  for (const m of markup.matchAll(re)) {
    if (m[1]) {
      const lists = resolve(scopes, m[1]);
      const next = [];
      scopes.forEach((sc, i) => { for (const item of lists[i] || []) next.push({ ...sc, [m[2]]: item }); });
      scopeHistory.push(scopes);
      stack.push({ as: m[2] });
      scopes = next;
      continue;
    }
    if (m[0] === '</sc-for>') { stack.pop(); scopes = scopeHistory.pop(); continue; }
    const h = m[3];
    if (['true', 'false', '$index'].includes(h)) continue;
    checks++;
    for (const val of resolve(scopes, h)) if (val === undefined) { bad++; if (bad < 30) console.log('missing', file, label, h); break; }
  }
}
function balance(file, markup) {
  const body = markup.split('</helmet>')[1];
  for (const tag of ['sc-if', 'sc-for', 'div', 'section', 'button', 'span', 'dc-import', 'ul', 'li', 'a', 'p', 'output', 'label', 'select', 'nav', 'main', 'header', 'figure', 'code', 'footer', 'svg', 'form']) {
    const open = (body.match(new RegExp('<' + tag + '[\\s>]', 'g')) || []).length;
    const close = (body.match(new RegExp('</' + tag + '>', 'g')) || []).length;
    if (open !== close) { bad++; console.log('unbalanced', file, tag, open, close); }
  }
  if (/<dc-import[^>]*\/>/.test(body)) { bad++; console.log('self-closed dc-import', file); }
  if (/—/.test(body.replace(/Paused — tab hidden|Blocked — here's the fix|Paste this where the button should appear — inside|awaketab\.com — never|Paused — tap to resume/g, ''))) console.log('note: em dash in', file);
}
const ev = { preventDefault() {}, target: { value: 'none' } };

// ExtPopup
{
  const { markup, Component } = load('ExtPopup.dc.html');
  balance('ExtPopup', markup);
  for (const status of ['ready', 'awake', 'system', 'dim', 'ended']) for (const theme of ['light', 'dark', 'auto']) {
    const c = new Component({ status, theme });
    check('ExtPopup', c.renderVals(), markup, status + '/' + theme);
    c.state.panel = 'until'; check('ExtPopup', c.renderVals(), markup, status + '/until');
  }
  const c = new Component({ status: 'ready', theme: 'dark' });
  let v = c.renderVals();
  console.log('popup ready:', v.statusLabel, '|', v.startLabel, '|', v.caption, '|', v.levelHelp);
  v.levels[1].pick(); v = c.renderVals(); console.log('level→system:', v.levelHelp);
  v.chips[1].pick(); c.state.mode = 'held'; c.tick(); v = c.renderVals();
  console.log('chip 30 min:', v.statusLabel, v.bigA + v.bigB, v.caption, '| caveat', v.showCaveat, '| extend', v.showExtend);
  v.extendOpts[0].pick(); v = c.renderVals(); console.log('+15:', v.bigA + v.bigB, v.caption);
  v.levels[0].pick(); v = c.renderVals(); console.log('level→screen while held:', v.statusLabel);
  v.stop(); v = c.renderVals(); console.log('stop:', v.statusLabel, v.startLabel);
  v.openUntil(); v = c.renderVals(); v.untilMore(); v = c.renderVals(); console.log('until panel:', v.draftTime, '|', v.draftSummary);
  v.startUntil(ev); c.state.mode = 'held'; v = c.renderVals(); console.log('until start:', v.statusLabel, v.caption, v.untilChip);
  c.state.left = 1; c.tick(); v = c.renderVals(); console.log('ended:', v.statusLabel, v.caption, v.meta, v.showExtend);
  v.extendOpts[2].pick(); c.state.mode = 'held'; v = c.renderVals(); console.log('extend from ended:', v.statusLabel, v.bigA + v.bigB);
  c.state.level = 'system'; c.state.preset = 'pinf'; c.state.total = 0; c.state.el = 5; v = c.renderVals(); console.log('system no limit:', v.statusLabel, v.caption, v.bigA + v.bigB);
}
// ExtOptions
{
  const { markup, Component } = load('ExtOptions.dc.html');
  balance('ExtOptions', markup);
  for (const theme of ['light', 'dark', 'auto']) for (const pro of [true, false]) {
    const c = new Component({ theme, pro });
    check('ExtOptions', c.renderVals(), markup, theme + '/' + pro);
  }
  const c = new Component({ theme: 'dark', pro: true });
  let v = c.renderVals();
  console.log('options H:', v.H, '| schedules:', v.schedules.map((s) => s.days + ' ' + s.range + ' ' + s.level).join(' ; '));
  console.log('week Tue blocks:', v.week[1].blocks.length, 'Wed:', v.week[2].blocks.map((b) => b.left + '+' + b.width).join(','));
  v.themes[3].pick(); v = c.renderVals(); console.log('oled ground:', v.t.ground, v.savedText, v.savedOp);
  v.dayToggles[0].pick(); v = c.renderVals(); v.steppers[1].more(); v = c.renderVals(); v.draftLevels[1].pick(); v = c.renderVals();
  console.log('draft:', v.dayToggles.map((d) => d.sel).join(''), v.steppers.map((p) => p.value).join(' to '));
  v.addSchedule(); v = c.renderVals(); console.log('added:', v.schedules.length, v.schedules[2].days, v.schedules[2].range, v.schedules[2].level, 'H', v.H);
  v.addSchedule(); v = c.renderVals(); console.log('empty days error:', v.schedError);
  v.schedules[0].remove(); v = c.renderVals(); console.log('removed →', v.schedules.length);
  v.typeHost({ target: { value: 'not a host' } }); v = c.renderVals(); v.addSite(); v = c.renderVals(); console.log('bad host:', v.siteError);
  v.typeHost({ target: { value: 'https://www.Recipes.example.org/x' } }); v = c.renderVals(); v.pickDur({ target: { value: '60' } }); v = c.renderVals(); v.addSite(); v = c.renderVals();
  console.log('sites:', v.sites.map((s) => s.host + ' · ' + s.duration).join(' ; '));
  v.toggleNotify(); v = c.renderVals(); console.log('notify off:', v.notifyOn, v.soundHelpColor);
  v.removeLicence(); v = c.renderVals(); console.log('licence removed → form:', v.licForm, 'locked', v.locked);
  v.typeKey({ target: { value: 'short' } }); v = c.renderVals(); v.activate(); v = c.renderVals(); console.log('short key:', v.licError);
  v.typeKey({ target: { value: 'ATK-1234-5678-9ABC-DEF0' } }); v = c.renderVals(); v.activate(); v = c.renderVals(); console.log('checking:', v.licStatus);
  clearTimeout(c.check);
  v.nav[4].pick(); v = c.renderVals(); console.log('nav:', v.navY);
}
// ExtBadges
{
  const { markup, Component } = load('ExtBadges.dc.html');
  balance('ExtBadges', markup);
  for (const theme of ['light', 'dark', 'auto']) check('ExtBadges', new Component({ theme }).renderVals(), markup, theme);
}
// EmbedWidget
{
  const { markup, Component } = load('EmbedWidget.dc.html');
  balance('EmbedWidget', markup);
  for (const theme of ['auto', 'light', 'dark', 'oled']) for (const size of ['compact', 'full']) for (const mode of ['cook', 'standard', 'clock', 'minimal']) for (const running of [true, false]) {
    const c = new Component({ theme, size, mode, running });
    check('EmbedWidget', c.renderVals(), markup, [theme, size, mode, running].join('/'));
  }
  const c = new Component({ size: 'full', mode: 'cook', theme: 'dark', running: false });
  let v = c.renderVals();
  console.log('widget ready:', v.statusLabel, v.digits, '|', v.hintOrMeta);
  v.quick[0].add(); c.state.lock = 'held'; v = c.renderVals(); console.log('timer added (starts session):', v.statusLabel, v.timers.map((k) => k.name + ' ' + k.left).join(', '));
  c.tick(); c.tick(); v = c.renderVals(); console.log('ticking:', v.digits, v.hintOrMeta);
  v.tapDigits(); v = c.renderVals(); console.log('paused:', v.statusLabel, v.hintOrMeta, v.pausedAria);
  v.tapDigits(); v = c.renderVals(); console.log('resumed:', v.hintOrMeta);
  v.quick[1].add(); v = c.renderVals(); v.quick[2].add(); v = c.renderVals(); console.log('3 timers canAdd:', v.canAdd);
  c.state.timers[0].endsAt = Date.now() - 1; c.tick(); v = c.renderVals(); console.log('done:', v.timers[0].left, '| announce:', v.announce);
  v.timers[0].remove(); v = c.renderVals(); console.log('after remove:', v.timers.length);
  v.stop(); v = c.renderVals(); console.log('stopped:', v.statusLabel);
  const k = new Component({ size: 'compact', mode: 'clock', theme: 'light', running: false }); v = k.renderVals(); console.log('clock compact:', v.digits, v.W, v.H);
}
// EmbedShowcase
{
  const { markup, Component } = load('EmbedShowcase.dc.html');
  balance('EmbedShowcase', markup);
  for (const theme of ['light', 'dark', 'auto']) check('EmbedShowcase', new Component({ theme }).renderVals(), markup, theme);
  const c = new Component({ theme: 'dark' });
  let v = c.renderVals();
  v.groups[0].opts[2].pick(); v = c.renderVals(); v.groups[1].opts[1].pick(); v = c.renderVals(); v.groups[2].opts[1].pick(); v = c.renderVals();
  console.log('snippet:', v.snipHead + v.attrs.map((a) => a.pre + a.name + '=' + a.value).join('') + v.snipTail, '| full', v.isFull);
  v.copy(); v = c.renderVals(); console.log('copy:', v.copyLabel); clearTimeout(c.cp);
}
// Wrappers reference existing children
for (const f of readdirSync(dir).filter((f) => /^(Ext|Embed)/.test(f))) {
  const src = readFileSync(dir + f, 'utf8');
  for (const m of src.matchAll(/<dc-import name="(\w+)"/g)) if (!readdirSync(dir).includes(m[1] + '.dc.html')) { bad++; console.log('missing child', f, m[1]); }
}
console.log('holes checked:', checks, 'missing:', bad);
process.exit(bad ? 1 : 0);

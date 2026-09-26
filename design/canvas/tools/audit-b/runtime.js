// In-page runtime for .dc.html boards: expands holes, sc-if, sc-for, dc-import (recursively),
// runs Component lifecycle (constructor, componentDidMount, setState re-render), applies helmets.
// Exposes window.__dc = { mount(name, props), rerender(), missing:Set, errors:[] }.
(function () {
  const files = window.__FILES;
  const parsed = {};
  const missing = new Set();
  const errors = [];
  class DCLogic {
    constructor(p) { this.props = p || {}; this.state = {}; }
    setState(u) { this.state = Object.assign({}, this.state, typeof u === 'function' ? u(this.state, this.props) : u); schedule(); }
    forceUpdate() { schedule(); }
  }
  window.DCLogic = DCLogic;
  function parse(name) {
    if (parsed[name]) return parsed[name];
    const src = files[name];
    if (!src) throw new Error('no file ' + name);
    const helmet = src.split('<helmet>')[1].split('</helmet>')[0];
    const root = src.split('</helmet>')[1].split('</x-dc>')[0];
    const scr = src.split('data-dc-script')[1];
    const js = scr.slice(scr.indexOf('>', scr.indexOf("'", scr.indexOf("data-props='") + 12) ) + 1).split('</script>')[0];
    let Component;
    try { Component = new Function('DCLogic', js + '\nreturn Component;')(DCLogic); } catch (e) { errors.push(name + ': ' + e.message); Component = class extends DCLogic { renderVals() { return {}; } }; }
    const tpl = document.createElement('template');
    tpl.innerHTML = root;
    parsed[name] = { helmet, tpl, Component };
    return parsed[name];
  }
  const get = (scope, path) => {
    path = path.trim();
    if (path === 'true') return true; if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), scope);
  };
  const whole = (v) => { const m = /^\s*\{\{\s*([\w.$]+)\s*\}\}\s*$/.exec(v || ''); return m ? m[1] : null; };
  const interp = (str, scope, ctx) => str.replace(/\{\{\s*([\w.$]+)\s*\}\}/g, (_, p) => { const v = get(scope, p); if (v === undefined) missing.add(ctx + ':' + p); return v == null ? '' : String(v); });
  const heads = new Set();
  const inst = {};
  let pendingMount = [];
  function renderFile(name, props, key) {
    const { helmet, tpl, Component } = parse(name);
    if (!heads.has(name)) { heads.add(name); document.head.insertAdjacentHTML('beforeend', helmet); }
    let c = inst[key];
    if (!c || c.__name !== name) {
      try { c = new Component(props); } catch (e) { errors.push(name + ' ctor: ' + e.message); c = new DCLogic(props); c.renderVals = () => ({}); }
      c.__name = name; inst[key] = c; pendingMount.push(c);
    } else c.props = props;
    let vals = {};
    try { vals = c.renderVals() || {}; } catch (e) { errors.push(name + ' renderVals: ' + e.message); }
    const frag = document.createDocumentFragment();
    walk(tpl.content, vals, frag, name, key, { n: 0 });
    return frag;
  }
  function walk(node, scope, out, name, key, counter) {
    for (const ch of node.childNodes) {
      if (ch.nodeType === 3) { out.appendChild(document.createTextNode(interp(ch.textContent, scope, name))); continue; }
      if (ch.nodeType !== 1) continue;
      const tag = ch.localName;
      if (tag === 'sc-if') {
        const p = whole(ch.getAttribute('value'));
        const v = p ? get(scope, p) : undefined;
        if (v === undefined) missing.add(name + ':if ' + ch.getAttribute('value'));
        if (v) walk(ch, scope, out, name, key, counter);
        continue;
      }
      if (tag === 'sc-for') {
        const p = whole(ch.getAttribute('list'));
        const list = p ? get(scope, p) : undefined;
        if (list === undefined) missing.add(name + ':for ' + ch.getAttribute('list'));
        const as = ch.getAttribute('as');
        (list || []).forEach((item, i) => walk(ch, Object.assign({}, scope, { [as]: item, $index: i }), out, name, key, counter));
        continue;
      }
      if (tag === 'dc-import') {
        const pr = {};
        for (const at of [...ch.attributes]) {
          if (at.name === 'name' || at.name.startsWith('hint-')) continue;
          const k = at.name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          const wh = whole(at.value);
          pr[k] = wh ? get(scope, wh) : interp(at.value, scope, name);
        }
        const hs = (ch.getAttribute('hint-size') || '').split(',');
        const box = document.createElement('div');
        box.setAttribute('data-dc-import', ch.getAttribute('name'));
        box.style.cssText = 'width:' + hs[0] + ';height:' + hs[1];
        box.appendChild(renderFile(ch.getAttribute('name'), pr, key + '/' + (counter.n++)));
        out.appendChild(box);
        continue;
      }
      const el = ch.cloneNode(false);
      for (const at of [...el.attributes]) {
        const wh = whole(at.value);
        if (/^on[a-z]+$/.test(at.name) && wh) {
          el.removeAttribute(at.name);
          const fn = get(scope, wh);
          if (typeof fn === 'function') el.addEventListener(at.name.slice(2), (e) => { try { fn(e); } catch (err) { errors.push('handler ' + wh + ': ' + err.message); } });
          else missing.add(name + ':handler ' + wh);
          continue;
        }
        if (at.value.includes('{{')) {
          const v = wh ? get(scope, wh) : interp(at.value, scope, name);
          if (wh && v === undefined) missing.add(name + ':' + wh);
          if (v === false || v == null) el.removeAttribute(at.name); else el.setAttribute(at.name, v === true ? 'true' : String(v));
        }
      }
      if (tag === 'template') walk(ch.content, scope, el.content, name, key, counter); else walk(ch, scope, el, name, key, counter);
      out.appendChild(el);
    }
  }
  let top = null, topProps = null, scheduled = false, app = null;
  function schedule() { if (scheduled || !top || window.__freeze) return; scheduled = true; queueMicrotask(() => { scheduled = false; rerender(); }); }
  function rerender() {
    const frag = renderFile(top, topProps, 'root');
    app.replaceChildren(frag);
    const pm = pendingMount; pendingMount = [];
    for (const c of pm) if (c.componentDidMount) { try { c.componentDidMount(); } catch (e) { errors.push(c.__name + ' didMount: ' + e.message); } }
  }
  window.__dc = {
    mount(name, props) { app = document.getElementById('app'); top = name; topProps = props; rerender(); },
    rerender, missing, errors, inst
  };
})();

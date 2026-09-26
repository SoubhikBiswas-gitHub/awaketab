// Generates GuideOn / GuideVs / GuideLearn / GuideGuides (fix batch 1b rewrite).
// Shared primitives come verbatim from fix1b/PRIMITIVES.md; copy is page-specific per docs/06 §2.4–2.7,
// the fact-check of 26 Sep 2026 and D-R12 (never "battery saver blocks the wake lock").
// Run: node GuideGen.mjs   (writes only the four Guide*.dc.html base files)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const dir = new URL('./project/', import.meta.url);
const sizesFile = new URL('./GuideSizes.json', import.meta.url);
const SIZES = existsSync(sizesFile) ? JSON.parse(readFileSync(sizesFile, 'utf8')) : {};
const J = (x) => JSON.stringify(x);

const MONO = "'Geist Mono', ui-monospace, monospace";
// P-KICKER (verbatim when extra is empty)
const kicker = (txt, extra = '') => `<span style="font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}${extra}">${txt}</span>`;
const h2 = (id, txt) => `<h2 id="${id}" style="margin: 0; font-size: {{fs.h2}}; line-height: {{fs.h2lh}}; font-weight: 600; letter-spacing: -0.01em; color: {{t.ink}}; text-wrap: balance">${txt}</h2>`;
const h3 = (txt) => `<h3 style="margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; color: {{t.ink}}; text-wrap: pretty">${txt}</h3>`;
const para = (txt, color = 'ink2') => `<p style="margin: 0; font-size: 16px; line-height: 26px; color: {{t.${color}}}; text-wrap: pretty">${txt}</p>`;
// P-CODE (inline code, verbatim)
const code = (txt) => `<code style="font-family: 'Geist Mono', ui-monospace, monospace; font-size: 14px; padding: 0 4px; border-radius: 4px; background: {{t.sunken}}; color: {{t.ink}}; overflow-wrap: anywhere">${txt}</code>`;
const strong = (txt) => `<strong style="color: {{t.ink}}; font-weight: 600">${txt}</strong>`;
const link = (txt, href = '#') => `<a href="${href}" style="color: {{p.link}}">${txt}</a>`;
const section = (id, inner, gap = 16) => `      <section id="s-${id}" aria-labelledby="h-${id}" style="display: flex; flex-direction: column; gap: ${gap}px; min-width: 0">\n${inner}\n      </section>`;
const srOnly = 'position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%)';

const HELMET = `<helmet>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@200;300;400;500;600;700&amp;family=Geist+Mono:wght@200;300;400;500&amp;family=Space+Grotesk:wght@500;600;700&amp;display=swap" rel="stylesheet">
<style>
:root{--ease:cubic-bezier(.22,1,.36,1)}
body{margin:0;font-family:Geist,system-ui,sans-serif}
button{font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background-color .45s var(--ease),color .45s var(--ease),border-color .45s var(--ease),box-shadow .45s var(--ease),transform .18s var(--ease)}
button:active{transform:scale(.96)}
button:focus-visible,a:focus-visible,[tabindex]:focus-visible{outline:2px solid #5BE0E8;outline-offset:3px}
.at-root{transition:background .9s var(--ease),color .9s var(--ease)}
.at-in{animation:at-in .7s var(--ease) both}
.at-rise{animation:at-in .9s var(--ease) both;animation-delay:.08s}
.at-slide{transition:transform .6s var(--ease),background-color .5s var(--ease),border-color .5s var(--ease),color .5s var(--ease)}
.at-arc{transition:stroke-dasharray 1s linear,stroke .6s var(--ease),stroke-opacity .6s var(--ease)}
.at-lin{transition:transform 1s linear,opacity 1s linear}
.at-halo{transform-box:fill-box;transform-origin:center;animation:at-halo 3.4s var(--ease) infinite}
.at-sweep{animation:at-spin 16s linear infinite}
.at-aura{animation:at-aura 26s ease-in-out infinite alternate}
.at-prose a{text-decoration-thickness:1px;text-underline-offset:4px;transition:text-decoration-thickness .3s var(--ease)}
.at-prose a:hover{text-decoration-thickness:2px}
.at-chev{transition:transform .6s var(--ease)}
.at-code{scrollbar-width:thin;-webkit-overflow-scrolling:touch}
.at-bar{transition:transform .9s var(--ease)}
@keyframes at-in{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}
@keyframes at-halo{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.8);opacity:0}}
@keyframes at-spin{to{transform:rotate(360deg)}}
@keyframes at-aura{0%{transform:translate(-6%,-3%) scale(1)}100%{transform:translate(6%,4%) scale(1.12)}}
@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
</style>
</helmet>`;

// P-HEADER + desktop nav + P-THEME (verbatim)
const HEADER = `  <header style="position: relative; height: {{hdr.h}}; flex-shrink: 0; box-sizing: border-box; padding: {{hdr.pad}}; display: flex; align-items: center; justify-content: space-between; gap: 12px">
    <a href="#" aria-label="AwakeTab home" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: {{t.ink}}; font-weight: 600; font-size: 17px; line-height: 24px; letter-spacing: -0.01em; min-height: 44px">
      <svg width="26" height="26" viewBox="0 0 48 48" aria-hidden="true" style="overflow: visible"><path d="M32.8 11.4A16 16 0 1 1 15.2 11.4" fill="none" stroke="{{t.ink}}" stroke-width="4.5" stroke-linecap="round"></path><circle cx="24" cy="9" r="7.5" fill="{{tone}}" opacity="0.28"></circle><circle cx="24" cy="9" r="4.2" fill="{{tone}}" style="transition: fill .6s"></circle></svg>
      AwakeTab
    </a>
    <sc-if value="{{isDesk}}" hint-placeholder-val="{{false}}">
      <nav aria-label="Main" style="display: flex; gap: 32px; font-size: 15px; line-height: 22px; font-weight: 500">
        <sc-for list="{{nav}}" as="n" hint-placeholder-count="4">
          <a href="#" aria-current="{{n.cur}}" style="color: {{n.ink}}; font-weight: {{n.weight}}; text-decoration: none; display: flex; align-items: center; gap: 8px; min-height: 44px"><sc-if value="{{n.on}}" hint-placeholder-val="{{false}}"><span aria-hidden="true" style="width: 6px; height: 6px; border-radius: 999px; background: {{p.lamp}}"></span></sc-if>{{n.label}}</a>
        </sc-for>
      </nav>
    </sc-if>
    <div role="radiogroup" aria-label="Theme" style="position: relative; display: grid; grid-template-columns: repeat(3, 44px); padding: 4px; border-radius: 999px; background: {{t.surface}}; border: 1px solid {{t.line}}">
      <div aria-hidden="true" class="at-slide" style="position: absolute; left: 4px; top: 4px; width: 44px; height: 44px; border-radius: 999px; background: {{t.raised}}; transform: translateX({{themeX}})"></div>
      <button role="radio" aria-checked="{{themeLight}}" aria-label="Light" title="Light" onClick="{{setLight}}" style="position: relative; height: 44px; padding: 0; border: 0; background: transparent; border-radius: 999px; color: {{themeLightInk}}; display: grid; place-items: center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"></path></svg></button>
      <button role="radio" aria-checked="{{themeDark}}" aria-label="Dark" title="Dark" onClick="{{setDark}}" style="position: relative; height: 44px; padding: 0; border: 0; background: transparent; border-radius: 999px; color: {{themeDarkInk}}; display: grid; place-items: center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"></path></svg></button>
      <button role="radio" aria-checked="{{themeAuto}}" aria-label="Auto, follows your system" title="Auto: follows your system" onClick="{{setAuto}}" style="position: relative; height: 44px; padding: 0; border: 0; background: transparent; border-radius: 999px; color: {{themeAutoInk}}; display: grid; place-items: center"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"></circle><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"></path></svg></button>
    </div>
  </header>`;

const VERIFIED_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="{{p.lamp}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M8 12.5l2.7 2.7L16.5 9.5"></path></svg>`;
const INFO_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="{{t.ink2}}" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" style="margin-top: 2px"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v6M12 7.5v.01"></path></svg>`;
const LAMP_ICON = `<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" style="margin-top: 2px"><path d="M32.8 11.4A16 16 0 1 1 15.2 11.4" fill="none" stroke="{{p.lamp}}" stroke-width="4.5" stroke-linecap="round"></path><circle cx="24" cy="9" r="4.6" fill="{{p.lamp}}"></circle></svg>`;

// P-NOTE: honest limit (or other note). A card: r16, padding cardPad, 20 px icon column, gap 12.
const note = (label, body, icon = INFO_ICON, extraAttr = '') => `        <div role="note"${extraAttr} style="display: grid; grid-template-columns: 20px minmax(0, 1fr); column-gap: 12px; row-gap: 4px; padding: {{cardPad}}; border-radius: 16px; background: {{t.surface}}; border: 1px solid {{t.line}}">
          ${icon}
          <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0">
            ${kicker(label)}
            <p style="margin: 0; font-size: 16px; line-height: 26px; color: {{t.ink}}; text-wrap: pretty">${body}</p>
          </div>
        </div>`;
const limitSection = (id, body) => section(id, `        <h2 id="h-${id}" style="${srOnly}; margin: 0; font-size: 16px; font-weight: 600">Honest limit</h2>
${note('Honest limit', body)}`);

function headBlock({ hub, hubHref, crumb, h1, lede, stale = false, extra = '' }) {
  return `    <div style="grid-area: head; display: flex; flex-direction: column; gap: 20px; min-width: 0">
      <nav aria-label="Breadcrumb">
        <ol style="margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; align-items: center; column-gap: 8px; font-size: 14px; line-height: 20px; color: {{t.muted}}">
          <li style="display: flex; align-items: center; gap: 8px"><a href="#" style="color: {{t.ink2}}; text-decoration: none; min-height: 44px; display: flex; align-items: center">AwakeTab</a><span aria-hidden="true">›</span></li>
          <li style="display: flex; align-items: center; gap: 8px"><a href="${hubHref}" style="color: {{t.ink2}}; text-decoration: none; min-height: 44px; display: flex; align-items: center">${hub}</a><sc-if value="{{showCrumb}}" hint-placeholder-val="{{true}}"><span aria-hidden="true">›</span></sc-if></li>
          <sc-if value="{{showCrumb}}" hint-placeholder-val="{{true}}">
            <li aria-current="page" style="min-height: 44px; display: flex; align-items: center; color: {{t.muted}}">${crumb}</li>
          </sc-if>
        </ol>
      </nav>
      <h1 style="margin: 0; font-size: {{fs.h1}}; line-height: {{fs.h1lh}}; font-weight: 600; letter-spacing: -0.02em; color: {{t.ink}}; text-wrap: balance">${h1}</h1>
      <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px">
        <span style="display: inline-flex; align-items: center; gap: 8px; min-height: 32px; padding: 4px 12px 4px 8px; box-sizing: border-box; border-radius: 999px; border: 1px solid {{t.line2}}; font-size: 14px; line-height: 20px; font-weight: 500; color: {{t.ink2}}">
          ${VERIFIED_ICON}
          {{verifiedLabel}}
        </span>
${stale ? `        <sc-if value="{{isStale}}" hint-placeholder-val="{{false}}">
          <span class="at-in" style="display: inline-flex; align-items: center; gap: 8px; min-height: 32px; padding: 4px 12px 4px 8px; box-sizing: border-box; border-radius: 999px; background: {{warnSoft}}; border: 1px solid {{warnLine}}; font-size: 14px; line-height: 20px; font-weight: 500; color: {{t.ink}}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="{{warn}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6"></path><path d="M20 4v4.5h-4.5"></path></svg>
            Sources checked over 6 months ago. Re-checking now.
          </span>
        </sc-if>
` : ''}        <span style="font-size: 14px; line-height: 20px; color: {{t.muted}}">By Soubhik Biswas</span>
      </div>
      <p style="margin: 0; font-size: 18px; line-height: 28px; color: {{t.ink}}; text-wrap: pretty">${lede}</p>
${extra}    </div>`;
}

// P-PILL-M (verbatim)
const PILL = `<output aria-live="polite" class="at-slide" style="display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 16px 0 12px; box-sizing: border-box; border-radius: 999px; background: {{toneSoft}}; border: 1px solid {{toneLine}}; font-size: 15px; line-height: 22px; font-weight: 600; color: {{t.ink}}; white-space: nowrap">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style="overflow: visible; filter: drop-shadow(0 0 5px {{toneGlow}})"><path d="{{glyph}}" fill="{{glyphFill}}" stroke="{{tone}}" stroke-width="1.6" fill-rule="evenodd" stroke-linejoin="round"></path></svg>
            {{statusLabel}}
          </output>`;

// Embedded tool card (hero panel, r28).
function toolCard(area = 'tool') {
  return `    <section id="tool" aria-label="{{toolAria}}" style="grid-area: ${area}; position: relative; overflow: hidden; border-radius: 28px; background: {{t.surface}}; border: 1px solid {{cardLine}}; box-shadow: {{cardShadow}}; min-width: 0">
      <div aria-hidden="true" class="at-aura" style="position: absolute; left: -20%; top: -30%; width: 140%; height: 160%; background: radial-gradient(40% 45% at 30% 50%, {{aura}} 0%, transparent 70%); pointer-events: none"></div>
      <div style="{{cardGrid}}">
        <div style="grid-area: top; display: flex; align-items: center; justify-content: space-between; gap: 8px 12px; flex-wrap: wrap">
          ${PILL}
          ${kicker('{{cardKicker}}', '; white-space: nowrap')}
        </div>
        <div style="grid-area: clock; display: flex; align-items: center; justify-content: center; min-width: 0">
          <div style="position: relative; width: {{ringPx}}; height: {{ringPx}}; flex-shrink: 0">
            <sc-if value="{{live}}" hint-placeholder-val="{{false}}">
              <div aria-hidden="true" class="at-sweep" style="position: absolute; inset: 10%; border-radius: 50%; background: conic-gradient(from 0deg, transparent 0deg 240deg, {{toneFaint}} 360deg)"></div>
            </sc-if>
            <svg width="100%" height="100%" viewBox="0 0 240 240" aria-hidden="true" style="position: absolute; inset: 0; overflow: visible">
              <defs><filter id="toolGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"></feGaussianBlur></filter></defs>
              <circle cx="120" cy="120" r="100" fill="none" stroke="{{t.tick}}" stroke-width="5" stroke-dasharray="1.2 9.272"></circle>
              <circle cx="120" cy="120" r="110" fill="none" stroke="{{t.track}}" stroke-width="5"></circle>
              <g transform="rotate(-90 120 120)">
                <circle class="at-arc" cx="120" cy="120" r="110" fill="none" stroke="{{faceColor}}" stroke-opacity="{{glowOp}}" stroke-width="11" stroke-linecap="round" filter="url(#toolGlow)" style="stroke-dasharray: {{arcDash}}"></circle>
                <circle class="at-arc" cx="120" cy="120" r="110" fill="none" stroke="{{faceColor}}" stroke-opacity="{{arcOp}}" stroke-width="5" stroke-linecap="round" style="stroke-dasharray: {{arcDash}}"></circle>
              </g>
              <g class="at-lin" style="transform: rotate({{tipDeg}}); transform-origin: 120px 120px; opacity: {{tipOp}}">
                <circle class="at-halo" cx="120" cy="10" r="6" fill="{{faceColor}}"></circle>
                <circle cx="120" cy="10" r="4.5" fill="{{t.ink}}"></circle>
              </g>
            </svg>
            <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px">
              ${kicker('{{kicker}}')}
              <div role="timer" aria-label="{{timerAria}}" style="font-family: Geist, system-ui, sans-serif; font-weight: 300; font-size: {{digitSize}}; line-height: 1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: {{numColor}}; transition: color .6s">{{bigA}}<span style="color: {{t.muted}}">{{bigB}}</span></div>
              <div style="font-size: 14px; line-height: 20px; color: {{t.muted}}; white-space: nowrap">{{metaA}} <span style="color: {{t.ink}}; font-weight: 500">{{metaB}}</span></div>
            </div>
          </div>
        </div>
        <div style="grid-area: len; min-width: 0">
          <sc-if value="{{presetGrid}}" hint-placeholder-val="{{true}}">
            <div role="group" aria-label="Session length" style="display: grid; grid-template-columns: repeat(20, minmax(0, 1fr)); gap: 8px">
              <sc-for list="{{presets}}" as="c" hint-placeholder-count="7">
                <button aria-pressed="{{c.sel}}" aria-label="{{c.aria}}" onClick="{{c.pick}}" style="grid-column: {{c.span}}; height: 44px; padding: 0 4px; box-sizing: border-box; border-radius: 999px; border: 1px solid {{c.line}}; background: {{c.bg}}; font-size: 14px; line-height: 20px; font-weight: {{c.weight}}; color: {{c.color}}; white-space: nowrap">{{c.label}}</button>
              </sc-for>
              <a href="#" style="grid-column: span 5; height: 44px; padding: 0 4px; box-sizing: border-box; border-radius: 999px; border: 1px dashed {{t.line2}}; display: flex; align-items: center; justify-content: center; font-size: 14px; line-height: 20px; font-weight: 500; color: {{t.ink2}}; text-decoration: none; white-space: nowrap">Until…</a>
              <a href="#" style="grid-column: span 5; height: 44px; padding: 0 4px; box-sizing: border-box; border-radius: 999px; border: 1px dashed {{t.line2}}; display: flex; align-items: center; justify-content: center; font-size: 14px; line-height: 20px; font-weight: 500; color: {{t.ink2}}; text-decoration: none; white-space: nowrap">Custom…</a>
            </div>
          </sc-if>
          <sc-if value="{{presetBar}}" hint-placeholder-val="{{false}}">
          <div role="group" aria-label="Session length" style="position: relative; display: grid; grid-template-columns: repeat({{presetN}}, minmax(0, 1fr)); padding: 4px; border-radius: 999px; background: {{t.surface}}; border: 1px solid {{t.line}}">
            <div aria-hidden="true" class="at-slide" style="position: absolute; left: 4px; top: 4px; width: calc((100% - 8px) / {{presetN}}); height: 44px; box-sizing: border-box; border-radius: 999px; background: {{lampSoft}}; border: 1px solid {{lampLine}}; transform: translateX({{presetX}})"></div>
            <sc-for list="{{presets}}" as="c" hint-placeholder-count="7">
              <button aria-pressed="{{c.sel}}" aria-label="{{c.aria}}" onClick="{{c.pick}}" style="position: relative; height: 44px; padding: 0; border: 0; background: transparent; border-radius: 999px; font-size: {{presetFont}}; line-height: 20px; font-weight: {{c.weight}}; color: {{c.color}}; white-space: nowrap">{{c.label}}</button>
            </sc-for>
          </div>
          </sc-if>
        </div>
        <div style="grid-area: cta; min-width: 0">
          <sc-if value="{{isSetup}}" hint-placeholder-val="{{true}}">
            <button onClick="{{start}}" aria-label="{{primaryAria}}" style="width: 100%; height: 60px; padding: 0 16px; border-radius: 20px; border: 0; background: {{p.lampFill}}; color: {{p.lampInk}}; font-size: 17px; line-height: 24px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 10px 30px -8px {{lampGlow}}">
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path d="M32.8 11.4A16 16 0 1 1 15.2 11.4" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"></path><circle cx="24" cy="9" r="4.6" fill="currentColor"></circle></svg>
              {{primaryLabel}}
            </button>
          </sc-if>
          <sc-if value="{{isRunning}}" hint-placeholder-val="{{false}}">
            <div class="at-rise" style="display: grid; grid-template-columns: {{runCols}}; gap: 12px">
              <sc-if value="{{canExtend}}" hint-placeholder-val="{{true}}">
                <button onClick="{{extend}}" aria-label="Add 15 minutes" style="height: 60px; padding: 0 16px; border-radius: 20px; border: 1px solid {{t.line2}}; background: {{t.surface}}; font-size: 17px; line-height: 24px; font-weight: 600; color: {{t.ink}}">+15 min</button>
              </sc-if>
              <button onClick="{{stop}}" style="height: 60px; padding: 0 16px; border-radius: 20px; border: 0; background: {{t.primaryBg}}; font-size: 17px; line-height: 24px; font-weight: 600; color: {{t.primaryInk}}">Stop</button>
            </div>
          </sc-if>
        </div>
        <p style="grid-area: note; margin: 0; font-size: 14px; line-height: 20px; color: {{t.muted}}; text-align: {{noteAlign}}; text-wrap: pretty">{{note}}</p>
      </div>
    </section>`;
}

const TOC_ASIDE = `    <sc-if value="{{isDesk}}" hint-placeholder-val="{{false}}">
      <nav aria-label="On this page" style="grid-area: toc; align-self: start; position: sticky; top: 24px; display: flex; flex-direction: column; gap: 24px">
        <div style="display: flex; flex-direction: column; gap: 4px">
          ${kicker('On this page', '; padding-bottom: 8px')}
          <sc-for list="{{toc}}" as="c" hint-placeholder-count="5">
            <a href="{{c.href}}" onClick="{{c.pick}}" aria-current="{{c.current}}" style="display: flex; align-items: center; gap: 8px; min-height: 44px; font-size: 14px; line-height: 20px; font-weight: {{c.weight}}; color: {{c.ink}}; text-decoration: none">
              <span aria-hidden="true" class="at-slide" style="flex-shrink: 0; width: 6px; height: 6px; border-radius: 999px; background: {{c.dot}}"></span>
              {{c.label}}
            </a>
          </sc-for>
        </div>
        <a href="#tool" style="display: flex; flex-direction: column; gap: 8px; padding: 16px; border-radius: 16px; background: {{t.surface}}; border: 1px solid {{t.line}}; text-decoration: none; color: {{t.ink}}">
          <span style="display: flex; align-items: center; gap: 8px; font-size: 14px; line-height: 20px; font-weight: 600">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style="overflow: visible; filter: drop-shadow(0 0 4px {{toneGlow}})"><path d="{{glyph}}" fill="{{glyphFill}}" stroke="{{tone}}" stroke-width="1.6"></path></svg>
            {{statusLabel}}
          </span>
          <span style="font-family: Geist, system-ui, sans-serif; font-size: 24px; line-height: 32px; font-weight: 300; font-variant-numeric: tabular-nums; color: {{numColor}}">{{bigA}}{{bigB}}</span>
          <span style="font-size: 13px; line-height: 18px; color: {{t.muted}}">Back to the tool ↑</span>
        </a>
      </nav>
    </sc-if>`;

const AD_BOX = (w, h, label) => `<div style="width: ${w}; height: ${h}; max-width: 100%; box-sizing: border-box; border-radius: 12px; border: 1px solid {{t.line}}; background: repeating-linear-gradient(135deg, transparent 0 11px, {{p.hatch}} 11px 12px), {{p.adBg}}; display: grid; place-items: center">
          <span style="font-size: 13px; line-height: 18px; font-variant-numeric: tabular-nums; color: {{t.muted}}">${label}</span>
        </div>`;
const INLINE_AD = `      <aside aria-label="Advertisement" style="display: flex; flex-direction: column; align-items: center; gap: 8px">
        ${kicker('Advertisement')}
        ${AD_BOX('{{adW}}', '{{adH}}', '{{adSize}}')}
      </aside>`;
const RAIL = `    <sc-if value="{{isDesk}}" hint-placeholder-val="{{false}}">
      <aside aria-label="Advertisement" style="grid-area: rail; align-self: start; position: sticky; top: 24px; display: flex; flex-direction: column; gap: 8px">
        ${kicker('Advertisement')}
        ${AD_BOX('160px', '600px', '160 × 600')}
      </aside>
    </sc-if>`;

// FAQ: list rows (min 56, padding 16 0), chevron in a 44 box.
const FAQ = section('faq', `        ${h2('h-faq', 'Questions')}
        <div style="display: flex; flex-direction: column; border-top: 1px solid {{t.line}}">
          <sc-for list="{{faq}}" as="f" hint-placeholder-count="4">
            <div style="border-bottom: 1px solid {{t.line}}">
              <h3 style="margin: 0">
                <button id="{{f.qid}}" aria-expanded="{{f.open}}" aria-controls="{{f.aid}}" onClick="{{f.toggle}}" style="width: 100%; min-height: 56px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 0; box-sizing: border-box; border: 0; background: transparent; text-align: start; font-size: 16px; line-height: 24px; font-weight: 600; color: {{t.ink}}">
                  <span style="text-wrap: pretty">{{f.q}}</span>
                  <span aria-hidden="true" style="flex-shrink: 0; width: 44px; height: 44px; margin-block: -12px; display: grid; place-items: center; color: {{t.ink2}}">
                    <svg class="at-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="transform: rotate({{f.rot}})"><path d="M12 5v14M5 12h14"></path></svg>
                  </span>
                </button>
              </h3>
              <sc-if value="{{f.isOpen}}" hint-placeholder-val="{{false}}">
                <p id="{{f.aid}}" role="region" aria-labelledby="{{f.qid}}" class="at-in" style="margin: 0; padding: 0 48px 16px 0; font-size: 16px; line-height: 26px; color: {{t.ink2}}; text-wrap: pretty">{{f.a}}</p>
              </sc-if>
            </div>
          </sc-for>
        </div>`);

function related(start, links) {
  return `      <nav aria-label="Related" style="display: flex; flex-direction: column; gap: 12px">
        ${h2('h-related', 'Related')}
${start ? `        <a href="#tool" style="align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px; box-sizing: border-box; border-radius: 999px; background: {{lampSoft}}; border: 1px solid {{lampLine}}; color: {{t.ink}}; font-size: 15px; line-height: 22px; font-weight: 600; text-decoration: none">
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path d="M32.8 11.4A16 16 0 1 1 15.2 11.4" fill="none" stroke="{{p.lamp}}" stroke-width="5" stroke-linecap="round"></path><circle cx="24" cy="9" r="4.6" fill="{{p.lamp}}"></circle></svg>
          ${start}
        </a>
` : ''}        <div style="display: flex; flex-wrap: wrap; column-gap: 24px; row-gap: 0; font-size: 16px; line-height: 26px">
${links.map(([label, href = '#']) => `          <a href="${href}" style="min-height: 44px; display: inline-flex; align-items: center; color: {{p.link}}">${label}</a>`).join('\n')}
        </div>
      </nav>
      <div style="display: flex; align-items: center; gap: 16px; border-radius: 16px; padding: {{cardPad}}; background: {{t.surface}}; border: 1px solid {{t.line}}">
        <span aria-hidden="true" style="flex-shrink: 0; width: 48px; height: 48px; border-radius: 999px; background: {{lampSoft}}; border: 1px solid {{lampLine}}; display: grid; place-items: center; font-size: 15px; line-height: 22px; font-weight: 600; color: {{t.ink}}">SB</span>
        <div style="display: flex; flex-direction: column; gap: 4px">
          <span style="font-size: 16px; line-height: 24px; font-weight: 600; color: {{t.ink}}">Soubhik Biswas</span>
          <span style="font-size: 15px; line-height: 22px; color: {{t.ink2}}">Builds AwakeTab. <a href="#" style="color: {{p.link}}">About AwakeTab</a></span>
        </div>
      </div>`;
}

// P-FOOTER (verbatim) after a spacer.
const FOOTER = `  <div style="flex-grow: 1; min-height: 64px"></div>

  <footer style="border-top: 1px solid {{t.line}}; padding: {{foot.pad}}; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 24px">
    <p style="margin: 0; font-size: 13px; line-height: 18px; color: {{t.muted}}">No ads on the awake screen, now or later.</p>
    <nav aria-label="Footer" style="display: flex; flex-wrap: wrap; column-gap: 16px; font-size: 13px; line-height: 18px">
      <a href="#" style="min-height: 44px; display: inline-flex; align-items: center; color: {{t.ink2}}; text-decoration: none">Privacy</a>
      <a href="#" style="min-height: 44px; display: inline-flex; align-items: center; color: {{t.ink2}}; text-decoration: none">Terms</a>
      <a href="#" style="min-height: 44px; display: inline-flex; align-items: center; color: {{t.ink2}}; text-decoration: none">Changelog</a>
      <a href="#" style="min-height: 44px; display: inline-flex; align-items: center; color: {{t.ink2}}; text-decoration: none">About</a>
      <a href="#" style="min-height: 44px; display: inline-flex; align-items: center; color: {{t.ink2}}; text-decoration: none">Buy me a coffee</a>
    </nav>
  </footer>`;

// P-TAG tone variant (result badges). w.line is transparent for tone tags, line-strong for neutral ones.
const tag = (o) => `<span style="display: inline-flex; align-items: center; height: 24px; padding: 0 8px; box-sizing: border-box; border-radius: 999px; border: 1px solid {{${o}.line}}; background: {{${o}.soft}}; font-size: 12px; line-height: 16px; font-weight: 600; color: {{t.ink}}; white-space: nowrap">{{${o}.label}}</span>`;
// P-ROW (verbatim opening)
const ROW_OPEN = `<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 56px; padding: 16px 0; box-sizing: border-box; border-bottom: 1px solid {{t.line}}">`;
// Settings path chip (not a URL, so sans): padding 4 8, r8.
const pathChip = (hole) => `<span style="align-self: flex-start; max-width: 100%; box-sizing: border-box; font-size: 13px; line-height: 18px; font-weight: 500; padding: 4px 8px; border-radius: 8px; background: {{t.sunken}}; border: 1px solid {{t.line}}; color: {{t.ink}}">${hole}</span>`;

// ---------- Shared component logic ----------
const AT_CONST = `// AT-PRIMITIVES v1 (fix batch 1b): DESIGN.md §2.1 tokens and §11 geometry. Keep identical across files.
const AT_TOK = {
  dark: { raised: '#26324B', sunken: '#0D131F', horizonInk: '#F6F2EA', line2: '#33405C', inputBorder: '#5A6781', groundEnd: '#070A11' },
  light: { raised: '#E3E9F1', sunken: '#F6F9FC', horizonInk: '#F6F2EA', line2: '#C3CDDA', inputBorder: '#8C98AA', groundEnd: '#EEF3F8' }
};
const AT_NIGHT = { ground: '#000000', ink: '#FF5A3C', ink2: '#E8563C', muted: '#A89690', line: '#3A2E2A' };
const AT_SCRIM = 'rgba(4,7,12,.55)';
const AT_HDR = { phone: { h: '60px', pad: '0 16px' }, tablet: { h: '68px', pad: '0 32px' }, desktop: { h: '68px', pad: '0 80px' }, xl: { h: '68px', pad: '0 120px' } };
const AT_FOOT = { phone: '24px 16px 32px', tablet: '24px 32px', desktop: '24px 80px', xl: '24px 120px' };
const AT_CARD_PAD = { phone: '20px', tablet: '24px', desktop: '24px', xl: '24px' };
const AT_TYPE = {
  phone: { h1: '34px', h1lh: '42px', h2: '24px', h2lh: '32px', gutter: '16px', section: '48px' },
  tablet: { h1: '48px', h1lh: '56px', h2: '28px', h2lh: '36px', gutter: '32px', section: '64px' },
  desktop: { h1: '48px', h1lh: '56px', h2: '28px', h2lh: '36px', gutter: '80px', section: '96px' }
};`;

const COMMON_JS = `${AT_CONST}
const DARK = Object.assign({
  surface: '#111826', line: '#1F2940', line2: '#33405C', ink: '#EAF0F7', ink2: '#B7C1D1', muted: '#8E9AAE',
  track: '#1A2336', tick: '#2A3752', primaryBg: '#EAF0F7', primaryInk: '#0A0E16'
}, { raised: AT_TOK.dark.raised, sunken: AT_TOK.dark.sunken });
const LIGHT = Object.assign({
  surface: '#FFFFFF', line: '#DCE3EC', line2: '#C3CDDA', ink: '#0E1726', ink2: '#3A4659', muted: '#5B6779',
  track: '#E3E9F1', tick: '#CCD5E1', primaryBg: '#0E1726', primaryInk: '#F2F6FA'
}, { raised: AT_TOK.light.raised, sunken: AT_TOK.light.sunken });
// Long-page ground: the same night lift as the tool, anchored to the top.
const PAGE = {
  dark: { ground: 'radial-gradient(1400px 900px at 50% -160px, #13203A 0%, rgba(10,14,22,0) 72%), #0A0E16', lamp: '#5BE0E8', lampFill: '#5BE0E8', lampInk: '#04232A', link: '#5BE0E8', warn: '#F2B34C', bad: '#FF7A7A', hatch: 'rgba(234,240,247,0.04)', adBg: 'rgba(17,24,38,0.55)' },
  light: { ground: 'radial-gradient(1400px 900px at 50% -160px, #FFFFFF 0%, rgba(242,246,250,0) 72%), #F2F6FA', lamp: '#087B87', lampFill: '#087B87', lampInk: '#FFFFFF', link: '#087B87', warn: '#B7791F', bad: '#D14343', hatch: 'rgba(14,23,38,0.045)', adBg: 'rgba(255,255,255,0.6)' }
};
// All seven presets on every layout (D-R14). The last one shows ∞ with the accessible name "Until I stop".
const PRESETS = [['p15', '15 min', '15 minutes', 900], ['p30', '30 min', '30 minutes', 1800], ['p45', '45 min', '45 minutes', 2700], ['p60', '1 h', '1 hour', 3600], ['p120', '2 h', '2 hours', 7200], ['p240', '4 h', '4 hours', 14400], ['pinf', '∞', 'Until I stop', 0]];
const RC = 2 * Math.PI * 110;
const GLYPHS = {
  dot: 'M6 1.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 1 1 0-9z',
  pause: 'M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z',
  tri: 'M6 1L11.2 10.5H.8z',
  ring: 'M6 3.4a2.6 2.6 0 1 1 0 5.2a2.6 2.6 0 1 1 0-5.2zM6 .6a5.4 5.4 0 1 1 0 10.8a5.4 5.4 0 1 1 0-10.8zm0 1.4a4 4 0 1 0 0 8a4 4 0 1 0 0-8z',
  dash: 'M1.5 5.1h9v1.8h-9z'
};
`;

const COMMON_METHODS = `  constructor(props) {
    super(props);
    const awake = props.status === 'awake';
    const sec = this.secsOf(PRESET0);
    const left = awake ? (sec ? Math.round(sec * 0.81) : 0) : sec;
    this.state = Object.assign({ theme: props.theme ?? 'auto', sysDark: this.sys(), now: Date.now(), mode: awake ? 'awake' : 'ready', preset: PRESET0, total: sec, left, el: awake ? 754 : 0, startedAt: Date.now() - (awake ? (sec ? (sec - left) : 754) * 1000 : 0), faqOpen: 0, toc: TOC[0][0] }, this.initPage(props));
  }
  sys() { try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return true; } }
  componentDidMount() {
    this.timer = setInterval(() => this.tick(), 1000);
    try {
      this.mq = window.matchMedia('(prefers-color-scheme: dark)');
      this.onMq = (e) => this.setState({ sysDark: e.matches });
      this.mq.addEventListener('change', this.onMq);
    } catch (e) {}
  }
  componentWillUnmount() {
    clearInterval(this.timer);
    clearTimeout(this.boot);
    clearTimeout(this.copyT);
    if (this.mq) this.mq.removeEventListener('change', this.onMq);
  }
  componentDidUpdate(prev) {
    const p = this.props;
    if (prev.theme !== p.theme && p.theme) this.setState({ theme: p.theme });
  }
  secsOf(id) { const f = PRESETS.find((x) => x[0] === id); return f ? f[3] : 1800; }
  tick() {
    const s = this.state;
    const next = { now: Date.now() };
    if (s.mode === 'awake') {
      if (s.total === 0) next.el = s.el + 1;
      else if (s.left <= 1) Object.assign(next, { mode: 'ready', left: s.total });
      else next.left = s.left - 1;
    }
    this.setState(next);
  }
  start() {
    clearTimeout(this.boot);
    const sec = this.secsOf(this.state.preset);
    this.setState({ mode: 'starting', total: sec, left: sec, el: 0, startedAt: Date.now() });
    this.boot = setTimeout(() => this.setState({ mode: 'awake', startedAt: Date.now() }), 900);
  }
  stop() { clearTimeout(this.boot); this.setState({ mode: 'ready', left: this.state.total, el: 0 }); }
  pick(id) {
    const s = this.state, sec = this.secsOf(id);
    const running = s.mode === 'awake' || s.mode === 'starting';
    this.setState(running ? { preset: id, total: sec, left: sec, el: 0, startedAt: Date.now() } : { preset: id, total: sec, left: sec });
  }
  rgba(hex, a) {
    const n = parseInt(hex.replace('#', ''), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  hm(ms) { return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); }
  when(ms) { return this.hm(ms) + (new Date(ms).toDateString() !== new Date(this.state.now).toDateString() ? ' tomorrow' : ''); }
  split(sec) {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), x = sec % 60;
    const p = (n) => String(n).padStart(2, '0');
    return h ? [h + ':' + p(m), ':' + p(x)] : [p(m), ':' + p(x)];
  }
  words(sec) {
    if (!sec) return '∞';
    const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
    if (h && m) return h + ' h ' + m + ' min';
    if (h) return h === 1 ? '1 hour' : h + ' hours';
    return m + ' min';
  }
  renderVals() {
    const s = this.state;
    const layout = ['phone', 'tablet', 'desktop'].includes(this.props.layout) ? this.props.layout : 'phone';
    const desk = layout === 'desktop', tab = layout === 'tablet', phone = !desk && !tab;
    const dark = s.theme === 'dark' || (s.theme === 'auto' && s.sysDark);
    const t = dark ? DARK : LIGHT;
    const p = dark ? PAGE.dark : PAGE.light;
    const ty = AT_TYPE[layout];
    const mode = s.mode;
    const live = mode === 'awake' || mode === 'starting';
    const setup = mode === 'ready';
    const tone = live ? p.lamp : t.muted;
    const faceColor = p.lamp;
    const noLimit = s.total === 0;
    const prog = noLimit ? 1 : s.left / s.total;
    const shown = noLimit ? (mode === 'awake' ? s.el : null) : s.left;
    const [bigA, bigB] = shown === null ? ['∞', ''] : this.split(shown);
    const hours = shown !== null && shown >= 3600;
    const endMs = Math.round((s.now + s.left * 1000) / 60000) * 60000;
    const LABEL = { ready: 'Ready', starting: 'Starting…', awake: 'Screen awake' };
    let kicker = 'Time left', metaA = 'until', metaB = this.when(endMs);
    if (setup) { kicker = 'Keeps awake for'; metaA = noLimit ? 'until you stop' : 'ends at'; metaB = noLimit ? '' : this.when(endMs); }
    if (mode === 'starting') kicker = 'Starting';
    if (live && noLimit) { kicker = 'Awake for'; metaA = 'since'; metaB = this.hm(s.startedAt); }
    const NOTE = { ready: 'Keeps this screen on while this tab stays visible.', starting: 'Asking your browser to keep the screen on…', awake: 'Started ' + this.hm(s.startedAt) + ' · keep this tab visible' };
    const sel = (on) => ({ weight: on ? 600 : 500, color: on ? t.ink : t.ink2 });
    const pi = Math.max(0, PRESETS.findIndex((x) => x[0] === s.preset));
    const presets = PRESETS.map(([id, label, aria], i) => Object.assign({ label, aria, sel: s.preset === id ? 'true' : 'false', pick: () => this.pick(id),
      span: 'span ' + (i < 5 ? 4 : 5), line: s.preset === id ? this.rgba(p.lamp, 0.45) : t.line, bg: s.preset === id ? this.rgba(p.lamp, 0.14) : t.surface }, sel(s.preset === id)));
    const [W, H] = (SIZES[layout] || [390, 4000]);
    const ringPx = desk ? 280 : tab ? 260 : 236;
    const cardGrid = desk
      ? 'position: relative; display: grid; grid-template-columns: ' + ringPx + 'px minmax(0, 1fr); grid-template-areas: "clock top" "clock len" "clock cta" "clock note"; column-gap: 48px; row-gap: 16px; align-items: center; padding: 32px'
      : 'position: relative; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-areas: "top" "clock" "len" "cta" "note"; row-gap: ' + (tab ? 24 : 16) + 'px; padding: ' + (tab ? '24px 32px' : '16px 16px 20px');
    const toc = TOC.map(([id, label]) => {
      const on = s.toc === id;
      return { href: '#' + id, label, current: on ? 'location' : 'false', weight: on ? 600 : 500, ink: on ? t.ink : t.ink2, dot: on ? p.lamp : 'transparent', pick: () => this.setState({ toc: id }) };
    });
    const faq = FAQS.map(([q, a], i) => {
      const open = s.faqOpen === i;
      return { q, a, qid: 'faq-q' + i, aid: 'faq-a' + i, open: open ? 'true' : 'false', isOpen: open, rot: open ? '45deg' : '0deg', toggle: () => this.setState({ faqOpen: this.state.faqOpen === i ? -1 : i }) };
    });
    const nav = [['Use cases', 'for'], ['Devices', 'on'], ['Extension', 'ext'], ['Pro', 'pro']].map(([label, id]) => ({ label, on: NAV === id, cur: NAV === id ? 'page' : 'false', ink: NAV === id ? t.ink : t.ink2, weight: NAV === id ? 600 : 500 }));
    const ctx = { s, layout, desk, tab, phone, dark, t, p };
    const base = {
      W: W + 'px', H: H + 'px', isDesk: desk, isTab: tab, isPhone: phone, showCrumb: !phone, t, p, tone, nav,
      hdr: AT_HDR[layout], foot: { pad: AT_FOOT[layout] }, cardPad: AT_CARD_PAD[layout],
      shellStyle: SHELL(layout, ty), cardGrid,
      fs: { h1: ty.h1, h1lh: ty.h1lh, h2: ty.h2, h2lh: ty.h2lh },
      gap: { section: ty.section },
      verifiedLabel: 'Sources checked ' + (this.verified ? this.verified() : VERIFIED),
      warn: p.warn, warnSoft: this.rgba(p.warn, 0.12), warnLine: this.rgba(p.warn, 0.38),
      toolAria: TOOL_ARIA, cardKicker: CARD_KICKER,
      cardLine: live ? this.rgba(p.lamp, 0.38) : t.line,
      cardShadow: live ? '0 24px 64px -24px ' + this.rgba(p.lamp, dark ? 0.45 : 0.3) : 'none',
      aura: this.rgba(p.lamp, live ? (dark ? 0.18 : 0.1) : 0.05),
      toneSoft: this.rgba(tone, 0.12), toneLine: this.rgba(tone, 0.38), toneGlow: live ? this.rgba(tone, 0.8) : 'transparent', toneFaint: this.rgba(faceColor, dark ? 0.16 : 0.12),
      glyph: GLYPHS.dot, glyphFill: mode === 'awake' ? tone : 'transparent', statusLabel: LABEL[mode],
      lampGlow: this.rgba(p.lamp, 0.5), lampSoft: this.rgba(p.lamp, 0.14), lampLine: this.rgba(p.lamp, 0.45),
      live, faceColor, ringPx: ringPx + 'px', digitSize: hours ? (desk ? '52px' : '48px') : (desk ? '64px' : '56px'),
      kicker, bigA, bigB, metaA, metaB, numColor: live ? t.ink : t.ink2,
      timerAria: shown === null ? 'Until I stop' : bigA + bigB + ' ' + (live && noLimit ? 'awake so far' : 'left'),
      arcDash: prog <= 0 ? '0.01 ' + RC.toFixed(1) : (RC * prog).toFixed(1) + ' ' + RC.toFixed(1),
      arcOp: setup ? 0.45 : 1, glowOp: live ? 0.45 : 0,
      tipDeg: (360 * prog).toFixed(2) + 'deg', tipOp: live && !noLimit && prog > 0 ? 1 : 0,
      presets, presetGrid: phone, presetBar: !phone, presetN: PRESETS.length, presetX: pi * 100 + '%', presetFont: desk ? '14px' : phone ? '14px' : '15px',
      primaryLabel: 'Keep awake · ' + this.words(s.total), primaryAria: noLimit ? 'Keep awake until I stop' : 'Keep awake for ' + this.words(s.total),
      isSetup: setup, isRunning: live, canExtend: !noLimit, runCols: noLimit ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))',
      start: () => this.start(), stop: () => this.stop(),
      extend: () => this.setState({ left: this.state.left + 900, total: this.state.total + 900 }),
      note: NOTE[mode], noteAlign: desk ? 'start' : 'center',
      toc, faq,
      adW: phone ? '300px' : '336px', adH: phone ? '250px' : '280px', adSize: phone ? '300 × 250' : '336 × 280',
      themeAuto: s.theme === 'auto', themeLight: s.theme === 'light', themeDark: s.theme === 'dark',
      themeX: (s.theme === 'light' ? 0 : s.theme === 'dark' ? 44 : 88) + 'px',
      themeLightInk: s.theme === 'light' ? t.ink : t.ink2, themeDarkInk: s.theme === 'dark' ? t.ink : t.ink2, themeAutoInk: s.theme === 'auto' ? t.ink : t.ink2,
      setLight: () => this.setState({ theme: 'light' }), setDark: () => this.setState({ theme: 'dark' }), setAuto: () => this.setState({ theme: 'auto' })
    };
    return Object.assign(base, this.pageVals(ctx));
  }
`;

function page({ file, title, props, pageConsts, pageMethods, body }) {
  const sizes = SIZES[file] || { phone: [390, 7990], tablet: [820, 7990], desktop: [1280, 7990] };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>AwakeTab · ${title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
${HELMET}
<div class="at-root" style="width: {{W}}; height: {{H}}; box-sizing: border-box; position: relative; overflow: hidden; background: {{p.ground}}; color: {{t.ink}}; display: flex; flex-direction: column">

${HEADER}

  <div style="{{shellStyle}}">
${body}
  </div>

${FOOTER}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='${JSON.stringify(Object.assign({
    theme: { editor: 'enum', options: ['auto', 'light', 'dark'], default: 'auto' },
    layout: { editor: 'enum', options: ['phone', 'tablet', 'desktop'], default: 'phone' },
    status: { editor: 'enum', options: ['ready', 'awake'], default: 'ready' }
  }, props, { $preview: { width: 390, height: sizes.phone[1] } }))}'>
${COMMON_JS}const SIZES = ${JSON.stringify(sizes)};
${pageConsts}
class Component extends DCLogic {
${COMMON_METHODS}${pageMethods}}
</script>
</body>
</html>
`;
}

// Shells. Desktop: 200 toc | 680 article | 160 rail with 40 gaps inside the 80 px gutters (1120 content).
// STD = head, tool, body (tool above the fold). MID = head, body, tool, tail (tool mid-page or at the end).
const SHELL_STD = `const SHELL = (layout, ty) => layout === 'desktop'
  ? 'position: relative; display: grid; grid-template-columns: 200px 680px 160px; grid-template-areas: "toc head ." "toc tool tool" "toc body rail"; column-gap: 40px; row-gap: 48px; padding: 24px 80px 0; align-items: start'
  : 'position: relative; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-areas: "head" "tool" "body"; row-gap: ' + (layout === 'tablet' ? 40 : 32) + 'px; padding: ' + (layout === 'tablet' ? 24 : 8) + 'px ' + ty.gutter + ' 0';`;
const SHELL_MID = `const SHELL = (layout, ty) => layout === 'desktop'
  ? 'position: relative; display: grid; grid-template-columns: 200px 680px 160px; grid-template-areas: "toc head ." "toc body rail" "toc tool tool" "toc tail ."; column-gap: 40px; row-gap: ' + ty.section + '; padding: 24px 80px 0; align-items: start'
  : 'position: relative; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-areas: "head" "body" "tool" "tail"; row-gap: ' + ty.section + '; padding: ' + (layout === 'tablet' ? 24 : 8) + 'px ' + ty.gutter + ' 0';`;

const pages = [];

// =====================================================================================
// 1. GuideOn: /on/iphone-safari (docs/06 §2.4)
// =====================================================================================
{
  const steps = section('steps', `        ${h2('h-steps', 'Set it up on your iPhone')}
        ${para('Four steps. The screenshots are placeholders until real-device captures are recorded.')}
        <ol style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; border-top: 1px solid {{t.line}}">
          <sc-for list="{{steps}}" as="st" hint-placeholder-count="4">
            <li id="{{st.id}}" style="display: grid; grid-template-columns: {{stepCols}}; gap: {{stepGap}}; align-items: start; padding: 24px 0; border-bottom: 1px solid {{t.line}}">
              <div style="display: flex; flex-direction: column; gap: 12px; min-width: 0">
                <span aria-hidden="true" style="width: 32px; height: 32px; box-sizing: border-box; border-radius: 999px; background: {{lampSoft}}; border: 1px solid {{lampLine}}; display: grid; place-items: center; font-size: 14px; line-height: 20px; font-weight: 600; font-variant-numeric: tabular-nums; color: {{t.ink}}">{{st.n}}</span>
                <h3 style="margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; color: {{t.ink}}; text-wrap: balance"><span style="${srOnly}">Step {{st.n}}: </span>{{st.title}}</h3>
                ${pathChip('{{st.path}}')}
                <p style="margin: 0; font-size: 16px; line-height: 26px; color: {{t.ink2}}; text-wrap: pretty">{{st.body}}</p>
              </div>
              <figure style="margin: 0; display: flex; flex-direction: column; gap: 8px; width: {{frameW}}">
                <div data-placeholder="screenshot" aria-hidden="true" style="width: {{frameW}}; height: {{frameH}}; box-sizing: border-box; border-radius: 20px; border: 1px dashed {{t.line2}}; background: repeating-linear-gradient(135deg, transparent 0 11px, {{p.hatch}} 11px 12px), {{t.sunken}}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{t.muted}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="3"></rect><circle cx="9" cy="10" r="1.8"></circle><path d="M20.5 16l-5-5-8 8.5"></path></svg>
                  <span style="font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}">Screenshot</span>
                </div>
                <figcaption style="font-size: 12px; line-height: 16px; color: {{t.muted}}; text-wrap: pretty">{{st.shot}}</figcaption>
              </figure>
            </li>
          </sc-for>
        </ol>`);
  const matrix = section('matrix', `        ${h2('h-matrix', 'Which iPhone setups keep the screen on')}
        ${para('Support claims come from browser documentation and automated tests. Real-device results appear in the matrix once recorded. Sources checked 26 September 2026.')}
        <sc-if value="{{tableView}}" hint-placeholder-val="{{false}}">
          <div role="table" aria-label="iPhone Safari support, sources checked 26 September 2026" style="border-radius: 16px; border: 1px solid {{t.line}}; background: {{t.surface}}; overflow: hidden">
            <div role="rowgroup">
              <div role="row" style="display: grid; grid-template-columns: {{matrixCols}}; background: {{t.sunken}}">
                <span role="columnheader" style="padding: 12px 16px">${kicker('Setup')}</span>
                <span role="columnheader" style="padding: 12px 16px">${kicker('Result')}</span>
                <span role="columnheader" style="padding: 12px 16px">${kicker('What to know')}</span>
              </div>
            </div>
            <div role="rowgroup">
              <sc-for list="{{works}}" as="w" hint-placeholder-count="9">
                <div role="row" style="display: grid; grid-template-columns: {{matrixCols}}; border-top: 1px solid {{t.line}}">
                  <span role="rowheader" style="padding: 16px; font-size: 15px; line-height: 22px; font-weight: 600; color: {{t.ink}}; text-wrap: pretty">{{w.what}}</span>
                  <span role="cell" style="padding: 16px">${tag('w')}</span>
                  <span role="cell" style="padding: 16px; font-size: 15px; line-height: 22px; color: {{t.ink2}}; text-wrap: pretty">{{w.fix}}</span>
                </div>
              </sc-for>
            </div>
          </div>
        </sc-if>
        <sc-if value="{{listView}}" hint-placeholder-val="{{true}}">
          <ul aria-label="iPhone Safari support, sources checked 26 September 2026" style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; border-radius: 16px; border: 1px solid {{t.line}}; background: {{t.surface}}; overflow: hidden">
            <sc-for list="{{works}}" as="w" hint-placeholder-count="9">
              <li style="display: flex; flex-direction: column; gap: 8px; padding: 16px; border-top: {{w.sep}}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px">
                  <span style="font-size: 15px; line-height: 22px; font-weight: 600; color: {{t.ink}}; text-wrap: pretty">{{w.what}}</span>
                  ${tag('w')}
                </div>
                <span style="font-size: 15px; line-height: 22px; color: {{t.ink2}}; text-wrap: pretty">{{w.fix}}</span>
              </li>
            </sc-for>
          </ul>
        </sc-if>`);
  const blockers = section('blockers', `        ${h2('h-blockers', 'What turns the screen off anyway')}
        ${para('If the screen still dims, one of these is usually the reason. Each has its own fix.')}
        <div style="display: flex; flex-direction: column; border-top: 1px solid {{t.line}}">
          <sc-for list="{{blockers}}" as="b" hint-placeholder-count="5">
            ${ROW_OPEN}
              <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0">
                <span style="font-size: 16px; line-height: 24px; font-weight: 600; color: {{t.ink}}">{{b.title}}</span>
                <span style="font-size: 16px; line-height: 26px; color: {{t.ink2}}; text-wrap: pretty">{{b.body}}</span>
                <sc-if value="{{b.hasLink}}" hint-placeholder-val="{{true}}">
                  <a href="{{b.href}}" style="align-self: flex-start; min-height: 44px; display: inline-flex; align-items: center; font-size: 15px; line-height: 22px; font-weight: 500; color: {{p.link}}">{{b.link}}</a>
                </sc-if>
              </div>
            </div>
          </sc-for>
        </div>`);
  const body = `${headBlock({ hub: 'Use AwakeTab on your device', hubHref: '#', crumb: 'iPhone in Safari', h1: 'Keep your iPhone screen on in Safari', stale: true,
    lede: 'Safari 16.4 and later can keep your iPhone screen on while the AwakeTab tab is in front. Tap Keep awake once, because Safari only grants a wake lock after a tap. Switch apps and the lock is released until you come back.',
    extra: `      <div style="display: flex; flex-wrap: wrap; gap: 8px">
        <span style="display: inline-flex; align-items: center; gap: 8px; min-height: 32px; padding: 4px 12px; box-sizing: border-box; border-radius: 8px; background: {{t.sunken}}; border: 1px solid {{t.line}}; font-size: 14px; line-height: 20px; color: {{t.ink}}"><span style="color: {{t.ink2}}">Safari</span><span style="font-weight: 600; font-variant-numeric: tabular-nums">16.4 or later</span></span>
        <span style="display: inline-flex; align-items: center; gap: 8px; min-height: 32px; padding: 4px 12px; box-sizing: border-box; border-radius: 8px; background: {{t.sunken}}; border: 1px solid {{t.line}}; font-size: 14px; line-height: 20px; color: {{t.ink}}"><span style="color: {{t.ink2}}">Home Screen web app</span><span style="font-weight: 600; font-variant-numeric: tabular-nums">iOS 18.4 or later</span></span>
        <span style="display: inline-flex; align-items: center; gap: 8px; min-height: 32px; padding: 4px 12px; box-sizing: border-box; border-radius: 8px; background: {{t.sunken}}; border: 1px solid {{t.line}}; font-size: 14px; line-height: 20px; color: {{t.ink}}"><span style="color: {{t.ink2}}">Extension</span><span style="font-weight: 600">not on iPhone</span></span>
      </div>
` })}

${toolCard()}

${TOC_ASIDE}

    <article class="at-prose" style="grid-area: body; display: flex; flex-direction: column; gap: {{gap.section}}; min-width: 0">
${steps}

${INLINE_AD}

${matrix}

${blockers}

${limitSection('limit', 'AwakeTab needs Safari 16.4 or later and its tab in front. Opening another app, another tab or the lock screen releases the wake lock. Low Power Mode sets Auto-Lock to 30 seconds, and we have not yet confirmed on a real iPhone whether the tab holds past that.')}

${FAQ}

${related('Start a 30-minute session', [['iPhone Auto-Lock Never is greyed out', 'GuideGuidesPhoneLight.dc.html'], ['Keep an iPhone Home Screen web app awake'], ['Low Power Mode and wake locks'], ['Screen Wake Lock API guide', 'GuideLearnPhoneLight.dc.html']])}
    </article>

${RAIL}`;
  const STEPS = [
    ['Check your iOS version', 'Settings › General › About', 'Look at the iOS Version row. Safari gained the wake lock in iOS 16.4 (March 2023). On anything older, AwakeTab offers a video fallback after one tap instead.', 'the About screen with the iOS Version row'],
    ['Open AwakeTab in Safari and tap Keep awake', 'Safari › awaketab.com', 'Safari will not grant a wake lock until you touch the page, so the session always starts from your tap. Then watch the pill. It says "Screen awake" only once Safari has agreed.', 'AwakeTab in Safari with the pill reading Screen awake'],
    ['Keep the tab in front', 'No app switching while it runs', 'Going to the Home Screen, opening another app or pressing the side button hides the page. The pill changes to "Paused — tab hidden". Come back and AwakeTab asks Safari again by itself.', 'the pill after switching away and back'],
    ['Optional: add it to your Home Screen', 'Share › Add to Home Screen', 'From iOS 18.4 the Home Screen web app can hold the wake lock too, and it opens without the Safari toolbar. On iOS 26, sites you add open as web apps by default.', 'the Share sheet with Add to Home Screen']
  ];
  // what, kind, label, note
  const WORKS = [
    ['Safari 16.4 or later, tab in front', 'works', 'Supported', 'Tap Keep awake once. Safari needs that tap before it grants the lock.'],
    ['Session started without a tap, for example after a reload', 'blocked', 'Blocked', 'The pill says "Blocked — here\'s the fix". Tap Retry.'],
    ['Another app, another tab or the lock screen', 'pauses', 'Pauses', 'The lock is released. It comes back when you return to the tab.'],
    ['Low Power Mode on', 'untested', 'Not yet tested', 'Low Power Mode sets Auto-Lock to 30 seconds (Apple support article 101604).'],
    ['Home Screen web app, iOS 18.4 or later', 'works', 'Supported', 'Same rules as Safari. The fix shipped in WebKit for iOS 18.4.'],
    ['Home Screen web app before iOS 18.4', 'no', 'Not supported', 'Open AwakeTab in Safari instead.'],
    ['Site added to the Home Screen on iOS 26', 'works', 'Supported', 'iOS 26 opens it as a web app by default, so the web app rules apply.'],
    ['Safari before 16.4', 'fallback', 'Video fallback', 'Tap once to start it. It needs this tab visible and uses a little more battery.'],
    ['AwakeTab browser extension', 'no', 'Not available', 'The extension is for desktop Chrome and Edge. There is no iPhone version.']
  ];
  const BLOCKERS = [
    ['Low Power Mode', 'It sets Auto-Lock to 30 seconds and greys out the longer choices, including Never.', 'Fix a greyed-out Auto-Lock', 'GuideGuidesPhoneLight.dc.html'],
    ['A work or school profile', 'A management profile can set a maximum Auto-Lock time that you cannot change.', 'Check for a profile', 'GuideGuidesPhoneLight.dc.html'],
    ['No tap yet', 'After a reload or a restored tab, Safari waits for a fresh tap before it grants the lock again.', '', ''],
    ['An old Home Screen web app', 'Before iOS 18.4, web apps opened from the Home Screen cannot hold a wake lock.', 'Home Screen web apps', '#']
  ];
  pages.push({
    file: 'GuideOn.dc.html', title: 'iPhone in Safari', body,
    props: { stale: { editor: 'boolean', default: false } },
    pageConsts: `const PRESET0 = 'p30';
const NAV = 'on';
const VERIFIED = '26 September 2026';
const TOOL_ARIA = 'Keep your iPhone screen on in Safari: tool';
const CARD_KICKER = 'Suggested · 30 min';
${SHELL_STD}
const TOC = [['s-steps', 'Set it up'], ['s-matrix', 'Which setups work'], ['s-blockers', 'What turns it off'], ['s-limit', 'Honest limit'], ['s-faq', 'Questions']];
const FAQS = ${J([
      ['Why does my screen go dark after 30 seconds once I leave Safari?', 'Low Power Mode is probably on. It sets Auto-Lock to 30 seconds, and once AwakeTab is not in front, Auto-Lock is in charge again. Turn Low Power Mode off in Settings › Battery if you need longer outside the tab.'],
      ['iOS reloaded the tab. Do I lose my session?', 'No. AwakeTab remembers how much time you had left and offers to resume. Tap Resume: that tap is also what Safari needs before it grants a new wake lock.'],
      ['Should I use Safari or the Home Screen web app?', 'Either works on iOS 18.4 or later. The web app opens full screen without the Safari toolbar, so there is less to tap by mistake. On older iOS, stay in Safari.'],
      ['How much battery does it use?', 'Almost all of the cost is the lit screen itself. AwakeTab does very little while it waits. For a long session, plug in or turn the brightness down.']
    ])};
const STEPS = ${J(STEPS)};
// kind: works | pauses | blocked | fallback | no | untested
const WORKS = ${J(WORKS)};
const BLOCKERS = ${J(BLOCKERS)};`,
    pageMethods: `  initPage(props) { return {}; }
  stale() { return this.props.stale === true || this.props.stale === 'true'; }
  verified() { return this.stale() ? '9 March 2026' : VERIFIED; }
  pageVals(c) {
    const { t, p, desk, tab, phone } = c;
    const K = { works: p.lamp, fallback: p.lamp, pauses: p.warn, blocked: p.bad, no: null, untested: null };
    return {
      isStale: this.stale(),
      steps: STEPS.map(([title, path, body, shot], i) => ({ id: 'step-' + (i + 1), n: i + 1, title, path, body, shot: 'Placeholder: ' + shot })),
      stepCols: phone ? 'minmax(0, 1fr) 112px' : 'minmax(0, 1fr) 160px',
      stepGap: phone ? '16px' : '32px',
      frameW: phone ? '112px' : '160px', frameH: phone ? '224px' : '320px',
      tableView: !phone, listView: phone,
      matrixCols: 'minmax(0, 1.1fr) 144px minmax(0, 1.4fr)',
      works: WORKS.map(([what, kind, label, fix], i) => {
        const tone = K[kind];
        return { what, label, fix, kind, soft: tone ? this.rgba(tone, 0.14) : 'transparent', line: tone ? 'transparent' : t.line2, sep: i ? '1px solid ' + t.line : '0' };
      }),
      blockers: BLOCKERS.map(([title, body, linkLabel, href]) => ({ title, body, link: linkLabel, href: href || '#', hasLink: !!linkLabel }))
    };
  }
`
  });
}

// =====================================================================================
// 2. GuideVs: /vs/nosleep-page (docs/06 §2.5)
// =====================================================================================
{
  const cmpTable = section('compare', `        ${h2('h-compare', 'Side by side')}
        ${para('Facts about nosleep.page come from its own site, checked 26 September 2026. Where its site does not say, the table says so. Rows marked Same are real ties.')}
        <sc-if value="{{tableView}}" hint-placeholder-val="{{false}}">
          <div role="table" aria-label="AwakeTab compared with nosleep.page, checked 26 September 2026" style="border-radius: 16px; border: 1px solid {{t.line}}; background: {{t.surface}}; overflow: hidden">
            <div role="rowgroup">
              <div role="row" style="display: grid; grid-template-columns: {{cmpCols}}; background: {{t.sunken}}">
                <span role="columnheader" style="padding: 12px 16px">${kicker('What')}</span>
                <span role="columnheader" style="padding: 12px 16px; display: flex; align-items: center; gap: 8px; font-size: 15px; line-height: 22px; font-weight: 600; color: {{t.ink}}"><span aria-hidden="true" style="width: 8px; height: 8px; border-radius: 999px; background: {{p.lamp}}"></span>AwakeTab</span>
                <span role="columnheader" style="padding: 12px 16px; display: flex; align-items: center; gap: 8px; font-size: 15px; line-height: 22px; font-weight: 600; color: {{t.ink}}"><span aria-hidden="true" style="width: 8px; height: 8px; box-sizing: border-box; border-radius: 999px; border: 1px solid {{t.ink2}}"></span>nosleep.page</span>
              </div>
            </div>
            <div role="rowgroup">
              <sc-for list="{{rows}}" as="r" hint-placeholder-count="8">
                <div role="row" style="display: grid; grid-template-columns: {{cmpCols}}; border-top: 1px solid {{t.line}}">
                  <span role="rowheader" style="padding: 16px; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; font-size: 15px; line-height: 22px; font-weight: 600; color: {{t.ink}}; text-wrap: pretty">{{r.what}}<sc-if value="{{r.same}}" hint-placeholder-val="{{false}}"><span style="display: inline-flex; align-items: center; height: 24px; padding: 0 8px; box-sizing: border-box; border-radius: 999px; border: 1px solid {{t.line2}}; font-size: 12px; line-height: 16px; font-weight: 600; color: {{t.ink2}}; white-space: nowrap">Same</span></sc-if></span>
                  <span role="cell" style="padding: 16px; font-size: 15px; line-height: 22px; color: {{t.ink}}; text-wrap: pretty">{{r.us}}</span>
                  <span role="cell" style="padding: 16px; font-size: 15px; line-height: 22px; color: {{t.ink}}; text-wrap: pretty">{{r.them}}</span>
                </div>
              </sc-for>
            </div>
          </div>
        </sc-if>
        <sc-if value="{{listView}}" hint-placeholder-val="{{true}}">
          <ul aria-label="AwakeTab compared with nosleep.page, checked 26 September 2026" style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 12px">
            <sc-for list="{{rows}}" as="r" hint-placeholder-count="8">
              <li style="display: flex; flex-direction: column; gap: 12px; padding: {{cardPad}}; border-radius: 16px; background: {{t.surface}}; border: 1px solid {{t.line}}">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px">
                  <span style="font-size: 16px; line-height: 24px; font-weight: 600; color: {{t.ink}}">{{r.what}}</span>
                  <sc-if value="{{r.same}}" hint-placeholder-val="{{false}}"><span style="display: inline-flex; align-items: center; height: 24px; padding: 0 8px; box-sizing: border-box; border-radius: 999px; border: 1px solid {{t.line2}}; font-size: 12px; line-height: 16px; font-weight: 600; color: {{t.ink2}}; white-space: nowrap">Same</span></sc-if>
                </div>
                <dl style="margin: 0; display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 8px 12px; font-size: 15px; line-height: 22px">
                  <dt style="display: flex; align-items: center; gap: 8px; font-weight: 600; color: {{t.ink}}"><span aria-hidden="true" style="width: 8px; height: 8px; border-radius: 999px; background: {{p.lamp}}; flex-shrink: 0"></span>AwakeTab</dt>
                  <dd style="margin: 0; color: {{t.ink}}; text-wrap: pretty">{{r.us}}</dd>
                  <dt style="display: flex; align-items: center; gap: 8px; font-weight: 600; color: {{t.ink}}"><span aria-hidden="true" style="width: 8px; height: 8px; box-sizing: border-box; border-radius: 999px; border: 1px solid {{t.ink2}}; flex-shrink: 0"></span>nosleep.page</dt>
                  <dd style="margin: 0; color: {{t.ink}}; text-wrap: pretty">{{r.them}}</dd>
                </dl>
              </li>
            </sc-for>
          </ul>
        </sc-if>`);
  const caseList = (id, title, intro, list) => section(id, `        ${h2('h-' + id, title)}
        ${para(intro)}
        <ol style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; border-top: 1px solid {{t.line}}">
          <sc-for list="{{${list}}}" as="b" hint-placeholder-count="3">
            <li style="display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 12px; padding: 16px 0; border-bottom: 1px solid {{t.line}}">
              <span aria-hidden="true" style="font-size: 16px; line-height: 24px; font-weight: 500; font-variant-numeric: tabular-nums; color: {{t.muted}}">{{b.n}}</span>
              <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0">
                <span style="font-size: 16px; line-height: 24px; font-weight: 600; color: {{t.ink}}; text-wrap: pretty">{{b.title}}</span>
                <span style="font-size: 16px; line-height: 26px; color: {{t.ink2}}; text-wrap: pretty">{{b.body}}</span>
              </div>
            </li>
          </sc-for>
        </ol>`);
  const body = `${headBlock({ hub: 'Compare screen-awake tools', hubHref: '#', crumb: 'nosleep.page', h1: 'AwakeTab vs nosleep.page',
    lede: 'Both are browser tabs that use the Screen Wake Lock API, and both stop when the tab is hidden. Pick nosleep.page if you want one quick timer with nothing to set. Pick AwakeTab if you want a status pill that only says "Screen awake" once the browser agrees, an end time on the clock, or a session that survives a reload.' })}

${toolCard()}

${TOC_ASIDE}

    <article class="at-prose" style="grid-area: body; display: flex; flex-direction: column; gap: {{gap.section}}; min-width: 0">
${cmpTable}

${INLINE_AD}

${caseList('them', 'When nosleep.page is the better choice', 'It is a good page. In these cases we would send you there.', 'better')}

${caseList('us', 'When AwakeTab is the better choice', 'These are the jobs AwakeTab was built for.', 'ours')}

${limitSection('limit', 'Both are tabs. Hide the tab and both stop, because the browser releases the wake lock. AwakeTab cannot keep the screen on from the background any better than nosleep.page can.')}

${FAQ}

${related('Start a 30-minute session', [['Compare screen-awake tools'], ['NoSleep.js vs the Screen Wake Lock API'], ['Browser support for the Screen Wake Lock API'], ['Screen Wake Lock API guide', 'GuideLearnDeskDark.dc.html']])}
    </article>

${RAIL}`;
  // what, AwakeTab, nosleep.page, same?
  const ROWS = [
    ['How it keeps the screen on', 'Screen Wake Lock API', 'Screen Wake Lock API', true],
    ['With the tab hidden', 'Stops. The pill says "Paused — tab hidden" and asks again when you return.', 'Stops. It asks you to keep the tab in front.', true],
    ['Install', 'None', 'None', true],
    ['Platforms', 'Chrome and Edge 84+, Firefox 126+, Safari 16.4+. Older browsers can use a video fallback after a tap.', 'Browsers that support the Screen Wake Lock API', false],
    ['Price', 'Free. Optional Pro adds extras.', 'Not stated on its site', false],
    ['Lengths', '15 min to 4 h, until you stop, or a custom length', '30 min, 1 h, 2 h or a custom length', false],
    ['Status you see', 'A pill that says "Screen awake" only once the browser grants the lock, and "Blocked — here\'s the fix" when it refuses', 'Not stated on its site', false],
    ['End at a clock time', 'Yes, for example 7:30 AM', 'Not stated on its site', false],
    ['Resume after a reload', 'Offers to resume with the time you had left', 'Not stated on its site', false],
    ['Facts checked', '26 September 2026', '26 September 2026', true]
  ];
  const BETTER = [
    ['You want the simplest page', 'nosleep.page asks very little of you: pick 30 minutes, 1 hour, 2 hours or a custom length, and keep the tab in front.'],
    ['You do not need status or an end time', 'AwakeTab\'s pill, end time and resume are extras. If you never look at them, a simpler page does the same job.'],
    ['It already works for you', 'Both ask the browser for the same wake lock and both stop when the tab is hidden, so switching will not keep your screen on any longer.']
  ];
  const OURS = [
    ['You want to know it is really working', 'The pill says "Screen awake" only after the browser grants the lock. If the browser refuses, it says "Blocked — here\'s the fix" and tells you what to try.'],
    ['You need to stop at a set time', 'Until a time ends the session at, say, 7:30 AM, so you do not have to work out the minutes.'],
    ['A reload should not lose your session', 'After a reload or a crash, AwakeTab offers to resume with the time you had left.'],
    ['Your browser is older', 'On browsers without the Screen Wake Lock API, a tap starts a video fallback and the pill says "Awake via video fallback". It needs this tab visible and uses a little more battery.']
  ];
  pages.push({
    file: 'GuideVs.dc.html', title: 'AwakeTab vs nosleep.page', body, props: {},
    pageConsts: `const PRESET0 = 'p30';
const NAV = '';
const VERIFIED = '26 September 2026';
const TOOL_ARIA = 'AwakeTab vs nosleep.page: tool';
const CARD_KICKER = 'Suggested · 30 min';
${SHELL_STD}
const TOC = [['s-compare', 'Side by side'], ['s-them', 'When nosleep.page is better'], ['s-us', 'When AwakeTab is better'], ['s-limit', 'Honest limit'], ['s-faq', 'Questions']];
const FAQS = ${J([
      ['Can I keep the screen on while the tab is hidden?', 'Not with either page. Browsers release the wake lock when a tab is hidden. On desktop Chrome and Edge, the AwakeTab extension can keep the screen on without a visible tab.'],
      ['Which one uses less battery?', 'They ask for the same wake lock, so the lit screen is the main cost either way. AwakeTab\'s video fallback, used only on older browsers after a tap, costs a little more.'],
      ['Is there any point in running both at once?', 'No. One visible tab holding a wake lock is enough, and on a phone only one tab can be in front anyway.'],
      ['Is AwakeTab made by the people behind nosleep.page?', 'No. They are separate projects. AwakeTab is built by Soubhik Biswas, and this page compares the two as fairly as we can.']
    ])};
// what, AwakeTab, nosleep.page, same?
const ROWS = ${J(ROWS)};
const BETTER = ${J(BETTER)};
const OURS = ${J(OURS)};`,
    pageMethods: `  initPage(props) { return {}; }
  pageVals(c) {
    const { t, phone } = c;
    const n = (list) => list.map(([title, body], i) => ({ n: String(i + 1), title, body }));
    return {
      tableView: !phone, listView: phone,
      cmpCols: 'minmax(0, 0.8fr) minmax(0, 1.2fr) minmax(0, 1.2fr)',
      rows: ROWS.map(([what, us, them, same]) => ({ what, us, them, same: !!same })),
      better: n(BETTER), ours: n(OURS)
    };
  }
`
  });
}

// =====================================================================================
// 3. GuideLearn: /learn/screen-wake-lock-api-guide (docs/06 §2.7)
// =====================================================================================
{
  // Code block: sunken, 1 px line, r8, 14/22, line numbers t.muted 14 px.
  const codeBlock = (id, label) => `        <div style="border-radius: 8px; border: 1px solid {{t.line}}; background: {{t.sunken}}; overflow: hidden; min-width: 0">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 4px 0 16px; border-bottom: 1px solid {{t.line}}">
            <code style="font-family: ${MONO}; font-size: 13px; line-height: 18px; color: {{t.ink2}}">{{${id}.file}}</code>
            <button onClick="{{${id}.copy}}" aria-label="{{${id}.aria}}" style="display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 12px; border-radius: 12px; border: 0; background: {{${id}.btnBg}}; font-size: 14px; line-height: 20px; font-weight: 600; color: {{${id}.btnInk}}">
              <sc-if value="{{${id}.copied}}" hint-placeholder-val="{{false}}"><svg class="at-in" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></sc-if>
              <sc-if value="{{${id}.idle}}" hint-placeholder-val="{{true}}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"></rect><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"></path></svg></sc-if>
              <span aria-live="polite">{{${id}.label}}</span>
            </button>
          </div>
          <div class="at-code" role="region" tabindex="0" aria-label="${label}" style="overflow-x: auto; overflow-y: hidden; max-width: 100%">
            <pre style="margin: 0; padding: 16px 16px 16px 0; min-width: max-content; font-family: ${MONO}; font-size: 14px; line-height: 22px; color: {{t.ink}}"><sc-for list="{{${id}.lines}}" as="ln" hint-placeholder-count="6"><span style="display: flex; min-height: 22px"><span aria-hidden="true" style="flex-shrink: 0; width: 48px; padding: 0 16px 0 0; box-sizing: border-box; text-align: end; font-size: 14px; color: {{t.muted}}; user-select: none">{{ln.n}}</span><code style="white-space: pre; font-family: ${MONO}; font-size: 14px"><sc-for list="{{ln.toks}}" as="tk" hint-placeholder-count="3"><code style="font-family: ${MONO}; font-size: 14px; color: {{tk.c}}; font-style: {{tk.fs}}; font-weight: {{tk.fw}}">{{tk.x}}</code></sc-for></code></span></sc-for></pre>
          </div>
        </div>`;
  const callout = note('Good to know', `The browser releases the lock the moment the page is hidden, and it never asks again by itself. Listen for ${code('visibilitychange')} and request a new lock when the page is visible again.`, LAMP_ICON);
  // Lifecycle diagram: SVG main loop (wide or tall) + HTML branch chains.
  const node = (x, y, w, tone, glyph, label, fill = true) => `<g><rect x="${x}" y="${y}" width="${w}" height="44" rx="22" fill="{{dg.${tone}Soft}}" stroke="{{dg.${tone}Line}}" stroke-width="1"></rect><path transform="translate(${x + 16} ${y + 16})" d="{{dg.g${glyph}}}" fill="${fill ? `{{dg.${tone}}}` : 'none'}" stroke="{{dg.${tone}}}" stroke-width="1.6" fill-rule="evenodd" stroke-linejoin="round"></path><text x="${x + 38}" y="${y + 27}" font-size="14" font-weight="600" fill="{{t.ink}}" style="font-family: Geist, system-ui, sans-serif">${label}</text></g>`;
  const lbl = (x, y, txt, anchor = 'middle', mono = true, extra = '') => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="12" fill="{{t.ink2}}" style="font-family: ${mono ? MONO : 'Geist, system-ui, sans-serif'}"${extra}>${txt}</text>`;
  const wide = `<svg role="img" aria-labelledby="dg-title dg-desc" width="100%" viewBox="0 0 680 210" style="display: block; overflow: visible">
              <title id="dg-title">Wake lock lifecycle</title>
              <desc id="dg-desc">Ready moves to Starting when the page calls request. Starting moves to Screen awake when the browser grants the lock. Screen awake moves to Paused, tab hidden, when the page is hidden. When the page is visible again it requests a new lock and returns to Starting.</desc>
              <defs><marker id="dgArrW" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L8 4L0 8z" fill="{{t.muted}}"></path></marker></defs>
              <g fill="none" stroke="{{t.muted}}" stroke-width="1.5">
                <path d="M152 46H231" marker-end="url(#dgArrW)"></path>
                <path d="M397 46H476" marker-end="url(#dgArrW)"></path>
                <path d="M580 70V152" marker-end="url(#dgArrW)"></path>
                <path d="M478 178H315V72" stroke-dasharray="4 5" marker-end="url(#dgArrW)"></path>
              </g>
              ${lbl(192, 36, 'request()')}
              ${lbl(437, 36, 'granted', 'middle', false)}
              ${lbl(570, 116, 'tab hidden', 'end', false)}
              ${lbl(396, 170, 'visible again', 'middle', false)}
              ${node(0, 24, 150, 'muted', 'dot', 'Ready', false)}
              ${node(235, 24, 160, 'lamp', 'dot', 'Starting…', false)}
              ${node(480, 24, 200, 'lamp', 'dot', 'Screen awake')}
              ${node(480, 156, 200, 'warn', 'pause', 'Paused — tab hidden')}
            </svg>`;
  const tall = `<svg role="img" aria-labelledby="dg-title-p dg-desc-p" width="100%" viewBox="0 0 358 334" style="display: block; overflow: visible">
              <title id="dg-title-p">Wake lock lifecycle</title>
              <desc id="dg-desc-p">Ready moves to Starting when the page calls request. Starting moves to Screen awake when the browser grants the lock. Screen awake moves to Paused, tab hidden, when the page is hidden. When the page is visible again it requests a new lock and returns to Starting.</desc>
              <defs><marker id="dgArrT" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L8 4L0 8z" fill="{{t.muted}}"></path></marker></defs>
              <g fill="none" stroke="{{t.muted}}" stroke-width="1.5">
                <path d="M118 46V92" marker-end="url(#dgArrT)"></path>
                <path d="M118 142V188" marker-end="url(#dgArrT)"></path>
                <path d="M118 238V284" marker-end="url(#dgArrT)"></path>
                <path d="M236 310H300V118H240" stroke-dasharray="4 5" marker-end="url(#dgArrT)"></path>
              </g>
              ${lbl(130, 73, 'request()', 'start')}
              ${lbl(130, 169, 'granted', 'start', false)}
              ${lbl(130, 265, 'tab hidden', 'start', false)}
              ${lbl(318, 214, 'visible again', 'middle', false, ' transform="rotate(90 318 214)"')}
              ${node(0, 0, 236, 'muted', 'dot', 'Ready', false)}
              ${node(0, 96, 236, 'lamp', 'dot', 'Starting…', false)}
              ${node(0, 192, 236, 'lamp', 'dot', 'Screen awake')}
              ${node(0, 288, 236, 'warn', 'pause', 'Paused — tab hidden')}
            </svg>`;
  const diagram = section('lifecycle', `        ${h2('h-lifecycle', 'What does the whole lifecycle look like?')}
        ${para('Each box is one of AwakeTab\'s pill messages. The dashed line is the step most pages forget: asking again when the tab comes back.')}
        <figure style="margin: 0; display: flex; flex-direction: column; gap: 20px; padding: {{cardPad}}; border-radius: 16px; background: {{t.surface}}; border: 1px solid {{t.line}}; min-width: 0">
          <sc-if value="{{dgWide}}" hint-placeholder-val="{{false}}">
            ${wide}
          </sc-if>
          <sc-if value="{{dgTall}}" hint-placeholder-val="{{true}}">
            ${tall}
          </sc-if>
          <div style="display: flex; flex-direction: column; gap: 12px; padding-top: 20px; border-top: 1px solid {{t.line}}">
            ${kicker('Other ways out')}
            <sc-for list="{{chains}}" as="ch" hint-placeholder-count="3">
              <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 4px 0">
                <sc-for list="{{ch.items}}" as="it" hint-placeholder-count="3">
                  <sc-if value="{{it.isNode}}" hint-placeholder-val="{{true}}">
                    <span style="display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 12px 0 8px; box-sizing: border-box; border-radius: 999px; background: {{it.soft}}; border: 1px solid {{it.line}}; font-size: 14px; line-height: 20px; font-weight: 600; color: {{t.ink}}; white-space: nowrap"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style="overflow: visible"><path d="{{it.glyph}}" fill="{{it.fill}}" stroke="{{it.tone}}" stroke-width="1.6" fill-rule="evenodd" stroke-linejoin="round"></path></svg>{{it.label}}</span>
                  </sc-if>
                  <sc-if value="{{it.isEdge}}" hint-placeholder-val="{{false}}">
                    <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 13px; line-height: 18px; color: {{t.ink2}}; white-space: nowrap"><sc-if value="{{it.mono}}" hint-placeholder-val="{{false}}"><code style="font-family: ${MONO}; font-size: 13px">{{it.label}}</code></sc-if><sc-if value="{{it.sans}}" hint-placeholder-val="{{true}}">{{it.label}}</sc-if><svg width="16" height="12" viewBox="0 0 16 10" aria-hidden="true"><path d="M0 5H13M9 1l4 4-4 4" fill="none" stroke="{{t.muted}}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>
                  </sc-if>
                </sc-for>
              </div>
            </sc-for>
          </div>
          <figcaption style="font-size: 14px; line-height: 20px; color: {{t.muted}}; text-wrap: pretty">Labels are the exact pill copy. A timer runs only in "Screen awake" and "Awake via video fallback".</figcaption>
        </figure>`);
  const rowList = (list, hint, left, right) => `        <div style="display: flex; flex-direction: column; border-top: 1px solid {{t.line}}">
          <sc-for list="{{${list}}}" as="r" hint-placeholder-count="${hint}">
            ${ROW_OPEN}
${left}
${right}
            </div>
          </sc-for>
        </div>`;
  const support = section('support', `        ${h2('h-support', 'Which browsers support it?')}
        ${para(`Versions come from MDN's browser compatibility data, checked 26 September 2026. Support claims come from browser documentation and automated tests. Real-device results appear in the matrix once recorded.`)}
${rowList('support', 6, `              <span style="font-size: 16px; line-height: 24px; font-weight: 500; color: {{t.ink}}">{{r.name}}</span>`, `              <span style="font-size: 15px; line-height: 22px; font-variant-numeric: tabular-nums; color: {{t.ink2}}; text-align: end">{{r.ver}}</span>`)}`);
  const errors = section('errors', `        ${h2('h-errors', 'Why did request() throw NotAllowedError?')}
        ${para(`The browser rejects the promise with ${code('NotAllowedError')} for a small set of reasons. Battery saver modes are not one of them in Chromium or Safari. Here is what each cause looks like and what AwakeTab shows.`)}
${rowList('errors', 5, `              <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0">
                <span style="font-size: 16px; line-height: 24px; font-weight: 600; color: {{t.ink}}; text-wrap: pretty">{{r.cause}}</span>
                <span style="font-size: 16px; line-height: 26px; color: {{t.ink2}}; text-wrap: pretty">{{r.body}}</span>
              </div>`, '')}`);
  const body = `${headBlock({ hub: 'Learn about screen wake locks', hubHref: '#', crumb: 'Screen Wake Lock API', h1: 'Screen Wake Lock API guide',
    lede: `${code("navigator.wakeLock.request('screen')")} asks the browser to keep the display on. It works only on a secure (HTTPS) page that is visible. The browser releases the lock when the page is hidden and never asks again by itself. This guide gives you code for each step.` })}

${TOC_ASIDE}

    <article class="at-prose" style="grid-area: body; display: flex; flex-direction: column; gap: {{gap.section}}; min-width: 0">
${support}

${section('request', `        ${h2('h-request', 'How do I ask for a wake lock?')}
        ${para(`Call ${code("request('screen')")} from a visible page served over HTTPS. Keep the object it returns: it is your only proof that the lock is held, and its ${code('release')} event tells you when it is gone. If ${code('navigator.wakeLock')} is missing, the browser has no support or the page is not secure.`)}
${codeBlock('c1', 'wake-lock.js, scrolls sideways')}
        ${para(`These examples use the raw API. Our small wrapper is ${code('@awaketab/wake')}: npm package coming soon. The ${link('/library')} page will say when it ships.`)}`)}

${errors}

${INLINE_AD}

${section('hidden', `        ${h2('h-hidden', 'What happens when the tab is hidden?')}
        ${para(`Switching tabs, minimising the window or opening another app on a phone hides the document. The lock fires ${code('release')}, and your page should show that honestly instead of a running timer.`)}
${callout}
${codeBlock('c2', 'resume.js, scrolls sideways')}`)}

${diagram}

${section('iframe', `        ${h2('h-iframe', 'Can a page in an iframe ask for one?')}
        ${para(`Only if the parent page allows it. Without ${code('allow="screen-wake-lock"')} on the iframe, the Permissions-Policy blocks the request and it fails with ${code('NotAllowedError')}. AwakeTab then shows ${strong("\"Blocked — here's the fix\"")}.`)}
${codeBlock('c3', 'embed.html, scrolls sideways')}`)}

${section('stop', `        ${h2('h-stop', 'How do I let go on purpose?')}
        ${para(`When the user stops or the time is up, release the lock and clear the flag that says they wanted it. Otherwise your ${code('visibilitychange')} handler will ask again the next time the tab is shown.`)}
${codeBlock('c4', 'stop.js, scrolls sideways')}`)}

${section('limits', `        ${h2('h-limits', 'What can a wake lock not do?')}
        ${para('It keeps the display on. It does not keep a closed laptop awake, since closing the lid follows your lid setting. It does not move the mouse, so Teams and Slack still go Away after their idle timers. It cannot beat a work or school policy that locks the device.')}
${note('Honest limit', 'Secure pages only, and the lock is released whenever the document is hidden, so your code has to ask again. On iPhone, Low Power Mode sets Auto-Lock to 30 seconds; whether a held lock outlasts that is not yet tested on a real device.')}`)}

${FAQ}
    </article>

    <div id="s-try" style="grid-area: tool; display: flex; flex-direction: column; gap: 16px; min-width: 0">
      ${h2('h-try', 'Try it')}
      ${para('Start a session, switch tabs, then come back and watch the pill.')}
${toolCard('auto')}
    </div>

    <div class="at-prose" style="grid-area: tail; display: flex; flex-direction: column; gap: {{gap.section}}; min-width: 0">
${related('', [['Browser support for the Screen Wake Lock API'], ['NoSleep.js vs the Screen Wake Lock API'], ['How AwakeTab is tested'], ['The @awaketab/wake library']])}
    </div>

${RAIL}`;
  pages.push({
    file: 'GuideLearn.dc.html', title: 'Screen Wake Lock API guide', body, props: {},
    pageConsts: `const PRESET0 = 'p15';
const NAV = '';
const VERIFIED = '26 September 2026';
const TOOL_ARIA = 'Screen Wake Lock API guide: try it';
const CARD_KICKER = 'Suggested · 15 min';
${SHELL_MID}
const TOC = [['s-support', 'Browser support'], ['s-request', 'Ask for a lock'], ['s-errors', 'NotAllowedError'], ['s-hidden', 'When the tab is hidden'], ['s-lifecycle', 'The lifecycle'], ['s-iframe', 'Inside an iframe'], ['s-stop', 'Let go on purpose'], ['s-limits', 'Limits'], ['s-faq', 'Questions'], ['s-try', 'Try it']];
const FAQS = ${J([
      ['Does the user see a permission prompt?', 'No. Chromium grants the screen-wake-lock permission by default, so there is nothing to accept. Safari wants a tap on the page first, but it shows no dialog.'],
      ['Can I test it on localhost?', 'Yes. Browsers treat http://localhost as a secure context, so navigator.wakeLock is there while you develop.'],
      ['Does it stop the computer from sleeping too?', 'Mostly. On macOS, Chromium holds a no-display-sleep assertion, which also stops idle sleep. On Windows it asks for the display to stay on. Closing a laptop lid still follows your lid setting.']
    ])};
const SUPPORT = ${J([
      ['Chrome and Edge', '84 and later'], ['Opera', '70 and later'], ['Samsung Internet', '14 and later'],
      ['Firefox', '126 and later (May 2024)'], ['Safari on Mac, iPhone and iPad', '16.4 and later (March 2023)'], ['iPhone and iPad Home Screen web apps', 'iOS 18.4 and later']
    ])};
const ERRORS = ${J([
      ['The page is hidden or not active', 'The request is rejected. AwakeTab shows "Paused — tab hidden" and asks again when you come back.'],
      ['A Permissions-Policy blocks it', 'Common in an iframe without allow="screen-wake-lock". AwakeTab shows "Blocked — here\'s the fix".'],
      ['Safari has not had a tap yet', 'Safari wants a recent tap. AwakeTab shows "Blocked — here\'s the fix", and tapping Retry is that tap.'],
      ['Firefox is at 5% battery or less and not charging', 'Firefox refuses new locks and releases held ones. Plug in, then tap Retry.'],
      ['The page is not on HTTPS', 'There is no navigator.wakeLock, so nothing is rejected. AwakeTab calls this unsupported and shows "Tap to use the fallback".']
    ])};
const CODE = {
  c1: ['wake-lock.js', 'js', [
    'let sentinel = null;',
    'let wanted = false;',
    '',
    'async function keepAwake() {',
    '  wanted = true;',
    "  if (!('wakeLock' in navigator)) return 'unsupported';",
    '  try {',
    "    sentinel = await navigator.wakeLock.request('screen');",
    "    sentinel.addEventListener('release', () => { sentinel = null; });",
    "    return 'held';",
    '  } catch (err) {',
    '    // NotAllowedError: page hidden, Permissions-Policy,',
    '    // no tap yet in Safari, or Firefox at 5% battery or less',
    "    return 'denied';",
    '  }',
    '}'
  ]],
  c2: ['resume.js', 'js', [
    "document.addEventListener('visibilitychange', () => {",
    "  if (document.visibilityState === 'visible' && wanted && !sentinel) {",
    '    keepAwake();',
    '  }',
    '});'
  ]],
  c3: ['embed.html', 'html', [
    '<iframe src="https://awaketab.com/embed/cook" allow="screen-wake-lock" width="320" height="96"></iframe>'
  ]],
  c4: ['stop.js', 'js', [
    'async function stop() {',
    '  wanted = false;',
    '  await sentinel?.release();',
    '}'
  ]]
};
const KW = ['let', 'const', 'async', 'await', 'function', 'if', 'return', 'try', 'catch', 'new', 'null', 'true', 'false', 'in', 'of'];`,
    pageMethods: `  initPage(props) {
    this.lex = {};
    Object.keys(CODE).forEach((k) => { this.lex[k] = CODE[k][2].map((l) => this.tokens(l, CODE[k][1])); });
    return { copied: null };
  }
  tokens(line, lang) {
    const out = [];
    const re = lang === 'html' ? /(<\\/?[\\w-]+|\\/?>)|("[^"]*")|([\\w-]+)(?==)/g : /(\\/\\/.*$)|('[^']*'|"[^"]*")|([A-Za-z_$][\\w$]*)/g;
    let i = 0, m;
    while ((m = re.exec(line))) {
      if (m.index > i) out.push(['pun', line.slice(i, m.index)]);
      if (lang === 'html') out.push([m[1] ? 'tag' : m[2] ? 'str' : 'attr', m[0]]);
      else if (m[1]) out.push(['com', m[0]]);
      else if (m[2]) out.push(['str', m[0]]);
      else {
        const rest = line.slice(m.index + m[0].length);
        out.push([KW.includes(m[0]) ? 'kw' : /^\\s*\\(/.test(rest) ? 'fn' : 'id', m[0]]);
      }
      i = m.index + m[0].length;
    }
    if (i < line.length) out.push(['pun', line.slice(i)]);
    return out;
  }
  copy(id) {
    const src = CODE[id][2].join('\\n');
    try { if (navigator.clipboard) navigator.clipboard.writeText(src); } catch (e) {}
    clearTimeout(this.copyT);
    this.setState({ copied: id });
    this.copyT = setTimeout(() => this.setState({ copied: null }), 2000);
  }
  pageVals(c) {
    const { t, p, dark, desk, tab, phone } = c;
    const s = this.state;
    const COL = { kw: [p.lamp, 'normal', 500], fn: [t.ink, 'normal', 600], id: [t.ink, 'normal', 400], str: [t.ink2, 'normal', 400], com: [t.muted, 'italic', 400], pun: [t.ink2, 'normal', 400], tag: [p.lamp, 'normal', 500], attr: [t.ink, 'normal', 500] };
    const blocks = {};
    Object.keys(CODE).forEach((k) => {
      const on = s.copied === k;
      blocks[k] = {
        file: CODE[k][0], copied: on, idle: !on, label: on ? 'Copied' : 'Copy', aria: on ? 'Copied ' + CODE[k][0] : 'Copy ' + CODE[k][0],
        btnBg: on ? this.rgba(p.lamp, 0.14) : 'transparent', btnInk: on ? t.ink : t.ink2,
        copy: () => this.copy(k),
        lines: this.lex[k].map((toks, i) => ({ n: i + 1, toks: toks.map(([ty, x]) => ({ x, c: COL[ty][0], fs: COL[ty][1], fw: COL[ty][2] })) }))
      };
    });
    const tone = (hex) => ({ soft: this.rgba(hex, 0.12), line: this.rgba(hex, 0.38) });
    const n = (label, hex, glyph, fill) => Object.assign({ isNode: true, isEdge: false, mono: false, sans: false, label, tone: hex, glyph, fill: fill ? hex : 'transparent' }, tone(hex));
    const e = (label, mono) => ({ isNode: false, isEdge: true, mono: !!mono, sans: !mono, label, soft: '', line: '', tone: '', glyph: '', fill: '' });
    const chains = [
      [n('Starting…', p.lamp, GLYPHS.dot, false), e('NotAllowedError', true), n("Blocked — here's the fix", p.bad, GLYPHS.tri, true)],
      [n('Ready', t.muted, GLYPHS.dot, false), e('no wakeLock in navigator', false), n('Tap to use the fallback', p.lamp, GLYPHS.dot, true), e('tap', false), n('Awake via video fallback', p.lamp, GLYPHS.ring, true)],
      [n('Screen awake', p.lamp, GLYPHS.dot, true), e('release()', true), n('Ready', t.muted, GLYPHS.dot, false)]
    ].map((items) => ({ items }));
    return Object.assign(blocks, {
      dgWide: !phone, dgTall: phone,
      support: SUPPORT.map(([name, ver]) => ({ name, ver })),
      errors: ERRORS.map(([cause, body]) => ({ cause, body })),
      dg: {
        muted: t.muted, lamp: p.lamp, warn: p.warn,
        mutedSoft: this.rgba(t.muted, 0.12), mutedLine: this.rgba(t.muted, 0.38),
        lampSoft: this.rgba(p.lamp, 0.12), lampLine: this.rgba(p.lamp, 0.38),
        warnSoft: this.rgba(p.warn, 0.12), warnLine: this.rgba(p.warn, 0.38),
        gdot: GLYPHS.dot, gpause: GLYPHS.pause
      },
      chains
    });
  }
`
  });
}

// =====================================================================================
// 4. GuideGuides: /guides/iphone-auto-lock-never-greyed-out (docs/06 §2.6)
// =====================================================================================
{
  const progressBar = `<div aria-hidden="true" style="height: 4px; border-radius: 999px; background: {{t.track}}; overflow: hidden"><div class="at-bar" style="height: 100%; width: 100%; border-radius: 999px; background: {{p.lamp}}; transform-origin: left center; transform: scaleX({{prog}})"></div></div>`;
  const stepNav = `    <sc-if value="{{isDesk}}" hint-placeholder-val="{{false}}">
      <nav aria-label="Steps" style="grid-area: toc; align-self: start; position: sticky; top: 24px; display: flex; flex-direction: column; gap: 16px">
        <div style="display: flex; flex-direction: column; gap: 8px">
          ${kicker('Your progress')}
          ${progressBar}
          <span aria-live="polite" style="font-size: 14px; line-height: 20px; font-variant-numeric: tabular-nums; color: {{t.ink2}}">{{progLabel}}</span>
        </div>
        <ol style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column">
          <sc-for list="{{steps}}" as="st" hint-placeholder-count="4">
            <li>
              <a href="{{st.href}}" aria-current="{{st.cur}}" style="display: grid; grid-template-columns: 24px minmax(0, 1fr); gap: 8px; align-items: center; min-height: 44px; text-decoration: none; font-size: 14px; line-height: 20px; font-weight: {{st.weight}}; color: {{st.ink}}">
                <span aria-hidden="true" class="at-slide" style="width: 24px; height: 24px; box-sizing: border-box; border-radius: 999px; border: 1px solid {{st.ring}}; background: {{st.fill}}; display: grid; place-items: center; font-size: 12px; line-height: 16px; font-weight: 600; font-variant-numeric: tabular-nums; color: {{st.numInk}}">{{st.mark}}</span>
                <span>{{st.short}}<span style="${srOnly}">{{st.srState}}</span></span>
              </a>
            </li>
          </sc-for>
        </ol>
        <a href="#tool" style="display: flex; align-items: center; gap: 8px; min-height: 44px; font-size: 14px; line-height: 20px; color: {{p.link}}">Jump to the tool ↓</a>
      </nav>
    </sc-if>`;
  const stepsSec = section('steps', `        <div style="display: flex; flex-direction: column; gap: 12px">
          <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap">
            ${h2('h-steps', 'Get Never back in four steps')}
            <span aria-live="polite" style="font-size: 13px; line-height: 18px; font-variant-numeric: tabular-nums; color: {{t.muted}}">{{progShort}}</span>
          </div>
          <sc-if value="{{showTopBar}}" hint-placeholder-val="{{true}}">
            ${progressBar}
          </sc-if>
          ${para('These paths are for recent iOS versions. Older versions can name screens differently.')}
        </div>
        <ol style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column">
          <sc-for list="{{steps}}" as="st" hint-placeholder-count="4">
            <li id="{{st.id}}" style="display: grid; grid-template-columns: 40px minmax(0, 1fr); column-gap: {{railGap}}">
              <div aria-hidden="true" style="display: flex; flex-direction: column; align-items: center">
                <span class="at-slide" style="width: 40px; height: 40px; flex-shrink: 0; box-sizing: border-box; border-radius: 999px; border: 1px solid {{st.ring}}; background: {{st.fill}}; display: grid; place-items: center; font-size: 15px; line-height: 22px; font-weight: 600; font-variant-numeric: tabular-nums; color: {{st.numInk}}">{{st.mark}}</span>
                <span style="flex-grow: 1; width: 1px; margin: 8px 0; background: {{st.lineBg}}"></span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 12px; padding-bottom: 32px; min-width: 0">
                <div style="display: flex; align-items: center; gap: 4px; min-height: 40px">
                  <h3 style="margin: 0; flex-grow: 1; min-width: 0; font-size: 20px; line-height: 28px; font-weight: 600; color: {{t.ink}}; text-wrap: pretty"><span style="color: {{t.muted}}; font-weight: 500">Step {{st.n}} · </span>{{st.title}}</h3>
                  <a href="{{st.href}}" aria-label="{{st.linkAria}}" title="Link to this step" style="flex-shrink: 0; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; color: {{t.ink2}}; text-decoration: none"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"></path><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"></path></svg></a>
                </div>
                <sc-if value="{{st.isCurrent}}" hint-placeholder-val="{{false}}">
                  <span class="at-in" style="align-self: flex-start; font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{p.link}}">Next up</span>
                </sc-if>
                ${pathChip('{{st.path}}')}
                <p style="margin: 0; font-size: 16px; line-height: 26px; color: {{t.ink2}}; text-wrap: pretty">{{st.body}}</p>
                <button role="checkbox" aria-checked="{{st.on}}" onClick="{{st.toggle}}" style="align-self: flex-start; display: inline-flex; align-items: center; gap: 12px; height: 44px; padding: 0 16px 0 12px; border-radius: 12px; border: 1px solid {{st.btnLine}}; background: {{st.btnBg}}; font-size: 15px; line-height: 22px; font-weight: 600; color: {{t.ink}}">
                  <span aria-hidden="true" class="at-slide" style="width: 24px; height: 24px; box-sizing: border-box; border-radius: 8px; border: 1px solid {{st.box}}; background: {{st.boxFill}}; display: grid; place-items: center; color: {{p.lampInk}}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="opacity: {{st.tickOp}}"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span>
                  {{st.btnLabel}}
                </button>
              </div>
            </li>
          </sc-for>
        </ol>
        <sc-if value="{{allDone}}" hint-placeholder-val="{{false}}">
          <div class="at-in" role="status" style="display: grid; grid-template-columns: 20px minmax(0, 1fr); column-gap: 12px; row-gap: 4px; padding: {{cardPad}}; border-radius: 16px; background: {{t.surface}}; border: 1px solid {{lampLine}}">
            ${LAMP_ICON}
            <span style="font-size: 16px; line-height: 26px; color: {{t.ink}}">All four done. If Never is still grey, read the next section.</span>
          </div>
        </sc-if>
        <sc-if value="{{notDone}}" hint-placeholder-val="{{true}}">
          <button onClick="{{reset}}" style="align-self: flex-start; height: 44px; padding: 0; border: 0; background: transparent; font-size: 14px; line-height: 20px; color: {{t.ink2}}; text-decoration: underline; text-underline-offset: 4px">Clear my progress</button>
        </sc-if>`, 20);
  const still = section('still', `        ${h2('h-still', 'If the setting is still greyed out')}
        ${para('With Low Power Mode off, a grey Never almost always means a configuration profile. Schools and employers can set the longest Auto-Lock time a phone may use, and iOS then hides anything longer.')}
        ${para('Only the person who manages the phone can lift that limit. Removing the profile yourself can also remove your work email, apps and Wi-Fi settings, so ask first. Restarting the phone does not change a profile limit.')}`);
  const skip = `    <div id="s-skip" style="grid-area: tool; display: flex; flex-direction: column; gap: 16px; min-width: 0">
      ${h2('h-skip', 'Or skip the settings: open AwakeTab')}
      ${para('If you only need the screen on for one task, you can leave Auto-Lock alone. AwakeTab keeps the screen on while its Safari tab is in front. Tap Keep awake once, because Safari needs that tap. When you leave the tab, your normal Auto-Lock takes over again.')}
${toolCard('auto')}
    </div>`;
  const body = `${headBlock({ hub: 'Wake lock troubleshooting guides', hubHref: '#', crumb: 'Auto-Lock Never greyed out', h1: 'iPhone Auto-Lock Never is greyed out',
    lede: 'Auto-Lock Never goes grey when Low Power Mode is on, because Low Power Mode caps Auto-Lock at 30 seconds, or when a work or school profile limits Auto-Lock. Turn Low Power Mode off and Never usually comes back. A managed phone needs its admin.' })}

${stepNav}

    <article class="at-prose" style="grid-area: body; display: flex; flex-direction: column; gap: {{gap.section}}; min-width: 0">
${stepsSec}

${still}

${INLINE_AD}
    </article>

${skip}

    <div class="at-prose" style="grid-area: tail; display: flex; flex-direction: column; gap: {{gap.section}}; min-width: 0">
${limitSection('limit', 'With Low Power Mode on, iPhone sets Auto-Lock to 30 seconds. We have not yet tested on a real iPhone whether a Safari wake lock holds past that cap, or past a limit set by a work or school profile. Turn Low Power Mode off if you need to be sure.')}

${FAQ}

${related('Start a 30-minute session', [['Keep your iPhone screen on in Safari', 'GuideOn.dc.html'], ['Low Power Mode and wake locks'], ['Keep an iPad on for sheet music'], ['Lock screen vs sleep: what a wake lock changes']])}
    </div>

${RAIL}`;
  pages.push({
    file: 'GuideGuides.dc.html', title: 'iPhone Auto-Lock Never greyed out', body, props: {},
    pageConsts: `const PRESET0 = 'p30';
const NAV = '';
const VERIFIED = '26 September 2026';
const TOOL_ARIA = 'iPhone Auto-Lock Never is greyed out: tool';
const CARD_KICKER = 'Suggested · 30 min';
${SHELL_MID}
const TOC = [['s-steps', 'Get Never back'], ['s-still', 'Still greyed out'], ['s-skip', 'Skip the settings'], ['s-limit', 'Honest limit'], ['s-faq', 'Questions']];
const FAQS = ${J([
      ['Why does Low Power Mode keep turning back on?', 'iPhone offers to switch it on when the battery runs low. If it turns on with no prompt, look in the Shortcuts app under Automation for a rule that sets Low Power Mode.'],
      ['Is it bad to leave Auto-Lock on Never?', 'It will not harm the phone, but a lit screen drains the battery and anyone can pick up an unlocked phone. Set it back when you finish, or use AwakeTab for one task instead.'],
      ['Does Never stop the side button from locking the phone?', 'No. Pressing the side button always locks the screen. Never only stops the automatic lock after a period without touches.'],
      ['Will turning off Low Power Mode drain my battery faster?', 'A little. Low Power Mode also cuts back background activity such as mail fetch and downloads, not just Auto-Lock.']
    ])};
// title, short nav label, path, body
const STEPS = ${J([
      ['Turn off Low Power Mode', 'Low Power Mode off', 'Settings › Battery › Low Power Mode', 'A yellow battery icon means it is on. Switch it off here, or with the battery button in Control Centre if you have added it.'],
      ['Choose Never in Auto-Lock', 'Auto-Lock to Never', 'Settings › Display & Brightness › Auto-Lock', 'Never should now be available. Pick it only if you want the whole phone to stay on. For most tasks, 5 minutes is a kinder choice for the battery.'],
      ['Look for a work or school profile', 'Check for a profile', 'Settings › General › VPN & Device Management', 'If a management profile is listed, it may cap Auto-Lock. Older iOS versions may give this screen a different name.'],
      ['Check that it stuck', 'Check it stuck', 'Leave the phone untouched for a while', 'Put the phone down for longer than your old Auto-Lock time. If it still dims after 30 seconds, Low Power Mode has come back on.']
    ])};`,
    pageMethods: `  initPage(props) { return { done: [true, false, false, false] }; }
  pageVals(c) {
    const { t, p, phone, desk } = c;
    const s = this.state;
    const n = s.done.filter(Boolean).length;
    const cur = s.done.findIndex((d) => !d);
    const steps = STEPS.map(([title, short, path, body], i) => {
      const on = !!s.done[i], isCurrent = i === cur;
      return {
        id: 'step-' + (i + 1), href: '#step-' + (i + 1), n: i + 1, title, short, path, body,
        on: on ? 'true' : 'false', isCurrent, cur: isCurrent ? 'step' : 'false',
        srState: on ? ', done' : isCurrent ? ', next' : '',
        linkAria: 'Link to step ' + (i + 1),
        mark: on ? '✓' : String(i + 1),
        ring: on ? p.lampFill : isCurrent ? this.rgba(p.lamp, 0.45) : t.line2, fill: on ? p.lampFill : isCurrent ? this.rgba(p.lamp, 0.14) : 'transparent',
        numInk: on ? p.lampInk : isCurrent ? t.ink : t.ink2,
        lineBg: i === STEPS.length - 1 ? 'transparent' : on ? p.lamp : t.line2, weight: isCurrent ? 600 : 500, ink: isCurrent || on ? t.ink : t.ink2,
        box: on ? p.lampFill : t.line2, boxFill: on ? p.lampFill : 'transparent', tickOp: on ? 1 : 0,
        btnLine: on ? this.rgba(p.lamp, 0.45) : t.line2, btnBg: on ? this.rgba(p.lamp, 0.14) : t.surface,
        btnLabel: on ? 'Done' : 'Mark as done',
        toggle: () => this.setState({ done: this.state.done.map((v, j) => (j === i ? !v : v)) })
      };
    });
    return {
      steps, prog: (n / STEPS.length).toFixed(3), allDone: n === STEPS.length, notDone: n > 0 && n < STEPS.length,
      progLabel: n === STEPS.length ? 'All 4 steps done' : n + ' of 4 done · next: step ' + (cur + 1),
      progShort: n + ' of 4 done', showTopBar: !desk, railGap: phone ? '16px' : '20px',
      reset: () => this.setState({ done: [false, false, false, false] })
    };
  }
`
  });
}

const fixAreas = (src) => src.replace(/'([^'\n]*grid-template-areas[^'\n]*)'/g, (m, inner) => '"' + inner.replace(/"/g, "'") + '"');
for (const pg of pages) writeFileSync(new URL(pg.file, dir), fixAreas(page(pg)));
console.log('wrote', pages.map((p) => p.file).join(', '));

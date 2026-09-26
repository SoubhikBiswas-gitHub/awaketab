// Generates GuideOn / GuideVs / GuideLearn / GuideGuides from shared fragments that follow
// ContentArticle.dc.html (the approved article template). Run: node GuideGen.mjs
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const dir = new URL('./project/', import.meta.url);
const sizesFile = new URL('./GuideSizes.json', import.meta.url);
const SIZES = existsSync(sizesFile) ? JSON.parse(readFileSync(sizesFile, 'utf8')) : {};

const MONO = "'Geist Mono', ui-monospace, monospace";
const kicker = (txt, extra = '') => `<span style="font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: {{t.muted}}${extra}">${txt}</span>`;
const h2 = (id, txt) => `<h2 id="${id}" style="margin: 0; font-size: {{fs.h2}}; line-height: 1.2; font-weight: 600; letter-spacing: -0.02em; color: {{t.ink}}; text-wrap: balance">${txt}</h2>`;
const para = (txt, size = 'body', color = 'ink2') => `<p style="margin: 0; font-size: {{fs.${size}}}; line-height: ${size === 'lede' ? 1.6 : 1.7}; color: {{t.${color}}}; text-wrap: pretty">${txt}</p>`;
const code = (txt) => `<code style="font-family: ${MONO}; font-size: 0.86em; padding: 2px 6px; border-radius: 6px; background: {{t.track}}; color: {{t.ink}}; overflow-wrap: anywhere">${txt}</code>`;
const strong = (txt) => `<strong style="color: {{t.ink}}; font-weight: 600">${txt}</strong>`;
const section = (id, inner, gap = 16) => `      <section id="s-${id}" aria-labelledby="h-${id}" style="display: flex; flex-direction: column; gap: ${gap}px; min-width: 0">\n${inner}\n      </section>`;

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
.at-float{animation:at-float 7s ease-in-out infinite}
.at-prose a{text-decoration-thickness:1px;text-underline-offset:4px;transition:text-decoration-thickness .3s var(--ease)}
.at-prose a:hover{text-decoration-thickness:2px}
.at-row{transition:background-color .45s var(--ease)}
.at-row:hover{background-color:rgba(127,140,160,0.08)}
.at-chev{transition:transform .6s var(--ease)}
.at-code{scrollbar-width:thin;-webkit-overflow-scrolling:touch}
.at-bar{transition:transform .9s var(--ease)}
@keyframes at-in{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}
@keyframes at-halo{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.8);opacity:0}}
@keyframes at-spin{to{transform:rotate(360deg)}}
@keyframes at-aura{0%{transform:translate(-6%,-3%) scale(1)}100%{transform:translate(6%,4%) scale(1.12)}}
@keyframes at-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
</style>
</helmet>`;

const LOGO = `<svg width="26" height="26" viewBox="0 0 48 48" aria-hidden="true" style="overflow: visible"><path d="M32.8 11.4A16 16 0 1 1 15.2 11.4" fill="none" stroke="{{t.ink}}" stroke-width="4.5" stroke-linecap="round"></path><circle cx="24" cy="9" r="7.5" fill="{{tone}}" opacity="0.28"></circle><circle cx="24" cy="9" r="4.2" fill="{{tone}}" style="transition: fill .6s"></circle></svg>`;

const HEADER = `  <header style="position: relative; height: 64px; flex-shrink: 0; box-sizing: border-box; padding-inline: {{headPad}}; display: flex; align-items: center; justify-content: space-between; gap: 12px">
    <a href="#" aria-label="AwakeTab home" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: {{t.ink}}; font-weight: 600; font-size: 17px; letter-spacing: -0.01em; min-height: 44px">
      ${LOGO}
      AwakeTab
    </a>
    <sc-if value="{{isDesk}}" hint-placeholder-val="{{false}}">
      <nav aria-label="Main" style="display: flex; gap: 32px; font-size: 15px; font-weight: 500">
        <sc-for list="{{nav}}" as="n" hint-placeholder-count="4">
          <a href="#" aria-current="{{n.cur}}" style="color: {{n.ink}}; text-decoration: none; display: flex; align-items: center; gap: 8px; min-height: 44px"><sc-if value="{{n.on}}" hint-placeholder-val="{{false}}"><span aria-hidden="true" style="width: 6px; height: 6px; border-radius: 50%; background: {{p.lamp}}"></span></sc-if>{{n.label}}</a>
        </sc-for>
      </nav>
    </sc-if>
    <div role="radiogroup" aria-label="Theme" style="position: relative; display: grid; grid-template-columns: repeat(3, 44px); padding: 3px; border-radius: 999px; background: {{t.surface}}; border: 1px solid {{t.line}}">
      <div aria-hidden="true" class="at-slide" style="position: absolute; left: 3px; top: 3px; width: 44px; height: 44px; border-radius: 999px; background: {{t.chip}}; box-shadow: 0 1px 3px {{t.chipShadow}}; transform: translateX({{themeX}})"></div>
      <button role="radio" aria-checked="{{themeLight}}" aria-label="Light" title="Light" onClick="{{setLight}}" style="position: relative; height: 44px; border: 0; background: transparent; border-radius: 999px; color: {{themeLightInk}}; display: grid; place-items: center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"></path></svg></button>
      <button role="radio" aria-checked="{{themeDark}}" aria-label="Dark" title="Dark" onClick="{{setDark}}" style="position: relative; height: 44px; border: 0; background: transparent; border-radius: 999px; color: {{themeDarkInk}}; display: grid; place-items: center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"></path></svg></button>
      <button role="radio" aria-checked="{{themeAuto}}" aria-label="Auto, follows your system" title="Auto: follows your system" onClick="{{setAuto}}" style="position: relative; height: 44px; border: 0; background: transparent; border-radius: 999px; color: {{themeAutoInk}}; display: grid; place-items: center"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"></circle><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"></path></svg></button>
    </div>
  </header>`;

const VERIFIED_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="{{p.lamp}}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M8 12.5l2.7 2.7L16.5 9.5"></path></svg>`;

function headBlock({ hub, hubHref, crumb, h1, lede, note, noteKicker = 'Honest limit', stale = false, extra = '' }) {
  return `    <div style="grid-area: head; display: flex; flex-direction: column; gap: 20px; min-width: 0">
      <nav aria-label="Breadcrumb">
        <ol style="margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; align-items: center; column-gap: 8px; font-size: 14px; color: {{t.muted}}">
          <li style="display: flex; align-items: center; gap: 8px"><a href="#" style="color: {{t.ink2}}; text-decoration: none; min-height: 44px; display: flex; align-items: center">AwakeTab</a><span aria-hidden="true">›</span></li>
          <li style="display: flex; align-items: center; gap: 8px"><a href="${hubHref}" style="color: {{t.ink2}}; text-decoration: none; min-height: 44px; display: flex; align-items: center">${hub}</a><sc-if value="{{showCrumb}}" hint-placeholder-val="{{true}}"><span aria-hidden="true">›</span></sc-if></li>
          <sc-if value="{{showCrumb}}" hint-placeholder-val="{{true}}">
            <li aria-current="page" style="min-height: 44px; display: flex; align-items: center; color: {{t.muted}}">${crumb}</li>
          </sc-if>
        </ol>
      </nav>
      <h1 style="margin: 0; font-size: {{fs.h1}}; line-height: 1.06; font-weight: 600; letter-spacing: -0.035em; color: {{t.ink}}; text-wrap: balance">${h1}</h1>
      <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 10px 12px">
        <span style="display: inline-flex; align-items: center; gap: 8px; min-height: 32px; padding: 4px 14px 4px 11px; box-sizing: border-box; border-radius: 999px; border: 1px solid {{t.line2}}; font-size: 14px; font-weight: 500; color: {{t.ink2}}">
          ${VERIFIED_ICON}
          {{verifiedLabel}}
        </span>
${stale ? `        <sc-if value="{{isStale}}" hint-placeholder-val="{{false}}">
          <span class="at-in" style="display: inline-flex; align-items: center; gap: 8px; min-height: 32px; padding: 4px 14px 4px 11px; box-sizing: border-box; border-radius: 999px; background: {{warnSoft}}; border: 1px solid {{warnLine}}; font-size: 14px; font-weight: 500; color: {{t.ink}}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="{{warn}}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6"></path><path d="M20 4v4.5h-4.5"></path></svg>
            Last verified over 6 months ago — re-testing
          </span>
        </sc-if>
` : ''}        <span style="font-size: 14px; color: {{t.muted}}">By Soubhik Biswas</span>
      </div>
${lede ? `      <p style="margin: 0; font-size: {{fs.lede}}; line-height: 1.6; color: {{t.ink}}; text-wrap: pretty">${lede}</p>\n` : ''}${extra}      <div role="note" style="display: grid; grid-template-columns: 24px minmax(0, 1fr); column-gap: 14px; row-gap: 4px; padding: 18px 20px; border-radius: 20px; background: {{t.surface}}; border: 1px solid {{t.line}}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="{{t.ink2}}" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" style="margin-top: 1px"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v6M12 7.5v.01"></path></svg>
        <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0">
          ${kicker(noteKicker)}
          <p style="margin: 0; font-size: {{fs.note}}; line-height: 1.55; color: {{t.ink}}; text-wrap: pretty">${note}</p>
        </div>
      </div>
    </div>`;
}

const PILL = `<output aria-live="polite" class="at-slide" style="display: inline-flex; align-items: center; gap: 10px; height: 38px; padding: 0 17px 0 13px; box-sizing: border-box; border-radius: 999px; background: {{toneSoft}}; border: 1px solid {{toneLine}}; font-size: 15px; font-weight: 600; color: {{t.ink}}; white-space: nowrap">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style="overflow: visible; filter: drop-shadow(0 0 5px {{toneGlow}})"><path d="{{glyph}}" fill="{{glyphFill}}" stroke="{{tone}}" stroke-width="1.6" fill-rule="evenodd" stroke-linejoin="round"></path></svg>
            {{statusLabel}}
          </output>`;

function toolCard(area = 'tool', heading = '') {
  return `    <section id="tool" aria-label="{{toolAria}}" style="grid-area: ${area}; position: relative; overflow: hidden; border-radius: 28px; background: {{t.surface}}; border: 1px solid {{cardLine}}; box-shadow: {{cardShadow}}; min-width: 0">
      <div aria-hidden="true" class="at-aura" style="position: absolute; left: -20%; top: -30%; width: 140%; height: 160%; background: radial-gradient(40% 45% at 30% 50%, {{aura}} 0%, transparent 70%); pointer-events: none"></div>
      <div style="{{cardGrid}}">
${heading}        <div style="grid-area: top; display: flex; align-items: center; justify-content: space-between; gap: 8px 12px; flex-wrap: wrap">
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
              <div role="timer" aria-label="{{timerAria}}" style="font-family: ${MONO}; font-weight: 300; font-size: {{digitSize}}; line-height: 1; letter-spacing: -0.05em; font-variant-numeric: tabular-nums; color: {{numColor}}; transition: color .6s">{{bigA}}<span style="color: {{t.muted}}">{{bigB}}</span></div>
              <div style="font-size: 14px; color: {{t.muted}}; white-space: nowrap">{{metaA}} <span style="color: {{t.ink}}; font-weight: 500">{{metaB}}</span></div>
            </div>
          </div>
        </div>
        <div style="grid-area: len; min-width: 0">
          <div role="group" aria-label="Session length" style="position: relative; display: grid; grid-template-columns: repeat({{presetN}}, minmax(0, 1fr)); padding: 4px; border-radius: 999px; background: {{t.surface}}; border: 1px solid {{t.line}}">
            <div aria-hidden="true" class="at-slide" style="position: absolute; left: 4px; top: 4px; width: calc((100% - 8px) / {{presetN}}); height: 46px; box-sizing: border-box; border-radius: 999px; background: {{lampSoft}}; border: 1px solid {{lampLine}}; transform: translateX({{presetX}})"></div>
            <sc-for list="{{presets}}" as="c" hint-placeholder-count="5">
              <button aria-pressed="{{c.sel}}" aria-label="{{c.aria}}" onClick="{{c.pick}}" style="position: relative; height: 46px; padding: 0; border: 0; background: transparent; border-radius: 999px; font-size: {{presetFont}}; font-weight: {{c.weight}}; color: {{c.color}}; white-space: nowrap">{{c.label}}</button>
            </sc-for>
          </div>
        </div>
        <div style="grid-area: cta; min-width: 0">
          <sc-if value="{{isSetup}}" hint-placeholder-val="{{true}}">
            <button class="at-rise" onClick="{{start}}" style="width: 100%; height: 60px; border-radius: 20px; border: 0; background: {{p.lampFill}}; color: {{p.lampInk}}; font-size: 17px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 10px 30px -8px {{lampGlow}}">
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path d="M32.8 11.4A16 16 0 1 1 15.2 11.4" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"></path><circle cx="24" cy="9" r="4.6" fill="currentColor"></circle></svg>
              {{primaryLabel}}
            </button>
          </sc-if>
          <sc-if value="{{isRunning}}" hint-placeholder-val="{{false}}">
            <div class="at-rise" style="display: grid; grid-template-columns: {{runCols}}; gap: 10px">
              <sc-if value="{{canExtend}}" hint-placeholder-val="{{true}}">
                <button onClick="{{extend}}" style="height: 60px; border-radius: 20px; border: 1px solid {{t.line2}}; background: {{t.surface}}; font-size: 17px; font-weight: 600; color: {{t.ink}}">+15 min</button>
              </sc-if>
              <button onClick="{{stop}}" style="height: 60px; border-radius: 20px; border: 0; background: {{t.primaryBg}}; font-size: 17px; font-weight: 600; color: {{t.primaryInk}}">Stop</button>
            </div>
          </sc-if>
        </div>
        <p style="grid-area: note; margin: 0; font-size: 14px; line-height: 1.5; color: {{t.muted}}; text-align: {{noteAlign}}; text-wrap: pretty">{{note}}</p>
      </div>
    </section>`;
}

const TOC_ASIDE = `    <sc-if value="{{isDesk}}" hint-placeholder-val="{{false}}">
      <nav aria-label="On this page" style="grid-area: toc; align-self: start; position: sticky; top: 24px; display: flex; flex-direction: column; gap: 24px; padding-top: 58px">
        <div style="display: flex; flex-direction: column; gap: 2px">
          ${kicker('On this page', '; padding-bottom: 8px')}
          <sc-for list="{{toc}}" as="c" hint-placeholder-count="5">
            <a href="{{c.href}}" onClick="{{c.pick}}" aria-current="{{c.current}}" style="display: flex; align-items: center; gap: 10px; min-height: 44px; font-size: 14px; line-height: 1.3; font-weight: {{c.weight}}; color: {{c.ink}}; text-decoration: none">
              <span aria-hidden="true" class="at-slide" style="flex-shrink: 0; width: 6px; height: 6px; border-radius: 50%; background: {{c.dot}}"></span>
              {{c.label}}
            </a>
          </sc-for>
        </div>
        <a href="#tool" style="display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; border-radius: 20px; background: {{t.surface}}; border: 1px solid {{t.line}}; text-decoration: none; color: {{t.ink}}">
          <span style="display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600">
            <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true" style="overflow: visible; filter: drop-shadow(0 0 4px {{toneGlow}})"><path d="{{glyph}}" fill="{{glyphFill}}" stroke="{{tone}}" stroke-width="1.6"></path></svg>
            {{statusLabel}}
          </span>
          <span style="font-family: ${MONO}; font-size: 22px; font-weight: 300; font-variant-numeric: tabular-nums; color: {{numColor}}">{{bigA}}{{bigB}}</span>
          <span style="font-size: 13px; color: {{t.muted}}">Back to the tool ↑</span>
        </a>
      </nav>
    </sc-if>`;

const INLINE_AD = `      <aside aria-label="Advertisement" style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding-block: 8px">
        <span style="font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: {{t.muted}}">Advertisement</span>
        <div style="width: {{adW}}; height: {{adH}}; max-width: 100%; box-sizing: border-box; border-radius: 12px; border: 1px solid {{t.line}}; background: repeating-linear-gradient(135deg, transparent 0 11px, {{p.hatch}} 11px 12px), {{p.adBg}}; display: grid; place-items: center">
          <span style="font-family: ${MONO}; font-size: 12px; color: {{t.muted}}">{{adSize}}</span>
        </div>
      </aside>`;

const RAIL = `    <sc-if value="{{isDesk}}" hint-placeholder-val="{{false}}">
      <aside aria-label="Advertisement" style="grid-area: rail; align-self: start; position: sticky; top: 24px; display: flex; flex-direction: column; gap: 8px">
        <span style="font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: {{t.muted}}">Advertisement</span>
        <div style="width: 160px; height: 600px; box-sizing: border-box; border-radius: 12px; border: 1px solid {{t.line}}; background: repeating-linear-gradient(135deg, transparent 0 11px, {{p.hatch}} 11px 12px), {{p.adBg}}; display: grid; place-items: center">
          <span style="font-family: ${MONO}; font-size: 12px; color: {{t.muted}}">160 × 600</span>
        </div>
      </aside>
    </sc-if>`;

const FAQ = section('faq', `        ${h2('h-faq', 'Questions')}
        <div style="display: flex; flex-direction: column; border-top: 1px solid {{t.line}}">
          <sc-for list="{{faq}}" as="f" hint-placeholder-count="3">
            <div style="border-bottom: 1px solid {{t.line}}">
              <h3 style="margin: 0">
                <button id="{{f.qid}}" aria-expanded="{{f.open}}" aria-controls="{{f.aid}}" onClick="{{f.toggle}}" style="width: 100%; min-height: 60px; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 2px; border: 0; background: transparent; text-align: start; font-size: 17px; line-height: 1.4; font-weight: 600; color: {{t.ink}}">
                  <span style="text-wrap: pretty">{{f.q}}</span>
                  <span aria-hidden="true" style="flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; border: 1px solid {{t.line2}}; display: grid; place-items: center; color: {{t.ink2}}">
                    <svg class="at-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" style="transform: rotate({{f.rot}})"><path d="M12 5v14M5 12h14"></path></svg>
                  </span>
                </button>
              </h3>
              <sc-if value="{{f.isOpen}}" hint-placeholder-val="{{false}}">
                <p id="{{f.aid}}" role="region" aria-labelledby="{{f.qid}}" class="at-in" style="margin: 0; padding: 0 48px 20px 2px; font-size: 16px; line-height: 1.65; color: {{t.ink2}}; text-wrap: pretty">{{f.a}}</p>
              </sc-if>
            </div>
          </sc-for>
        </div>`);

function related(links) {
  return `      <nav aria-label="Related" style="display: flex; flex-direction: column; gap: 12px">
        <a href="#tool" style="align-self: flex-start; display: inline-flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 20px; border-radius: 999px; background: {{lampSoft}}; border: 1px solid {{lampLine}}; color: {{t.ink}}; font-size: 16px; font-weight: 600; text-decoration: none">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path d="M32.8 11.4A16 16 0 1 1 15.2 11.4" fill="none" stroke="{{p.lamp}}" stroke-width="5" stroke-linecap="round"></path><circle cx="24" cy="9" r="4.6" fill="{{p.lamp}}"></circle></svg>
          Start this session
        </a>
        <div style="display: flex; flex-wrap: wrap; column-gap: 24px; row-gap: 0; font-size: 16px">
${links.map(([label, href = '#']) => `          <a href="${href}" style="min-height: 44px; display: inline-flex; align-items: center; color: {{p.link}}">${label}</a>`).join('\n')}
        </div>
      </nav>
      <div style="display: flex; align-items: center; gap: 16px; padding: 20px; border-radius: 24px; background: {{t.surface}}; border: 1px solid {{t.line}}">
        <span aria-hidden="true" style="flex-shrink: 0; width: 48px; height: 48px; border-radius: 50%; background: {{lampSoft}}; border: 1px solid {{lampLine}}; display: grid; place-items: center; font-size: 15px; font-weight: 600; color: {{t.ink}}">SB</span>
        <div style="display: flex; flex-direction: column; gap: 2px">
          <span style="font-size: 16px; font-weight: 600; color: {{t.ink}}">Soubhik Biswas</span>
          <span style="font-size: 15px; color: {{t.ink2}}">Builds and tests AwakeTab. <a href="#" style="color: {{p.link}}">About AwakeTab</a></span>
        </div>
      </div>`;
}

const FOOTER = `  <div style="flex-grow: 1"></div>

  <footer style="flex-shrink: 0; margin-top: 64px; padding: 24px {{footPad}} 32px; border-top: 1px solid {{t.line}}; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 24px; font-size: 14px; color: {{t.muted}}">
    <span>No ads on the awake screen, now or later.</span>
    <div style="display: flex; flex-wrap: wrap; column-gap: 20px">
      <a href="#" style="min-height: 44px; display: inline-flex; align-items: center; color: {{t.ink2}}; text-decoration: none">Privacy</a>
      <a href="#" style="min-height: 44px; display: inline-flex; align-items: center; color: {{t.ink2}}; text-decoration: none">Terms</a>
      <a href="#" style="min-height: 44px; display: inline-flex; align-items: center; color: {{t.ink2}}; text-decoration: none">Changelog</a>
      <a href="#" style="min-height: 44px; display: inline-flex; align-items: center; color: {{t.ink2}}; text-decoration: none">Buy me a coffee</a>
    </div>
  </footer>`;

// ---------- Shared component logic ----------
const COMMON_JS = `const DARK = {
  surface: '#111826', line: '#1F2940', line2: '#33405C', ink: '#EAF0F7', ink2: '#B7C1D1', muted: '#8E9AAE',
  track: '#1A2336', tick: '#2A3752', primaryBg: '#EAF0F7', primaryInk: '#0A0E16', chip: '#26324B', chipShadow: 'rgba(0,0,0,0.4)'
};
const LIGHT = {
  surface: '#FFFFFF', line: '#DCE3EC', line2: '#C3CDDA', ink: '#0E1726', ink2: '#3A4659', muted: '#5B6779',
  track: '#E3E9F1', tick: '#CCD5E1', primaryBg: '#0E1726', primaryInk: '#F4F7FB', chip: '#E3EAF2', chipShadow: 'rgba(14,23,38,0.14)'
};
// Long-page ground: the same night lift as the tool, anchored to the top (ContentArticle).
const PAGE = {
  dark: { ground: 'radial-gradient(1400px 900px at 50% -160px, #13203A 0%, rgba(10,14,22,0) 72%), #0A0E16', lamp: '#5BE0E8', lampFill: '#5BE0E8', lampInk: '#04232A', link: '#5BE0E8', warn: '#F2B34C', bad: '#FF7A7A', hatch: 'rgba(234,240,247,0.04)', adBg: 'rgba(17,24,38,0.55)' },
  light: { ground: 'radial-gradient(1400px 900px at 50% -160px, #FFFFFF 0%, rgba(242,246,250,0) 72%), #F2F6FA', lamp: '#087B87', lampFill: '#087B87', lampInk: '#FFFFFF', link: '#087B87', warn: '#B7791F', bad: '#D14343', hatch: 'rgba(14,23,38,0.045)', adBg: 'rgba(255,255,255,0.6)' }
};
const PRESETS = [['p15', '15m', '15 minutes', 900], ['p30', '30m', '30 minutes', 1800], ['p45', '45m', '45 minutes', 2700], ['p60', '1h', '1 hour', 3600], ['p120', '2h', '2 hours', 7200], ['p240', '4h', '4 hours', 14400], ['pinf', 'No limit', 'No limit', 0]];
const PHONE_PRESETS = ['p15', 'p30', 'p60', 'p120', 'pinf'];
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
    if (!sec) return 'no limit';
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
    const rows = phone ? PRESETS.filter((x) => PHONE_PRESETS.includes(x[0])) : PRESETS;
    const pi = Math.max(0, rows.findIndex((x) => x[0] === s.preset));
    const presets = rows.map(([id, label, aria]) => Object.assign({ label, aria, sel: s.preset === id ? 'true' : 'false', pick: () => this.pick(id) }, sel(s.preset === id)));
    const [W, H] = (SIZES[layout] || [390, 4000]);
    const pad = desk ? 56 : tab ? 70 : 16;
    const ringPx = desk ? 280 : tab ? 260 : 236;
    const cardGrid = desk
      ? 'position: relative; display: grid; grid-template-columns: ' + ringPx + 'px minmax(0, 1fr); grid-template-areas: "clock top" "clock len" "clock cta" "clock note"; column-gap: 48px; row-gap: 18px; align-items: center; padding: 32px 36px'
      : 'position: relative; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-areas: "top" "clock" "len" "cta" "note"; row-gap: ' + (tab ? 22 : 18) + 'px; padding: ' + (tab ? '28px 32px' : '18px 16px 20px');
    const toc = TOC.map(([id, label]) => {
      const on = s.toc === id;
      return { href: '#' + id, label, current: on ? 'location' : 'false', weight: on ? 600 : 500, ink: on ? t.ink : t.ink2, dot: on ? p.lamp : 'transparent', pick: () => this.setState({ toc: id }) };
    });
    const faq = FAQS.map(([q, a], i) => {
      const open = s.faqOpen === i;
      return { q, a, qid: 'faq-q' + i, aid: 'faq-a' + i, open: open ? 'true' : 'false', isOpen: open, rot: open ? '45deg' : '0deg', toggle: () => this.setState({ faqOpen: this.state.faqOpen === i ? -1 : i }) };
    });
    const nav = [['Use cases', 'for'], ['Devices', 'on'], ['Extension', 'ext'], ['Pro', 'pro']].map(([label, id]) => ({ label, on: NAV === id, cur: NAV === id ? 'page' : 'false', ink: NAV === id ? t.ink : t.ink2 }));
    const ctx = { s, layout, desk, tab, phone, dark, t, p };
    const base = {
      W: W + 'px', H: H + 'px', isDesk: desk, isTab: tab, isPhone: phone, showCrumb: !phone, t, p, tone, nav,
      headPad: desk ? '56px' : tab ? '70px' : '20px 12px', footPad: desk ? '56px' : tab ? '70px' : '20px',
      shellStyle: SHELL(desk, tab, pad), cardGrid,
      fs: desk ? { h1: '56px', h2: '28px', h3: '20px', lede: '21px', body: '18px', note: '17px', quote: '34px', code: '15px' }
        : tab ? { h1: '48px', h2: '27px', h3: '20px', lede: '21px', body: '18px', note: '17px', quote: '32px', code: '15px' }
          : { h1: '36px', h2: '24px', h3: '18px', lede: '19px', body: '17px', note: '16px', quote: '27px', code: '13.5px' },
      gap: { section: desk || tab ? '56px' : '44px' },
      verifiedLabel: 'Last verified: ' + (this.verified ? this.verified() : '9 September 2026'),
      warn: p.warn, warnSoft: this.rgba(p.warn, 0.12), warnLine: this.rgba(p.warn, 0.45),
      toolAria: TOOL_ARIA, cardKicker: CARD_KICKER,
      cardLine: live ? this.rgba(p.lamp, 0.35) : t.line,
      cardShadow: live ? '0 24px 60px -30px ' + this.rgba(p.lamp, dark ? 0.55 : 0.4) : (dark ? '0 24px 60px -36px rgba(0,0,0,0.8)' : '0 24px 50px -34px rgba(14,23,38,0.28)'),
      aura: this.rgba(p.lamp, live ? (dark ? 0.2 : 0.14) : 0.05),
      toneSoft: this.rgba(tone, 0.12), toneLine: this.rgba(tone, 0.38), toneGlow: live ? this.rgba(tone, 0.8) : 'transparent', toneFaint: this.rgba(faceColor, dark ? 0.16 : 0.12),
      glyph: GLYPHS.dot, glyphFill: mode === 'awake' ? tone : 'transparent', statusLabel: LABEL[mode],
      lampGlow: this.rgba(p.lamp, 0.5), lampSoft: this.rgba(p.lamp, 0.12), lampLine: this.rgba(p.lamp, 0.4),
      live, faceColor, ringPx: ringPx + 'px', digitSize: hours ? (desk ? '48px' : '42px') : (desk ? '62px' : '54px'),
      kicker, bigA, bigB, metaA, metaB, numColor: live ? t.ink : t.ink2,
      timerAria: shown === null ? 'No limit' : bigA + bigB + ' ' + (live && noLimit ? 'awake so far' : 'left'),
      arcDash: prog <= 0 ? '0.01 ' + RC.toFixed(1) : (RC * prog).toFixed(1) + ' ' + RC.toFixed(1),
      arcOp: setup ? 0.45 : 1, glowOp: live ? 0.45 : 0,
      tipDeg: (360 * prog).toFixed(2) + 'deg', tipOp: live && !noLimit && prog > 0 ? 1 : 0,
      presets, presetN: rows.length, presetX: pi * 100 + '%', presetFont: desk ? '13px' : phone ? '14px' : '15px',
      primaryLabel: 'Keep awake · ' + this.words(s.total),
      isSetup: setup, isRunning: live, canExtend: !noLimit, runCols: noLimit ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))',
      start: () => this.start(), stop: () => this.stop(),
      extend: () => this.setState({ left: this.state.left + 900, total: this.state.total + 900 }),
      note: NOTE[mode], noteAlign: desk ? 'start' : 'center',
      toc, faq,
      adW: phone ? '300px' : '336px', adH: phone ? '250px' : '280px', adSize: phone ? '300 × 250' : '336 × 280',
      themeAuto: s.theme === 'auto', themeLight: s.theme === 'light', themeDark: s.theme === 'dark',
      themeX: (s.theme === 'light' ? 0 : s.theme === 'dark' ? 44 : 88) + 'px',
      themeLightInk: s.theme === 'light' ? t.ink : t.muted, themeDarkInk: s.theme === 'dark' ? t.ink : t.muted, themeAutoInk: s.theme === 'auto' ? t.ink : t.muted,
      setLight: () => this.setState({ theme: 'light' }), setDark: () => this.setState({ theme: 'dark' }), setAuto: () => this.setState({ theme: 'auto' })
    };
    return Object.assign(base, this.pageVals(ctx));
  }
`;

function page({ file, title, props, pageConsts, pageMethods, body, preview }) {
  const sizes = SIZES[file] || { phone: [390, 5000], tablet: [820, 4600], desktop: [1280, 4200] };
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

// Desktop shell used by On, Learn and Guides: toc | article | rail, tool card spanning article + rail.
const SHELL_STD = `const SHELL = (desk, tab, pad) => desk
  ? 'position: relative; display: grid; grid-template-columns: 200px 680px 160px; grid-template-areas: "toc head ." "toc tool tool" "toc body rail"; column-gap: 64px; row-gap: 40px; padding: 24px ' + pad + 'px 0; align-items: start'
  : 'position: relative; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-areas: "head" "tool" "body"; row-gap: ' + (tab ? 40 : 28) + 'px; padding: ' + (tab ? 24 : 8) + 'px ' + pad + 'px 0';`;

const FAQ_BASE = `  ['Will this keep Teams or Slack Available?', 'No. Those products follow input idle. AwakeTab never moves the mouse or presses keys, including for this scenario.'],
  ['What browsers are in scope?', 'Native lock: Chrome 84+, Edge 84+, Firefox 126+, Safari 16.4+, Samsung Internet 14+. Older Firefox can use the video fallback after a tap. Versions come from the 9 September 2026 matrix.']`;

const pages = [];

// =====================================================================================
// 1. GuideOn: /on/iphone-safari
// =====================================================================================
{
  const stepFrame = `              <figure style="margin: 0; width: {{frameW}}; height: {{frameH}}; flex-shrink: 0; box-sizing: border-box; border-radius: 22px; border: 1.5px dashed {{t.line2}}; background: repeating-linear-gradient(135deg, transparent 0 11px, {{p.hatch}} 11px 12px), {{t.surface}}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 14px; text-align: center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="{{t.muted}}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="3"></rect><circle cx="9" cy="10" r="1.8"></circle><path d="M20.5 16l-5-5-8 8.5"></path></svg>
                <span style="font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}">Screenshot</span>
                <figcaption style="font-size: 13px; line-height: 1.4; color: {{t.ink2}}; text-wrap: balance">{{st.shot}}</figcaption>
              </figure>`;
  const steps = section('steps', `        ${h2('h-steps', 'Set it up on iPhone')}
        ${para('Five steps, in this order. The screenshots are placeholders until the next test run on iOS 18.')}
        <ol style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 14px">
          <sc-for list="{{steps}}" as="st" hint-placeholder-count="5">
            <li id="{{st.id}}" style="display: grid; grid-template-columns: {{stepCols}}; gap: {{stepGap}}; align-items: start; padding: {{stepPad}}; border-radius: 24px; background: {{t.surface}}; border: 1px solid {{t.line}}">
              <div style="display: flex; flex-direction: column; gap: 10px; min-width: 0">
                <span aria-hidden="true" style="width: 36px; height: 36px; border-radius: 50%; background: {{lampSoft}}; border: 1px solid {{lampLine}}; display: grid; place-items: center; font-family: ${MONO}; font-size: 15px; font-weight: 500; color: {{t.ink}}">{{st.n}}</span>
                <h3 style="margin: 0; font-size: {{fs.h3}}; line-height: 1.3; font-weight: 600; color: {{t.ink}}; text-wrap: balance"><span style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%)">Step {{st.n}}: </span>{{st.title}}</h3>
                <span style="align-self: flex-start; max-width: 100%; box-sizing: border-box; font-family: ${MONO}; font-size: 13px; line-height: 1.4; padding: 5px 10px; border-radius: 10px; background: {{t.track}}; color: {{t.ink}}">{{st.path}}</span>
                <p style="margin: 0; font-size: {{stepBody}}; line-height: 1.6; color: {{t.ink2}}; text-wrap: pretty">{{st.body}}</p>
              </div>
${stepFrame}
            </li>
          </sc-for>
        </ol>`);
  const resultGlyph = (o) => `<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style="flex-shrink: 0; overflow: visible"><path d="{{${o}.glyph}}" fill="{{${o}.fill}}" stroke="{{${o}.tone}}" stroke-width="1.6" fill-rule="evenodd" stroke-linejoin="round"></path></svg>`;
  const resultChip = (o) => `<span style="display: inline-flex; align-items: center; gap: 8px; min-height: 30px; padding: 3px 12px 3px 10px; box-sizing: border-box; border-radius: 999px; background: {{${o}.soft}}; border: 1px solid {{${o}.line}}; font-size: 14px; font-weight: 600; color: {{t.ink}}; white-space: nowrap">${resultGlyph(o)}{{${o}.label}}</span>`;
  const matrix = section('matrix', `        ${h2('h-matrix', 'What works on iPhone, and what does not')}
        ${para('Tested on iPhone with Safari. Each result has a glyph and a word, so it reads without colour.')}
        <sc-if value="{{tableView}}" hint-placeholder-val="{{false}}">
          <div style="border-radius: 24px; border: 1px solid {{t.line}}; background: {{t.surface}}; overflow: hidden">
            <table style="width: 100%; border-collapse: collapse; font-size: 15px; line-height: 1.5">
              <caption style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%)">iPhone Safari results, 9 September 2026</caption>
              <thead>
                <tr style="background: {{t.track}}">
                  <th scope="col" style="text-align: start; padding: 12px 18px; font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: {{t.muted}}; width: 34%">Situation</th>
                  <th scope="col" style="text-align: start; padding: 12px 18px; font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: {{t.muted}}; width: 26%">Result</th>
                  <th scope="col" style="text-align: start; padding: 12px 18px; font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: {{t.muted}}">What to do</th>
                </tr>
              </thead>
              <tbody>
                <sc-for list="{{works}}" as="w" hint-placeholder-count="8">
                  <tr style="border-top: 1px solid {{t.line}}">
                    <th scope="row" style="text-align: start; vertical-align: top; padding: 14px 18px; font-weight: 600; color: {{t.ink}}">{{w.what}}</th>
                    <td style="vertical-align: top; padding: 12px 18px">${resultChip('w')}</td>
                    <td style="vertical-align: top; padding: 14px 18px; color: {{t.ink2}}; text-wrap: pretty">{{w.fix}}</td>
                  </tr>
                </sc-for>
              </tbody>
            </table>
          </div>
        </sc-if>
        <sc-if value="{{listView}}" hint-placeholder-val="{{true}}">
          <ul aria-label="iPhone Safari results, 9 September 2026" style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; border-radius: 24px; border: 1px solid {{t.line}}; background: {{t.surface}}; overflow: hidden">
            <sc-for list="{{works}}" as="w" hint-placeholder-count="8">
              <li style="display: flex; flex-direction: column; gap: 8px; padding: 16px 16px 18px; border-top: {{w.sep}}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px">
                  <span style="font-size: 16px; font-weight: 600; line-height: 1.4; color: {{t.ink}}; text-wrap: pretty">{{w.what}}</span>
                  ${resultChip('w')}
                </div>
                <span style="font-size: 15px; line-height: 1.55; color: {{t.ink2}}; text-wrap: pretty">{{w.fix}}</span>
              </li>
            </sc-for>
          </ul>
        </sc-if>`);
  const success = section('success', `        ${h2('h-success', 'What success looks like')}
        ${para('Success is a pill that matches the browser. If iPhone still dims, something else is in charge: a hidden tab, another app in front, or a session that never got its tap. Tapping Start again without changing that repeats the same result.')}
        ${para('A lit screen costs battery, so plug in for long sessions. Do not leave an unattended phone as a safety monitor.')}`);
  const body = `${headBlock({ hub: 'Use AwakeTab on your device', hubHref: '#', crumb: 'iPhone in Safari', h1: 'Keep iPhone on in Safari', stale: true,
    lede: 'Safari on iPhone gained a native screen wake lock in 16.4. Low Power Mode still greys out Auto-Lock Never and forces a short lock. Leaving Safari releases the lock until you come back.',
    extra: `      <div style="display: flex; flex-wrap: wrap; gap: 8px">
        <span style="display: inline-flex; align-items: center; min-height: 32px; padding: 4px 12px; box-sizing: border-box; border-radius: 10px; background: {{t.track}}; font-size: 14px; color: {{t.ink}}"><span style="color: {{t.muted}}; margin-inline-end: 6px">Safari</span><span style="font-family: ${MONO}">16.4+</span></span>
        <span style="display: inline-flex; align-items: center; min-height: 32px; padding: 4px 12px; box-sizing: border-box; border-radius: 10px; background: {{t.track}}; font-size: 14px; color: {{t.ink}}"><span style="color: {{t.muted}}; margin-inline-end: 6px">Home Screen app</span><span style="font-family: ${MONO}">iOS 18.4+</span></span>
        <span style="display: inline-flex; align-items: center; min-height: 32px; padding: 4px 12px; box-sizing: border-box; border-radius: 10px; background: {{t.track}}; font-size: 14px; color: {{t.ink}}"><span style="color: {{t.muted}}; margin-inline-end: 6px">Extension</span>not available</span>
      </div>
`,
    note: 'Safari 16.4+ only; Low Power Mode forces 30 s Auto-Lock; switching apps releases the lock.' })}

${toolCard()}

${TOC_ASIDE}

    <article class="at-prose" style="grid-area: body; display: flex; flex-direction: column; gap: {{gap.section}}; min-width: 0">
${steps}

${INLINE_AD}

${matrix}

${success}

${FAQ}

${related([['Use AwakeTab on your device'], ['iPhone Auto-Lock Never is greyed out', 'GuideGuidesPhoneDark.dc.html'], ['Keep the screen on in Windows 10'], ['PowerToys Awake vs a tab']])}
    </article>

${RAIL}`;
  pages.push({
    file: 'GuideOn.dc.html', title: 'iPhone in Safari', body,
    props: { stale: { editor: 'boolean', default: false } },
    pageConsts: `const PRESET0 = 'p30';
const NAV = 'on';
const TOOL_ARIA = 'Keep iPhone on in Safari: tool';
const CARD_KICKER = 'Suggested · 30 min';
${SHELL_STD}
const TOC = [['s-steps', 'Set it up on iPhone'], ['s-matrix', 'What works'], ['s-success', 'What success looks like'], ['s-faq', 'Questions']];
const FAQS = [
  ['Does it keep working when Safari is in the background?', 'No. The lock is released when the tab is hidden. Return to the tab and wait for the pill to say Screen awake or Awake via video fallback.'],
${FAQ_BASE}
];
const STEPS = [
  ['Check your iOS version', 'Settings › General › About', 'Safari updates with iOS. The wake lock needs iOS 16.4 or later.', 'Settings › General › About, iOS version row'],
  ['Open AwakeTab in Safari and tap', 'awaketab.com › Keep awake', 'Safari needs one tap before it grants the lock, so the session starts from your tap. Then wait for the pill: it, not the button, tells you it worked.', 'AwakeTab in Safari, pill reads Screen awake'],
  ['Keep Safari in front', 'Do not switch apps or lock the phone', 'Another app or the lock button releases the lock. Come back to Safari and AwakeTab asks again by itself.', 'The pill after switching apps and back'],
  ['Know what happens when you leave', 'Settings › Display & Brightness › Auto-Lock', 'Outside AwakeTab, Auto-Lock is in charge again. With Low Power Mode on, it is capped at 30 seconds.', 'Auto-Lock list with Low Power Mode on'],
  ['Optional: add it to the Home Screen', 'Share › Add to Home Screen', 'The Home Screen app can hold the lock from iOS 18.4. On older iOS, stay in Safari.', 'Share sheet with Add to Home Screen']
];
// kind: works | pauses | blocked | fallback | no
const WORKS = [
  ['Safari 16.4 or later, tab in front', 'works', 'Works', 'Nothing. The pill says Screen awake.'],
  ['Low Power Mode on, tab in front', 'works', 'Works', 'Nothing while you stay. Auto-Lock drops to 30 seconds once you leave.'],
  ['Session started without a tap, for example after a reload', 'blocked', 'Blocked', 'Tap Try again. Safari needs one tap to start.'],
  ['Another app opened, or phone locked', 'pauses', 'Pauses', 'Go back to Safari. AwakeTab asks again by itself.'],
  ['Home Screen app, iOS 18.4 or later', 'works', 'Works', 'Same as Safari.'],
  ['Home Screen app before iOS 18.4', 'no', 'Not supported', 'Use AwakeTab in Safari instead.'],
  ['Safari before 16.4', 'fallback', 'Video fallback', 'Tap once to start it. It uses a little more battery.'],
  ['AwakeTab browser extension', 'no', 'Not available', 'Safari has no power API for extensions.'],
  ['Teams or Slack status', 'no', 'Never', 'AwakeTab never moves the mouse or presses keys.']
];`,
    pageMethods: `  initPage(props) { return {}; }
  stale() { return this.props.stale === true || this.props.stale === 'true'; }
  verified() { return this.stale() ? '9 March 2026' : '9 September 2026'; }
  pageVals(c) {
    const { t, p, desk, tab, phone } = c;
    const K = {
      works: [p.lamp, GLYPHS.dot, true], fallback: [p.lamp, GLYPHS.ring, true],
      pauses: [p.warn, GLYPHS.pause, true], blocked: [p.bad, GLYPHS.tri, true], no: [t.muted, GLYPHS.dash, true]
    };
    return {
      isStale: this.stale(),
      steps: STEPS.map(([title, path, body, shot], i) => ({ id: 'step-' + (i + 1), n: i + 1, title, path, body, shot: 'Placeholder: ' + shot })),
      stepCols: desk ? 'minmax(0, 1fr) 176px' : tab ? 'minmax(0, 1fr) 176px' : 'minmax(0, 1fr) 118px',
      stepGap: phone ? '14px' : '28px', stepPad: phone ? '16px' : '22px 24px',
      stepBody: phone ? '15px' : '16px',
      frameW: phone ? '118px' : '176px', frameH: phone ? '232px' : '346px',
      tableView: !phone, listView: phone,
      works: WORKS.map(([what, kind, label, fix], i) => {
        const [tone, glyph] = K[kind];
        return { what, label, fix, tone, glyph, fill: kind === 'fallback' ? tone : kind === 'no' ? tone : tone, soft: this.rgba(tone, 0.1), line: this.rgba(tone, 0.4), sep: i ? '1px solid ' + t.line : '0' };
      })
    };
  }
`
  });
}

// =====================================================================================
// 2. GuideVs: /vs/nosleep-page
// =====================================================================================
{
  const cmpTable = section('compare', `        ${h2('h-compare', 'Side by side')}
        ${para('Checked against nosleep.page on 9 September 2026. Rows marked Same are real ties.')}
        <sc-if value="{{tableView}}" hint-placeholder-val="{{false}}">
          <div style="border-radius: 24px; border: 1px solid {{t.line}}; background: {{t.surface}}; overflow: hidden">
            <table style="width: 100%; border-collapse: collapse; font-size: 15px; line-height: 1.5; table-layout: fixed">
              <caption style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%)">AwakeTab compared with nosleep.page, 9 September 2026</caption>
              <colgroup><col style="width: 28%"><col style="width: 36%"><col style="width: 36%"></colgroup>
              <thead>
                <tr style="background: {{t.track}}">
                  <th scope="col" style="text-align: start; padding: 14px 18px; font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: {{t.muted}}">What</th>
                  <th scope="col" style="text-align: start; padding: 14px 18px; font-size: 15px; font-weight: 600; color: {{t.ink}}"><span style="display: inline-flex; align-items: center; gap: 8px"><span aria-hidden="true" style="width: 8px; height: 8px; border-radius: 50%; background: {{p.lamp}}"></span>AwakeTab</span></th>
                  <th scope="col" style="text-align: start; padding: 14px 18px; font-size: 15px; font-weight: 600; color: {{t.ink}}"><span style="display: inline-flex; align-items: center; gap: 8px"><span aria-hidden="true" style="width: 8px; height: 8px; box-sizing: border-box; border-radius: 50%; border: 1.5px solid {{t.ink2}}"></span>nosleep.page</span></th>
                </tr>
              </thead>
              <tbody>
                <sc-for list="{{rows}}" as="r" hint-placeholder-count="9">
                  <tr style="border-top: 1px solid {{t.line}}">
                    <th scope="row" style="text-align: start; vertical-align: top; padding: 15px 18px; font-weight: 600; color: {{t.ink}}; text-wrap: pretty">{{r.what}}<sc-if value="{{r.same}}" hint-placeholder-val="{{false}}"><span style="display: block; margin-top: 6px; font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: {{t.muted}}">Same</span></sc-if></th>
                    <td style="vertical-align: top; padding: 15px 18px; color: {{t.ink}}; text-wrap: pretty">{{r.us}}</td>
                    <td style="vertical-align: top; padding: 15px 18px; color: {{r.themInk}}; text-wrap: pretty">{{r.them}}</td>
                  </tr>
                </sc-for>
              </tbody>
            </table>
          </div>
        </sc-if>
        <sc-if value="{{listView}}" hint-placeholder-val="{{true}}">
          <ul aria-label="AwakeTab compared with nosleep.page, 9 September 2026" style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px">
            <sc-for list="{{rows}}" as="r" hint-placeholder-count="9">
              <li style="display: flex; flex-direction: column; gap: 12px; padding: 16px; border-radius: 22px; background: {{t.surface}}; border: 1px solid {{t.line}}">
                <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px">
                  <span style="font-size: 16px; font-weight: 600; color: {{t.ink}}">{{r.what}}</span>
                  <sc-if value="{{r.same}}" hint-placeholder-val="{{false}}"><span style="font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: {{t.muted}}">Same</span></sc-if>
                </div>
                <dl style="margin: 0; display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 8px 12px; font-size: 15px; line-height: 1.5">
                  <dt style="display: flex; align-items: baseline; gap: 8px; font-weight: 600; color: {{t.ink}}"><span aria-hidden="true" style="width: 7px; height: 7px; border-radius: 50%; background: {{p.lamp}}; flex-shrink: 0; transform: translateY(-1px)"></span>AwakeTab</dt>
                  <dd style="margin: 0; color: {{t.ink}}; text-wrap: pretty">{{r.us}}</dd>
                  <dt style="display: flex; align-items: baseline; gap: 8px; font-weight: 600; color: {{t.ink2}}"><span aria-hidden="true" style="width: 7px; height: 7px; box-sizing: border-box; border-radius: 50%; border: 1.5px solid {{t.ink2}}; flex-shrink: 0; transform: translateY(-1px)"></span>nosleep.page</dt>
                  <dd style="margin: 0; color: {{r.themInk}}; text-wrap: pretty">{{r.them}}</dd>
                </dl>
              </li>
            </sc-for>
          </ul>
        </sc-if>`);
  const better = section('better', `        ${h2('h-better', 'When nosleep.page is the better tool')}
        ${para('Pick the tool that fits the job. These are the cases where we would send you there.')}
        <ol style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; border-top: 1px solid {{t.line}}">
          <sc-for list="{{better}}" as="b" hint-placeholder-count="3">
            <li style="display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: 14px; padding: 18px 0; border-bottom: 1px solid {{t.line}}">
              <span aria-hidden="true" style="font-family: ${MONO}; font-size: 15px; color: {{t.muted}}; padding-top: 2px">{{b.n}}</span>
              <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0">
                <span style="font-size: 17px; font-weight: 600; line-height: 1.4; color: {{t.ink}}; text-wrap: pretty">{{b.title}}</span>
                <span style="font-size: {{fs.body}}; line-height: 1.6; color: {{t.ink2}}; text-wrap: pretty">{{b.body}}</span>
              </div>
            </li>
          </sc-for>
        </ol>`);
  const verdict = section('verdict', `        ${kicker('Verdict')}
        <h2 id="h-verdict" style="margin: 0; font-size: {{fs.quote}}; line-height: 1.2; font-weight: 500; letter-spacing: -0.02em; color: {{t.ink}}; text-wrap: balance">Same lock, same limits. <span style="color: {{p.link}}">AwakeTab tells you when it is really working.</span></h2>
        ${para('Both are browser tabs that ask for the same wake lock, and both stop when the tab is hidden. Choose AwakeTab when you need to see that the lock is held, end at a clock time, or pick up after a reload. Choose nosleep.page when one round button and your own colours are all you want.')}`, 16);
  const tryIt = `      <div style="display: flex; flex-direction: column; gap: 16px; min-width: 0">
        ${h2('h-try', 'Try it here')}
${toolCard('auto')}
      </div>`;
  const body = `${headBlock({ hub: 'Compare screen-awake tools', hubHref: '#', crumb: 'nosleep.page', h1: 'nosleep.page vs AwakeTab',
    lede: 'nosleep.page is also a tab. Hidden, both release. AwakeTab adds a seven-state pill, until-time, session restore and a documented fallback. Compare them as browsers, not as magic.',
    noteKicker: 'Honest scope',
    note: 'Both are tabs and both release when hidden; the difference is honest status, until-time and persistence. Facts dated 9 September 2026.' })}

${TOC_ASIDE}

    <article class="at-prose" style="grid-area: body; display: flex; flex-direction: column; gap: {{gap.section}}; min-width: 0">
${cmpTable}

${INLINE_AD}

${better}

${verdict}
    </article>

    <div id="s-try" style="grid-area: tool; display: flex; flex-direction: column; gap: 16px; min-width: 0">
      ${h2('h-try', 'Try it here')}
${toolCard('auto')}
    </div>

    <div class="at-prose" style="grid-area: tail; display: flex; flex-direction: column; gap: {{gap.section}}; min-width: 0">
${FAQ}

${related([['Compare screen-awake tools'], ['Android timeout for a single app'], ['Low Power Mode and wake locks'], ['Keep a dashboard screen switched on']])}
    </div>

${RAIL}`;
  pages.push({
    file: 'GuideVs.dc.html', title: 'nosleep.page vs AwakeTab', body, props: {},
    pageConsts: `const PRESET0 = 'pinf';
const NAV = '';
const TOOL_ARIA = 'nosleep.page vs AwakeTab: tool';
const CARD_KICKER = 'Suggested · no limit';
const SHELL = (desk, tab, pad) => desk
  ? 'position: relative; display: grid; grid-template-columns: 200px 680px 160px; grid-template-areas: "toc head ." "toc body rail" "toc tool tool" "toc tail ."; column-gap: 64px; row-gap: 56px; padding: 24px ' + pad + 'px 0; align-items: start'
  : 'position: relative; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-areas: "head" "body" "tool" "tail"; row-gap: ' + (tab ? 56 : 44) + 'px; padding: ' + (tab ? 24 : 8) + 'px ' + pad + 'px 0';
const TOC = [['s-compare', 'Side by side'], ['s-better', 'When nosleep.page is better'], ['s-verdict', 'Verdict'], ['s-try', 'Try it here'], ['s-faq', 'Questions']];
const FAQS = [
  ['Does either one work in a hidden tab?', 'No. The lock is released when the document is hidden. Return to the tab and wait for the pill to say Screen awake or Awake via video fallback.'],
${FAQ_BASE}
];
// what, AwakeTab, nosleep.page, same?, nosleep.page is ahead?
const ROWS = [
  ['What it is', 'A browser tab', 'A browser tab', true],
  ['When the tab is hidden', 'Releases. The pill says Paused — tab hidden.', 'Releases.', true],
  ['Status you see', 'Seven-state pill. Screen awake appears only once the browser grants the lock.', 'A ring and a timer that start when you click.', false],
  ['Lengths', '15 min to 4 h, no limit, or custom up to 7 days', '30 min, 1 hr, 2 hr or custom', false],
  ['End at a clock time', 'Until a time, for example 7:30 AM', 'Not offered', false],
  ['After a reload', 'Offers to resume with the time you had left', 'Not offered', false],
  ['If the browser refuses', 'Says Blocked and names the fix', 'General tips in its FAQ', false],
  ['Stats', 'Today, this week, streak and all time', 'Today and this week', false],
  ['Colours', 'Four lamp colours, light and dark', 'Any ring and background colour', false, true]
];
const BETTER = [
  ['You want one round button and nothing else', 'nosleep.page is a single ring you click. AwakeTab shows more: a status pill, an end time and length presets.'],
  ['You want your own colours', 'nosleep.page lets you pick any ring and background colour. AwakeTab offers four lamp colours.'],
  ['It already works for you', 'Both ask for the same browser lock and both stop when the tab is hidden, so switching will not keep your screen on any longer.']
];`,
    pageMethods: `  initPage(props) { return {}; }
  pageVals(c) {
    const { t, phone } = c;
    return {
      tableView: !phone, listView: phone,
      rows: ROWS.map(([what, us, them, same, ahead]) => ({ what, us, them, same: !!same, themInk: ahead ? t.ink : t.ink2 })),
      better: BETTER.map(([title, body], i) => ({ n: '0' + (i + 1), title, body }))
    };
  }
`
  });
}

// =====================================================================================
// 3. GuideLearn: /learn/screen-wake-lock-api-guide
// =====================================================================================
{
  const codeBlock = (id, label) => `        <div style="border-radius: 20px; border: 1px solid {{t.line}}; background: {{codeBg}}; overflow: hidden; min-width: 0">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 6px 4px 16px; border-bottom: 1px solid {{t.line}}">
            <span style="font-family: ${MONO}; font-size: 13px; color: {{t.muted}}">{{${id}.file}}</span>
            <button onClick="{{${id}.copy}}" aria-label="{{${id}.aria}}" style="display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 14px; border-radius: 14px; border: 0; background: {{${id}.btnBg}}; font-size: 14px; font-weight: 600; color: {{${id}.btnInk}}">
              <sc-if value="{{${id}.copied}}" hint-placeholder-val="{{false}}"><svg class="at-in" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></sc-if>
              <sc-if value="{{${id}.idle}}" hint-placeholder-val="{{true}}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"></rect><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"></path></svg></sc-if>
              <span aria-live="polite">{{${id}.label}}</span>
            </button>
          </div>
          <div class="at-code" role="region" tabindex="0" aria-label="${label}" style="overflow-x: auto; overflow-y: hidden; max-width: 100%">
            <pre style="margin: 0; padding: 16px 20px 18px 0; min-width: max-content; font-family: ${MONO}; font-size: {{fs.code}}; line-height: 1.65; color: {{t.ink}}"><code style="display: block"><sc-for list="{{${id}.lines}}" as="ln" hint-placeholder-count="6"><span style="display: flex; min-height: 1.65em"><span aria-hidden="true" style="flex-shrink: 0; width: 44px; padding-inline-end: 16px; box-sizing: border-box; text-align: end; color: {{lnInk}}; user-select: none">{{ln.n}}</span><span style="white-space: pre"><sc-for list="{{ln.toks}}" as="tk" hint-placeholder-count="3"><span style="color: {{tk.c}}; font-style: {{tk.fs}}; font-weight: {{tk.fw}}">{{tk.x}}</span></sc-for></span></span></sc-for></code></pre>
          </div>
        </div>`;
  const callout = `        <div role="note" style="display: grid; grid-template-columns: 24px minmax(0, 1fr); column-gap: 14px; padding: 18px 20px; border-radius: 20px; background: {{lampFaint}}; border: 1px solid {{lampLine}}">
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" style="margin-top: 2px"><path d="M32.8 11.4A16 16 0 1 1 15.2 11.4" fill="none" stroke="{{p.lamp}}" stroke-width="4.5" stroke-linecap="round"></path><circle cx="24" cy="9" r="4.6" fill="{{p.lamp}}"></circle></svg>
          <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0">
            ${kicker('Good to know')}
            <p style="margin: 0; font-size: {{fs.note}}; line-height: 1.6; color: {{t.ink}}; text-wrap: pretty">The browser releases the lock the moment the page is hidden, and it will not ask again by itself. Your page has to listen for ${code('visibilitychange')} and request a new sentinel.</p>
          </div>
        </div>`;
  // Lifecycle diagram: SVG main loop (wide or tall) + HTML branch chains.
  const node = (x, y, w, tone, glyph, label, fill = true) => `<g><rect x="${x}" y="${y}" width="${w}" height="44" rx="22" fill="{{dg.${tone}Soft}}" stroke="{{dg.${tone}Line}}" stroke-width="1"></rect><path transform="translate(${x + 16} ${y + 16})" d="{{dg.g${glyph}}}" fill="${fill ? `{{dg.${tone}}}` : 'none'}" stroke="{{dg.${tone}}}" stroke-width="1.6" fill-rule="evenodd" stroke-linejoin="round"></path><text x="${x + 38}" y="${y + 27}" font-size="14" font-weight="600" fill="{{t.ink}}" style="font-family: Geist, system-ui, sans-serif">${label}</text></g>`;
  const lbl = (x, y, txt, anchor = 'middle', mono = true, extra = '') => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="12" fill="{{t.ink2}}" style="font-family: ${mono ? MONO : 'Geist, system-ui, sans-serif'}"${extra}>${txt}</text>`;
  const wide = `<svg role="img" aria-labelledby="dg-title dg-desc" width="100%" viewBox="0 0 680 210" style="display: block; overflow: visible">
              <title id="dg-title">Wake lock lifecycle</title>
              <desc id="dg-desc">Ready moves to Starting when the page calls request. Starting moves to Screen awake when the browser grants the sentinel. Screen awake moves to Paused, tab hidden, when the page is hidden. When the page is visible again it requests a new lock and returns to Starting.</desc>
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
              <desc id="dg-desc-p">Ready moves to Starting when the page calls request. Starting moves to Screen awake when the browser grants the sentinel. Screen awake moves to Paused, tab hidden, when the page is hidden. When the page is visible again it requests a new lock and returns to Starting.</desc>
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
  const diagram = section('lifecycle', `        ${h2('h-lifecycle', 'The lifecycle, in one picture')}
        ${para('Every state below is one of AwakeTab’s seven pill states. The dashed line is the step most pages forget: asking again when the tab comes back.')}
        <figure style="margin: 0; display: flex; flex-direction: column; gap: 20px; padding: {{dgPad}}; border-radius: 24px; background: {{t.surface}}; border: 1px solid {{t.line}}; min-width: 0">
          <sc-if value="{{dgWide}}" hint-placeholder-val="{{false}}">
            ${wide}
          </sc-if>
          <sc-if value="{{dgTall}}" hint-placeholder-val="{{true}}">
            ${tall}
          </sc-if>
          <div style="display: flex; flex-direction: column; gap: 12px; padding-top: 18px; border-top: 1px solid {{t.line}}">
            ${kicker('Other ways out')}
            <sc-for list="{{chains}}" as="ch" hint-placeholder-count="3">
              <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px 8px; padding-block: 4px">
                <sc-for list="{{ch.items}}" as="it" hint-placeholder-count="3">
                  <sc-if value="{{it.isNode}}" hint-placeholder-val="{{true}}">
                    <span style="display: inline-flex; align-items: center; gap: 8px; height: 34px; padding: 0 13px 0 11px; box-sizing: border-box; border-radius: 999px; background: {{it.soft}}; border: 1px solid {{it.line}}; font-size: 14px; font-weight: 600; color: {{t.ink}}; white-space: nowrap"><svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true" style="overflow: visible"><path d="{{it.glyph}}" fill="{{it.fill}}" stroke="{{it.tone}}" stroke-width="1.6" fill-rule="evenodd" stroke-linejoin="round"></path></svg>{{it.label}}</span>
                  </sc-if>
                  <sc-if value="{{it.isEdge}}" hint-placeholder-val="{{false}}">
                    <span style="display: inline-flex; align-items: center; gap: 6px; font-family: {{it.font}}; font-size: 12.5px; color: {{t.ink2}}; white-space: nowrap; padding-inline: 2px">{{it.label}}<svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true"><path d="M0 5H13M9 1l4 4-4 4" fill="none" stroke="{{t.muted}}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>
                  </sc-if>
                </sc-for>
              </div>
            </sc-for>
          </div>
          <figcaption style="font-size: 14px; line-height: 1.5; color: {{t.muted}}; text-wrap: pretty">Labels are the exact pill copy. A timer runs only in Screen awake and Awake via video fallback.</figcaption>
        </figure>`);
  const body = `${headBlock({ hub: 'Learn about screen wake locks', hubHref: '#', crumb: 'Screen Wake Lock API', h1: 'Screen Wake Lock API guide',
    lede: `${code("navigator.wakeLock.request('screen')")} returns a sentinel in a secure, visible document. Hidden documents release it. ${code('NotAllowedError')} means the page is hidden, a permissions policy blocks it, or Safari wanted a tap first. AwakeTab never reports held without a live sentinel.`,
    note: 'Secure pages only, and released whenever the document is hidden. This guide shows the handling for both.' })}

${toolCard()}

${TOC_ASIDE}

    <article class="at-prose" style="grid-area: body; display: flex; flex-direction: column; gap: {{gap.section}}; min-width: 0">
${section('request', `        ${h2('h-request', 'Ask for a lock')}
        ${para(`Call ${code('request')} from a page served over HTTPS while it is on screen. Keep the returned sentinel: it is the only proof that the lock is held, and its ${code('release')} event tells you when it is gone.`)}
${codeBlock('c1', 'wake-lock.js, scrolls sideways')}`)}

${section('hidden', `        ${h2('h-hidden', 'Hidden means released')}
        ${para(`Switching tabs, minimising the window or opening another app on a phone hides the document. The sentinel fires ${code('release')} and your status has to change with it. Do not keep showing a running timer.`)}
${callout}
${codeBlock('c2', 'resume.js, scrolls sideways')}`)}

${diagram}

${INLINE_AD}

${section('iframe', `        ${h2('h-iframe', 'Inside an iframe')}
        ${para(`A frame can only ask when the parent page allows it. Without the ${code('allow')} attribute, the request fails with ${code('NotAllowedError')} and AwakeTab shows ${strong("Blocked — here's the fix")}.`)}
${codeBlock('c3', 'embed.html, scrolls sideways')}`)}

${section('stop', `        ${h2('h-stop', 'Let go on purpose')}
        ${para(`When the user stops or the time is up, release the sentinel and forget that they wanted it, so the visibility handler does not ask again.`)}
${codeBlock('c4', 'stop.js, scrolls sideways')}`)}

${FAQ}

${related([['Learn about screen wake locks'], ['Keep the screen on while presenting'], ['Run a night clock on OLED'], ['Keep a second monitor from sleeping']])}
    </article>

${RAIL}`;
  pages.push({
    file: 'GuideLearn.dc.html', title: 'Screen Wake Lock API guide', body, props: {},
    pageConsts: `const PRESET0 = 'p15';
const NAV = '';
const TOOL_ARIA = 'Screen Wake Lock API guide: tool';
const CARD_KICKER = 'Suggested · 15 min';
${SHELL_STD}
const TOC = [['s-request', 'Ask for a lock'], ['s-hidden', 'Hidden means released'], ['s-lifecycle', 'The lifecycle'], ['s-iframe', 'Inside an iframe'], ['s-stop', 'Let go on purpose'], ['s-faq', 'Questions']];
const FAQS = [
  ['Does the lock survive a hidden tab?', 'No. The lock is released when the document is hidden. Return to the tab and wait for the pill to say Screen awake or Awake via video fallback.'],
${FAQ_BASE}
];
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
    '    // NotAllowedError: hidden tab, a permissions policy, no tap yet in Safari, or battery at 5% or less in Firefox',
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
    const tone = (hex) => ({ soft: this.rgba(hex, 0.12), line: this.rgba(hex, 0.4) });
    const n = (label, hex, glyph, fill) => Object.assign({ isNode: true, isEdge: false, label, tone: hex, glyph, fill: fill ? hex : 'transparent', font: '' }, tone(hex));
    const e = (label, mono) => ({ isNode: false, isEdge: true, label, font: mono ? "'Geist Mono', ui-monospace, monospace" : 'Geist, system-ui, sans-serif', soft: '', line: '', tone: '', glyph: '', fill: '' });
    const chains = [
      [n('Starting…', p.lamp, GLYPHS.dot, false), e('NotAllowedError', true), n("Blocked — here's the fix", p.bad, GLYPHS.tri, true)],
      [n('Ready', t.muted, GLYPHS.dot, false), e('no wakeLock in navigator', false), n('Tap to use the fallback', p.lamp, GLYPHS.dot, true), e('tap', false), n('Awake via video fallback', p.lamp, GLYPHS.ring, true)],
      [n('Screen awake', p.lamp, GLYPHS.dot, true), e('release()', true), n('Ready', t.muted, GLYPHS.dot, false)]
    ].map((items) => ({ items }));
    return Object.assign(blocks, {
      codeBg: dark ? '#0D1320' : '#FFFFFF', lnInk: dark ? '#5E6A80' : '#8A95A6',
      lampFaint: this.rgba(p.lamp, 0.07),
      dgWide: !phone, dgTall: phone, dgPad: phone ? '18px 16px' : '28px 28px 22px',
      dg: {
        muted: t.muted, lamp: p.lamp, warn: p.warn,
        mutedSoft: this.rgba(t.muted, 0.1), mutedLine: this.rgba(t.muted, 0.4),
        lampSoft: this.rgba(p.lamp, 0.12), lampLine: this.rgba(p.lamp, 0.4),
        warnSoft: this.rgba(p.warn, 0.12), warnLine: this.rgba(p.warn, 0.45),
        gdot: GLYPHS.dot, gpause: GLYPHS.pause
      },
      chains
    });
  }
`
  });
}

// =====================================================================================
// 4. GuideGuides: /guides/iphone-auto-lock-never-greyed-out
// =====================================================================================
{
  const progressBar = `<div aria-hidden="true" style="height: 6px; border-radius: 99px; background: {{t.track}}; overflow: hidden"><div class="at-bar" style="height: 100%; width: 100%; border-radius: 99px; background: {{p.lamp}}; transform-origin: left center; transform: scaleX({{prog}})"></div></div>`;
  const stepNav = `    <sc-if value="{{isDesk}}" hint-placeholder-val="{{false}}">
      <nav aria-label="Steps" style="grid-area: toc; align-self: start; position: sticky; top: 24px; display: flex; flex-direction: column; gap: 16px; padding-top: 58px">
        <div style="display: flex; flex-direction: column; gap: 10px">
          ${kicker('Your progress')}
          ${progressBar}
          <span aria-live="polite" style="font-size: 14px; color: {{t.ink2}}">{{progLabel}}</span>
        </div>
        <ol style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 2px">
          <sc-for list="{{steps}}" as="st" hint-placeholder-count="4">
            <li>
              <a href="{{st.href}}" aria-current="{{st.cur}}" style="display: grid; grid-template-columns: 26px minmax(0, 1fr); gap: 10px; align-items: center; min-height: 44px; text-decoration: none; font-size: 14px; line-height: 1.3; font-weight: {{st.weight}}; color: {{st.ink}}">
                <span aria-hidden="true" class="at-slide" style="width: 24px; height: 24px; box-sizing: border-box; border-radius: 50%; border: 1.5px solid {{st.ring}}; background: {{st.fill}}; display: grid; place-items: center; font-family: ${MONO}; font-size: 12px; color: {{st.numInk}}">{{st.mark}}</span>
                <span>{{st.short}}<span style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%)">{{st.srState}}</span></span>
              </a>
            </li>
          </sc-for>
        </ol>
        <a href="#tool" style="display: flex; align-items: center; gap: 8px; min-height: 44px; font-size: 14px; color: {{p.link}}">Jump to the tool ↑</a>
      </nav>
    </sc-if>`;
  const stepsSec = section('steps', `        <div style="display: flex; flex-direction: column; gap: 12px">
          <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap">
            ${h2('h-steps', 'Fix it in four steps')}
            <span aria-live="polite" style="font-family: ${MONO}; font-size: 14px; color: {{t.muted}}; font-variant-numeric: tabular-nums">{{progShort}}</span>
          </div>
          <sc-if value="{{showTopBar}}" hint-placeholder-val="{{true}}">
            ${progressBar}
          </sc-if>
        </div>
        <ol style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column">
          <sc-for list="{{steps}}" as="st" hint-placeholder-count="4">
            <li id="{{st.id}}" style="display: grid; grid-template-columns: 40px minmax(0, 1fr); column-gap: {{railGap}}">
              <div aria-hidden="true" style="display: flex; flex-direction: column; align-items: center">
                <span class="at-slide" style="width: 40px; height: 40px; flex-shrink: 0; box-sizing: border-box; border-radius: 50%; border: 2px solid {{st.ring}}; background: {{st.fill}}; display: grid; place-items: center; font-family: ${MONO}; font-size: 15px; font-weight: 500; color: {{st.numInk}}; box-shadow: {{st.glow}}">{{st.mark}}</span>
                <span style="flex-grow: 1; width: 2px; margin-block: 6px; border-radius: 2px; background: {{st.lineBg}}"></span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 12px; padding-bottom: 32px; min-width: 0">
                <div style="display: flex; align-items: center; gap: 4px; min-height: 40px">
                  <h3 style="margin: 0; flex-grow: 1; min-width: 0; font-size: {{fs.h3}}; line-height: 1.3; font-weight: 600; color: {{st.titleInk}}; text-wrap: pretty"><span style="color: {{t.muted}}; font-weight: 500">Step {{st.n}} · </span>{{st.title}}</h3>
                  <a href="{{st.href}}" aria-label="{{st.linkAria}}" title="Link to this step" style="flex-shrink: 0; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; color: {{t.muted}}; text-decoration: none"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"></path><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"></path></svg></a>
                </div>
                <sc-if value="{{st.isCurrent}}" hint-placeholder-val="{{false}}">
                  <span class="at-in" style="align-self: flex-start; font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: {{p.link}}">Next up</span>
                </sc-if>
                <span style="align-self: flex-start; max-width: 100%; box-sizing: border-box; font-family: ${MONO}; font-size: 13px; line-height: 1.4; padding: 5px 10px; border-radius: 10px; background: {{t.track}}; color: {{t.ink}}">{{st.path}}</span>
                <p style="margin: 0; font-size: {{fs.body}}; line-height: 1.65; color: {{st.bodyInk}}; text-wrap: pretty">{{st.body}}</p>
                <sc-if value="{{st.hasTool}}" hint-placeholder-val="{{false}}">
                  <a href="#tool" style="align-self: flex-start; display: inline-flex; align-items: center; min-height: 44px; font-size: 16px; font-weight: 500; color: {{p.link}}">Use the tool on this page ↑</a>
                </sc-if>
                <button role="checkbox" aria-checked="{{st.on}}" onClick="{{st.toggle}}" style="align-self: flex-start; display: inline-flex; align-items: center; gap: 12px; min-height: 48px; padding: 0 18px 0 14px; border-radius: 16px; border: 1px solid {{st.btnLine}}; background: {{st.btnBg}}; font-size: 15px; font-weight: 600; color: {{t.ink}}">
                  <span aria-hidden="true" class="at-slide" style="width: 22px; height: 22px; box-sizing: border-box; border-radius: 7px; border: 1.5px solid {{st.box}}; background: {{st.boxFill}}; display: grid; place-items: center; color: {{p.lampInk}}"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="opacity: {{st.tickOp}}"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span>
                  {{st.btnLabel}}
                </button>
              </div>
            </li>
          </sc-for>
        </ol>
        <sc-if value="{{allDone}}" hint-placeholder-val="{{false}}">
          <div class="at-in" role="status" style="display: flex; align-items: center; gap: 14px; padding: 18px 20px; border-radius: 20px; background: {{lampFaint}}; border: 1px solid {{lampLine}}">
            <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true"><path d="M32.8 11.4A16 16 0 1 1 15.2 11.4" fill="none" stroke="{{p.lamp}}" stroke-width="4.5" stroke-linecap="round"></path><circle cx="24" cy="9" r="4.6" fill="{{p.lamp}}"></circle></svg>
            <span style="font-size: 16px; line-height: 1.5; color: {{t.ink}}">All four done. If the pill says Screen awake, this iPhone stays on while the tab is in front.</span>
          </div>
        </sc-if>
        <sc-if value="{{notDone}}" hint-placeholder-val="{{true}}">
          <button onClick="{{reset}}" style="align-self: flex-start; min-height: 44px; padding: 0 4px; border: 0; background: transparent; font-size: 14px; color: {{t.muted}}; text-decoration: underline; text-underline-offset: 4px">Clear my progress</button>
        </sc-if>`, 20);
  const why = section('why', `        ${h2('h-why', 'Why Never goes grey')}
        ${para('Low Power Mode caps Auto-Lock at 30 seconds and hides the longer choices, Never included. Once Low Power Mode is off, every Auto-Lock choice comes back.')}
        ${para('A browser wake lock is a separate thing. It holds only while one Safari tab is in front, and Auto-Lock takes over again when you leave.')}`);
  const body = `${headBlock({ hub: 'Wake lock troubleshooting guides', hubHref: '#', crumb: 'Auto-Lock Never greyed out', h1: 'iPhone Auto-Lock Never is greyed out',
    lede: 'Settings › Display & Brightness › Auto-Lock greys out Never while Low Power Mode is on. Turn Low Power Mode off and Never comes back. Or leave Auto-Lock alone and keep one Safari tab awake instead.',
    note: 'Low Power Mode greys out Never and caps Auto-Lock at 30 seconds. A Safari tab can still keep the screen on while it is in front.' })}

${toolCard()}

${stepNav}

    <article class="at-prose" style="grid-area: body; display: flex; flex-direction: column; gap: {{gap.section}}; min-width: 0">
${stepsSec}

${INLINE_AD}

${why}

${FAQ}

${related([['Wake lock troubleshooting guides'], ['Keep iPhone on in Safari', 'GuideOnPhoneDark.dc.html'], ['NoSleep.js compared with wake lock'], ['Keep the screen on while downloading'], ['Keep a phone on for a baby monitor']])}
    </article>

${RAIL}`;
  pages.push({
    file: 'GuideGuides.dc.html', title: 'iPhone Auto-Lock Never greyed out', body, props: {},
    pageConsts: `const PRESET0 = 'p30';
const NAV = '';
const TOOL_ARIA = 'iPhone Auto-Lock Never is greyed out: tool';
const CARD_KICKER = 'Suggested · 30 min';
${SHELL_STD}
const TOC = [['s-steps', 'Fix it in four steps'], ['s-why', 'Why Never goes grey'], ['s-faq', 'Questions']];
const FAQS = [
  ['Does the tab keep the screen on in the background?', 'No. The lock is released when the document is hidden. Return to the tab and wait for the pill to say Screen awake or Awake via video fallback.'],
${FAQ_BASE}
];
// title, short nav label, path, body, links to tool
const STEPS = [
  ['Turn off Low Power Mode', 'Low Power Mode off', 'Settings › Battery › Low Power Mode', 'Switch it off here or with the battery button in Control Centre. iPhone also turns it off by itself once it charges to 80%.'],
  ['Set Auto-Lock to Never', 'Auto-Lock to Never', 'Settings › Display & Brightness › Auto-Lock', 'Never can be picked again now. Choose it only if you want the whole phone to stay on.'],
  ['Or keep only this tab awake', 'Keep one tab awake', 'Safari 16.4+ › AwakeTab › Keep awake', 'If you would rather leave Auto-Lock alone, start a session in Safari. Auto-Lock takes over again when you leave the tab.', true],
  ['Check the pill', 'Check the pill', 'Wait for: Screen awake', "If it says Blocked — here's the fix instead, Safari wanted a tap first. Tap Try again."]
];`,
    pageMethods: `  initPage(props) { return { done: [true, false, false, false] }; }
  pageVals(c) {
    const { t, p, phone, desk } = c;
    const s = this.state;
    const n = s.done.filter(Boolean).length;
    const cur = s.done.findIndex((d) => !d);
    const steps = STEPS.map(([title, short, path, body, hasTool], i) => {
      const on = !!s.done[i], isCurrent = i === cur;
      return {
        id: 'step-' + (i + 1), href: '#step-' + (i + 1), n: i + 1, title, short, path, body, hasTool: !!hasTool,
        on: on ? 'true' : 'false', isCurrent, cur: isCurrent ? 'step' : 'false',
        srState: on ? ', done' : isCurrent ? ', next' : '',
        linkAria: 'Link to step ' + (i + 1),
        mark: on ? '✓' : String(i + 1),
        ring: on || isCurrent ? p.lamp : t.line2, fill: on ? p.lampFill : isCurrent ? this.rgba(p.lamp, 0.12) : 'transparent',
        numInk: on ? p.lampInk : isCurrent ? t.ink : t.muted, glow: isCurrent ? '0 0 0 6px ' + this.rgba(p.lamp, 0.12) : 'none',
        lineBg: i === STEPS.length - 1 ? 'transparent' : on ? this.rgba(p.lamp, 0.6) : t.line, weight: isCurrent ? 600 : 500, ink: isCurrent || on ? t.ink : t.ink2,
        titleInk: t.ink, bodyInk: on ? t.muted : t.ink2,
        box: on ? p.lampFill : t.line2, boxFill: on ? p.lampFill : 'transparent', tickOp: on ? 1 : 0,
        btnLine: on ? this.rgba(p.lamp, 0.45) : t.line2, btnBg: on ? this.rgba(p.lamp, 0.1) : t.surface,
        btnLabel: on ? 'Done' : 'Mark as done',
        toggle: () => this.setState({ done: this.state.done.map((v, j) => (j === i ? !v : v)) })
      };
    });
    return {
      steps, prog: (n / STEPS.length).toFixed(3), allDone: n === STEPS.length, notDone: n > 0 && n < STEPS.length,
      progLabel: n === STEPS.length ? 'All 4 steps done' : n + ' of 4 done · next: step ' + (cur + 1),
      progShort: n + ' of 4 done', showTopBar: !desk, railGap: phone ? '14px' : '20px',
      lampFaint: this.rgba(p.lamp, 0.07),
      reset: () => this.setState({ done: [false, false, false, false] })
    };
  }
`
  });
}

const fixAreas = (src) => src.replace(/'([^'\n]*grid-template-areas[^'\n]*)'/g, (m, inner) => '"' + inner.replace(/"/g, "'") + '"');
for (const pg of pages) writeFileSync(new URL(pg.file, dir), fixAreas(page(pg)));
console.log('wrote', pages.map((p) => p.file).join(', '));

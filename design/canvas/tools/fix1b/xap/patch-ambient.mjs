import { readFileSync, writeFileSync } from 'node:fs';
const P = '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions/project/Ambient.dc.html';
const SN = JSON.parse(readFileSync(new URL('./snips.json', import.meta.url), 'utf8'));
let s = readFileSync(P, 'utf8');
const rep = (a, b, n = 1) => {
  const c = s.split(a).length - 1;
  if (c !== n) throw new Error('count ' + c + ' (want ' + n + ') for: ' + a.slice(0, 90));
  s = s.split(a).join(b);
};
const MONO = `font-family: 'Geist Mono', ui-monospace, monospace; `;
const GEIST = `font-family: Geist, system-ui, sans-serif; `;

// ---- markup ----
// Pills (top row + minimal) -> P-PILL-M verbatim.
const pillTop = s.slice(s.indexOf('<output aria-live="polite" class="at-slide"'), s.indexOf('</output>') + 9);
rep(pillTop, SN['P-PILL-M']);
const i2 = s.indexOf('<output aria-live="polite" style="display: inline-flex; align-items: center; gap: 9px; height: 34px');
const pillMin = s.slice(i2, s.indexOf('</output>', i2) + 9);
rep(pillMin, SN['P-PILL-M']);

rep(`<span role="timer" style="${MONO}font-size: 15px; color: {{t.muted}}; font-variant-numeric: tabular-nums; white-space: nowrap">{{leftShort}} left</span>`,
  `<span role="timer" style="font-size: 15px; line-height: 22px; color: {{t.muted}}; font-variant-numeric: tabular-nums; white-space: nowrap">{{leftShort}} left</span>`);
rep(`<span style="font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: {{t.muted}}">Time left</span>
              <span style="font-size: 15px; color: {{t.ink2}}">{{untilText}}</span>`,
  `<span style="font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}">Time left</span>
              <span style="font-size: 15px; line-height: 22px; color: {{t.ink2}}">{{untilText}}</span>`);
rep(`justify-content: center; gap: 2px">
              <span style="${MONO}font-weight: 400; font-size: {{ringFont}}; letter-spacing: -0.04em;`,
  `justify-content: center; gap: 4px">
              <span style="${GEIST}font-weight: 300; font-size: {{ringFont}}; line-height: 1; letter-spacing: -0.04em;`);
rep(`<span style="font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: {{t.muted}}">left</span>`,
  `<span style="font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}">left</span>`);

// Pro tags -> P-TAG verbatim.
rep(`<div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0">
          <span style="display: inline-flex; align-items: center; height: 26px; padding: 0 10px; border-radius: 999px; border: 1px solid {{lampLine}}; color: {{lampText}}; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase">Pro</span>
          <span role="timer" style="font-size: 14px; color: {{t.muted}};`,
  `<div style="display: flex; align-items: center; gap: 12px; flex-shrink: 0">
          ${SN['P-TAG']}
          <span role="timer" style="font-size: 14px; line-height: 20px; color: {{t.muted}};`);
rep(`<span style="align-self: flex-start; display: inline-flex; align-items: center; height: 26px; padding: 0 10px; border-radius: 999px; border: 1px solid {{lampLine}}; color: {{lampText}}; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase">Pro</span>`,
  `<div style="align-self: flex-start">${SN['P-TAG']}</div>`);

// Toast: pill-free notice that never covers the pill or the primary action.
rep(`<div role="status" aria-live="polite" style="position: absolute; z-index: 5; left: 0; right: 0; top: {{z.toastTop}}; display: flex; justify-content: center; padding: 0 16px; pointer-events: none">`,
  `<div role="status" aria-live="polite" style="position: absolute; z-index: 5; left: 0; right: 0; {{toastPos}}; display: flex; justify-content: center; padding: 0 16px; pointer-events: none">`);
rep(`<div class="at-in" style="max-width: 520px; padding: 12px 18px; border-radius: 20px; background: {{t.surface}}; border: 1px solid {{t.line2}}; box-shadow: 0 12px 32px -12px {{t.chipShadow}}; font-size: 15px; font-weight: 500; color: {{t.ink}}; text-align: center; text-wrap: pretty">{{toastText}}</div>`,
  `<div class="at-in" style="max-width: {{z.toastMax}}; min-height: 52px; box-sizing: border-box; display: flex; align-items: center; padding: 12px 16px; border-radius: 16px; background: {{t.surface}}; border: 1px solid {{t.line2}}; box-shadow: 0 24px 64px -24px rgba(0,0,0,.45); font-size: 15px; line-height: 22px; font-weight: 500; color: {{t.ink}}; text-align: center; text-wrap: pretty">{{toastText}}</div>`);

// Clock digits: Geist 300 tabular (no slashed zero).
rep(`<time aria-label="{{clockAria}}" style="display: flex; flex-direction: column; align-items: center; ${MONO}font-weight: 300;`,
  `<time aria-label="{{clockAria}}" style="display: flex; flex-direction: column; align-items: center; ${GEIST}font-weight: 300;`);
rep(`<span style="display: flex; gap: 14px; margin-top: 18px; font-size: {{z.suffix}};`, `<span style="display: flex; gap: 12px; margin-top: 16px; font-size: {{z.suffix}};`);
rep(`<span style="display: flex; align-items: flex-start; gap: 22px">`, `<span style="display: flex; align-items: flex-start; gap: 24px">`, 2);
rep(`<span style="width: 1.5px; height: {{tk.h}}; border-radius: 1px; background: {{tk.c}}"></span>`,
  `<span style="width: 1px; height: {{tk.h}}; border-radius: 999px; background: {{tk.c}}"></span>`);
rep(`<div style="font-size: {{z.date}}; color: {{t.ink2}}; letter-spacing: -0.01em; text-align: center">{{dateLong}}</div>`,
  `<div style="font-size: {{z.date}}; line-height: {{z.dateLh}}; color: {{t.ink2}}; letter-spacing: -0.01em; text-align: center">{{dateLong}}</div>`);

// Focus.
rep(`<div style="font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: {{t.muted}}">Focus block</div>`,
  `<span style="font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}">Focus block</span>`);
rep(`<div role="timer" aria-label="25 minutes of focus" style="${MONO}font-weight: 300;`, `<div role="timer" aria-label="25 minutes of focus" style="${GEIST}font-weight: 300;`);
rep(`border: 0; background: {{lamp}}; color: {{lampInk}}; font-size: 17px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 10px; box-shadow`,
  `border: 0; background: {{lamp}}; color: {{lampInk}}; font-size: 17px; line-height: 24px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 8px; box-shadow`);
rep(`<div style="display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap">`, `<div style="display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap">`);
rep(`<span class="at-slide" style="display: inline-flex; align-items: center; gap: 9px; height: 38px; padding: 0 16px 0 13px; box-sizing: border-box; border-radius: 999px; background: {{phSoft}}; border: 1px solid {{phLine}}; font-size: 15px; font-weight: 600; color: {{t.ink}}">
              <span aria-hidden="true" style="width: 9px; height: 9px;`,
  `<span class="at-slide" style="display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 16px 0 12px; box-sizing: border-box; border-radius: 999px; background: {{phSoft}}; border: 1px solid {{phLine}}; font-size: 15px; line-height: 22px; font-weight: 600; color: {{t.ink}}">
              <span aria-hidden="true" style="width: 8px; height: 8px;`);
rep(`<span style="font-size: 16px; color: {{t.ink2}}">{{cycleText}}</span>`, `<span style="font-size: 16px; line-height: 24px; color: {{t.ink2}}">{{cycleText}}</span>`);
rep(`<span role="img" aria-label="{{dotsAria}}" style="display: flex; align-items: center; gap: 10px">`, `<span role="img" aria-label="{{dotsAria}}" style="display: flex; align-items: center; gap: 8px">`);
rep(`border-radius: 50%; background: {{d.bg}}; border: 2px solid {{d.bd}}">`, `border-radius: 50%; background: {{d.bg}}; border: 1px solid {{d.bd}}">`);
rep(`<span class="at-halo" style="position: absolute; inset: -2px; border-radius: 50%; background: {{ph}}"></span>`, `<span class="at-halo" style="position: absolute; inset: -1px; border-radius: 50%; background: {{ph}}"></span>`);
rep(`<div role="timer" aria-label="{{focusAria}}" style="${MONO}font-weight: 300;`, `<div role="timer" aria-label="{{focusAria}}" style="${GEIST}font-weight: 300;`);
rep(`height: 8px; border-radius: 99px; background: {{t.track}}; overflow: hidden">`, `height: 8px; border-radius: 999px; background: {{t.track}}; overflow: hidden">`, 2);
rep(`<div class="at-lin" style="position: absolute; inset: 0; border-radius: 99px; overflow: hidden; background: {{ph}};`, `<div class="at-lin" style="position: absolute; inset: 0; border-radius: 999px; overflow: hidden; background: {{ph}};`);
rep(`background: {{t.surface}}; font-size: 16px; font-weight: 600; color: {{t.ink}}; display: inline-flex; align-items: center; gap: 10px">
            <svg width="18" height="18"`,
  `background: {{t.surface}}; font-size: 15px; line-height: 22px; font-weight: 600; color: {{t.ink}}; display: inline-flex; align-items: center; gap: 8px">
            <svg width="20" height="20"`);

// Minimal.
rep(`<svg role="img" aria-label="AwakeTab" width="22" height="22"`, `<svg role="img" aria-label="AwakeTab" width="24" height="24"`);
rep(`<span role="timer" style="${MONO}font-size: 15px; color: {{t.muted}}; font-variant-numeric: tabular-nums; white-space: nowrap">{{leftShort}} left · {{untilText}}</span>`,
  `<span role="timer" style="font-size: 15px; line-height: 22px; color: {{t.muted}}; font-variant-numeric: tabular-nums; white-space: nowrap">{{leftShort}} left · {{untilText}}</span>`);

// Night: AT_NIGHT tokens; dimming touches only the large digits (AA large text stays >= 3:1).
rep(`<div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; padding: 0 {{z.pad}}; opacity: {{nightOp}}; transition: opacity 1.2s var(--ease)">
          <time aria-label="{{clockAria}}" style="display: flex; flex-direction: column; align-items: center; ${MONO}font-weight: 200; font-variant-numeric: tabular-nums; letter-spacing: -0.05em; color: #FF5A3C">`,
  `<div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: 0 {{z.pad}}">
          <time aria-label="{{clockAria}}" style="display: flex; flex-direction: column; align-items: center; ${GEIST}font-weight: 200; font-variant-numeric: tabular-nums; letter-spacing: -0.05em; color: {{night.ink}}; opacity: {{nightOp}}; transition: opacity 1.2s var(--ease)">`);
rep(`<span style="margin-top: 18px; font-size: {{z.suffix}}; line-height: 1; letter-spacing: 0.02em; color: #E8563C">{{clk.ap}}</span>`,
  `<span style="margin-top: 16px; font-size: {{z.suffix}}; line-height: 1; letter-spacing: 0.02em; color: {{night.ink2}}">{{clk.ap}}</span>`);
rep(`<span style="padding-top: {{z.suffixTop}}; font-size: {{z.suffix}}; line-height: 1; letter-spacing: 0; color: #E8563C">{{clk.ap}}</span>`,
  `<span style="padding-top: {{z.suffixTop}}; font-size: {{z.suffix}}; line-height: 1; letter-spacing: 0; color: {{night.ink2}}">{{clk.ap}}</span>`);
rep(`<div style="font-size: {{z.date}}; color: #E8563C; letter-spacing: -0.01em; text-align: center">{{dateLong}}</div>`,
  `<div style="font-size: {{z.date}}; line-height: {{z.dateLh}}; color: {{night.ink2}}; letter-spacing: -0.01em; text-align: center">{{dateLong}}</div>`);
rep(`<p style="position: absolute; left: 0; right: 0; bottom: 14px; margin: 0; padding: 0 20px; text-align: center; font-size: 14px; color: #B86A5E">{{nightNote}}</p>`,
  `<p style="position: absolute; left: 0; right: 0; bottom: 16px; margin: 0; padding: 0 16px; text-align: center; font-size: 14px; line-height: 20px; color: {{night.muted}}">{{nightNote}}</p>`);

// Message.
rep(`<div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: {{z.msgGap}}; padding: 0 {{z.pad}}; text-align: center; opacity: {{msgOp}}; transition: opacity .9s var(--ease)">`,
  `<div aria-hidden="{{msgHidden}}" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: {{z.msgGap}}; padding: 0 {{z.pad}}; text-align: center; opacity: {{msgOp}}; transition: opacity .9s var(--ease)">`);
rep(`<label for="am-msg" style="font-size: 14px; font-weight: 600; color: {{t.ink2}}">`, `<label for="am-msg" style="font-size: 14px; line-height: 20px; font-weight: 600; color: {{t.ink2}}">`);
rep(`height: {{z.msgInputH}}; padding: 0 20px; border-radius: 20px; border: 1px solid {{lamp}}; background: {{t.surface}};`,
  `height: {{z.msgInputH}}; padding: 0 16px; border-radius: 8px; border: 1px solid {{lamp}}; background: {{t.sunken}};`);
rep(`<span style="font-size: 14px; color: {{t.muted}}; font-variant-numeric: tabular-nums">{{draftCount}} / 80</span>`,
  `<span style="font-size: 14px; line-height: 20px; color: {{t.muted}}; font-variant-numeric: tabular-nums">{{draftCount}} / 80</span>`);
rep(`style="height: 48px; padding: 0 18px; border-radius: 16px; border: 1px solid {{t.line2}}; background: {{t.surface}}; font-size: 15px; font-weight: 600; color: {{t.ink}}">Cancel</button>`,
  `style="height: 52px; padding: 0 20px; border-radius: 20px; border: 1px solid {{t.line2}}; background: {{t.surface}}; font-size: 15px; line-height: 22px; font-weight: 600; color: {{t.ink}}">Cancel</button>`);
rep(`style="height: 48px; padding: 0 22px; border-radius: 16px; border: 0; background: {{t.primaryBg}}; font-size: 15px; font-weight: 600; color: {{t.primaryInk}}">Show message</button>`,
  `style="height: 52px; padding: 0 20px; border-radius: 20px; border: 0; background: {{t.primaryBg}}; font-size: 15px; line-height: 22px; font-weight: 600; color: {{t.primaryInk}}">Show message</button>`);
rep(`<time style="${MONO}color: {{t.ink2}}; font-variant-numeric: tabular-nums">{{nowTime}}</time>`, `<time style="color: {{t.ink2}}; font-variant-numeric: tabular-nums">{{nowTime}}</time>`);
rep(`border-radius: 999px; border: 1px dashed {{t.line2}}; background: transparent; font-size: 14px; font-weight: 500; color: {{t.ink2}};`,
  `border-radius: 999px; border: 1px solid {{t.line2}}; background: transparent; font-size: 14px; line-height: 20px; font-weight: 500; color: {{t.ink2}};`);
rep(`gap: 12px; padding: 24px; border-radius: 24px; background: {{t.surface}}; border: 1px solid {{t.line}}; box-shadow: 0 24px 60px -24px {{t.chipShadow}}; text-align: start">`,
  `gap: 12px; padding: {{cardPad}}; border-radius: 16px; background: {{t.surface}}; border: 1px solid {{t.line}}; box-shadow: 0 24px 64px -24px rgba(0,0,0,.45); text-align: start">`);
rep(`<h2 id="am-pro" style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.01em">`, `<h2 id="am-pro" style="margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -0.01em">`);
rep(`<p style="margin: 0; font-size: 15px; line-height: 1.5; color: {{t.ink2}}">Show your own message`, `<p style="margin: 0; font-size: 16px; line-height: 26px; color: {{t.ink2}}">Show your own message`);
rep(`style="height: 52px; padding: 0 22px; border-radius: 20px; background: {{lamp}}; color: {{lampInk}}; font-size: 16px; font-weight: 600;`,
  `style="box-sizing: border-box; height: 52px; padding: 0 24px; border-radius: 20px; background: {{lamp}}; color: {{lampInk}}; font-size: 15px; line-height: 22px; font-weight: 600;`);
rep(`style="height: 52px; padding: 0 20px; border-radius: 20px; border: 1px solid {{t.line2}}; background: {{t.surface}}; font-size: 16px; font-weight: 600; color: {{t.ink}}">Back to Clock</button>`,
  `style="height: 52px; padding: 0 20px; border-radius: 20px; border: 1px solid {{t.line2}}; background: {{t.surface}}; font-size: 15px; line-height: 22px; font-weight: 600; color: {{t.ink}}">Back to Clock</button>`);

// Cook.
rep(`border-radius: 28px; border: 1.5px {{cookTapStyle}} {{cookTapLine}};`, `border-radius: 28px; border: 1px {{cookTapStyle}} {{cookTapLine}};`);
rep(`<span style="font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: {{t.muted}}">{{cookKicker}}</span>`,
  `<span style="font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}">{{cookKicker}}</span>`);
rep(`<span style="display: inline-flex; align-items: center; gap: 10px; font-size: {{z.cookHint}}; font-weight: 500; color: {{t.ink2}}">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">`,
  `<span style="display: inline-flex; align-items: center; gap: 8px; font-size: {{z.cookHint}}; line-height: {{z.cookHintLh}}; font-weight: 500; color: {{t.ink2}}">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">`);
rep(`<span style="font-size: 14px; color: {{t.muted}}">The screen stays awake while the clock is paused.</span>`, `<span style="font-size: 14px; line-height: 20px; color: {{t.muted}}">The screen stays awake while the clock is paused.</span>`);
rep(`<section aria-labelledby="am-kt" style="min-height: 0; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; padding: 2px">`,
  `<section aria-labelledby="am-kt" style="min-height: 0; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; padding: 4px">`);
rep(`<h2 id="am-kt" style="margin: 0; font-size: 12px; font-weight: 600; letter-spacing: 0.16em;`, `<h2 id="am-kt" style="margin: 0; font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.14em;`);
rep(`<span style="font-size: 14px; color: {{t.muted}}">{{timerCount}}</span>`, `<span style="font-size: 14px; line-height: 20px; color: {{t.muted}}; font-variant-numeric: tabular-nums">{{timerCount}}</span>`);
rep(`grid-template-rows: auto 8px; column-gap: 14px; row-gap: 10px; align-items: center; padding: 12px 12px 14px 18px; border-radius: 24px;`,
  `grid-template-rows: auto 8px; column-gap: 12px; row-gap: 8px; align-items: center; padding: 12px 16px; border-radius: 16px;`);
rep(`<span aria-hidden="true" class="am-flash" style="position: absolute; inset: -1px; border-radius: 24px; border: 2px solid {{t.good}};`,
  `<span aria-hidden="true" class="am-flash" style="position: absolute; inset: -1px; border-radius: 16px; border: 1px solid {{t.good}};`);
rep(`<div style="min-width: 0; display: flex; flex-direction: column; gap: 3px">`, `<div style="min-width: 0; display: flex; flex-direction: column; gap: 4px">`);
rep(`<span style="font-size: 14px; color: {{k.subInk}};`, `<span style="font-size: 14px; line-height: 20px; color: {{k.subInk}};`);
rep(`<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="{{t.good}}" stroke-width="2.6"`, `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{t.good}}" stroke-width="2.4"`);
rep(`style="width: 64px; height: 64px; border-radius: 20px; border: 1px solid {{t.line2}}; background: {{t.surface}}; color: {{t.ink2}}; display: grid; place-items: center">`,
  `style="width: 64px; height: 64px; padding: 0; border-radius: 20px; border: 1px solid {{t.line2}}; background: {{t.surface}}; color: {{t.ink2}}; display: grid; place-items: center">`);
rep(`<div class="at-lin" style="position: absolute; inset: 0; border-radius: 99px; background: {{k.bar}};`, `<div class="at-lin" style="position: absolute; inset: 0; border-radius: 999px; background: {{k.bar}};`);
rep(`<p style="margin: 0; padding: 4px; font-size: 15px; color: {{t.muted}}">No kitchen timers yet.`, `<p style="margin: 0; padding: 4px; font-size: 15px; line-height: 22px; color: {{t.muted}}">No kitchen timers yet.`);
rep(`display: flex; flex-direction: column; gap: 8px; padding-top: 6px">`, `display: flex; flex-direction: column; gap: 8px; padding-top: 8px">`);
rep(`<div style="display: flex; flex-direction: column; gap: 6px; min-width: 0">`, `<div style="display: flex; flex-direction: column; gap: 8px; min-width: 0">`);
rep(`<label for="am-tname" style="font-size: 13px; font-weight: 600;`, `<label for="am-tname" style="font-size: 13px; line-height: 18px; font-weight: 600;`);
rep(`height: 64px; padding: 0 18px; border-radius: 20px; border: 1px solid {{t.muted}}; background: {{t.surface}}; font-size: 18px;`,
  `height: 64px; padding: 0 16px; border-radius: 8px; border: 1px solid {{t.muted}}; background: {{t.sunken}}; font-size: 18px;`);
rep(`background: {{customBg}}; font-size: 16px; font-weight: 500;`, `background: {{customBg}}; font-size: 16px; line-height: 24px; font-weight: 500;`);
rep(`style="height: 64px; border-radius: 20px; border: 1px solid {{t.line2}}; background: {{t.surface}}; font-size: 24px; color: {{t.ink}}">`,
  `style="height: 64px; padding: 0; border-radius: 20px; border: 1px solid {{t.line2}}; background: {{t.surface}}; font-size: 24px; color: {{t.ink}}">`, 2);
rep(`height: 64px; padding: 0 44px 0 12px; border-radius: 20px; border: 1px solid {{t.muted}}; background: {{t.surface}}; text-align: center; ${MONO}font-size: 22px; color: {{t.ink}}">`,
  `height: 64px; padding: 0 48px 0 16px; border-radius: 8px; border: 1px solid {{t.muted}}; background: {{t.sunken}}; text-align: center; font-size: 24px; font-variant-numeric: tabular-nums; color: {{t.ink}}">`);
rep(`style="height: 64px; padding: 0 22px; border-radius: 20px; border: 0; background: {{lamp}}; color: {{lampInk}}; font-size: 17px; font-weight: 600">Add</button>`,
  `style="height: 64px; padding: 0 24px; border-radius: 20px; border: 0; background: {{lamp}}; color: {{lampInk}}; font-size: 17px; line-height: 24px; font-weight: 600">Add</button>`);
rep(`<p style="margin: 0; padding: 2px 4px; font-size: 14px; color: {{t.muted}}">Up to 3 timers.`, `<p style="margin: 0; padding: 4px; font-size: 14px; line-height: 20px; color: {{t.muted}}">Up to 3 timers.`);

// Mode bar.
rep(`display: flex; flex-direction: {{z.barDir}}; align-items: center; justify-content: center; gap: 10px;`, `display: flex; flex-direction: {{z.barDir}}; align-items: center; justify-content: center; gap: 12px;`);
rep(`font-size: 14px; font-weight: 600; color: {{t.ink}}; display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap">`,
  `font-size: 14px; line-height: 20px; font-weight: 600; color: {{t.ink}}; display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap">`, 2);
rep(`height: 44px; padding: 0 18px; border-radius: 999px; border: 0; background: {{t.primaryBg}}; font-size: 14px; font-weight: 600;`,
  `height: 44px; padding: 0 16px; border-radius: 999px; border: 0; background: {{t.primaryBg}}; font-size: 14px; line-height: 20px; font-weight: 600;`);

// ---- script ----
rep(`<script type="text/x-dc" data-dc-script data-props='{"mode"`, `<script type="text/x-dc" data-dc-script data-props='{"mode"`);
const k = s.indexOf(`}'>\nconst DARK = {`);
if (k < 0) throw new Error('script start');
s = s.slice(0, k + 4) + SN['JS constants'] + '\n' + s.slice(k + 4);

rep(`// Night forces the OLED palette whatever the theme (docs/05 §3.13); neutrals are warm so nothing blue hits night vision.
const NIGHT = {
  bg: '#000000', flat: '#000000', surface: '#0A0A0A', line: '#1F1917', line2: '#3A2E2A', ink: '#E9DDD8', ink2: '#CDBDB7', muted: '#A89690',
  track: '#1A1412', tick: '#2A201D', tick2: '#3A2E2A', primaryBg: '#241C19', primaryInk: '#E9DDD8', chip: '#241C19', chipShadow: 'rgba(0,0,0,0.6)',
  good: '#7EF0B8'
};`,
`// Night forces the OLED palette whatever the theme (docs/05 §3.13), built only from the DESIGN.md §2.1 night tokens
// (AT_NIGHT) so nothing blue hits night vision. On #000: ink 6.8:1, ink2 5.8:1, muted 7.4:1 (all pass AA).
const NIGHT = {
  bg: AT_NIGHT.ground, flat: AT_NIGHT.ground, surface: '#0A0A0A', line: AT_NIGHT.line, line2: AT_NIGHT.line, ink: AT_NIGHT.ink2, ink2: AT_NIGHT.muted, muted: AT_NIGHT.muted,
  track: AT_NIGHT.line, tick: AT_NIGHT.line, primaryBg: AT_NIGHT.line, primaryInk: AT_NIGHT.muted, raised: AT_NIGHT.line, sunken: AT_NIGHT.ground,
  good: '#7EF0B8'
};`);
rep(`track: '#1A2336', tick: '#2A3752', tick2: '#33405C', primaryBg: '#EAF0F7', primaryInk: '#0A0E16', chip: '#26324B', chipShadow: 'rgba(0,0,0,0.4)',`,
  `track: '#1A2336', tick: '#2A3752', primaryBg: '#EAF0F7', primaryInk: '#0A0E16',`);
rep(`track: '#E3E9F1', tick: '#CCD5E1', tick2: '#C3CDDA', primaryBg: '#0E1726', primaryInk: '#F4F7FB', chip: '#E3EAF2', chipShadow: 'rgba(14,23,38,0.14)',`,
  `track: '#E3E9F1', tick: '#CCD5E1', primaryBg: '#0E1726', primaryInk: '#F4F7FB',`);
rep(`  top: '84px', toastTop: '96px', clockGap: '30px', suffix: '46px', suffixTop: '24px', date: '26px', trackW: '640px',
  focusGap: '22px', focusBarW: '520px', body: '18px', msgGap: '36px', meta: '20px', msgInputH: '84px', msgInput: '34px',
  cookHint: '22px', cookInner: '18px', tName: '20px', cookTimer: '52px', quickFont: '17px', cookCols: 'minmax(0, 1.1fr) minmax(0, 1fr)',
  cookRows: 'minmax(0, 1fr)', cookGap: '28px', barDir: 'row', iconDisp: 'block', segW: '584px', segFont: '14px', btnCols: 'repeat(3, auto)', btnW: 'auto', minBottom: '28px'`,
`  top: '84px', toastMax: '640px', clockGap: '32px', suffix: '48px', suffixTop: '24px', date: '24px', dateLh: '32px', trackW: '640px',
  focusGap: '24px', focusBarW: '520px', body: '18px', msgGap: '40px', meta: '20px', msgInputH: '64px', msgInput: '34px',
  cookHint: '20px', cookHintLh: '28px', cookInner: '20px', tName: '20px', cookTimer: '52px', quickFont: '16px', cookCols: 'minmax(0, 1.1fr) minmax(0, 1fr)',
  cookRows: 'minmax(0, 1fr)', cookGap: '32px', barDir: 'row', iconDisp: 'block', segW: '584px', segFont: '14px', btnCols: 'repeat(3, auto)', btnW: 'auto', minBottom: '32px'`);
rep(`    W: '390px', H: '844px', pad: '20px', top: '64px', topPad: '10px 12px 0 20px', toastTop: '84px', clockGap: '24px', clockSize: '176px', suffix: '26px', suffixTop: '0px',
    date: '17px', trackW: '260px', focusGap: '18px', focusSize: '108px', focusBarW: '300px', body: '15px', msgGap: '26px', msgSize: '44px', msgMax: '350px',
    meta: '15px', msgInputH: '64px', msgInput: '20px', cookSize: '96px', cookSizeH: '72px', cookHint: '17px', cookInner: '10px', tName: '18px', cookTimer: '34px',
    quickFont: '15px', cookCols: 'minmax(0, 1fr)', cookRows: '168px minmax(0, 1fr)', cookGap: '12px', cookPad: '6px 16px 8px', barPad: '8px 16px 16px',
    barDir: 'column', iconDisp: 'none', segW: '100%', segFont: '12.5px', btnCols: 'repeat(3, minmax(0, 1fr))', btnW: '100%', minBottom: '20px'`,
`    W: '390px', H: '844px', pad: '20px', top: '64px', topPad: '8px 16px 0 16px', toastMax: '100%', clockGap: '24px', clockSize: '176px', suffix: '28px', suffixTop: '0px',
    date: '18px', dateLh: '28px', trackW: '260px', focusGap: '16px', focusSize: '108px', focusBarW: '300px', body: '16px', msgGap: '24px', msgSize: '48px', msgMax: '350px',
    meta: '15px', msgInputH: '48px', msgInput: '20px', cookSize: '96px', cookSizeH: '72px', cookHint: '16px', cookHintLh: '24px', cookInner: '8px', tName: '18px', cookTimer: '34px',
    quickFont: '15px', cookCols: 'minmax(0, 1fr)', cookRows: '176px minmax(0, 1fr)', cookGap: '12px', cookPad: '8px 16px', barPad: '8px 16px 16px',
    barDir: 'column', iconDisp: 'none', segW: '100%', segFont: '13px', btnCols: 'repeat(3, minmax(0, 1fr))', btnW: '100%', minBottom: '20px'`);
rep(`W: '1180px', H: '820px', pad: '40px', topPad: '20px 32px 0 40px',`, `W: '1180px', H: '820px', pad: '40px', topPad: '20px 40px 0 40px',`);
rep(`cookPad: '8px 40px 12px', barPad: '12px 32px 22px'`, `cookPad: '8px 40px 12px', barPad: '12px 32px 24px'`);
rep(`W: '1280px', H: '800px', pad: '48px', topPad: '20px 40px 0 48px',`, `W: '1280px', H: '800px', pad: '48px', topPad: '20px 48px 0 48px',`);
rep(`cookPad: '8px 48px 12px', barPad: '12px 40px 22px'`, `cookPad: '8px 48px 12px', barPad: '12px 40px 24px'`);

rep(`const nope = "Fullscreen isn't available here — add AwakeTab to your Home Screen for a full-screen clock";`,
  `const nope = "Fullscreen isn't available here. Add AwakeTab to your Home Screen for a full-screen clock.";`);
rep(`const t = night ? NIGHT : dark ? DARK : LIGHT;`, `const t = night ? NIGHT : Object.assign({}, dark ? DARK : LIGHT, dark ? AT_TOK.dark : AT_TOK.light);`);
rep(`for (let i = 0; i < 60; i++) ticks.push({ h: i % 5 === 0 ? '12px' : '6px', c: i % 5 === 0 ? t.tick2 : t.tick });`,
  `// Minute ticks: 1 px, --at-tick; 5-minute marks on --at-muted (night: AT_NIGHT.line / muted).
    for (let i = 0; i < 60; i++) ticks.push({ h: i % 5 === 0 ? '12px' : '6px', c: i % 5 === 0 ? t.muted : t.tick });`);
rep(`      z, t, wide: !phone, stacked: phone,`,
  `      z, t, wide: !phone, stacked: phone, night: AT_NIGHT, cardPad: AT_CARD_PAD[L],
      // Notices never cover the pill or the primary control: wide layouts centre them in the free middle of the
      // top row; phones stack them just above the mode bar (bar 134 px + 12).
      toastPos: phone ? 'bottom: 146px' : 'top: 26px',`);
rep(`      tone, glyph: GLYPH[st] ?? DOT,`, `      tone, toneSoft: quiet ? 'transparent' : this.rgba(tone, hidden ? 0.06 : 0.12), toneLine: quiet ? t.line2 : this.rgba(tone, hidden ? 0.22 : 0.38),
      glyph: GLYPH[st] ?? DOT,`);
rep(`msgLocked, msgOp: msgLocked ? 0.12 : 1,`, `msgLocked, msgOp: msgLocked ? 0 : 1, msgHidden: msgLocked ? 'true' : 'false',`);
rep(`segBg: night ? t.chip : this.rgba(lamp, 0.14), segLine: night ? t.line2 : this.rgba(lamp, 0.45),`, `segBg: this.rgba(lamp, 0.14), segLine: this.rgba(lamp, 0.45),`);

writeFileSync(P, s);
console.log('patched ambient');

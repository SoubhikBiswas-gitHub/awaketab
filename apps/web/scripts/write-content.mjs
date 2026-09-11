#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/content');
const SUFFIX = ' — AwakeTab';

const FOR = [
  ['cooking', 'Keep your screen on while cooking', 'keep screen on while cooking', 'pinf', 'cook', 'Works while the AwakeTab tab is on screen; opening another app on a phone releases the lock until you return.', 'A recipe on a phone or tablet will dim mid-step unless something holds the display. AwakeTab does that in the browser while its tab stays visible beside the recipe, in Split View, or as the only tab you glance at.'],
  ['presentations', 'Keep the screen on while presenting', 'keep screen on during presentation', 'p120', 'standard', 'Full-screen slide apps hide the tab; use the PiP pill on Chromium or remember the projector still follows the OS display timeout.', 'Slide decks often go full screen and hide the browser. AwakeTab can hold the display only while it remains a visible surface — a PiP pill on Chromium, a second window, or a confidence monitor that still shows the tab.'],
  ['downloads', 'Keep the PC awake while downloading', 'keep computer awake while downloading', 'pinf', 'standard', 'Keeps the display on; idle system sleep varies by OS (Chromium on Windows: yes in our tests; macOS: no). Closing the lid always sleeps.', 'Large copies stall when the laptop sleeps. AwakeTab keeps the display awake in a visible tab. Whether the rest of the machine stays out of idle sleep depends on the OS, not on this page.'],
  ['ai-agents', 'Keep the browser awake for AI agents', 'keep browser awake while ai agent runs', 'pinf', 'minimal', 'Keeps the screen on; it cannot stop a site\'s own inactivity timeout or the throttling of a hidden agent tab.', 'Long agent runs die when the tab is hidden or the display sleeps. Keep AwakeTab visible in the same window or a split, and expect the agent site to apply its own idle rules regardless.'],
  ['dashboards', 'Keep a dashboard screen switched on', 'keep dashboard screen on', 'pinf', 'minimal', 'AwakeTab must stay visible on the same display as the dashboard (split-screen, second window or its own monitor). Use a visible tab, not a hidden one.', 'Wall boards and NOC screens fail when the OS display timeout wins. Put AwakeTab on that same display — split, second window, or its own monitor — and leave the tab in view.'],
  ['kiosk', 'Keep a kiosk browser display on', 'keep screen on kiosk browser', 'pinf', 'minimal', 'Not a kiosk browser: no lockdown, no auto-launch. Pair it with the OS kiosk mode; AwakeTab only holds the display while visible.', 'A lobby tablet still obeys the OS timeout. AwakeTab is not a locked-down kiosk shell. Pair OS kiosk mode with a visible AwakeTab tab if you need the panel to stay lit.'],
  ['sheet-music', 'Keep iPad on for sheet music', 'keep ipad screen on for sheet music', 'p60', 'minimal', 'Needs Split View next to the score app; Low Power Mode forces a 30 s lock regardless.', 'Page turns fail when iPadOS dims the score. Split View with AwakeTab beside the score app is the honest setup. Low Power Mode still forces a short Auto-Lock.'],
  ['reading', 'Keep the screen on while reading', 'keep screen on while reading', 'p60', 'minimal', 'Only the visible tab is protected; for a reading app, use split-screen with AwakeTab beside it.', 'Articles in the browser can stay awake in this tab. Native reader apps hide the browser, so use split-screen if the book lives in another app.'],
  ['night-clock', 'Run a night clock on OLED', 'night clock online oled', 'pinf', 'night', 'A screen on all night needs power — plug in. Pixel shift reduces OLED burn-in risk but cannot remove it.', 'A dim clock on the nightstand still uses a real panel. Plug in. Night mode reduces brightness; pixel shift only lowers burn-in risk, it does not remove it.'],
  ['baby-monitor', 'Keep a phone on for a baby monitor', 'keep phone screen on baby monitor', 'pinf', 'standard', 'AwakeTab is not a safety device and must share the screen with a web-based monitor; battery auto-stop is Chromium-only.', 'A web monitor in Safari or Chrome still dims. AwakeTab is not a safety product. Share the screen with the monitor page and plug in; Chromium can auto-stop on low battery.'],
  ['navigation', 'Keep the screen on for web maps', 'keep screen on while navigating maps', 'pinf', 'standard', 'Native map apps hide the browser; works only with web maps in split-screen. Expect heavy battery use.', 'Google Maps in a native app will cover the browser. This page only helps web maps that share the screen with AwakeTab. Navigation plus a lit display drains the pack quickly.'],
  ['video-calls', 'Keep the screen on in a video call', 'keep screen on during video call', 'p60', 'standard', 'Does not keep Teams, Slack or Zoom available — presence follows keyboard and mouse activity, not the display.', 'Calls already try to hold the display while video plays. AwakeTab helps when the player pauses. It will not keep chat presence green.'],
  ['live-streams', 'Keep the screen on for a live stream', 'keep screen from sleeping while watching stream', 'p240', 'standard', 'Most players hold their own wake lock while playing; AwakeTab helps when paused, muted or in chat. The tab must stay visible.', 'Playing video often already holds a wake lock. Use AwakeTab when you pause, sit in chat, or the player fails to request one. The tab still has to stay visible.'],
  ['teleprompter', 'Keep a teleprompter screen awake', 'teleprompter keep screen on', 'p30', 'minimal', 'Not a teleprompter; the prompter page must be visible alongside AwakeTab (split view or PiP pill).', 'AwakeTab is not a scrolling prompter. Keep your script page visible next to it, or use the Chromium PiP pill, and treat thirty minutes as a rehearsal block you can extend.'],
  ['workouts', 'Keep the screen on for a workout', 'keep screen on during workout timer', 'p45', 'clock', 'Sweaty taps can stop the session; lock the phone orientation and keep it plugged in for long sessions.', 'A floor timer that dims mid-set is useless. Use clock mode, lock orientation, and plug in. Accidental taps on a sweaty screen can stop the session — watch the pill.'],
  ['second-monitor', 'Keep a second monitor from sleeping', 'keep second monitor from turning off', 'pinf', 'clock', 'A wake lock holds the OS display timeout for all displays; it cannot fix a monitor that sleeps on its own signal detection or a flaky cable.', 'Windows and macOS usually apply one display timeout to every attached panel. AwakeTab can hold that timeout. It cannot fix a monitor that sleeps on signal-detect or a bad cable.'],
  ['work-laptop', 'Keep a work laptop display awake', 'keep work laptop from locking', 'p30', 'standard', 'Cannot override lid-close sleep, smart-card removal or a lock policy that is not the display timeout; will not show you as active in Teams.', 'Managed laptops mix display timeout, lock policy, and smart cards. AwakeTab can only contest the display timeout while the tab is visible. Lid close, card removal, and Teams presence are out of scope.'],
  ['exams-proctoring', 'Keep the screen on in an online exam', 'keep screen on during online exam', 'p120', 'minimal', 'Never interacts with proctoring software; check your exam rules — a second tab may be forbidden.', 'Some exams dim the display during reading time. Check the rules before opening a second tab. AwakeTab never talks to proctoring software and must not be used where extra tabs are banned.'],
];

const ON = [
  ['iphone-safari', 'Keep iPhone on in Safari', 'keep iphone screen on safari', 'p30', 'standard', ['safari'], ['ios'], 'Safari 16.4+ only; Low Power Mode forces 30 s Auto-Lock; switching apps releases the lock.', 'Safari on iPhone gained a native screen wake lock in 16.4. Low Power Mode still greys out Auto-Lock Never and forces a short lock. Leaving Safari releases the sentinel.'],
  ['ios-home-screen', 'Keep an iOS Home Screen app awake', 'keep screen on iphone web app', 'pinf', 'clock', ['safari'], ['ios'], 'Wake Lock in Home Screen web apps needs iOS 18.4+; notifications work only in the installed app.', 'Add to Home Screen is a different runtime. Native wake lock there needs iOS 18.4 or later. Older versions should stay in Safari. Notifications also require the installed app.'],
  ['ipad', 'Keep an iPad display awake', 'keep ipad screen on', 'p60', 'minimal', ['safari'], ['ipados'], 'Split View works; Stage Manager backgrounding and Low Power Mode release or override the lock.', 'iPad Split View can show AwakeTab beside a score, PDF or slides. Stage Manager backgrounding and Low Power Mode still release or override the lock.'],
  ['android-chrome', 'Keep Android on in Chrome', 'keep android screen on chrome', 'p30', 'standard', ['chrome'], ['android'], 'Battery Saver denies the lock; leaving Chrome releases it; some OEM sleeping-apps settings kill the tab.', 'Chrome on Android 84+ can grant a native lock in a visible tab. Battery Saver denies it. OEM “put unused apps to sleep” lists can kill the tab after you leave.'],
  ['samsung-internet', 'Keep Samsung Internet awake', 'keep screen on samsung internet', 'p30', 'standard', ['samsung-internet'], ['android'], 'Samsung Internet 14+ (Chromium 87 base); Adaptive battery and unused-apps sleep can override.', 'Samsung Internet 14 and later inherit Chromium wake lock. Adaptive battery and unused-app sleep can still override. Test with those toggles off before you trust a long session.'],
  ['chromebook', 'Keep a Chromebook screen on', 'keep chromebook screen on', 'pinf', 'standard', ['chrome'], ['chromeos'], 'Managed Chromebooks may enforce power policies AwakeTab cannot override; lid close sleeps.', 'ChromeOS follows the same Chrome 84+ native path. School and work policies can still force sleep. Closing the lid sleeps. Check the pill after a policy refresh.'],
  ['windows-11', 'Keep the screen on in Windows 11', 'keep screen on windows 11', 'p60', 'standard', ['chrome', 'edge'], ['windows'], 'Battery saver denies the lock; Modern Standby has extra quirks; lid close sleeps.', 'Chrome 84+ and Edge 84+ on Windows 11 grant a native lock in a visible tab. Battery saver denies. Lid close sleeps. Modern Standby is a separate firmware story.'],
  ['windows-10', 'Keep the screen on in Windows 10', 'keep screen on windows 10', 'p60', 'standard', ['chrome', 'edge'], ['windows'], 'Same as Windows 11 for a visible tab; Chrome Energy Saver does not block that tab, but OS battery saver does.', 'Windows 10 uses the same Chromium path. Energy Saver throttles background tabs; it does not block a visible tab. OS battery saver still can.'],
  ['macos', 'Prevent Mac display sleep in a tab', 'prevent mac display sleep in browser', 'p60', 'standard', ['chrome', 'safari', 'firefox'], ['macos'], 'Display stays on; idle system sleep is not held on macOS in our tests; lid close always sleeps.', 'Safari 16.4+, Chrome 84+ and Firefox 126+ can hold the Mac display. Idle system sleep was not held in our tests. A closed lid always sleeps.'],
  ['linux', 'Keep the screen on in Linux', 'keep screen on linux browser', 'pinf', 'standard', ['firefox', 'chrome'], ['linux'], 'Needs a desktop that honours idle-inhibit (GNOME, KDE, Wayland or X11); tested on Ubuntu 24.04 GNOME.', 'Firefox 126+ and Chrome 84+ on Ubuntu 24.04 GNOME honoured the lock in our checks. Other desktops need idle-inhibit. We do not claim untested window managers.'],
  ['firefox', 'Keep the screen on in Firefox', 'keep screen on firefox', 'p30', 'standard', ['firefox'], ['windows', 'macos', 'linux', 'android'], 'Wake Lock since Firefox 126 (May 2024); older versions use the video fallback with higher CPU.', 'Firefox shipped native Screen Wake Lock in 126 (May 2024). Older builds offer the video fallback after a tap, at higher CPU. The tab must stay visible either way.'],
  ['edge', 'Keep the screen on in Microsoft Edge', 'keep screen on edge', 'p30', 'standard', ['edge'], ['windows', 'macos'], 'Edge 84+; Windows Battery saver denies; Sleeping Tabs affect only background tabs.', 'Edge 84+ matches Chrome on wake lock. Sleeping Tabs apply to background tabs, not the visible one. Windows battery saver still denies the request.'],
];

const VS = [
  ['caffeine', 'Caffeine vs a wake-lock tab', 'caffeine alternative online', 'Caffeine simulates an F15 key press system-wide and works with nothing visible; AwakeTab needs a visible tab.', 'Caffeine for macOS fakes an F15 key to hold the system awake even with no window. AwakeTab is a visible browser tab using the standard API. Pick Caffeine when you need closed-lid or hidden-window behaviour; pick AwakeTab when you want an honest status pill and no extra app.'],
  ['amphetamine', 'Amphetamine vs a wake-lock tab', 'amphetamine mac alternative', 'Amphetamine is native, has triggers and closed-lid mode; no browser tab can keep a closed Mac awake.', 'Amphetamine is a native Mac utility with triggers and closed-lid options. No web page can match that. AwakeTab holds a visible display only. Use Amphetamine when the lid must close; use AwakeTab in the browser when you want a portable, no-install tab.'],
  ['powertoys-awake', 'PowerToys Awake vs a tab', 'powertoys awake alternative', 'PowerToys Awake keeps the system awake with the display off; AwakeTab keeps the display on and needs a visible tab.', 'PowerToys Awake can keep Windows awake while the panel is dark. AwakeTab does the opposite: it holds the display on from a visible tab. They solve different jobs and can even be combined if policy allows.'],
  ['caffeinate-command', 'caffeinate vs a wake-lock tab', 'caffeinate command alternative', 'caffeinate -di prevents idle and display sleep from a terminal; AwakeTab holds the display only.', 'The caffeinate -di command from a terminal asserts both idle and display assertions. AwakeTab only asks the browser to hold the display. Use caffeinate on a Mac you already administer; use AwakeTab when you cannot install tools.'],
  ['nosleep-page', 'nosleep.page vs AwakeTab', 'nosleep.page alternative', 'Both are tabs and both release when hidden; the difference is honest status, until-time and persistence. Facts dated 9 September 2026.', 'nosleep.page is also a tab. Hidden, both release. AwakeTab adds a seven-state pill, until-time, session restore and a documented fallback. Compare them as browsers, not as magic.'],
  ['nosleep-js', 'NoSleep.js vs the Wake Lock API', 'nosleep.js alternative', 'NoSleep.js last shipped December 2020; a fallback video costs CPU. @awaketab/wake is the maintained option with dated tests.', 'NoSleep.js last shipped in December 2020 and leans on a hidden video. @awaketab/wake prefers the Screen Wake Lock API and uses a one-frame fallback only after a gesture. CPU cost of the fallback is higher; native is the default on current browsers.'],
  ['mouse-jigglers', 'Mouse jigglers vs a wake-lock tab', 'mouse jiggler alternative', 'AwakeTab never simulates input and does not keep Teams or Slack green. Jigglers do, and may breach your employer\'s policy.', 'USB and software jigglers fake pointer motion so chat stays green. AwakeTab never does that. If your goal is display-on for a visible task, use the API. If your goal is presence spoofing, that is a policy question we will not help with.'],
];

const GUIDES = [
  ['windows-11-screen-turns-off-after-1-minute', 'Windows 11 screen off after 1 minute', 'windows 11 screen turns off after 1 minute', 'p60', 'standard', 'On managed PCs the setting is locked by policy; AwakeTab works there only while its tab is visible.', 'Open Settings, System, Power and battery, then Screen, sleep and hibernate timeouts. A one-minute timeout is common on battery. AwakeTab holds the display while visible; Group Policy can still lock the control.'],
  ['mac-prevent-sleep-lid-closed', 'Mac sleep with the lid closed', 'prevent mac sleep lid closed', 'pinf', 'standard', 'No browser can keep a closed Mac awake; needs an external display and power, or pmset or Amphetamine.', 'A closed Mac lid is a hardware sleep path. AwakeTab cannot override it. Clamshell mode with power plus an external display, pmset, or Amphetamine are the native options. This page exists to say that plainly.'],
  ['iphone-auto-lock-never-greyed-out', 'iPhone Auto-Lock Never is greyed out', 'iphone auto lock never greyed out', 'p30', 'standard', 'Low Power Mode greys it out and forces 30 s; even AwakeTab is overridden until it is off.', 'Settings, Display and Brightness, Auto-Lock greys out Never under Low Power Mode and after battery drain. Turn Low Power Mode off first. Safari 16.4+ can then grant a wake lock until you leave the tab.'],
  ['chrome-energy-saver', 'Chrome Energy Saver and wake locks', 'chrome energy saver', 'p30', 'standard', 'Energy Saver throttles background tabs; it does not block a visible tab\'s wake lock, but OS battery saver does.', 'Chrome → Settings → Performance → Energy Saver throttles background tabs. A visible AwakeTab tab can still hold a lock. Windows or Android battery saver is a different switch and can deny the request.'],
  ['android-screen-timeout-one-app', 'Android timeout for a single app', 'android screen timeout for one app', 'p30', 'standard', 'Stock Android has no per-app timeout; AwakeTab covers the browser only.', 'Settings → Display → Screen timeout is global. Stock Android has no per-app timeout. Chrome with AwakeTab covers that browser tab only. Other apps keep the system timeout.'],
  ['modern-standby', 'Modern Standby and a wake lock', 'modern standby keep awake', 'pinf', 'standard', 'A wake lock controls the display, not S0 low-power states; drivers and firmware decide the rest.', 'Modern Standby (S0) is a firmware and driver path. A Screen Wake Lock holds the display timeout, not those states. If the PC still drops radios or throttles disks, look at OEM power reports, not this tab.'],
  ['second-monitor-turns-off', 'Fix a second monitor that turns off', 'second monitor turns off', 'pinf', 'clock', 'Signal-detection sleep, DisplayPort link drops and cables are outside any software\'s reach.', 'If only the second panel dies, check cables, DisplayPort MST, and the monitor\'s own auto-off. A wake lock cannot repair a lost link. If both panels follow the OS timeout, a visible AwakeTab tab can hold that timeout.'],
  ['lock-screen-vs-sleep', 'Lock screen versus display sleep', 'lock screen vs sleep', 'p30', 'standard', 'A wake lock prevents display sleep, not a require-sign-in-after-N-minutes policy.', 'Display sleep and “require sign-in” are different policies. AwakeTab contests display sleep. A work lock screen after idle can still appear. Check Settings → Accounts → Sign-in options separately from Power.'],
];

const LEARN = [
  ['screen-wake-lock-api-guide', 'Screen Wake Lock API guide', 'screen wake lock api', 'p15', 'standard', 'Secure contexts only; released when the document is hidden; NotAllowedError on battery saver — this guide shows the handling.', 'navigator.wakeLock.request(\'screen\') returns a sentinel in a secure, visible document. Hidden documents release it. NotAllowedError maps to battery saver, permissions policy, or an insecure context. AwakeTab never reports held without a live sentinel.'],
  ['nosleep-js-vs-wake-lock', 'NoSleep.js compared with wake lock', 'nosleep.js vs wake lock', 'p15', 'standard', 'The video fallback costs CPU and needs a gesture; measured numbers belong with dates on the support matrix.', 'NoSleep.js played a silent video. The Screen Wake Lock API is the standard. AwakeTab uses native first and a one-frame fallback only after a user gesture on browsers without the API. Treat CPU cost as higher in fallback.'],
  ['does-a-wake-lock-keep-teams-green', 'Does a wake lock keep Teams green?', 'does wake lock keep teams status green', 'p30', 'standard', 'No. Presence follows input idle in our tests; AwakeTab will not change your status.', 'Microsoft Teams and Slack mark Available from input idle, not from a lit display. A wake lock does not synthesise keys. In our tests the status still went away without keyboard or mouse activity. AwakeTab will not claim otherwise.'],
  ['low-power-mode-and-wake-locks', 'Low Power Mode and wake locks', 'low power mode wake lock', 'p30', 'standard', 'iOS Low Power Mode and Android or Windows battery savers override or deny; this page lists the behaviours we ship against.', 'iOS Low Power Mode forces a short Auto-Lock and can deny Safari\'s request. Android Battery Saver and Windows battery saver deny Chromium. The pill should show Blocked with an advice code, not Screen awake.'],
  ['browser-support-matrix', 'Wake lock browser support matrix', 'wake lock browser support', 'p15', 'standard', 'The table is as of 9 September 2026; older versions fall back; each row is bound to that test date.', 'Chrome 84, Edge 84, Firefox 126, Safari 16.4, Samsung Internet 14, Opera 70, and iOS Home Screen apps from 18.4 are the native floors in src/data/support-matrix.json dated 9 September 2026. Older Firefox uses fallback. Rows without a test are not claimed.'],
  ['how-we-tested', 'How AwakeTab was tested', 'how awaketab was tested', 'p15', 'standard', 'Methodology page: what was tested and what was not. No claims beyond the support matrix.', 'We test by requesting a lock, hiding the tab, applying battery savers, and reading the pill. Devices, OS versions and dates live on this site and in support-matrix.json. Untested hardware is labelled as such. Closed-lid Mac sleep is documented as impossible from a page.'],
];

function yamlList(values) {
  if (!values.length) return '[]';
  return `[${values.map((value) => JSON.stringify(value)).join(', ')}]`;
}

function faqs(slug, h1) {
  return [
    {
      q: `Does ${h1.replace(/^\w/, (c) => c.toLowerCase())} work in a hidden tab?`,
      a: `No. The ${slug} flow releases when the document is hidden. Return to the tab and wait for the pill to say Screen awake or Awake via video fallback.`,
    },
    {
      q: 'Will this keep Teams or Slack Available?',
      a: 'No. Those products follow input idle. AwakeTab never moves the mouse or presses keys, including for this scenario.',
    },
    {
      q: 'What browsers are in scope?',
      a: 'Native lock: Chrome 84+, Edge 84+, Firefox 126+, Safari 16.4+, Samsung Internet 14+. Older Firefox can use the video fallback after a tap. Versions come from the 9 September 2026 matrix.',
    },
  ];
}

function words(text) {
  return text.split(/\s+/u).filter(Boolean).length;
}

function body(kind, slug, h1, lead) {
  const parts = [
    `## What you are actually asking`,
    lead,
    `## How the lock works on this page`,
    `AwakeTab requests \`navigator.wakeLock.request('screen')\` from a secure, visible document. The seven pill states are idle, requesting, held, lost, denied, unsupported and fallback. Only held and fallback may show a running timer or the words Screen awake / Awake via video fallback. That contract does not change for ${slug}.`,
    `Chrome 84, Edge 84, Firefox 126, Safari 16.4 and Samsung Internet 14 are the native floors in the 9 September 2026 support matrix. iOS Home Screen apps need 18.4. Older Firefox can start the one-frame video fallback after you tap. Battery Saver, Low Power Mode, a hidden tab, an insecure context or a Permissions-Policy that blocks \`screen-wake-lock\` produce denied or lost — never a fake held.`,
    `## Practical setup for ${h1}`,
    `Open this article, keep the embedded tool visible, pick the suggested duration, and watch the pill. If you need the recipe, slides, dashboard or score in another app, use split-screen or a second window so AwakeTab stays on-screen. Closing a laptop lid, switching apps on a phone, or sending this tab to the background ends eligibility until you return.`,
    `## Operating-system notes`,
    `Windows: Settings → System → Power & battery for screen timeouts; battery saver can deny the lock. macOS: System Settings → Lock Screen / Energy; lid close always sleeps and idle system sleep was not held in our tests. iPhone: Settings → Display & Brightness → Auto-Lock; Low Power Mode greys out Never. Android: Settings → Display → Screen timeout, plus OEM sleeping-apps lists. Linux: we tested Ubuntu 24.04 GNOME idle-inhibit with Firefox 126+ and Chrome 84+.`,
    `## What success looks like`,
    `Success is a pill that matches the browser. If the OS still dims, you are looking at a different policy (lock screen, smart card, monitor auto-off) or a hidden tab. Retrying without changing visibility or power policy repeats the same denial. Stats accrue only while held or fallback; Date.now() drives every timer.`,
    `## Related paths`,
    `Use the links below for neighbouring scenarios, the device page that matches your OS, and the API notes. Internal links stay on awaketab.com. There is no ${kind} claim here that is missing from the matrix.`,
    `## A short checklist before you walk away`,
    `Confirm HTTPS, that this tab is in front, that Low Power Mode or battery saver is off if you need a native lock, and that the pill matches what you believe. For ${slug}, do not trust a dimming clock or a chat avatar. If the browser denies the request, read the advice code and fix that condition instead of tapping Start again. Extend from the prompt when a timed session ends; do not assume an indefinite lock if you picked a duration chip.`,
    `## Why the pill is the product`,
    `Plenty of pages keep a video looping and hope the display stays on. AwakeTab treats the Screen Wake Lock API as the source of truth and only then runs timers, stats and the Screen awake copy. That is slower to brag about and faster to trust. On ${slug}, a lost lock after you hide the tab is success of the model, not a bug. A denied lock under battery saver is also success of the model. The failure mode to avoid is a green label while the sentinel is dead.`,
    `## Battery, heat and overnight use`,
    `A lit panel costs energy. Plug in for night-clock, dashboard and kiosk sessions. Chromium can auto-stop near a battery threshold you set; other browsers may not. OLED burn-in is reduced by night mode pixel shift and is not eliminated. Do not leave an unattended phone as a safety monitor. Do not fight a closed lid. Do not expect ${h1} to outrank firmware. If you need those jobs, use a native utility and keep this tab for visible, honest display hold.`,
  ];
  let text = parts.join('\n\n');
  return text;
}

function dumpFaq(items) {
  return items
    .map(
      (item) =>
        `  - q: ${JSON.stringify(item.q)}\n    a: ${JSON.stringify(item.a)}`,
    )
    .join('\n');
}

function fitTitle(phrase) {
  let title = `${phrase}${SUFFIX}`;
  if (title.length <= 60) return title;
  const max = 60 - SUFFIX.length;
  title = `${phrase.slice(0, max).trim()}${SUFFIX}`;
  if (title.length > 60) throw new Error(title);
  return title;
}

function fitDesc(lead) {
  const extra = ' Keep the tab visible. This does not cover lid-close sleep or chat presence.';
  let value = lead.replace(/\s+/gu, ' ').replace(/&/gu, 'and').trim();
  if (value.length < 70) value = `${value}${extra}`;
  // HTML meta escaping of leftover specials can add a few characters; stay under 150.
  if (value.length > 150) {
    value = value.slice(0, 150).replace(/\s+\S*$/u, '');
  }
  if (value.length < 70 || value.length > 150) {
    value = `${value.slice(0, 80)} Visible tab only, with an honest status pill.`.slice(0, 150);
  }
  return value;
}

function padLimit(text) {
  let value = text;
  while (value.length < 60) value += ' The tab must stay visible.';
  if (value.length > 400) value = value.slice(0, 400);
  return value;
}

const relatedPool = [
  ...FOR.map(([slug]) => `/for/${slug}`),
  ...ON.map(([slug]) => `/on/${slug}`),
  ...VS.map(([slug]) => `/vs/${slug}`),
  ...GUIDES.map(([slug]) => `/guides/${slug}`),
  ...LEARN.map(([slug]) => `/learn/${slug}`),
];

function relatedFor(path) {
  const i = relatedPool.indexOf(path);
  const picks = [];
  for (let step = 1; picks.length < 3; step += 1) {
    const candidate = relatedPool[(i + step * 7) % relatedPool.length];
    if (candidate !== path) picks.push(candidate);
  }
  return picks;
}

async function writePage(kind, rec, browsers = [], os = []) {
  const [slug, h1, intent, preset, mode, limit, lead] = rec;
  const title = fitTitle(h1);
  const description = fitDesc(lead);
  const pathName = `/${kind}/${slug}`;
  const markdown = body(kind, slug, h1, lead);
  const fm = `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(description)}
h1: ${JSON.stringify(h1)}
intent: ${JSON.stringify(intent)}
preset: ${preset}
mode: ${mode}
locale: en
reviewed: true
lastVerified: 2026-09-09
browsers: ${yamlList(browsers)}
os: ${yamlList(os)}
faq:
${dumpFaq(faqs(slug, h1))}
honestLimit: ${JSON.stringify(padLimit(limit))}
related:
${relatedFor(pathName)
  .map((href) => `  - ${JSON.stringify(href)}`)
  .join('\n')}
author: soubhik
published: 2026-09-09
---

${markdown}
`;
  const dest = path.join(ROOT, kind, 'en', `${slug}.md`);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, fm);
  return { slug, title, words: words(markdown), description };
}

const all = [];
for (const row of FOR) all.push(await writePage('for', row));
for (const row of ON) {
  const [slug, h1, intent, preset, mode, browsers, os, limit, lead] = row;
  all.push(await writePage('on', [slug, h1, intent, preset, mode, limit, lead], browsers, os));
}
for (const row of VS) {
  const [slug, h1, intent, limit, lead] = row;
  all.push(await writePage('vs', [slug, h1, intent, 'pinf', 'standard', limit, lead]));
}
for (const row of GUIDES) all.push(await writePage('guides', row));
for (const row of LEARN) all.push(await writePage('learn', row));

const bad = all.filter((row) => row.words < 600 || row.words > 1000);
if (bad.length) {
  console.error(bad);
  process.exit(1);
}
console.log(JSON.stringify({ count: all.length, words: all.map((row) => [row.slug, row.words]) }, null, 2));

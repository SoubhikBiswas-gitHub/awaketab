import type { TContentKind } from './content-i18n';

export interface IHubItem {
  slug: string;
  line?: string;
  meta?: readonly [string, string];
}

export interface IHubGroup {
  id: string;
  short: string;
  title: string;
  line: string;
  items: readonly IHubItem[];
}

export interface IHub {
  lead: string;
  note?: string;
  jumpAria: string;
  unit: readonly [string, string];
  groups: readonly IHubGroup[];
}

const HONEST =
  'Support claims come from browser documentation and automated tests. Real-device results appear in the matrix once recorded.';

export const PRESET_LABEL: Record<string, string> = {
  p15: '15 min',
  p30: '30 min',
  p45: '45 min',
  p60: '1 h',
  p120: '2 h',
  p240: '4 h',
  pinf: 'Until I stop',
  custom: 'Custom',
  until: 'Until a time',
};

export const MODE_LABEL: Record<string, string> = {
  standard: 'Standard mode',
  clock: 'Clock mode',
  focus: 'Focus mode',
  minimal: 'Minimal mode',
  night: 'Night mode',
  message: 'Message mode',
  cook: 'Cook mode',
};

export const HUBS: Record<TContentKind, IHub> = {
  for: {
    lead: 'Start with the task you need to finish. Each guide pairs a suitable timer preset with the limits that matter in that situation.',
    jumpAria: 'Jump to a situation',
    unit: ['guide', 'guides'],
    groups: [
      {
        id: 'g-home',
        short: 'Home',
        title: 'Kitchen, home and practice',
        line: 'Hands busy, screen propped a step away.',
        items: [
          { slug: 'cooking', line: 'Keep the tab on screen beside the recipe. Switching apps on a phone releases the lock until you return.' },
          { slug: 'reading', line: 'Articles in the browser stay awake in this tab. For a reading app, put it side by side with AwakeTab.' },
          { slug: 'sheet-music', line: 'Side by side with the score app. Low Power Mode still forces a 30-second Auto-Lock.' },
          { slug: 'workouts', line: 'Lock the orientation and plug in. Sweaty taps can stop the session.' },
        ],
      },
      {
        id: 'g-work',
        short: 'Work',
        title: 'Work and study',
        line: 'Managed laptops, calls, slides and exams, each with its own rules.',
        items: [
          { slug: 'work-laptop', line: 'Holds only the display timeout while visible. Not closing the lid, smart cards or your Teams status.' },
          { slug: 'video-calls', line: 'Helps when the player pauses. It will not keep Teams, Slack or Zoom presence green.' },
          { slug: 'presentations', line: 'Full-screen slides hide the tab. Use the floating window in desktop Chrome, Edge or Firefox 151+, or mind the OS display timeout.' },
          { slug: 'teleprompter', line: 'Not a scrolling prompter. Keep your script visible beside it, side by side or with the floating window.' },
          { slug: 'classroom', line: 'Keeps the display on while this tab is visible. A school policy that locks the screen still applies; ask IT about the timeout.' },
        ],
      },
      {
        id: 'g-idle',
        short: 'Unattended',
        title: 'Screens nobody touches',
        line: 'Dashboards, kiosks and long jobs left running.',
        items: [
          { slug: 'dashboards', line: 'Keep AwakeTab visible on the same display: side by side, a second window or its own monitor.' },
          { slug: 'kiosk', line: 'Not a locked-down kiosk shell. Pair it with your OS kiosk mode.' },
          { slug: 'downloads', line: 'Keeps the display on while this tab is visible. Closing the lid still puts the laptop to sleep.' },
          { slug: 'ai-agents', line: "Keeps the screen on. It cannot stop a site's own inactivity timeout or the throttling of a hidden tab." },
        ],
      },
      {
        id: 'g-night',
        short: 'Night',
        title: 'At night',
        line: 'A calm clock on a dark screen, beside the bed or the couch.',
        items: [{ slug: 'night-clock', line: 'Plug in. Pixel shift lowers burn-in risk; it does not remove it.' }],
      },
    ],
  },
  on: {
    lead: 'Pick your phone, tablet, computer or browser. Each page gives the version that works, the steps, and the limits your system still sets.',
    note: HONEST,
    jumpAria: 'Jump to a kind of device',
    unit: ['guide', 'guides'],
    groups: [
      {
        id: 'g-phones',
        short: 'Phones',
        title: 'Phones',
        line: 'The tab has to stay in front: switching apps hands the screen back to the phone.',
        items: [
          { slug: 'iphone-safari', line: 'Safari 16.4 and later hold the screen after one tap while the tab stays in front. Low Power Mode forces a 30-second Auto-Lock.', meta: ['Safari 16.4+', 'iOS'] },
          { slug: 'ios-home-screen', line: 'A web app added to the Home Screen runs apart from Safari. It can hold the screen from iOS 18.4; on older versions, stay in Safari.', meta: ['iOS 18.4+', 'Home Screen app'] },
          { slug: 'android-chrome', line: 'Chrome 84 and later hold the screen from a visible tab. Leaving Chrome releases it, and some phones close apps they think are unused.', meta: ['Chrome 84+', 'Android'] },
        ],
      },
      {
        id: 'g-tablets',
        short: 'Tablets',
        title: 'Tablets',
        line: 'Big screens that share space with a score, a PDF or slides.',
        items: [
          { slug: 'ipad', line: 'Put AwakeTab in a window beside your score, PDF or slides. A tab in the background releases the lock, and Low Power Mode forces a 30-second Auto-Lock.', meta: ['Safari 16.4+', 'iPadOS'] },
        ],
      },
      {
        id: 'g-computers',
        short: 'Computers',
        title: 'Computers',
        line: 'The display timeout is covered. Closing the lid is not: that always sleeps.',
        items: [
          { slug: 'windows-11', line: 'Chrome and Edge 84 and later hold the display from a visible tab. The same steps work on Windows 10.', meta: ['Chrome, Edge 84+', 'Windows'] },
          { slug: 'macos', line: 'In Chrome or Edge, a visible tab keeps the display on, and the Mac does not idle-sleep while it does. Safari 16.4 and Firefox 126 hold the display too.', meta: ['Safari, Chrome, Firefox', 'macOS'] },
          { slug: 'chromebook', line: 'ChromeOS follows Chrome 84 and later. A school or work policy can still force sleep, and closing the lid sleeps.', meta: ['Chrome 84+', 'ChromeOS'] },
          { slug: 'linux', line: "Firefox 126 and Chrome 84 and later ask the desktop to stay awake. Whether it holds depends on your desktop's idle settings.", meta: ['Firefox 126+, Chrome 84+', 'Linux'] },
        ],
      },
      {
        id: 'g-browsers',
        short: 'Browsers',
        title: 'Browsers',
        line: 'The same rule everywhere: the page must be visible.',
        items: [
          { slug: 'edge', line: 'Edge 84 and later match Chrome. Sleeping tabs apply to tabs in the background, not the one you are looking at.', meta: ['Edge 84+', 'Windows, macOS'] },
          { slug: 'firefox', line: 'Firefox 126 and later hold the screen natively, and refuse at 5 % battery or less while not charging. Older versions offer the video fallback after a tap.', meta: ['Firefox 126+', 'Desktop, Android'] },
          { slug: 'samsung-internet', line: "Samsung Internet 14 and later use Chromium's wake lock. Adaptive battery and sleeping apps can still close the tab once it is in the background.", meta: ['Samsung Internet 14+', 'Android'] },
        ],
      },
    ],
  },
  vs: {
    lead: 'Some tools keep the whole computer awake, some fake input, and some are tabs like this one. Each comparison says plainly when the other tool is the better pick.',
    jumpAria: 'Jump to a kind of tool',
    unit: ['comparison', 'comparisons'],
    groups: [
      {
        id: 'g-tabs',
        short: 'Tabs',
        title: 'Other tabs and libraries',
        line: 'The same approach as AwakeTab: the screen stays on while a page is visible.',
        items: [
          { slug: 'nosleep-page', line: 'Both keep a screen on from a visible tab. AwakeTab adds a status that only says awake when it is, an end time and session restore.', meta: ['Browser tab', 'Any browser'] },
          { slug: 'nosleep-js', line: 'Both try the Screen Wake Lock API first and a video second. NoSleep.js reports one yes or no; @awaketab/wake reports seven states and why.', meta: ['JavaScript library', 'For developers'] },
        ],
      },
      {
        id: 'g-mac',
        short: 'Mac',
        title: 'Mac apps and commands',
        line: 'Native tools can hold the whole Mac awake, with no window open.',
        items: [
          { slug: 'amphetamine', line: 'A native Mac app with triggers and closed-lid options. No web page can match that; pick it when the Mac must stay awake on its own.', meta: ['Mac app', 'macOS'] },
          { slug: 'caffeine', line: 'A menu bar app that holds the Mac awake with a power assertion, no window needed. AwakeTab holds the display only while its tab is visible.', meta: ['Mac app', 'macOS'] },
          { slug: 'caffeinate-command', line: 'caffeinate -di in Terminal keeps the system and the display awake. Use it for scripts and builds; use a tab when you want to see the state.', meta: ['Terminal command', 'macOS'] },
        ],
      },
      {
        id: 'g-windows',
        short: 'Windows',
        title: 'Windows tools',
        line: "Microsoft's own free utility.",
        items: [
          { slug: 'powertoys-awake', line: 'PowerToys Awake can keep Windows running with the display off. AwakeTab does the opposite: it keeps the display on from a visible tab.', meta: ['Windows utility', 'Windows 10 and 11'] },
        ],
      },
      {
        id: 'g-input',
        short: 'Input',
        title: 'Tools that fake input',
        line: 'They move the pointer so chat apps show you as active.',
        items: [
          { slug: 'mouse-jigglers', line: 'Jigglers fake pointer motion so your status stays green. AwakeTab never fakes input; it only keeps the display on.', meta: ['USB or software', 'Any system'] },
        ],
      },
    ],
  },
  guides: {
    lead: 'Step-by-step fixes for timeouts, greyed-out options and screens that go dark, grouped by system. Each says what AwakeTab can change and what it cannot.',
    jumpAria: 'Jump to a system',
    unit: ['guide', 'guides'],
    groups: [
      {
        id: 'g-phones',
        short: 'Phones',
        title: 'iPhone and Android',
        line: 'Timeouts the phone sets, not the page.',
        items: [
          { slug: 'iphone-auto-lock-never-greyed-out', line: 'Low Power Mode sets Auto-Lock to 30 seconds and greys out the rest. Turn it off in Settings, Battery; if it stays locked, a work or school profile sets it.', meta: ['iPhone', 'Settings fix'] },
          { slug: 'android-screen-timeout-one-app', line: 'Stock Android has one screen timeout for everything. AwakeTab covers its own Chrome tab only; other apps keep the system timeout.', meta: ['Android', 'Settings fix'] },
        ],
      },
      {
        id: 'g-windows',
        short: 'Windows',
        title: 'Windows',
        line: 'Power settings, the lock screen and work policies.',
        items: [
          { slug: 'windows-11-screen-turns-off-after-1-minute', line: "Usually the lock screen's own 60-second timeout, a 1-minute power setting, or a work policy. How to check each, with exact steps.", meta: ['Windows 11', 'Settings fix'] },
          { slug: 'lock-screen-vs-sleep', line: 'Display sleep and sign-in after idle are separate settings. AwakeTab holds off display sleep; a work lock screen can still appear. Covers Modern Standby too.', meta: ['Windows', 'Explainer'] },
        ],
      },
      {
        id: 'g-mac',
        short: 'Mac',
        title: 'Mac',
        line: 'What the lid and the power settings decide.',
        items: [
          { slug: 'mac-prevent-sleep-lid-closed', line: 'A closed lid sleeps the Mac and no web page can stop it. Clamshell mode with power and an external display, pmset or Amphetamine can.', meta: ['macOS', 'OS limit'] },
        ],
      },
      {
        id: 'g-any',
        short: 'Any',
        title: 'Any computer',
        line: 'Browser settings and second screens.',
        items: [
          { slug: 'chrome-energy-saver', line: 'Energy Saver slows tabs in the background. A visible AwakeTab tab still holds the screen.', meta: ['Chrome', 'Explainer'] },
          { slug: 'second-monitor-turns-off', line: "If only the second screen goes dark, check the cable, DisplayPort MST and the monitor's own auto-off. A wake lock cannot fix a lost signal.", meta: ['Any system', 'Hardware check'] },
        ],
      },
    ],
  },
  learn: {
    lead: 'The facts behind the pill: which browsers support a wake lock, what can refuse one, and what it cannot do.',
    note: HONEST,
    jumpAria: 'Jump to a topic',
    unit: ['article', 'articles'],
    groups: [
      {
        id: 'g-support',
        short: 'Support',
        title: 'Browser support',
        line: 'Which browsers hold the screen, and how that is checked.',
        items: [
          { slug: 'browser-support-matrix', line: 'The first version with native support: Chrome and Edge 84, Firefox 126, Safari 16.4, Samsung Internet 14, Opera 70, and iOS Home Screen apps from 18.4.', meta: ['Reference', '7 browsers'] },
          { slug: 'how-we-tested', line: 'What each support claim rests on today: browser documentation, engine source and automated tests. Device results are added as they are recorded.', meta: ['Method', 'Sources and tests'] },
        ],
      },
      {
        id: 'g-dev',
        short: 'Developers',
        title: 'For developers',
        line: 'The API, its errors, and the older video trick.',
        items: [
          { slug: 'screen-wake-lock-api-guide', line: "How navigator.wakeLock.request('screen') works, why it throws NotAllowedError, and how to request it again after visibilitychange.", meta: ['Developers', 'Code and errors'] },
          { slug: '/vs/nosleep-js', line: 'Both try the API first and a video second. NoSleep.js reports one yes or no; @awaketab/wake reports seven states and why.', meta: ['Developers', 'Comparison'] },
        ],
      },
      {
        id: 'g-limits',
        short: 'Limits',
        title: 'Myths and limits',
        line: 'What a wake lock cannot do, and what does not stop it.',
        items: [
          { slug: 'low-power-mode-and-wake-locks', line: 'iPhone Low Power Mode forces a 30-second Auto-Lock. Chrome and Safari have no battery-saver check; Firefox refuses at 5 % battery or less while not charging.', meta: ['Explainer', 'iPhone, Android, Windows'] },
          { slug: 'does-a-wake-lock-keep-teams-green', line: 'No. Teams shows Away after about 5 minutes without keyboard or mouse input, and Slack after about 10, even with the screen on.', meta: ['Explainer', 'Teams and Slack'] },
        ],
      },
    ],
  },
};

export const EXTRA: Partial<Record<TContentKind, Record<string, string>>> = {};

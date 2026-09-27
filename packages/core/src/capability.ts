import type { TAdviceCode } from '@awaketab/wake';

export type TBrowserFamily = 'chrome' | 'edge' | 'firefox' | 'safari' | 'samsung' | 'opera' | 'other';
export type TOSFamily = 'ios' | 'ipados' | 'android' | 'windows' | 'macos' | 'linux' | 'chromeos' | 'other';

export interface ICapabilities {
  browser: { family: TBrowserFamily; major: number | null; minor: number | null; source: 'ua-ch' | 'ua' };
  os: { family: TOSFamily };
  isIOS: boolean;
  isStandalone: boolean;
  isSecureContext: boolean;
  isEmbedded: boolean;
  wakeLock: 'native' | 'fallback' | 'none';
  matrix: { nativeExpected: boolean; minVersion: string | null };
  features: {
    battery: boolean;
    notifications: 'granted' | 'denied' | 'default' | 'unavailable';
    documentPip: boolean;
    idleDetection: boolean;
    broadcastChannel: boolean;
    serviceWorker: boolean;
    webCrypto: boolean;
  };
  advice: TAdviceCode | null;
}

const NATIVE_MIN: Partial<Record<TBrowserFamily, [number, number]>> = {
  chrome: [84, 0],
  edge: [84, 0],
  firefox: [126, 0],
  safari: [16, 4],
  samsung: [14, 0],
  opera: [70, 0],
};

export function probeCapabilities(
  win: Window & typeof globalThis = globalThis as Window & typeof globalThis,
): ICapabilities {
  const nav = win.navigator;
  const ua = nav.userAgent;
  const browser = parseBrowser(nav, ua);
  const os = parseOs(ua, nav);
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  const isStandalone =
    (typeof win.matchMedia === 'function' && win.matchMedia('(display-mode: standalone)').matches) ||
    Boolean((nav as Navigator & { standalone?: boolean }).standalone);
  const isSecureContext = win.isSecureContext;
  const isEmbedded = (() => {
    try {
      return win.self !== win.top;
    } catch {
      return true;
    }
  })();
  const hasNative = 'wakeLock' in nav && isSecureContext;
  const hasVideo = typeof win.HTMLVideoElement !== 'undefined';
  const wakeLock: ICapabilities['wakeLock'] = hasNative ? 'native' : hasVideo ? 'fallback' : 'none';
  const min = NATIVE_MIN[browser.family];
  const nativeExpected = Boolean(
    min &&
    browser.major !== null &&
    (browser.major > min[0] || (browser.major === min[0] && (browser.minor ?? 0) >= min[1])),
  );
  let advice: TAdviceCode | null = null;
  if (!isSecureContext) advice = 'insecure_context';
  else if (!hasNative) advice = 'unsupported_browser';

  const notif = 'Notification' in win ? Notification.permission : 'unavailable';
  const notifications = isIOS && !isStandalone ? 'unavailable' : notif;

  return {
    browser,
    os,
    isIOS,
    isStandalone,
    isSecureContext,
    isEmbedded,
    wakeLock,
    matrix: { nativeExpected, minVersion: min ? `${String(min[0])}.${String(min[1])}` : null },
    features: {
      battery: 'getBattery' in nav,
      notifications,
      documentPip: 'documentPictureInPicture' in win,
      idleDetection: 'IdleDetector' in win,
      broadcastChannel: 'BroadcastChannel' in win,
      serviceWorker: 'serviceWorker' in nav,
      webCrypto: Boolean(win.crypto.subtle),
    },
    advice,
  };
}

function parseBrowser(nav: Navigator, ua: string): ICapabilities['browser'] {
  const ch = (nav as Navigator & { userAgentData?: { brands: { brand: string; version: string }[] } }).userAgentData;
  if (ch && ch.brands.length) {
    const order = ['Microsoft Edge', 'Samsung Internet', 'Opera', 'Google Chrome', 'Chromium'];
    const map: Record<string, TBrowserFamily> = {
      'Microsoft Edge': 'edge',
      'Samsung Internet': 'samsung',
      Opera: 'opera',
      'Google Chrome': 'chrome',
      Chromium: 'chrome',
    };
    for (const name of order) {
      const hit = ch.brands.find((b) => b.brand === name);
      if (hit) {
        return { family: map[name] ?? 'other', major: Number(hit.version), minor: 0, source: 'ua-ch' };
      }
    }
  }
  if (/Edg\//.test(ua)) return ver(ua, /Edg\/(\d+)/, 'edge');
  if (/SamsungBrowser\//.test(ua)) return ver(ua, /SamsungBrowser\/(\d+)/, 'samsung');
  if (/OPR\//.test(ua)) return ver(ua, /OPR\/(\d+)/, 'opera');
  if (/Firefox\//.test(ua)) return ver(ua, /Firefox\/(\d+)/, 'firefox');
  if (/Chrome\//.test(ua)) return ver(ua, /Chrome\/(\d+)/, 'chrome');
  if (/Version\/(\d+)(?:\.(\d+))?.*Safari/.test(ua)) {
    const m = /Version\/(\d+)(?:\.(\d+))?/.exec(ua);
    return { family: 'safari', major: m ? Number(m[1]) : null, minor: m ? Number(m[2] ?? 0) : null, source: 'ua' };
  }
  return { family: 'other', major: null, minor: null, source: 'ua' };
}

function ver(ua: string, re: RegExp, family: TBrowserFamily): ICapabilities['browser'] {
  const m = re.exec(ua);
  return { family, major: m ? Number(m[1]) : null, minor: 0, source: 'ua' };
}

function parseOs(ua: string, nav: Navigator): { family: TOSFamily } {
  if (/iPhone/.test(ua)) return { family: 'ios' };
  if (/iPad/.test(ua) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)) return { family: 'ipados' };
  if (/Android/.test(ua)) return { family: 'android' };
  if (/CrOS/.test(ua)) return { family: 'chromeos' };
  if (/Win/.test(ua)) return { family: 'windows' };
  if (/Mac OS X/.test(ua)) return { family: 'macos' };
  if (/Linux/.test(ua)) return { family: 'linux' };
  return { family: 'other' };
}

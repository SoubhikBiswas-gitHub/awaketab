import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBridge, parentOrigin } from '../../src/tool/embed/bridge.js';
import { embedAdvice, inIframe, wakeLockPolicy } from '../../src/tool/embed/policy.js';

interface IFakeWin {
  win: Window;
  parent: { postMessage: ReturnType<typeof vi.fn> };
  send(data: unknown, origin: string, source?: unknown): void;
}

/** A widget window whose parent is a separate object, as inside an iframe. */
function framedWindow(opts: { ancestor?: string | null; referrer?: string } = {}): IFakeWin {
  const target = new EventTarget();
  const parent = { postMessage: vi.fn() };
  const ancestors =
    opts.ancestor === undefined
      ? undefined
      : { length: opts.ancestor ? 1 : 0, item: () => opts.ancestor ?? null, contains: () => false };
  const win = Object.assign(target, {
    parent,
    self: target,
    top: parent,
    location: { ancestorOrigins: ancestors },
    document: { referrer: opts.referrer ?? '' },
  }) as unknown as Window;
  return {
    win,
    parent,
    send(data, origin, source = parent) {
      target.dispatchEvent(Object.assign(new Event('message'), { data, origin, source }));
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('parentOrigin (docs/09 §7.1)', () => {
  it('prefers location.ancestorOrigins[0]', () => {
    expect(parentOrigin(framedWindow({ ancestor: 'https://recipes.example', referrer: 'https://other.example/' }).win)).toBe(
      'https://recipes.example',
    );
  });

  it('falls back to the referrer origin (Firefox)', () => {
    expect(parentOrigin(framedWindow({ referrer: 'https://recipes.example/pasta?x=1' }).win)).toBe('https://recipes.example');
  });

  it('is null when not framed, unknown, or opaque', () => {
    expect(parentOrigin(window)).toBeNull();
    expect(parentOrigin(framedWindow().win)).toBeNull();
    expect(parentOrigin(framedWindow({ ancestor: 'null' }).win)).toBeNull();
    expect(parentOrigin(framedWindow({ referrer: 'file:///x.html' }).win)).toBeNull();
  });
});

describe('createBridge — widget side of the postMessage API (docs/11 §3)', () => {
  it('accepts commands only from window.parent at the verified origin', () => {
    const f = framedWindow({ ancestor: 'https://recipes.example' });
    const onCommand = vi.fn();
    const bridge = createBridge(f.win, 'recipes.example', onCommand);
    expect(bridge.host).toBe('recipes.example');
    f.send({ type: 'awaketab:start' }, 'https://evil.example'); // wrong origin
    f.send({ type: 'awaketab:start' }, 'https://recipes.example', {}); // wrong source
    f.send({ type: 'awaketab:eval' }, 'https://recipes.example'); // not a command
    expect(onCommand).not.toHaveBeenCalled();
    f.send({ type: 'awaketab:stop' }, 'https://recipes.example');
    expect(onCommand).toHaveBeenCalledWith({ type: 'awaketab:stop' });
  });

  it('distrusts a parent whose origin does not match the declared host', () => {
    const f = framedWindow({ ancestor: 'https://evil.example' });
    const onCommand = vi.fn();
    const bridge = createBridge(f.win, 'recipes.example', onCommand);
    f.send({ type: 'awaketab:start' }, 'https://evil.example');
    bridge.post({ type: 'awaketab:ready', version: '1' });
    expect(onCommand).not.toHaveBeenCalled();
    expect(f.parent.postMessage).not.toHaveBeenCalled();
    expect(bridge.host).toBeNull();
  });

  it('posts to the exact parent origin, never "*"', () => {
    const f = framedWindow({ referrer: 'https://recipes.example/' });
    const bridge = createBridge(f.win, null, vi.fn());
    bridge.post({ type: 'awaketab:resize', height: 120 });
    expect(f.parent.postMessage).toHaveBeenCalledWith({ type: 'awaketab:resize', height: 120 }, 'https://recipes.example');
  });

  it('stops listening after dispose', () => {
    const f = framedWindow({ ancestor: 'https://recipes.example' });
    const onCommand = vi.fn();
    createBridge(f.win, null, onCommand).dispose();
    f.send({ type: 'awaketab:stop' }, 'https://recipes.example');
    expect(onCommand).not.toHaveBeenCalled();
  });

  it('is inert when the widget is opened directly (not framed)', () => {
    const bridge = createBridge(window, null, vi.fn());
    expect(bridge.origin).toBeNull();
    expect(() => {
      bridge.post({ type: 'awaketab:ready', version: '1' });
    }).not.toThrow();
    bridge.dispose();
  });
});

describe('Permissions-Policy detection and advice', () => {
  it('reads permissionsPolicy / featurePolicy when present', () => {
    const allows = (v: boolean) => ({ allowsFeature: (f: string) => f === 'screen-wake-lock' && v });
    expect(wakeLockPolicy({ featurePolicy: allows(false) } as unknown as Document)).toBe(false);
    expect(wakeLockPolicy({ permissionsPolicy: allows(true) } as unknown as Document)).toBe(true);
    expect(wakeLockPolicy({} as Document)).toBeNull();
    expect(
      wakeLockPolicy({
        featurePolicy: {
          allowsFeature: () => {
            throw new Error('x');
          },
        },
      } as unknown as Document),
    ).toBeNull();
  });

  it('turns the library’s iframe_no_allow into power advice when the policy allows the lock', () => {
    expect(embedAdvice('iframe_no_allow', true, 'Mozilla/5.0 (Windows NT 10.0) Chrome/130')).toBe('battery_saver');
    expect(embedAdvice('iframe_no_allow', true, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Version/18.0 Safari')).toBe('low_power_ios');
    expect(embedAdvice('iframe_no_allow', false, 'x')).toBe('iframe_no_allow');
    expect(embedAdvice('iframe_no_allow', null, 'x')).toBe('iframe_no_allow');
    expect(embedAdvice('battery_saver', true, 'x')).toBe('battery_saver');
  });

  it('knows whether it is framed', () => {
    expect(inIframe(window)).toBe(false);
    expect(inIframe(framedWindow().win)).toBe(true);
  });
});

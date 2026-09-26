import { createWakeLock, type TLockState } from '@awaketab/wake';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bindDemo, DEMO_REQUEST_MS, demoWorld, formatChange } from '../../src/lib/library-demo.js';

// The page runs the published IIFE; here the same factory comes from the workspace source (identical code).
const lib = { createWakeLock };

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

function states(scenario: Parameters<typeof demoWorld>[0]) {
  const world = demoWorld(scenario, 'Mozilla/5.0 (X11; Linux x86_64) Chrome/130');
  const lock = createWakeLock(world.options);
  const seen: TLockState[] = [lock.state];
  lock.on('change', (e) => seen.push(e.to));
  return { world, lock, seen };
}

describe('/library demo scenarios (docs/12 §6)', () => {
  it('simulated device: requesting is visible, hidden tab → lost, visible → held again', async () => {
    vi.useFakeTimers();
    const { world, lock, seen } = states('simulated');
    const p = lock.request();
    expect(lock.state).toBe('requesting');
    await vi.advanceTimersByTimeAsync(DEMO_REQUEST_MS);
    await p;
    expect(lock.state).toBe('held');
    world.hide();
    expect(lock.state).toBe('lost');
    world.show();
    await vi.advanceTimersByTimeAsync(DEMO_REQUEST_MS);
    expect(lock.state).toBe('held');
    expect(seen).toEqual(['idle', 'requesting', 'held', 'lost', 'requesting', 'held']);
    lock.destroy();
  });

  it('battery saver: denied with advice, no retry loop', async () => {
    const { lock } = states('denied');
    expect(await lock.request()).toBe('denied');
    expect(lock.advice).toBe('battery_saver');
    lock.destroy();
  });

  it('no API: unsupported until a request tries the video fallback', () => {
    const { lock } = states('unsupported');
    expect(lock.state).toBe('unsupported');
    expect(lock.supported).toBe(false);
    lock.destroy();
  });

  it('formats a log line', () => {
    expect(formatChange({ from: 'requesting', to: 'denied', reason: 'denied', advice: 'battery_saver' })).toBe(
      'requesting → denied (denied, battery_saver)',
    );
    expect(formatChange({ from: 'idle', to: 'requesting', reason: 'request' })).toBe('idle → requesting (request)');
  });
});

describe('bindDemo', () => {
  const markup = `<section data-wake-demo>
    <span data-demo-loading>…</span>
    <select data-demo-scenario><option value="real" selected>r</option><option value="simulated">s</option><option value="denied">d</option><option value="unsupported">u</option></select>
    <ol>${['idle', 'requesting', 'held', 'lost', 'denied', 'unsupported', 'fallback'].map((s) => `<li data-state="${s}"></li>`).join('')}</ol>
    <output data-demo-current></output><span data-demo-advice data-label="Advice: {code}"></span>
    <button data-demo-request disabled></button><button data-demo-release disabled></button>
    <button data-demo-hide disabled></button><button data-demo-show disabled></button>
    <ol data-demo-log></ol></section>`;

  it('waits for the IIFE, then drives the chosen scenario and marks visited states', async () => {
    document.body.innerHTML = `${markup}<script data-wake-iife></script>`;
    const root = document.querySelector<HTMLElement>('[data-wake-demo]') as HTMLElement;
    const win = window as Window & { AwakeTabWake?: typeof lib };
    delete win.AwakeTabWake;
    bindDemo(root, win);
    expect(root.querySelector<HTMLButtonElement>('[data-demo-request]')?.disabled).toBe(true);
    win.AwakeTabWake = lib;
    document.querySelector('script[data-wake-iife]')?.dispatchEvent(new Event('load'));
    expect(root.querySelector<HTMLButtonElement>('[data-demo-request]')?.disabled).toBe(false);

    const select = root.querySelector<HTMLSelectElement>('[data-demo-scenario]') as HTMLSelectElement;
    select.value = 'denied';
    select.dispatchEvent(new Event('change'));
    root.querySelector<HTMLButtonElement>('[data-demo-request]')?.click();
    await vi.waitFor(() => {
      expect(root.querySelector('[data-demo-current]')?.textContent).toBe('denied');
    });
    expect(root.querySelector('[data-demo-advice]')?.textContent).toBe('Advice: battery_saver');
    expect(root.querySelector('[data-state="denied"]')?.hasAttribute('data-visited')).toBe(true);
    expect(root.querySelector('[data-state="denied"]')?.hasAttribute('aria-current')).toBe(true);
    expect(root.querySelector('[data-demo-log]')?.textContent).toContain('requesting → denied');
    expect(root.querySelector<HTMLButtonElement>('[data-demo-hide]')?.disabled).toBe(true);
    delete win.AwakeTabWake;
  });
});

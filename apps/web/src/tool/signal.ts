import type { IToolCtx } from './ctx.js';

export type TChime = 'end' | 'focus' | 'timer';

// Oscillator tones (Hz, start offset s). No audio files: the chime is synthesised (docs/04 §10 step 3).
// `timer` is deliberately distinct from the session chime so a kitchen timer is never mistaken for the end.
const TONES: Record<TChime, Array<[number, number]>> = {
  end: [
    [660, 0],
    [880, 0.3],
  ],
  focus: [
    [523.25, 0],
    [659.25, 0.2],
  ],
  timer: [
    [988, 0],
    [988, 0.25],
    [988, 0.5],
  ],
};

export function chime(ctx: Pick<IToolCtx, 'store' | 'audio'>, kind: TChime): boolean {
  const sound = ctx.store.get().settings.sound;
  if (sound.id === 'none') return false;
  const ac = ctx.audio();
  if (!ac) return false;
  const volume = Math.min(1, Math.max(0, sound.volume));
  const t0 = ac.currentTime;
  for (const [freq, at] of TONES[kind]) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0 + at);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * 0.4), t0 + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 0.3);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0 + at);
    osc.stop(t0 + at + 0.32);
  }
  return true;
}

export function notificationsState(): 'granted' | 'denied' | 'default' | 'unavailable' {
  return typeof Notification === 'undefined' ? 'unavailable' : Notification.permission;
}

export async function notify(ctx: Pick<IToolCtx, 'store'>, title: string, body: string, tag: string): Promise<boolean> {
  if (!ctx.store.get().settings.notifications || notificationsState() !== 'granted') return false;
  const options: NotificationOptions & { renotify?: boolean } = {
    body,
    tag,
    renotify: true,
    icon: '/icons/icon-192.png',
  };
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) {
      await reg.showNotification(title, options);
      return true;
    }
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

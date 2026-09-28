import { Howl } from 'howler';

const FADE_MS = 1500;

let howl: Howl | null = null;
let current = '';

// html5 streaming: a track starts before it has fully downloaded, and its <audio> element drives the media keys.
export function playTrack(url: string, volume: number, onEnd: () => void): Promise<boolean> {
  if (howl && current === url) {
    howl.play();
    howl.fade(0, volume, FADE_MS);
    return Promise.resolve(true);
  }
  stopTrack();
  current = url;
  return new Promise((resolve) => {
    const h = new Howl({
      src: [url],
      html5: true,
      volume: 0,
      onplay: () => {
        h.fade(0, volume, FADE_MS);
        resolve(true);
      },
      onend: onEnd,
      onloaderror: () => {
        resolve(false);
      },
      onplayerror: () => {
        resolve(false);
      },
    });
    howl = h;
    h.play();
  });
}

export function pauseTrack(quick = false): Promise<void> {
  const h = howl;
  if (!h?.playing()) return Promise.resolve();
  const ms = quick ? 200 : FADE_MS;
  h.fade(h.volume(), 0, ms);
  return new Promise((resolve) => {
    setTimeout(() => {
      h.pause();
      resolve();
    }, ms + 50);
  });
}

function stopTrack(): void {
  howl?.unload();
  howl = null;
  current = '';
}

export function trackVolume(v: number): void {
  howl?.volume(v);
}

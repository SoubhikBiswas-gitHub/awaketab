import annyang from 'annyang';

interface IRecEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface IRec extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: IRecEvent) => void) | null;
}

export type TVoiceState = 'idle' | 'listening' | 'blocked' | 'nomic' | 'offline';

export interface IVoiceHooks {
  lang: string;
  commands: { line: string; item: string; stop: string };
  text: (words: string) => void;
  line: () => void;
  item: () => void;
  interim: (words: string) => void;
  heard: (on: boolean) => void;
  state: (s: TVoiceState) => void;
}

// Chrome and Edge name it webkitSpeechRecognition, Safari too; Firefox has none, so the mic stays hidden there.
export function voiceSupported(): boolean {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

const LANGS: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  'pt-br': 'pt-BR',
  de: 'de-DE',
  fr: 'fr-FR',
  ja: 'ja-JP',
  zh: 'zh-CN',
  hi: 'hi-IN',
};

// The page language decides; the browser's own region wins when it is the same language (en-GB, es-MX).
export function speechLang(page: string, browser = navigator.language): string {
  const base = page.toLowerCase();
  const primary = base.split('-')[0] ?? base;
  if (browser.toLowerCase().split('-')[0] === primary && base !== 'pt-br') return browser;
  return LANGS[base] ?? LANGS[primary] ?? browser;
}

export interface IVoice {
  start: () => void;
  stop: () => void;
  on: () => boolean;
}

export function createVoice(h: IVoiceHooks): IVoice {
  let active = false;
  let bound = false;
  let quiet = 0;
  const on = () => active;

  const stop = (state: TVoiceState = 'idle') => {
    active = false;
    annyang.abort();
    h.interim('');
    h.heard(false);
    h.state(state);
  };

  const pulse = () => {
    h.heard(true);
    clearTimeout(quiet);
    quiet = window.setTimeout(() => {
      h.heard(false);
    }, 700);
  };

  const bind = () => {
    if (bound) return;
    bound = true;
    annyang.addCallback('resultNoMatch', (phrases) => {
      if (active && phrases[0]) h.text(phrases[0]);
    });
    annyang.addCallback('errorPermissionBlocked', () => {
      stop('blocked');
    });
    annyang.addCallback('errorPermissionDenied', () => {
      stop('blocked');
    });
    annyang.addCallback('errorNetwork', () => {
      stop('offline');
    });
    annyang.addCallback('error', (e) => {
      if ((e as Event & { error?: string }).error === 'audio-capture') stop('nomic');
    });
    annyang.addCallback('soundstart', pulse);
  };

  const start = () => {
    if (active || !voiceSupported()) return;
    bind();
    annyang.setLanguage(h.lang);
    const { line, item, stop: halt } = h.commands;
    const then = (fn: () => void) => (words?: string) => {
      if (words?.trim()) h.text(words);
      fn();
    };
    annyang.addCommands(
      {
        [line]: then(h.line),
        [`*words ${line}`]: then(h.line),
        [item]: then(h.item),
        [`*words ${item}`]: then(h.item),
        [halt]: then(() => {
          stop();
        }),
        [`*words ${halt}`]: then(() => {
          stop();
        }),
      },
      true,
    );
    const rec = annyang.getSpeechRecognizer() as unknown as IRec | undefined;
    if (!rec) return;
    rec.interimResults = true;
    // Interim words are shown softly; only final ones reach annyang, which runs a command or hands the text back.
    rec.onresult = (e) => {
      if (!active) return;
      let soft = '';
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const r = e.results[i];
        if (!r) continue;
        if (r.isFinal) annyang.trigger(Array.from(r, (a) => a.transcript));
        else soft += r[0]?.transcript ?? '';
      }
      // A spoken "stop listening" in this batch has already ended the session.
      h.interim(on() ? soft : '');
      pulse();
    };
    active = true;
    h.state('listening');
    annyang.start({ autoRestart: true, continuous: true });
  };

  return {
    start,
    stop: () => {
      if (active) stop();
    },
    on,
  };
}

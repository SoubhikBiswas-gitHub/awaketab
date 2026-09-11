import { t } from './i18n.js';

export async function openPip(slot: HTMLElement): Promise<'document' | 'popup' | 'blocked'> {
  const w = window as Window & {
    documentPictureInPicture?: {
      requestWindow: (o: { width: number; height: number }) => Promise<Window>;
    };
  };
  const pill = slot.querySelector('[data-pill]');
  const timer = slot.querySelector('[data-timer]');
  if (w.documentPictureInPicture && pill && timer) {
    try {
      const pip = await w.documentPictureInPicture.requestWindow({ width: 280, height: 120 });
      for (const node of document.querySelectorAll('style, link[rel="stylesheet"]')) {
        pip.document.head.append(node.cloneNode(true));
      }
      pip.document.documentElement.dataset.theme = document.documentElement.dataset.theme;
      pip.document.body.append(pill, timer);
      pip.addEventListener('pagehide', () => {
        slot.append(pill, timer);
      });
      return 'document';
    } catch {
      // fall through to popup
    }
  }
  const pop = window.open('/pip', 'awaketab-pip', 'popup,width=280,height=120');
  if (!pop) return 'blocked';
  return 'popup';
}

export const pipBlockedText = (): string => t('tool.toast.pipBlocked');

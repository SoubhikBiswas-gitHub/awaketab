import href from '../../styles/tool-more.css?url';

let ready: Promise<void> | undefined;

export function moreCss(): Promise<void> {
  ready ??= new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = link.onerror = () => {
      resolve();
    };
    document.head.append(link);
  });
  return ready;
}

// Lazy UI mounts once its sheet is in, so a slow network never shows it unstyled.
export function styled(mount: () => () => void): () => void {
  let off = (): void => undefined;
  void moreCss().then(() => {
    off = mount();
  });
  return () => {
    off();
  };
}

void moreCss();

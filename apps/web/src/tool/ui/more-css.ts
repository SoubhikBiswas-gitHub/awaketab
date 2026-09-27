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

void moreCss();

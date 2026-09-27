export function everySecond(fn: (now: number) => void): () => void {
  let id = 0;
  let live = true;
  const run = () => {
    if (!live) return;
    const now = Date.now();
    fn(now);
    id = window.setTimeout(run, 1000 - (now % 1000));
  };
  run();
  return () => {
    live = false;
    window.clearTimeout(id);
  };
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...kids: Array<Node | string>
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...kids);
  return node;
}

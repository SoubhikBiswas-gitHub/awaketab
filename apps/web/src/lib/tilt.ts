const clamp = (n: number): string => Math.max(-1, Math.min(1, n)).toFixed(3);

// Cards marked [data-tilt] lean toward the pointer through --at-tx and --at-ty.
export function initTilt(): void {
  if (!matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
  let card: HTMLElement | null = null;
  let x = 0;
  let y = 0;
  let frame = 0;
  const paint = (): void => {
    frame = 0;
    if (!card) return;
    const box = card.getBoundingClientRect();
    card.style.setProperty('--at-tx', clamp(((x - box.left) / box.width) * 2 - 1));
    card.style.setProperty('--at-ty', clamp(((y - box.top) / box.height) * 2 - 1));
  };
  document.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      card = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-tilt]') : null;
      if (!card) return;
      x = e.clientX;
      y = e.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    },
    { passive: true },
  );
}

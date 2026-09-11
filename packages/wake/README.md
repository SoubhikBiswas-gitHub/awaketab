# @awaketab/wake

Screen Wake Lock with an honest state machine and a tiny video fallback. Maintained replacement for NoSleep.js.

- Seven lock states: `idle` · `requesting` · `held` · `lost` · `denied` · `unsupported` · `fallback`
- `held` is reported only while a live sentinel exists (or the fallback video is actually playing)
- Zero runtime dependencies · ESM / CJS / IIFE (`AwakeTabWake`)

## Install

```bash
pnpm add @awaketab/wake
```

## Usage

```ts
import { createWakeLock } from '@awaketab/wake';

const lock = createWakeLock();
lock.on('change', ({ to, advice }) => render(to, advice));
button.addEventListener('click', () => lock.request());
```

Native: Chrome/Edge ≥ 84, Firefox ≥ 126, Safari ≥ 16.4. Fallback after a user gesture on older browsers.

MIT · Used by [AwakeTab](https://awaketab.com/library)

Sponsor development via [GitHub Sponsors](https://github.com/sponsors/awaketab).

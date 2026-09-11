import { onMounted, onUnmounted, ref } from 'vue';
import { createWakeLock } from '../index.js';
import type { IWakeLockOptions } from '../types.js';

export function useWakeLock(options?: IWakeLockOptions) {
  const lock = createWakeLock(options);
  const state = ref(lock.state);
  const supported = ref(lock.supported);
  let off: () => void = () => {
    return;
  };

  onMounted(() => {
    off = lock.on('change', (e) => {
      state.value = e.to;
    });
  });
  onUnmounted(() => {
    off();
    lock.destroy();
  });

  return {
    state,
    supported,
    request: () => lock.request(),
    release: () => lock.release(),
  };
}

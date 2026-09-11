import { useCallback, useEffect, useState } from 'preact/hooks';
import { createWakeLock } from '../index.js';
import type { TLockState, IWakeLockOptions } from '../types.js';

export function useWakeLock(options?: IWakeLockOptions) {
  const [state, setState] = useState<TLockState>('idle');
  const [supported, setSupported] = useState(false);
  const [lock] = useState(() => createWakeLock(options));

  useEffect(() => {
    setSupported(lock.supported);
    setState(lock.state);
    return lock.on('change', (e: { to: TLockState }) => { setState(e.to); });
  }, [lock]);

  const request = useCallback(() => lock.request(), [lock]);
  const release = useCallback(() => lock.release(), [lock]);

  useEffect(() => () => { lock.destroy(); }, [lock]);

  return { state, supported, request, release };
}

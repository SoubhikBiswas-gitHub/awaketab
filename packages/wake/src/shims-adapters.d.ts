declare module 'react' {
  export function useCallback<T extends (...args: never[]) => unknown>(fn: T, deps: unknown[]): T;
  export function useEffect(fn: () => undefined | (() => void), deps?: unknown[]): void;
  export function useState<T>(init: T | (() => T)): [T, (v: T | ((p: T) => T)) => void];
}

declare module 'preact/hooks' {
  export function useCallback<T extends (...args: never[]) => unknown>(fn: T, deps: unknown[]): T;
  export function useEffect(fn: () => undefined | (() => void), deps?: unknown[]): void;
  export function useState<T>(init: T | (() => T)): [T, (v: T | ((p: T) => T)) => void];
}

declare module 'vue' {
  export function ref<T>(v: T): { value: T };
  export function onMounted(fn: () => void): void;
  export function onUnmounted(fn: () => void): void;
}

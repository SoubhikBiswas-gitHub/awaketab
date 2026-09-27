export interface IEmitter<E extends Record<string, unknown>> {
  on<K extends keyof E>(type: K, fn: (ev: E[K]) => void): () => void;
  emit<K extends keyof E>(type: K, ev: E[K]): void;
  clear(): void;
}

export function createEmitter<E extends Record<string, unknown>>(): IEmitter<E> {
  const map = new Map<keyof E, Set<(ev: never) => void>>();
  return {
    on(type, fn) {
      let set = map.get(type);
      if (!set) {
        set = new Set();
        map.set(type, set);
      }
      set.add(fn);
      return () => set.delete(fn);
    },
    emit(type, ev) {
      map.get(type)?.forEach((fn) => {
        fn(ev as never);
      });
    },
    clear() {
      map.clear();
    },
  };
}

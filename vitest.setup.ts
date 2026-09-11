if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
}

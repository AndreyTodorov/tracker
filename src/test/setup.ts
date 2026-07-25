import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Node 22+ defines its own experimental globalThis.localStorage, which is
// undefined unless the process is started with --localstorage-file. It shadows
// the one jsdom installs, so window.localStorage is missing in tests even
// though sessionStorage is present. Browsers are unaffected; this restores the
// API so code using it can be tested.
if (!globalThis.localStorage) {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, String(value)),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size;
      },
    },
  });
}

// Firebase environment variables are supplied by `test.env` in
// vitest.config.ts. They cannot be provided with vi.mock: import.meta.env is
// not a module, so mocking it silently does nothing.

// Add custom matchers
expect.extend({});

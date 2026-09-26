import { useSyncExternalStore } from 'react';

// Tracks whether a CSS media query currently matches, e.g. '(min-width: 1024px)'.
export const useMediaQuery = (query: string): boolean =>
  useSyncExternalStore(
    (onChange) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener('change', onChange);
      return () => mediaQuery.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches
  );

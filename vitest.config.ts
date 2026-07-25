import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // src/config/firebase.ts throws at import time when these are missing, so
    // any test that transitively imports it fails without them. Supplying
    // throwaway values here keeps tests independent of a developer's local
    // .env, which is why CI failed while local runs passed.
    env: {
      VITE_FIREBASE_API_KEY: 'test-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'demo-tracker.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'demo-tracker',
      VITE_FIREBASE_STORAGE_BUCKET: 'demo-tracker.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
      VITE_FIREBASE_APP_ID: '1:000000000000:web:0000000000000000000000',
      VITE_FIREBASE_DATABASE_URL: 'https://demo-tracker-default-rtdb.firebaseio.com',
    },
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

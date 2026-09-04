import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served from the custom domain tracker.atdrv.eu, so the app lives at the origin root.
  base: '/',
})

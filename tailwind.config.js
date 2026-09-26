import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Carbon palette
        ink: '#09090B',        // app background
        surface: '#131316',    // default card / panel
        surface2: '#1C1C20',   // elevated panel, inputs, hovers
        line: '#222226',       // borders / hairlines
        'line-soft': '#18181B',
        content: '#F4F4F5',    // primary text
        muted: '#8E8E96',      // secondary text
        faint: '#56565E',      // de-emphasised figures (cents, minor segments)
        accent: '#C6F432',     // brand / interactive (used with restraint)
        'accent-hover': '#B2DE1F',
        // Market semantics — reserved strictly for profit/loss
        profit: '#3DDC84',
        loss: '#FF6B6B',
        // Caution states, e.g. live exchange rates unavailable
        warning: '#F5C451',
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'panel': '0 1px 0 0 rgba(255,255,255,0.02) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

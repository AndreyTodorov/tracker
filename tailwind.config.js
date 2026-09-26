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
        // Keep the legacy primary scale so nothing references a missing token
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(198, 244, 50, 0.18)',
        'glow': '0 0 24px rgba(198, 244, 50, 0.22)',
        'panel': '0 1px 0 0 rgba(255,255,255,0.02) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #C6F432 0%, #B2DE1F 100%)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

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
        // Trading Terminal palette
        ink: '#0A0E17',        // app background
        surface: '#131A26',    // default card / panel
        surface2: '#1A2332',   // elevated panel, inputs, hovers
        line: '#232E40',       // borders / hairlines
        'line-soft': '#1B2433',
        content: '#EAEEF5',    // primary text
        muted: '#7E8A9E',      // secondary text
        accent: '#E5B567',     // brand / interactive (used with restraint)
        'accent-hover': '#D4A24A',
        // Market semantics — reserved strictly for profit/loss
        profit: '#0ECB81',
        loss: '#F6465D',
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
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(229, 181, 103, 0.18)',
        'glow': '0 0 24px rgba(229, 181, 103, 0.22)',
        'panel': '0 1px 0 0 rgba(255,255,255,0.02) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #E5B567 0%, #D4A24A 100%)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

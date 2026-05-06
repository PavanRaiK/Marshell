/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#07070B',
        canvas: '#0B0B11',
        surface: {
          DEFAULT: '#111118',
          raised: '#16161F',
          inset: '#0E0E14',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          default: 'rgba(255,255,255,0.10)',
          strong: 'rgba(255,255,255,0.16)',
        },
        fg: {
          primary: '#F5F5F7',
          secondary: '#8A8A94',
          tertiary: '#52525B',
        },
        accent: {
          glow: '#6366F1',
        },
        success: { DEFAULT: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
        danger:  { DEFAULT: '#F43F5E', bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.25)' },
        warning: { DEFAULT: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
      },
      fontFamily: {
        display: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      fontSize: {
        'display-hero': ['4.5rem', { lineHeight: '1.0',  letterSpacing: '-0.03em',  fontWeight: '700' }],
        'display-lg':   ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '700' }],
        'display-md':   ['2.5rem', { lineHeight: '1.1',  letterSpacing: '-0.02em',  fontWeight: '700' }],
        'display-sm':   ['2rem',   { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '600' }],
        'label':        ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.08em', fontWeight: '500' }],
        'micro':        ['0.625rem',  { lineHeight: '1.2', letterSpacing: '0.06em', fontWeight: '600' }],
      },
      borderRadius: {
        'xl':  '1.125rem',   // 18px
        '2xl': '1.5rem',     // 24px
      },
      backgroundImage: {
        'cosmic-glow': 'radial-gradient(ellipse 600px 300px at 50% -100px, rgba(99,102,241,0.18), rgba(99,102,241,0) 70%)',
        'card-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 50%)',
        'dot-grid': 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-grid': '24px 24px',
      },
    },
  },
};

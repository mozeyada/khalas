import type {Config} from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      // ── Brand colours (semantic mappings) ──
      colors: {
        ink:   '#0A0A0A',
        // Semantic surface tokens — map to CSS vars
        surface: {
          0: 'var(--surface-0)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          dark: 'var(--surface-dark)',
        },
        // Text hierarchy
        text: {
          1: 'var(--text-1)',
          2: 'var(--text-2)',
          3: 'var(--text-3)',
        },
        // Status
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger:  'var(--danger)',
      },

      // ── Typography ──────────────────────────────────────────
      fontFamily: {
        cairo: ['var(--font-cairo)', 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', 'sans-serif'],
        sans:  ['var(--font-cairo)', 'Cairo', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
      },

      // ── Border radius ───────────────────────────────────────
      borderRadius: {
        'xs':  'var(--radius-xs)',
        'sm':  'var(--radius-sm)',
        'md':  'var(--radius-md)',
        'lg':  'var(--radius-lg)',
        'xl':  'var(--radius-xl)',
        // Keep Tailwind's own 2xl, 3xl for granular control
      },

      // ── Box shadows ─────────────────────────────────────────
      boxShadow: {
        // Legacy — keep for any existing usage
        soft:    '0 12px 30px rgba(0, 0, 0, 0.05)',
        // New elevation system
        card:    'var(--shadow-card)',
        float:   'var(--shadow-float)',
        overlay: 'var(--shadow-overlay)',
        teal:    'var(--shadow-teal)',
      },

      // ── Transitions ─────────────────────────────────────────
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '400ms',
      },

      // ── Animation ───────────────────────────────────────────
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up':  'fade-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.4, 0, 0.2, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;

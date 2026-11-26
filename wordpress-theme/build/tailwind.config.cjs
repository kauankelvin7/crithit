/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    '../teoriageek/**/*.php',
    '../teoriageek/assets/js/**/*.js',
  ],
  theme: {
    borderRadius: {
      none: '0px',
      sm: '2px',
      DEFAULT: '2px',
      md: '2px',
      lg: '2px',
      xl: '2px',
      '2xl': '2px',
      '3xl': '2px',
      full: '9999px',
    },
    extend: {
      backgroundColor: {
        base: 'var(--tg-bg)',
      },
      colors: {
        surface: {
          DEFAULT: 'var(--tg-surface)',
          alt: 'var(--bg-surface-alt)',
          hover: 'var(--bg-surface-hover)',
        },
        chrome: {
          DEFAULT: 'var(--chrome-bg)',
          surface: 'var(--chrome-surface)',
          ink: 'var(--chrome-ink)',
          muted: 'var(--chrome-ink-muted)',
        },
        ink: {
          primary: 'var(--tg-text)',
          secondary: 'var(--ink-secondary)',
          muted: 'var(--ink-muted)',
          placeholder: 'var(--ink-placeholder)',
          inverse: 'var(--ink-inverse)',
          highlight: 'var(--tg-on-accent)',
        },
        border: {
          strong: 'var(--border-strong)',
          input: 'var(--border-input)',
          subtle: 'var(--border-subtle)',
        },
        highlight: 'var(--tg-accent)',
        brand: {
          DEFAULT: 'var(--accent-brand)',
          fill: 'var(--tg-primary)',
          hover: 'var(--tg-primary-hover)',
          soft: 'var(--accent-brand-soft)',
          softInk: 'var(--ink-on-brand-soft)',
        },
        status: {
          success: 'var(--status-success)',
          warning: 'var(--status-warning)',
          error: 'var(--status-error)',
          info: 'var(--status-info)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Arial Narrow', 'sans-serif'],
        headline: ['var(--font-headline)', 'Arial Narrow', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        reading: ['var(--font-reading)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'hard-sm': 'none',
        hard: 'none',
        'hard-hover': 'none',
      },
    },
  },
  plugins: [],
};

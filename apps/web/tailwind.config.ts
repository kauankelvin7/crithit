import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      backgroundColor: {
        base: 'var(--bg-base)',
      },
      colors: {
        surface: {
          DEFAULT: 'var(--bg-surface)',
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
          primary: 'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          muted: 'var(--ink-muted)',
          placeholder: 'var(--ink-placeholder)',
          inverse: 'var(--ink-inverse)',
          highlight: 'var(--ink-on-highlight)',
        },
        border: {
          strong: 'var(--border-strong)',
          input: 'var(--border-input)',
          subtle: 'var(--border-subtle)',
        },
        highlight: 'var(--highlight-comic)',
        brand: {
          DEFAULT: 'var(--accent-brand)',
          fill: 'var(--fill-brand)',
          soft: 'var(--accent-brand-soft)',
          softInk: 'var(--ink-on-brand-soft)',
        },
        editorial: {
          games: 'var(--accent-games)',
          gamesFill: 'var(--fill-games)',
          comics: 'var(--accent-comics)',
          comicsFill: 'var(--fill-comics)',
          cinema: 'var(--accent-cinema)',
          cinemaFill: 'var(--fill-cinema)',
          animes: 'var(--accent-animes)',
          animesFill: 'var(--fill-animes)',
          tech: 'var(--accent-tech)',
          techFill: 'var(--fill-tech)',
        },
        status: {
          success: 'var(--status-success)',
          successFill: 'var(--fill-success)',
          warning: 'var(--status-warning)',
          warningFill: 'var(--fill-warning)',
          error: 'var(--status-error)',
          errorFill: 'var(--fill-error)',
          info: 'var(--status-info)',
          infoFill: 'var(--fill-info)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'cursive'],
        headline: ['var(--font-headline)', 'sans-serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
        reading: ['var(--font-reading)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        'hard-sm': 'var(--shadow-hard-sm)',
        hard: 'var(--shadow-hard)',
        'hard-hover': 'var(--shadow-hard-hover)',
      },
    },
  },
  plugins: [],
};

export default config;

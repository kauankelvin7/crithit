'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'crithit-theme';

function applyThemeToDocument(theme: ThemeMode): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') {
      setTheme(attr);
    } else {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        setTheme(stored);
        applyThemeToDocument(stored);
      } else {
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        const resolved: ThemeMode = prefersDark ? 'dark' : 'light';
        setTheme(resolved);
        applyThemeToDocument(resolved);
      }
    }
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyThemeToDocument(nextTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Ignora erro de quota ou privacidade do navegador
    }
  };

  const isDark = mounted ? theme === 'dark' : false;

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={isDark}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className="inline-flex items-center gap-1.5 rounded border-2 border-[var(--chrome-ink-muted)] bg-[var(--chrome-surface)] px-2.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[var(--chrome-ink)] transition-colors hover:border-[var(--highlight-comic)] hover:bg-[var(--highlight-comic)] hover:text-[var(--ink-on-highlight)]"
    >
      {isDark ? (
        <Sun className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
      )}
      <span className="hidden sm:inline">{isDark ? 'Claro' : 'Escuro'}</span>
    </button>
  );
}

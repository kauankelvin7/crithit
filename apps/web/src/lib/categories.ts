import type { Category, EditorialFormat } from './types';

export interface CategoryMeta {
  key: Category;
  label: string;
  shortLabel: string;
  accentVar: string;
  fillVar: string;
  inkOnFillVar: string;
  softVar: string;
  inkOnSoftVar: string;
  coverArtKey: string;
}

export const CATEGORIES: Record<Category, CategoryMeta> = {
  GAMES: {
    key: 'GAMES',
    label: 'Games',
    shortLabel: 'Games',
    accentVar: 'var(--accent-games)',
    fillVar: 'var(--fill-games)',
    inkOnFillVar: 'var(--ink-on-fill-games)',
    softVar: 'var(--accent-games-soft)',
    inkOnSoftVar: 'var(--ink-on-games-soft)',
    coverArtKey: 'editorial-games-default',
  },
  COMICS: {
    key: 'COMICS',
    label: 'Quadrinhos & Mangás',
    shortLabel: 'Quadrinhos',
    accentVar: 'var(--accent-comics)',
    fillVar: 'var(--fill-comics)',
    inkOnFillVar: 'var(--ink-on-fill-comics)',
    softVar: 'var(--accent-comics-soft)',
    inkOnSoftVar: 'var(--ink-on-comics-soft)',
    coverArtKey: 'editorial-comics-default',
  },
  CINEMA: {
    key: 'CINEMA',
    label: 'Cinema & Séries',
    shortLabel: 'Cinema',
    accentVar: 'var(--accent-cinema)',
    fillVar: 'var(--fill-cinema)',
    inkOnFillVar: 'var(--ink-on-fill-cinema)',
    softVar: 'var(--accent-cinema-soft)',
    inkOnSoftVar: 'var(--ink-on-cinema-soft)',
    coverArtKey: 'editorial-cinema-default',
  },
  ANIMES: {
    key: 'ANIMES',
    label: 'Animes & Cultura Pop',
    shortLabel: 'Animes',
    accentVar: 'var(--accent-animes)',
    fillVar: 'var(--fill-animes)',
    inkOnFillVar: 'var(--ink-on-fill-animes)',
    softVar: 'var(--accent-animes-soft)',
    inkOnSoftVar: 'var(--ink-on-animes-soft)',
    coverArtKey: 'editorial-animes-default',
  },
  TECH: {
    key: 'TECH',
    label: 'Hardware & Tech',
    shortLabel: 'Tech',
    accentVar: 'var(--accent-tech)',
    fillVar: 'var(--fill-tech)',
    inkOnFillVar: 'var(--ink-on-fill-tech)',
    softVar: 'var(--accent-tech-soft)',
    inkOnSoftVar: 'var(--ink-on-tech-soft)',
    coverArtKey: 'editorial-tech-default',
  },
};

export const CATEGORY_LIST: Category[] = ['GAMES', 'COMICS', 'CINEMA', 'ANIMES', 'TECH'];

export const EDITORIAL_FORMAT_LABELS: Record<EditorialFormat, string> = {
  NEWS: 'Notícia',
  COLUMN: 'Coluna',
  REVIEW: 'Review',
};

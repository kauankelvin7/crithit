import {
  buildMockArticleDetail,
  buildMockHomeResponse,
  buildMockReelsResponse,
  MOCK_ARTICLES,
} from './mock-data';
import type {
  Category,
  HomeResponse,
  PublicArticleDetail,
  PublicArticlePage,
  ReelsFeedResponse,
} from './types';

export function getApiBaseUrl(): string {
  return (
    process.env.INTERNAL_API_BASE_URL ||
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:8080'
  ).replace(/\/$/, '');
}

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

/**
 * Controla explicitamente o fallback para dados de demonstração (mock-data.ts).
 * Em produção (`NODE_ENV === 'production'`), permanece DESATIVADO por padrão
 * para nunca exibir notícias fictícias silenciosamente caso a API falhe.
 * Para pré-visualização offline ou E2E sem Docker, defina `ENABLE_MOCK_FALLBACK=true`.
 */
export function isMockFallbackEnabled(): boolean {
  const raw = process.env.ENABLE_MOCK_FALLBACK?.trim().toLowerCase();
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return process.env.NODE_ENV !== 'production';
}

async function fetchJsonWithTimeout<T>(
  url: string,
  options: RequestInit & { next?: { revalidate?: number; tags?: string[] } },
  timeoutMs = 3500,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.headers ?? {}),
      },
    });
    if (!response.ok) {
      const error = new Error(`API status ${response.status}`) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchHomeData(): Promise<HomeResponse> {
  const baseUrl = getApiBaseUrl();
  try {
    return await fetchJsonWithTimeout<HomeResponse>(`${baseUrl}/api/v1/home`, {
      next: { revalidate: 60, tags: ['home', 'home-feed'] },
    });
  } catch (err) {
    if (isMockFallbackEnabled()) {
      return buildMockHomeResponse();
    }
    throw err;
  }
}

export async function fetchArticleBySlug(slug: string): Promise<PublicArticleDetail | null> {
  const baseUrl = getApiBaseUrl();
  try {
    return await fetchJsonWithTimeout<PublicArticleDetail>(
      `${baseUrl}/api/v1/articles/${encodeURIComponent(slug)}`,
      {
        next: { revalidate: 120, tags: [`article:${slug}`, 'articles-list'] },
      },
    );
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 404) {
      return null;
    }
    if (isMockFallbackEnabled()) {
      return buildMockArticleDetail(slug);
    }
    throw err;
  }
}

export async function fetchReelsFeed(params?: {
  category?: Category;
  focusSlug?: string;
}): Promise<ReelsFeedResponse> {
  const baseUrl = getApiBaseUrl();
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.focusSlug) query.set('focusSlug', params.focusSlug);
  query.set('size', '20');

  try {
    return await fetchJsonWithTimeout<ReelsFeedResponse>(
      `${baseUrl}/api/v1/reels?${query.toString()}`,
      {
        next: { revalidate: 60, tags: ['reels', 'reels-feed'] },
      },
    );
  } catch (err) {
    if (isMockFallbackEnabled()) {
      return buildMockReelsResponse(params?.category, params?.focusSlug);
    }
    throw err;
  }
}

export async function searchPublishedArticles(
  queryText: string,
  category?: Category,
): Promise<PublicArticlePage> {
  const baseUrl = getApiBaseUrl();
  const params = new URLSearchParams();
  if (queryText.trim()) params.set('q', queryText.trim());
  if (category) params.set('category', category);
  params.set('size', '12');

  try {
    return await fetchJsonWithTimeout<PublicArticlePage>(
      `${baseUrl}/api/v1/articles?${params.toString()}`,
      { cache: 'no-store' },
    );
  } catch (err) {
    if (!isMockFallbackEnabled()) {
      throw err;
    }
    const q = queryText.trim().toLowerCase();
    const filtered = MOCK_ARTICLES.filter((a) => {
      const catMatch = !category || a.category === category;
      const textMatch =
        !q ||
        a.headline.toLowerCase().includes(q) ||
        a.lead.toLowerCase().includes(q) ||
        a.attribution.sourceName.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q));
      return catMatch && textMatch;
    });
    return {
      content: filtered,
      page: 0,
      size: 12,
      totalElements: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / 12)),
    };
  }
}

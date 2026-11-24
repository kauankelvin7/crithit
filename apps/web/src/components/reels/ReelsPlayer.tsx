'use client';

import Link from 'next/link';
import {
  FormEvent,
  MouseEvent,
  TouchEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  ExternalLink,
  Flame,
  GitFork,
  Heart,
  Layers,
  MessageSquare,
  PenTool,
  Send,
  Share2,
} from 'lucide-react';
import { CategoryBadge } from '@/components/CategoryBadge';
import { EditorialCoverArt } from '@/components/EditorialCoverArt';
import { CommentsDrawer } from '@/components/reels/CommentsDrawer';
import { CATEGORIES, CATEGORY_LIST } from '@/lib/categories';
import {
  fetchArticleComments,
  MAX_COMMENT_BODY_LENGTH,
  postArticleComment,
  validateCommentInput,
} from '@/lib/comments-api';
import { formatCompactNumber, formatRelativeDate } from '@/lib/format';
import type { Category, CommentDto, MatchedSourceDto, PublicArticleSummary } from '@/lib/types';
import { getSafeHttpUrl } from '@/lib/url';

type FilterOption = 'TODOS' | Category;
type FeedMode = 'for-you' | 'trending' | 'saved';

interface ReelsPlayerProps {
  initialItems: PublicArticleSummary[];
  initialFocusSlug?: string;
  initialFocusFound?: boolean;
}

const FILTER_OPTIONS: Array<{ value: FilterOption; label: string }> = [
  { value: 'TODOS', label: 'Todas' },
  ...CATEGORY_LIST.map((cat) => ({ value: cat as FilterOption, label: CATEGORIES[cat].shortLabel })),
];

const AMBIENT_GLOW_BY_CATEGORY: Record<Category, string> = {
  GAMES: 'rgba(37, 99, 235, 0.36)',
  COMICS: 'rgba(217, 119, 6, 0.36)',
  CINEMA: 'rgba(5, 150, 105, 0.36)',
  ANIMES: 'rgba(8, 145, 178, 0.36)',
  TECH: 'rgba(124, 58, 237, 0.38)',
};

const SAVED_STORAGE_KEY = 'crithit-saved-slugs';

interface SfxFeedbackState {
  articleId: string;
  type: 'like' | 'save';
  seq: number;
  xPercent: number;
  yPercent: number;
  withImpactRing: boolean;
}

export function ReelsPlayer({
  initialItems,
  initialFocusSlug,
  initialFocusFound = true,
}: ReelsPlayerProps) {
  const [feedMode, setFeedMode] = useState<FeedMode>('for-you');
  const [selectedCategory, setSelectedCategory] = useState<FilterOption>('TODOS');
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const item of initialItems) map[item.id] = item.likesCount;
    return map;
  });
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const item of initialItems) map[item.id] = item.commentsCount;
    return map;
  });
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [drawerArticle, setDrawerArticle] = useState<PublicArticleSummary | null>(null);
  const [sfxFeedback, setSfxFeedback] = useState<SfxFeedbackState | null>(null);
  const [poppingButton, setPoppingButton] = useState<{ key: string; seq: number } | null>(null);
  const [showMissingNotice, setShowMissingNotice] = useState(
    Boolean(initialFocusSlug && !initialFocusFound),
  );

  // Estado sincronizado dos comentários e fontes cruzadas para o Painel Direito Desktop (xl+)
  const [panelCommentsByArticle, setPanelCommentsByArticle] = useState<Record<string, CommentDto[]>>({});
  const [matchedSourcesByArticle, setMatchedSourcesByArticle] = useState<
    Record<string, MatchedSourceDto[]>
  >({});
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelAuthor, setPanelAuthor] = useState('');
  const [panelBody, setPanelBody] = useState('');
  const [panelError, setPanelError] = useState('');
  const [panelSubmitting, setPanelSubmitting] = useState(false);

  const panelAuthorInputId = useId();
  const panelBodyInputId = useId();
  const panelErrorId = useId();

  const feedRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const commentTriggerRef = useRef<HTMLButtonElement | null>(null);
  const didInitialScrollRef = useRef(false);
  const sfxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<{ time: number; articleId: string } | null>(null);

  const triggerSfxFeedback = useCallback(
    (
      articleId: string,
      type: 'like' | 'save',
      options?: { xPercent?: number; yPercent?: number; withImpactRing?: boolean },
    ) => {
      if (sfxTimerRef.current) clearTimeout(sfxTimerRef.current);
      setSfxFeedback({
        articleId,
        type,
        seq: Date.now(),
        xPercent: options?.xPercent ?? 50,
        yPercent: options?.yPercent ?? 36,
        withImpactRing: options?.withImpactRing ?? false,
      });
      sfxTimerRef.current = setTimeout(() => {
        setSfxFeedback(null);
      }, 900);
    },
    [],
  );

  const triggerIconPop = useCallback((key: string) => {
    setPoppingButton({ key, seq: Date.now() });
  }, []);

  useEffect(() => {
    return () => {
      if (sfxTimerRef.current) clearTimeout(sfxTimerRef.current);
      if (shareToastTimerRef.current) clearTimeout(shareToastTimerRef.current);
    };
  }, []);

  // Contagem de Reels por editoria para exibir na sidebar esquerda
  const categoryCounts = useMemo(() => {
    const counts: Record<FilterOption, number> = {
      TODOS: initialItems.length,
      GAMES: 0,
      COMICS: 0,
      CINEMA: 0,
      ANIMES: 0,
      TECH: 0,
    };
    for (const item of initialItems) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [initialItems]);

  const savedCount = useMemo(
    () => initialItems.filter((item) => Boolean(savedIds[item.id])).length,
    [initialItems, savedIds],
  );

  const filteredItems = useMemo(() => {
    let base = initialItems;
    if (feedMode === 'saved') {
      base = base.filter((item) => Boolean(savedIds[item.id]));
    } else if (feedMode === 'trending') {
      base = [...base].sort((a, b) => b.viewsCount + b.likesCount * 8 - (a.viewsCount + a.likesCount * 8));
    }

    if (selectedCategory === 'TODOS') return base;
    return base.filter((item) => item.category === selectedCategory);
  }, [feedMode, initialItems, savedIds, selectedCategory]);

  const activeArticle = filteredItems[activeIndex] ?? filteredItems[0] ?? null;
  const ambientGlowColor = activeArticle
    ? AMBIENT_GLOW_BY_CATEGORY[activeArticle.category]
    : AMBIENT_GLOW_BY_CATEGORY.GAMES;

  // Restaura itens salvos do localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(SAVED_STORAGE_KEY) || '[]') as string[];
      if (Array.isArray(stored)) {
        const next: Record<string, boolean> = {};
        for (const item of initialItems) {
          if (stored.includes(item.slug)) next[item.id] = true;
        }
        setSavedIds(next);
      }
    } catch {
      // Ignora erro de localStorage
    }
  }, [initialItems]);

  // Carrega comentários e fontes cruzadas do Reel ativo para o Painel Direito Desktop (xl+)
  useEffect(() => {
    if (!activeArticle) return;
    const articleId = activeArticle.id;
    const articleSlug = activeArticle.slug;
    const hasInlineSources =
      Array.isArray(activeArticle.matchedSources) && activeArticle.matchedSources.length > 0;
    let active = true;
    setPanelLoading(true);
    setPanelError('');

    fetchArticleComments(articleId)
      .then((list) => {
        if (!active) return;
        setPanelCommentsByArticle((prev) => ({
          ...prev,
          [articleId]: list,
        }));
      })
      .finally(() => {
        if (active) setPanelLoading(false);
      });

    if (!hasInlineSources && !matchedSourcesByArticle[articleId] && typeof fetch === 'function') {
      fetch(`/api/public/articles/${encodeURIComponent(articleSlug)}`)
        .then(async (res) => {
          if (!res.ok) return null;
          return (await res.json()) as { matchedSources?: MatchedSourceDto[] };
        })
        .then((detail) => {
          if (!active || !detail?.matchedSources?.length) return;
          setMatchedSourcesByArticle((prev) => ({
            ...prev,
            [articleId]: detail.matchedSources!,
          }));
        })
        .catch(() => {
          // Mantém fallback da atribuição primária
        });
    }

    return () => {
      active = false;
    };
  }, [activeArticle, matchedSourcesByArticle]);

  // Posiciona no deep-link ?id=<slug> na montagem inicial via scroll interno do container
  useEffect(() => {
    if (didInitialScrollRef.current || filteredItems.length === 0) return;
    didInitialScrollRef.current = true;

    if (initialFocusSlug) {
      const targetIndex = filteredItems.findIndex((i) => i.slug === initialFocusSlug);
      if (targetIndex >= 0) {
        setActiveIndex(targetIndex);
        const container = feedRef.current;
        const node = cardRefs.current[targetIndex];
        if (container && node) {
          const top = node.offsetTop || targetIndex * container.clientHeight;
          if (typeof container.scrollTo === 'function') {
            container.scrollTo({ top, behavior: 'auto' });
          } else {
            container.scrollTop = top;
          }
        }
      } else {
        setShowMissingNotice(true);
      }
    }
  }, [filteredItems, initialFocusSlug]);

  // IntersectionObserver para sincronizar ?id=<slug> via history.replaceState
  useEffect(() => {
    const container = feedRef.current;
    if (!container || filteredItems.length === 0 || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number(entry.target.getAttribute('data-reel-index'));
            const slug = entry.target.getAttribute('data-reel-slug');
            if (!Number.isNaN(idx)) {
              setActiveIndex(idx);
            }
            if (slug) {
              const nextUrl = `/reels?id=${encodeURIComponent(slug)}`;
              if (window.location.pathname + window.location.search !== nextUrl) {
                window.history.replaceState(null, '', nextUrl);
              }
            }
          }
        }
      },
      {
        root: container,
        threshold: [0.6, 0.75],
      },
    );

    cardRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [filteredItems]);

  const scrollToCard = useCallback(
    (index: number) => {
      const bounded = Math.max(0, Math.min(index, filteredItems.length - 1));
      const container = feedRef.current;
      const target = cardRefs.current[bounded];
      if (!container || !target) return;

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      setActiveIndex(bounded);
      const top = target.offsetTop || bounded * container.clientHeight;
      if (typeof container.scrollTo === 'function') {
        container.scrollTo({
          top,
          behavior: prefersReduced ? 'auto' : 'smooth',
        });
      } else {
        container.scrollTop = top;
      }

      const slug = filteredItems[bounded]?.slug;
      if (slug) {
        window.history.replaceState(null, '', `/reels?id=${encodeURIComponent(slug)}`);
      }
    },
    [filteredItems],
  );

  const handleToggleLike = useCallback(
    async (
      article: PublicArticleSummary,
      options?: { forceLike?: boolean; xPercent?: number; yPercent?: number; withImpactRing?: boolean },
    ) => {
      const scrollSnapshot = feedRef.current?.scrollTop ?? 0;
      const alreadyLiked = Boolean(likedIds[article.id]);
      triggerIconPop(`like-${article.id}`);

      if (options?.forceLike && alreadyLiked) {
        triggerSfxFeedback(article.id, 'like', {
          xPercent: options.xPercent,
          yPercent: options.yPercent,
          withImpactRing: options.withImpactRing ?? true,
        });
        return;
      }

      const nextLiked = options?.forceLike ? true : !alreadyLiked;
      setLikedIds((prev) => ({ ...prev, [article.id]: nextLiked }));
      setLikeCounts((prev) => ({
        ...prev,
        [article.id]: Math.max(0, (prev[article.id] ?? article.likesCount) + (nextLiked ? 1 : -1)),
      }));
      if (nextLiked) {
        triggerSfxFeedback(article.id, 'like', {
          xPercent: options?.xPercent,
          yPercent: options?.yPercent,
          withImpactRing: options?.withImpactRing ?? false,
        });
      }

      if (feedRef.current) feedRef.current.scrollTop = scrollSnapshot;

      try {
        const res = await fetch(`/api/public/articles/${encodeURIComponent(article.id)}/like`, {
          method: 'POST',
        });
        if (res.ok) {
          const data = (await res.json()) as { liked: boolean; likesCount: number };
          setLikedIds((prev) => ({ ...prev, [article.id]: data.liked }));
          setLikeCounts((prev) => ({ ...prev, [article.id]: data.likesCount }));
        }
      } catch {
        // Mantém estado otimista
      }
    },
    [likedIds, triggerIconPop, triggerSfxFeedback],
  );

  const handleToggleSave = useCallback(
    async (article: PublicArticleSummary) => {
      const scrollSnapshot = feedRef.current?.scrollTop ?? 0;
      const nextSaved = !savedIds[article.id];
      triggerIconPop(`save-${article.id}`);
      setSavedIds((prev) => ({ ...prev, [article.id]: nextSaved }));
      if (nextSaved) {
        triggerSfxFeedback(article.id, 'save');
      }

      try {
        const stored = JSON.parse(window.localStorage.getItem(SAVED_STORAGE_KEY) || '[]') as string[];
        const set = new Set(Array.isArray(stored) ? stored : []);
        if (nextSaved) set.add(article.slug);
        else set.delete(article.slug);
        window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(Array.from(set)));
      } catch {
        // Ignora erro de localStorage
      }

      if (feedRef.current) feedRef.current.scrollTop = scrollSnapshot;

      try {
        await fetch(`/api/public/articles/${encodeURIComponent(article.id)}/save`, {
          method: 'POST',
        });
      } catch {
        // Mantém estado otimista
      }
    },
    [savedIds, triggerIconPop, triggerSfxFeedback],
  );

  const handleShare = useCallback(
    async (article: PublicArticleSummary) => {
      triggerIconPop(`share-${article.id}`);
      const url = `${window.location.origin}/reels?id=${encodeURIComponent(article.slug)}`;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
        }
        setCopiedSlug(article.slug);
        setShareToast('Link do Reel copiado para a área de transferência!');
        if (shareToastTimerRef.current) clearTimeout(shareToastTimerRef.current);
        shareToastTimerRef.current = setTimeout(() => {
          setCopiedSlug(null);
          setShareToast(null);
        }, 2200);
      } catch {
        setCopiedSlug(article.slug);
        setShareToast('Link do Reel pronto para compartilhar.');
        if (shareToastTimerRef.current) clearTimeout(shareToastTimerRef.current);
        shareToastTimerRef.current = setTimeout(() => {
          setCopiedSlug(null);
          setShareToast(null);
        }, 2200);
      }
    },
    [triggerIconPop],
  );

  // Navegação e ações por teclado (ArrowUp/ArrowDown/PageUp/PageDown + L curtir + C comentar)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (drawerArticle) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
        return;
      }

      if (event.key === 'ArrowDown' || event.key === 'PageDown') {
        event.preventDefault();
        scrollToCard(activeIndex + 1);
      } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault();
        scrollToCard(activeIndex - 1);
      } else if ((event.key === 'l' || event.key === 'L') && activeArticle) {
        event.preventDefault();
        void handleToggleLike(activeArticle);
      } else if ((event.key === 'c' || event.key === 'C') && activeArticle) {
        event.preventDefault();
        setDrawerArticle(activeArticle);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeArticle, activeIndex, drawerArticle, handleToggleLike, scrollToCard]);

  const handleCategoryChange = (nextCategory: FilterOption) => {
    setSelectedCategory(nextCategory);
    setActiveIndex(0);
    setShowMissingNotice(false);
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  };

  const handleFeedModeChange = (nextMode: FeedMode) => {
    setFeedMode(nextMode);
    setActiveIndex(0);
    setShowMissingNotice(false);
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  };

  const handlePanelCommentSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeArticle) return;

    const validation = validateCommentInput(panelAuthor, panelBody);
    if (!validation.valid) {
      setPanelError(validation.message);
      return;
    }

    setPanelSubmitting(true);
    setPanelError('');

    const result = await postArticleComment(
      activeArticle.id,
      validation.cleanName,
      validation.cleanBody,
    );
    setPanelSubmitting(false);

    if (!result.ok) {
      setPanelError(result.message);
      return;
    }

    setPanelCommentsByArticle((prev) => ({
      ...prev,
      [activeArticle.id]: [result.comment, ...(prev[activeArticle.id] ?? [])],
    }));
    setCommentCounts((prev) => ({
      ...prev,
      [activeArticle.id]: (prev[activeArticle.id] ?? activeArticle.commentsCount) + 1,
    }));
    setPanelBody('');
  };

  const handleStageDoubleClick = (
    event: MouseEvent<HTMLDivElement>,
    article: PublicArticleSummary,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const xPercent = Math.max(15, Math.min(85, ((event.clientX - rect.left) / rect.width) * 100));
    const yPercent = Math.max(15, Math.min(85, ((event.clientY - rect.top) / rect.height) * 100));
    void handleToggleLike(article, {
      forceLike: true,
      xPercent,
      yPercent,
      withImpactRing: true,
    });
  };

  const handleStageTouchEnd = (
    event: TouchEvent<HTMLDivElement>,
    article: PublicArticleSummary,
  ) => {
    const now = Date.now();
    const prev = lastTapRef.current;
    if (prev && prev.articleId === article.id && now - prev.time < 300) {
      lastTapRef.current = null;
      const touch = event.changedTouches[0];
      const rect = event.currentTarget.getBoundingClientRect();
      const xPercent = touch
        ? Math.max(15, Math.min(85, ((touch.clientX - rect.left) / rect.width) * 100))
        : 50;
      const yPercent = touch
        ? Math.max(15, Math.min(85, ((touch.clientY - rect.top) / rect.height) * 100))
        : 50;
      void handleToggleLike(article, {
        forceLike: true,
        xPercent,
        yPercent,
        withImpactRing: true,
      });
    } else {
      lastTapRef.current = { time: now, articleId: article.id };
    }
  };

  const paddedCurrent = String(Math.min(activeIndex + 1, filteredItems.length)).padStart(2, '0');
  const paddedTotal = String(filteredItems.length).padStart(2, '0');

  const activeMatchedSources = useMemo(() => {
    if (!activeArticle) return [];
    if (activeArticle.matchedSources && activeArticle.matchedSources.length > 0) {
      return activeArticle.matchedSources;
    }
    const fetched = matchedSourcesByArticle[activeArticle.id];
    if (fetched && fetched.length > 0) {
      return fetched;
    }
    return [
      {
        id: `fallback-${activeArticle.id}`,
        sourceName: activeArticle.attribution.sourceName,
        sourceUrl: activeArticle.attribution.sourceUrl,
        originalTitle: activeArticle.headline,
        originalExcerpt: null,
        similarityScore: 1,
        isPrimary: true,
        fetchedAt: activeArticle.publishedAt,
      },
    ];
  }, [activeArticle, matchedSourcesByArticle]);

  const activePanelComments = activeArticle
    ? (panelCommentsByArticle[activeArticle.id] ?? [])
    : [];

  return (
    <div
      data-chrome="dark"
      data-reels-stage="true"
      className="relative flex h-[calc(100dvh-67px)] w-full flex-1 overflow-hidden bg-[#0B0D12] text-white"
    >
      {/* ZONA ESQUERDA: Sidebar de Navegação estilo TikTok Desktop */}
      <aside
        aria-label="Navegação e editorias do Reels"
        className="hidden w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-white/10 bg-[#0D1017] p-4 lg:flex"
      >
        <div className="space-y-6">
          {/* Modos de Descoberta */}
          <div className="space-y-1.5">
            <p className="px-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Explorar Feed
            </p>
            <nav aria-label="Modos de visualização do Reels" className="space-y-1">
              <button
                type="button"
                aria-pressed={feedMode === 'for-you'}
                onClick={() => handleFeedModeChange('for-you')}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 font-sans text-sm font-semibold transition-colors ${
                  feedMode === 'for-you'
                    ? 'bg-[#FFD600] text-[#111111]'
                    : 'text-zinc-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="inline-flex items-center gap-2.5">
                  <Compass className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  Para Você
                </span>
                <span
                  aria-hidden="true"
                  className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-bold ${
                    feedMode === 'for-you' ? 'bg-[#111111] text-[#FFD600]' : 'bg-white/10 text-zinc-300'
                  }`}
                >
                  {initialItems.length}
                </span>
              </button>

              <button
                type="button"
                aria-pressed={feedMode === 'trending'}
                onClick={() => handleFeedModeChange('trending')}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 font-sans text-sm font-semibold transition-colors ${
                  feedMode === 'trending'
                    ? 'bg-[#FFD600] text-[#111111]'
                    : 'text-zinc-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="inline-flex items-center gap-2.5">
                  <Flame className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  Em Alta
                </span>
              </button>

              <button
                type="button"
                aria-pressed={feedMode === 'saved'}
                onClick={() => handleFeedModeChange('saved')}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 font-sans text-sm font-semibold transition-colors ${
                  feedMode === 'saved'
                    ? 'bg-[#FFD600] text-[#111111]'
                    : 'text-zinc-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="inline-flex items-center gap-2.5">
                  <Bookmark className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  Salvos
                </span>
                <span
                  aria-hidden="true"
                  className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-bold ${
                    feedMode === 'saved' ? 'bg-[#111111] text-[#FFD600]' : 'bg-white/10 text-zinc-300'
                  }`}
                >
                  {savedCount}
                </span>
              </button>
            </nav>
          </div>

          {/* Lista de Editorias com Contagem */}
          <div className="space-y-1.5 border-t border-white/10 pt-4">
            <p className="px-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Editorias
            </p>
            <div role="group" aria-label="Filtrar Reels por editoria" className="space-y-1">
              {FILTER_OPTIONS.map((option) => {
                const active = selectedCategory === option.value;
                const count = categoryCounts[option.value] ?? 0;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleCategoryChange(option.value)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                      active
                        ? 'border-[#FFD600] bg-[#FFD600] text-[#111111]'
                        : 'border-transparent bg-transparent text-zinc-200 hover:border-white/15 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{option.label}</span>
                    <span
                      aria-hidden="true"
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        active ? 'bg-[#111111] text-[#FFD600]' : 'bg-white/10 text-zinc-300'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Atalhos discretos de teclado na base da sidebar esquerda */}
        <div className="mt-4 rounded-xl border border-white/10 bg-[#141822] p-3 font-mono text-[11px] text-zinc-300">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#FFD600]">
            Atalhos do Player
          </p>
          <ul className="space-y-1">
            <li className="flex items-center justify-between">
              <span>Navegar</span>
              <span className="inline-flex gap-1 text-white">
                <kbd className="rounded border border-white/20 bg-[#0B0D12] px-1.5 py-0.5 font-bold">↑</kbd>
                <kbd className="rounded border border-white/20 bg-[#0B0D12] px-1.5 py-0.5 font-bold">↓</kbd>
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Curtir / Comentar</span>
              <span className="inline-flex gap-1 text-white">
                <kbd className="rounded border border-white/20 bg-[#0B0D12] px-1.5 py-0.5 font-bold">L</kbd>
                <kbd className="rounded border border-white/20 bg-[#0B0D12] px-1.5 py-0.5 font-bold">C</kbd>
              </span>
            </li>
          </ul>
        </div>
      </aside>

      {/* ZONA CENTRAL: Palco Imersivo 9:16 + Coluna de Ações Acoplada */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-2 py-2 lg:px-4">
        {/* Ambient Glow Reativo suave ao fundo do palco (desktop) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500 md:block"
          style={{
            background: `radial-gradient(circle, ${ambientGlowColor} 0%, rgba(11, 13, 18, 0) 70%)`,
          }}
        />

        {/* Pílulas Flutuantes de Editoria exclusivas Mobile/Tablet (< lg) */}
        <div className="relative z-20 mb-2 flex w-full max-w-[430px] items-center justify-center lg:hidden">
          <div
            aria-label="Editorias rápidas no celular"
            className="reels-scroller flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-white/15 bg-white/10 px-2 py-1 backdrop-blur-md"
          >
            {FILTER_OPTIONS.map((option) => {
              const active = selectedCategory === option.value;
              return (
                <button
                  key={`mobile-${option.value}`}
                  type="button"
                  aria-pressed={active}
                  aria-label={`Filtrar por ${option.label}`}
                  onClick={() => handleCategoryChange(option.value)}
                  className={`shrink-0 rounded-full border px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                    active
                      ? 'border-[#FFD600] bg-[#FFD600] text-[#111111]'
                      : 'border-white/15 bg-[#12151E] text-white hover:border-[#FFD600]'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {showMissingNotice && (
          <div
            role="status"
            className="relative z-20 mb-2 flex max-w-xl items-center gap-2 rounded-full border border-highlight/40 bg-[#141822] px-3.5 py-1 font-sans text-xs text-highlight"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
            <span>
              O Reel solicitado não está disponível ou foi retirado do ar. Exibindo os Reels mais
              recentes.
            </span>
          </div>
        )}

        {/* Toast discreto de link copiado */}
        {shareToast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-xl border-2 border-highlight bg-chrome px-4 py-2.5 font-mono text-xs font-bold text-white shadow-hard"
          >
            <Check className="h-4 w-4 text-highlight" strokeWidth={2.5} aria-hidden="true" />
            <span>{shareToast}</span>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="relative z-10 my-auto max-w-md rounded-2xl border border-white/20 bg-chrome-surface p-8 text-center">
            <h1 className="font-headline text-2xl font-extrabold uppercase text-white">
              {feedMode === 'saved'
                ? 'Nenhum Reel salvo ainda'
                : 'Nenhum Reel nesta editoria'}
            </h1>
            <p className="mt-2 font-reading text-sm text-chrome-muted">
              {feedMode === 'saved'
                ? 'Toque no ícone de marcador em qualquer Reel para salvar pautas e ler depois.'
                : 'Ainda não há notícias publicadas no formato 9:16 para o filtro selecionado.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setFeedMode('for-you');
                handleCategoryChange('TODOS');
              }}
              className="mt-5 inline-flex items-center justify-center rounded-xl border-2 border-highlight bg-highlight px-4 py-2.5 font-mono text-xs font-bold uppercase text-ink-highlight"
            >
              Ver todas as editorias
            </button>
          </div>
        ) : (
          <div
            ref={feedRef}
            aria-label="Feed vertical CritHit Reels"
            className="reels-scroller relative z-10 h-[calc(100dvh-130px)] w-full max-w-[430px] snap-y snap-mandatory overflow-y-scroll md:h-[calc(100dvh-132px)] md:w-[530px] md:max-w-none lg:h-[calc(100dvh-96px)] lg:max-h-[860px] lg:w-[540px] xl:w-[570px]"
            style={{ scrollSnapType: 'y mandatory' }}
          >
            {filteredItems.map((article, index) => {
              const isActive = index === activeIndex;
              const isLiked = Boolean(likedIds[article.id]);
              const isSaved = Boolean(savedIds[article.id]);
              const likes = likeCounts[article.id] ?? article.likesCount;
              const commentsCount = commentCounts[article.id] ?? article.commentsCount;
              const hasRealCover = Boolean(article.coverImageUrl);
              const safeSourceUrl = getSafeHttpUrl(article.attribution.sourceUrl);
              const isAutoral = article.attribution.contentType === 'AUTORAL';
              const artAnimationClass = isActive
                ? hasRealCover
                  ? 'reel-art-kenburns'
                  : 'reel-art-float'
                : '';

              return (
                <article
                  key={article.id}
                  ref={(el) => {
                    cardRefs.current[index] = el;
                  }}
                  data-reel-index={index}
                  data-reel-slug={article.slug}
                  data-reel-active={isActive ? 'true' : 'false'}
                  className="relative flex h-full w-full snap-start snap-always items-end justify-center md:gap-4"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {/* FRAME 9:16 PRINCIPAL DO CARD (460px-490px no desktop) */}
                  <div
                    data-reel-card-frame="true"
                    className="relative flex h-full w-full flex-col overflow-hidden rounded-[26px] border border-white/15 bg-[#06080C] shadow-[0_24px_60px_rgba(0,0,0,0.82)] md:w-[450px] md:shrink-0 md:rounded-[28px] lg:w-[460px] xl:w-[490px]"
                  >
                    {/* Indicador discreto de posição no topo (01 / 12) + AO VIVO */}
                    <div className="pointer-events-none absolute inset-x-4 top-3 z-30 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase text-white backdrop-blur-sm">
                        <span className="relative flex h-2 w-2" aria-hidden="true">
                          <span className="live-dot-ping absolute inline-flex h-full w-full rounded-full bg-brand-fill" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-fill" />
                        </span>
                        AO VIVO
                      </span>
                      <span className="rounded-full border border-white/20 bg-black/65 px-2.5 py-0.5 font-mono text-[11px] font-bold text-white backdrop-blur-sm">
                        <span className="text-[#FFD600]">{paddedCurrent}</span> / {paddedTotal}
                      </span>
                    </div>

                    {/* 48% SUPERIOR: Arte / Capa enquadrada sem cortes */}
                    <div
                      onDoubleClick={(e) => handleStageDoubleClick(e, article)}
                      onTouchEnd={(e) => handleStageTouchEnd(e, article)}
                      className="relative h-[48%] w-full shrink-0 cursor-pointer select-none overflow-hidden pt-9"
                    >
                      <EditorialCoverArt
                        coverImageUrl={article.coverImageUrl}
                        coverArtKey={article.coverArtKey}
                        category={article.category}
                        alt={article.headline}
                        aspectClass="h-full w-full"
                        mediaClassName={artAnimationClass}
                        fit="contain"
                      />

                      {/* Transição suave para o scrim de leitura inferior */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-14"
                        style={{
                          background:
                            'linear-gradient(to top, #06080C 0%, rgba(6,8,12,0.55) 55%, rgba(6,8,12,0) 100%)',
                        }}
                      />

                      {/* Explosão gráfica vetorial no double-click / double-tap / curtir / salvar (zero emojis) */}
                      {sfxFeedback && sfxFeedback.articleId === article.id && (
                        <div
                          key={sfxFeedback.seq}
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 z-30"
                        >
                          {sfxFeedback.withImpactRing && (
                            <span
                              className="reel-impact-ring absolute h-20 w-20 rounded-full border-4 border-[#FFD600]"
                              style={{
                                left: `${sfxFeedback.xPercent}%`,
                                top: `${sfxFeedback.yPercent}%`,
                              }}
                            />
                          )}
                          <div
                            className="sfx-burst absolute flex flex-col items-center justify-center"
                            style={{
                              left: `${sfxFeedback.xPercent}%`,
                              top: `${sfxFeedback.yPercent}%`,
                            }}
                          >
                            {sfxFeedback.type === 'like' && sfxFeedback.withImpactRing && (
                              <span className="mb-1 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#111111] bg-brand-fill text-white shadow-hard-sm">
                                <Heart className="h-6 w-6 fill-current" strokeWidth={2} />
                              </span>
                            )}
                            <svg
                              viewBox="0 0 180 112"
                              className="h-24 w-40 drop-shadow-[4px_4px_0_#111111]"
                              focusable="false"
                            >
                              <polygon
                                points="90,4 108,32 148,14 138,48 176,58 138,74 152,104 108,88 90,110 72,88 28,104 42,74 4,58 42,48 32,14 72,32"
                                fill={sfxFeedback.type === 'like' ? '#E11D48' : '#FFD600'}
                                stroke="#111111"
                                strokeWidth="5"
                                strokeLinejoin="round"
                              />
                              <text
                                x="90"
                                y="66"
                                textAnchor="middle"
                                fontFamily="var(--font-display), Impact, sans-serif"
                                fontSize="28"
                                letterSpacing="1.5"
                                fill={sfxFeedback.type === 'like' ? '#FFFFFF' : '#111111'}
                              >
                                {sfxFeedback.type === 'like' ? 'CRIT HIT!' : 'SALVO!'}
                              </text>
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 52% INFERIOR: Hierarquia Editorial Limpa Estilo TikTok Web */}
                    <div
                      className="relative z-10 flex h-[52%] flex-1 flex-col justify-end px-4 pb-4 pt-2 sm:px-6 sm:pb-5"
                      style={{
                        background:
                          'linear-gradient(to top, rgba(6,8,12,0.98) 0%, rgba(6,8,12,0.92) 48%, rgba(6,8,12,0.38) 82%, transparent 100%)',
                      }}
                    >
                      <div
                        data-reel-text-block="true"
                        className="flex flex-col gap-2 pr-16 md:pr-0"
                      >
                        <div
                          className={`flex flex-wrap items-center gap-2 ${
                            isActive ? 'reel-stagger-1' : ''
                          }`}
                        >
                          <CategoryBadge category={article.category} size="sm" skewed />
                          <span className="rounded-md border border-white/15 bg-white/10 px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                            {article.readingTimeMinutes} min
                          </span>
                          <span
                            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider"
                            style={{
                              backgroundColor: isAutoral ? '#065F46' : '#5B21B6',
                              color: '#FFFFFF',
                            }}
                          >
                            {isAutoral ? (
                              <PenTool className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden="true" />
                            ) : (
                              <GitFork className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden="true" />
                            )}
                            {article.attribution.contentType}
                          </span>
                        </div>

                        {isActive ? (
                          <h1
                            key={`h1-${article.id}`}
                            data-reel-headline="true"
                            className="reel-stagger-2 mb-1 line-clamp-3 font-headline text-[24px] font-extrabold leading-[1.08] tracking-tight text-white sm:text-[27px]"
                          >
                            {article.headline}
                          </h1>
                        ) : (
                          <h2
                            data-reel-headline="true"
                            className="mb-1 line-clamp-3 font-headline text-[24px] font-extrabold leading-[1.08] tracking-tight text-white sm:text-[27px]"
                          >
                            {article.headline}
                          </h2>
                        )}

                        <p
                          data-reel-summary="true"
                          className={`line-clamp-3 font-reading text-[13.5px] leading-relaxed text-zinc-200 sm:text-[14px] ${
                            isActive ? 'reel-stagger-3' : ''
                          }`}
                        >
                          {article.reelsSummary}
                        </p>

                        {/* Crédito + Link explícito da fonte + link para fontes cruzadas */}
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11.5px] text-zinc-200">
                          <span>Por {article.attribution.authorName}</span>
                          <span aria-hidden="true">•</span>
                          {safeSourceUrl ? (
                            <a
                              href={safeSourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-[#FFD600] underline decoration-[#FFD600] decoration-2 underline-offset-2 transition-colors hover:text-white"
                            >
                              <span>Fonte: {article.attribution.sourceName}</span>
                              <ExternalLink
                                className="h-3.5 w-3.5 shrink-0"
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                              <span className="sr-only">(abre em nova aba)</span>
                            </a>
                          ) : (
                            <span>Fonte: {article.attribution.sourceName}</span>
                          )}
                          {article.matchedSources && article.matchedSources.length > 1 && (
                            <Link
                              href={`/noticia/${article.slug}#fontes-cruzadas-heading`}
                              className="inline-flex items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-white hover:border-[#FFD600] hover:text-[#FFD600]"
                            >
                              <Layers className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                              +{article.matchedSources.length - 1} fonte
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* CTA Principal */}
                      <div className="mt-3 pt-1">
                        <Link
                          href={`/noticia/${article.slug}`}
                          className="tactile-btn inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#FFD600] bg-[#FFD600] px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-[#111111] shadow-[0_4px_14px_rgba(0,0,0,0.45)] hover:bg-white"
                        >
                          <span>Ler matéria completa</span>
                          <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* COLUNA DE AÇÕES ACOPLADA À DIREITA DO CARD (Curtir, Comentar, Salvar, Compartilhar + Setas ↑ ↓) */}
                  <div
                    data-reel-actions="true"
                    className="absolute bottom-[74px] right-3 z-20 flex flex-col items-center gap-2.5 md:static md:bottom-auto md:right-auto md:w-[60px] md:shrink-0 md:justify-end md:gap-3 md:pb-2"
                  >
                    <button
                      type="button"
                      onClick={() => scrollToCard(activeIndex - 1)}
                      disabled={activeIndex <= 0}
                      aria-label="Reel anterior"
                      className="tactile-btn hidden h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#151926] text-white shadow-md hover:border-[#FFD600] hover:text-[#FFD600] disabled:opacity-35 md:inline-flex"
                    >
                      <ChevronUp className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => scrollToCard(activeIndex + 1)}
                      disabled={activeIndex >= filteredItems.length - 1}
                      aria-label="Próximo Reel"
                      className="tactile-btn mb-2 hidden h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#151926] text-white shadow-md hover:border-[#FFD600] hover:text-[#FFD600] disabled:opacity-35 md:inline-flex"
                    >
                      <ChevronDown className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleToggleLike(article)}
                      aria-pressed={isLiked}
                      className={`tactile-btn flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 shadow-[3px_3px_0_#000000] active:translate-y-0.5 ${
                        isLiked
                          ? 'border-[#FFD600] bg-brand-fill text-white'
                          : 'border-white/20 bg-[#151926] text-white hover:border-[#FFD600] hover:text-[#FFD600]'
                      }`}
                    >
                      <Heart
                        key={
                          poppingButton?.key === `like-${article.id}`
                            ? poppingButton.seq
                            : `like-idle-${article.id}`
                        }
                        className={`h-4 w-4 ${isLiked ? 'fill-current' : ''} ${
                          poppingButton?.key === `like-${article.id}` ? 'reel-icon-pop' : ''
                        }`}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      <span className="sr-only">
                        {isLiked ? 'Remover curtida ' : 'Curtir notícia '}
                      </span>
                      <span className="font-mono text-[11px] font-bold leading-none">
                        {formatCompactNumber(likes)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        triggerIconPop(`comment-${article.id}`);
                        commentTriggerRef.current = e.currentTarget;
                        setDrawerArticle(article);
                      }}
                      className="tactile-btn flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-white/20 bg-[#151926] text-white shadow-[3px_3px_0_#000000] hover:border-[#FFD600] hover:text-[#FFD600] active:translate-y-0.5"
                    >
                      <MessageSquare
                        key={
                          poppingButton?.key === `comment-${article.id}`
                            ? poppingButton.seq
                            : `comment-idle-${article.id}`
                        }
                        className={`h-4 w-4 ${
                          poppingButton?.key === `comment-${article.id}` ? 'reel-icon-pop' : ''
                        }`}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      <span className="sr-only">Abrir comentários </span>
                      <span className="font-mono text-[11px] font-bold leading-none">
                        {formatCompactNumber(commentsCount)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleToggleSave(article)}
                      aria-pressed={isSaved}
                      aria-label={isSaved ? 'Remover dos salvos' : 'Salvar notícia'}
                      className={`tactile-btn flex h-12 w-12 items-center justify-center rounded-2xl border-2 shadow-[3px_3px_0_#000000] active:translate-y-0.5 ${
                        isSaved
                          ? 'border-[#111111] bg-[#FFD600] text-[#111111]'
                          : 'border-white/20 bg-[#151926] text-white hover:border-[#FFD600] hover:text-[#FFD600]'
                      }`}
                    >
                      <Bookmark
                        key={
                          poppingButton?.key === `save-${article.id}`
                            ? poppingButton.seq
                            : `save-idle-${article.id}`
                        }
                        className={`h-5 w-5 ${isSaved ? 'fill-current' : ''} ${
                          poppingButton?.key === `save-${article.id}` ? 'reel-icon-pop' : ''
                        }`}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleShare(article)}
                      aria-label="Compartilhar notícia"
                      className="tactile-btn flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/20 bg-[#151926] text-white shadow-[3px_3px_0_#000000] hover:border-[#FFD600] hover:text-[#FFD600] active:translate-y-0.5"
                    >
                      {copiedSlug === article.slug ? (
                        <Check
                          className="reel-icon-pop h-5 w-5 text-[#FFD600]"
                          strokeWidth={2.5}
                          aria-hidden="true"
                        />
                      ) : (
                        <Share2 className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ZONA DIREITA (xl+): Painel Vivo de Fontes Cruzadas & Comentários da Comunidade estilo TikTok Web */}
      <aside
        aria-label="Fontes cruzadas e comentários do Reel ativo"
        className="hidden w-80 shrink-0 flex-col border-l border-white/10 bg-[#0D1017] xl:flex"
      >
        {activeArticle ? (
          <>
            {/* Fontes Cruzadas desta Pauta */}
            <div className="border-b border-white/10 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white">
                  <Layers className="h-4 w-4 text-[#FFD600]" strokeWidth={2} aria-hidden="true" />
                  Fontes Cruzadas desta Pauta
                </h2>
                <span
                  className="rounded px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-white"
                  style={{
                    backgroundColor:
                      activeArticle.attribution.contentType === 'AUTORAL' ? '#065F46' : '#5B21B6',
                  }}
                >
                  {activeArticle.attribution.contentType}
                </span>
              </div>

              <ul className="space-y-2">
                {activeMatchedSources.map((src) => {
                  const safeSrcUrl = getSafeHttpUrl(src.sourceUrl);
                  return (
                    <li
                      key={src.id}
                      className="rounded-xl border border-white/15 bg-[#141822] p-2.5"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#FFD600]">
                          {src.sourceName}
                        </span>
                        <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-zinc-200">
                          {Math.round(src.similarityScore * 100)}%
                        </span>
                      </div>
                      {safeSrcUrl ? (
                        <a
                          href={safeSrcUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-start gap-1.5 font-sans text-xs leading-snug text-zinc-200 underline decoration-white/30 underline-offset-2 hover:text-[#FFD600] hover:decoration-[#FFD600]"
                        >
                          <span className="line-clamp-2">{src.originalTitle}</span>
                          <ExternalLink
                            className="mt-0.5 h-3.5 w-3.5 shrink-0"
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                          <span className="sr-only">(abre em nova aba)</span>
                        </a>
                      ) : (
                        <p className="line-clamp-2 font-sans text-xs leading-snug text-zinc-200">
                          {src.originalTitle}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Comentários da Comunidade ao Vivo */}
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <h2 className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white">
                  <MessageSquare className="h-4 w-4 text-[#FFD600]" strokeWidth={2} aria-hidden="true" />
                  Comentários da Comunidade
                </h2>
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                  {commentCounts[activeArticle.id] ?? activeArticle.commentsCount}
                </span>
              </div>

              <div className="reels-scroller flex-1 space-y-2.5 overflow-y-auto p-4">
                {panelLoading && activePanelComments.length === 0 ? (
                  <p className="font-mono text-xs text-zinc-400">Carregando comentários...</p>
                ) : activePanelComments.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/15 bg-[#12151E] p-4 text-center font-reading text-xs leading-relaxed text-zinc-300">
                    Nenhum comentário ainda. Participe da discussão desta pauta abaixo.
                  </p>
                ) : (
                  activePanelComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-white/10 bg-[#141822] p-3"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-white">
                          {comment.authorDisplayName}
                        </span>
                        <span className="font-mono text-[11px] text-zinc-400">
                          {formatRelativeDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="font-reading text-xs leading-relaxed text-zinc-200">
                        {comment.body}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Formulário direto sem abrir modal */}
              <form
                onSubmit={handlePanelCommentSubmit}
                noValidate
                className="space-y-2.5 border-t border-white/10 bg-[#12151E] p-3.5"
              >
                <div>
                  <label
                    htmlFor={panelAuthorInputId}
                    className="mb-1 block font-mono text-[11px] font-bold uppercase text-zinc-300"
                  >
                    Seu nome
                  </label>
                  <input
                    id={panelAuthorInputId}
                    type="text"
                    maxLength={60}
                    value={panelAuthor}
                    onChange={(e) => setPanelAuthor(e.target.value)}
                    placeholder="Ex.: Lucas M."
                    className="w-full rounded-lg border border-white/20 bg-[#0B0D12] px-3 py-1.5 font-sans text-xs text-white placeholder:text-zinc-400 focus:border-[#FFD600] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label
                      htmlFor={panelBodyInputId}
                      className="font-mono text-[11px] font-bold uppercase text-zinc-300"
                    >
                      Comentar neste Reel
                    </label>
                    <span className="font-mono text-[11px] text-zinc-400">
                      {panelBody.length}/{MAX_COMMENT_BODY_LENGTH}
                    </span>
                  </div>
                  <textarea
                    id={panelBodyInputId}
                    rows={2}
                    maxLength={MAX_COMMENT_BODY_LENGTH}
                    value={panelBody}
                    onChange={(e) => setPanelBody(e.target.value)}
                    aria-invalid={Boolean(panelError)}
                    aria-describedby={panelError ? panelErrorId : undefined}
                    placeholder="Escreva sua opinião sobre esta notícia..."
                    className="w-full resize-none rounded-lg border border-white/20 bg-[#0B0D12] px-3 py-1.5 font-reading text-xs text-white placeholder:text-zinc-400 focus:border-[#FFD600] focus:outline-none"
                  />
                </div>

                {panelError && (
                  <div
                    id={panelErrorId}
                    role="alert"
                    className="flex items-center gap-1.5 rounded-lg border border-rose-400/40 bg-rose-950/70 px-2.5 py-1.5 font-sans text-xs text-rose-200"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                    <span>{panelError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={panelSubmitting}
                  className="tactile-btn inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#FFD600] bg-[#FFD600] px-3 py-2 font-mono text-xs font-bold uppercase text-[#111111] hover:bg-white disabled:opacity-60"
                >
                  <Send className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                  {panelSubmitting ? 'Publicando...' : 'Publicar'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-center font-mono text-xs text-zinc-400">
            Selecione uma editoria para visualizar fontes e comentários.
          </div>
        )}
      </aside>

      <CommentsDrawer
        open={Boolean(drawerArticle)}
        articleId={drawerArticle?.id ?? ''}
        articleHeadline={drawerArticle?.headline ?? ''}
        triggerRef={commentTriggerRef}
        onClose={() => setDrawerArticle(null)}
        onCommentAdded={(created) => {
          if (!drawerArticle) return;
          setCommentCounts((prev) => ({
            ...prev,
            [drawerArticle.id]: (prev[drawerArticle.id] ?? drawerArticle.commentsCount) + 1,
          }));
          if (created) {
            setPanelCommentsByArticle((prev) => ({
              ...prev,
              [drawerArticle.id]: [created, ...(prev[drawerArticle.id] ?? [])],
            }));
          }
        }}
      />
    </div>
  );
}

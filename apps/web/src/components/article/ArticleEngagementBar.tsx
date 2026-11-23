'use client';

import { useEffect, useState } from 'react';
import { Bookmark, Check, Heart, Share2 } from 'lucide-react';
import { formatCompactNumber } from '@/lib/format';

interface ArticleEngagementBarProps {
  articleId: string;
  slug: string;
  headline: string;
  initialLikes: number;
  initialSaves: number;
  initialLiked?: boolean;
  initialSaved?: boolean;
}

const SAVED_STORAGE_KEY = 'crithit-saved-slugs';

export function ArticleEngagementBar({
  articleId,
  slug,
  headline,
  initialLikes,
  initialSaves,
  initialLiked = false,
  initialSaved = false,
}: ArticleEngagementBarProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [saved, setSaved] = useState(initialSaved);
  const [savesCount, setSavesCount] = useState(initialSaves);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(SAVED_STORAGE_KEY) || '[]') as string[];
      if (Array.isArray(stored) && stored.includes(slug)) {
        setSaved(true);
      }
    } catch {
      // Ignora erro de localStorage
    }

    fetch(`/api/public/articles/${encodeURIComponent(articleId)}/view`, {
      method: 'POST',
    }).catch(() => {
      // Silencioso em modo offline
    });
  }, [articleId, slug]);

  const handleLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));

    try {
      const res = await fetch(`/api/public/articles/${encodeURIComponent(articleId)}/like`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = (await res.json()) as { liked: boolean; likesCount: number };
        setLiked(data.liked);
        setLikesCount(data.likesCount);
      }
    } catch {
      // Mantém estado otimista
    }
  };

  const handleSave = async () => {
    const nextSaved = !saved;
    setSaved(nextSaved);
    setSavesCount((c) => Math.max(0, c + (nextSaved ? 1 : -1)));

    try {
      const stored = JSON.parse(window.localStorage.getItem(SAVED_STORAGE_KEY) || '[]') as string[];
      const set = new Set(Array.isArray(stored) ? stored : []);
      if (nextSaved) set.add(slug);
      else set.delete(slug);
      window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(Array.from(set)));
    } catch {
      // Ignora erro de localStorage
    }

    try {
      const res = await fetch(`/api/public/articles/${encodeURIComponent(articleId)}/save`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = (await res.json()) as { saved: boolean; savesCount: number };
        setSaved(data.saved);
        setSavesCount(data.savesCount);
      }
    } catch {
      // Mantém estado otimista
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: headline, url });
        return;
      } catch {
        // Fallback para clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignora erro de clipboard
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onClick={handleLike}
        aria-pressed={liked}
        className={`inline-flex items-center gap-1.5 rounded border-2 border-border-strong px-3.5 py-2 font-mono text-xs font-bold transition-colors ${
          liked
            ? 'bg-brand-fill text-white'
            : 'bg-surface text-ink-primary hover:bg-surface-alt'
        }`}
      >
        <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} strokeWidth={2} aria-hidden="true" />
        <span className="sr-only">
          {liked ? 'Remover curtida da matéria ' : 'Curtir matéria '}
        </span>
        <span>{formatCompactNumber(likesCount)}</span>
      </button>

      <button
        type="button"
        onClick={handleSave}
        aria-pressed={saved}
        className={`inline-flex items-center gap-1.5 rounded border-2 border-border-strong px-3.5 py-2 font-mono text-xs font-bold transition-colors ${
          saved
            ? 'bg-highlight text-ink-highlight'
            : 'bg-surface text-ink-primary hover:bg-surface-alt'
        }`}
      >
        <Bookmark
          className={`h-4 w-4 ${saved ? 'fill-current' : ''}`}
          strokeWidth={2}
          aria-hidden="true"
        />
        <span>{saved ? 'Salvo' : 'Salvar'}</span>
        <span className="text-[11px] opacity-80">({formatCompactNumber(savesCount)})</span>
      </button>

      <button
        type="button"
        onClick={handleShare}
        aria-label={copied ? 'Link copiado' : 'Compartilhar link da matéria'}
        className="inline-flex items-center gap-1.5 rounded border-2 border-border-strong bg-surface px-3.5 py-2 font-mono text-xs font-bold text-ink-primary transition-colors hover:bg-surface-alt"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-status-success" strokeWidth={2} aria-hidden="true" />
            <span>Link copiado</span>
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            <span>Compartilhar</span>
          </>
        )}
      </button>
    </div>
  );
}

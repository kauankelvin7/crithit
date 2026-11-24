'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  GitFork,
  Lock,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { CategoryBadge } from '@/components/CategoryBadge';
import { AdminArticleForm } from '@/components/admin/AdminArticleForm';
import { PublishedArticlesTab } from '@/components/admin/PublishedArticlesTab';
import { RssSourcesTab } from '@/components/admin/RssSourcesTab';
import { formatFullDate } from '@/lib/format';
import type {
  AdminArticleDetail,
  AdminArticlePage,
  AdminArticleSummary,
  AdminArticleUpsertRequest,
  AdminUserDto,
  CreateRssSourceRequest,
  RssSourceDto,
} from '@/lib/types';
import { getSafeHttpUrl } from '@/lib/url';

type AdminTab = 'review' | 'published' | 'rss';

export function AdminDashboard() {
  const [user, setUser] = useState<AdminUserDto | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<AdminTab>('review');
  const [pendingArticles, setPendingArticles] = useState<AdminArticleSummary[]>([]);
  const [publishedArticles, setPublishedArticles] = useState<AdminArticleSummary[]>([]);
  const [rssSources, setRssSources] = useState<RssSourceDto[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<AdminArticleDetail | null>(null);
  const [editingPublished, setEditingPublished] = useState<AdminArticleDetail | null>(null);

  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{
    type: 'success' | 'error';
    message: string;
    linkSlug?: string;
  } | null>(null);

  const loadArticleDetail = useCallback(async (id: string): Promise<AdminArticleDetail | null> => {
    const res = await fetch(`/api/bff/admin/articles/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as AdminArticleDetail;
  }, []);

  const refreshData = useCallback(async () => {
    setBusy(true);
    try {
      const [pendingRes, pubRes, unpubRes, rssRes] = await Promise.all([
        fetch('/api/bff/admin/articles?status=PENDING_REVIEW&size=30', { cache: 'no-store' }),
        fetch('/api/bff/admin/articles?status=PUBLISHED&size=30', { cache: 'no-store' }),
        fetch('/api/bff/admin/articles?status=UNPUBLISHED&size=30', { cache: 'no-store' }),
        fetch('/api/bff/admin/rss-sources', { cache: 'no-store' }),
      ]);

      if (pendingRes.status === 401 || pubRes.status === 401) {
        setUser(null);
        return;
      }

      if (pendingRes.ok) {
        const pendingData = (await pendingRes.json()) as AdminArticlePage;
        setPendingArticles(pendingData.content ?? []);
        if (pendingData.content?.length > 0) {
          const detail = await loadArticleDetail(pendingData.content[0].id);
          setSelectedDetail(detail);
        } else {
          setSelectedDetail(null);
        }
      }

      const combinedPublished: AdminArticleSummary[] = [];
      if (pubRes.ok) {
        const pubData = (await pubRes.json()) as AdminArticlePage;
        combinedPublished.push(...(pubData.content ?? []));
      }
      if (unpubRes.ok) {
        const unpubData = (await unpubRes.json()) as AdminArticlePage;
        combinedPublished.push(...(unpubData.content ?? []));
      }
      setPublishedArticles(combinedPublished);

      if (rssRes.ok) {
        const sources = (await rssRes.json()) as RssSourceDto[];
        setRssSources(Array.isArray(sources) ? sources : []);
      }
    } catch {
      setBanner({
        type: 'error',
        message: 'Falha ao carregar dados editoriais da API.',
      });
    } finally {
      setBusy(false);
    }
  }, [loadArticleDetail]);

  useEffect(() => {
    fetch('/api/bff/auth/me', { cache: 'no-store' })
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as { user: AdminUserDto };
          setUser(data.user);
        }
      })
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, refreshData]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!email.trim() || !password) {
      setLoginError('Informe e-mail e senha para entrar.');
      return;
    }

    setLoginBusy(true);
    try {
      const res = await fetch('/api/bff/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        user?: AdminUserDto;
        message?: string;
      };

      if (!res.ok || !data.user) {
        setLoginError(data.message || 'Credenciais inválidas. Verifique e tente novamente.');
        return;
      }

      setUser(data.user);
      setPassword('');
    } catch {
      setLoginError('Não foi possível conectar ao servidor de autenticação.');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/bff/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setSelectedDetail(null);
    setEditingPublished(null);
  };

  const extractErrorMessage = async (res: Response, fallback: string): Promise<string> => {
    const err = (await res.json().catch(() => ({}))) as {
      message?: string;
      fieldErrors?: Array<{ field?: string; message?: string }>;
    };
    const firstFieldMsg = err.fieldErrors?.[0]?.message;
    if (firstFieldMsg) return firstFieldMsg;
    return err.message || fallback;
  };

  const handleSaveEdits = async (articleId: string, payload: AdminArticleUpsertRequest) => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/bff/admin/articles/${encodeURIComponent(articleId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setBanner({ type: 'error', message: await extractErrorMessage(res, 'Erro ao salvar alterações.') });
        return;
      }
      const updated = (await res.json()) as AdminArticleDetail;
      if (editingPublished?.id === articleId) {
        setEditingPublished(updated);
      } else {
        setSelectedDetail(updated);
      }
      setBanner({ type: 'success', message: 'Alterações salvas com sucesso.' });
      await refreshData();
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async (
    articleId: string,
    payload: AdminArticleUpsertRequest,
    setAsMainHeadline: boolean,
  ) => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/bff/admin/articles/${encodeURIComponent(articleId)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setAsMainHeadline, edits: payload }),
      });
      if (!res.ok) {
        setBanner({
          type: 'error',
          message: await extractErrorMessage(res, 'Não foi possível publicar a matéria.'),
        });
        return;
      }
      const published = (await res.json()) as AdminArticleDetail;
      setBanner({
        type: 'success',
        message: 'Matéria aprovada e publicada na capa editorial!',
        linkSlug: published.slug,
      });
      await refreshData();
    } finally {
      setBusy(false);
    }
  };

  const handleSchedule = async (
    articleId: string,
    payload: AdminArticleUpsertRequest,
    scheduledAtIso: string,
  ) => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/bff/admin/articles/${encodeURIComponent(articleId)}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: scheduledAtIso, edits: payload }),
      });
      if (!res.ok) {
        setBanner({
          type: 'error',
          message: await extractErrorMessage(res, 'Falha ao agendar publicação.'),
        });
        return;
      }
      setBanner({
        type: 'success',
        message: `Publicação agendada para ${formatFullDate(scheduledAtIso)}.`,
      });
      await refreshData();
    } finally {
      setBusy(false);
    }
  };

  const handleDiscard = async (articleId: string, reason?: string) => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/bff/admin/articles/${encodeURIComponent(articleId)}/discard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        setBanner({ type: 'error', message: err.message || 'Falha ao descartar rascunho.' });
        return;
      }
      setBanner({ type: 'success', message: 'Rascunho descartado e arquivado para auditoria.' });
      await refreshData();
    } finally {
      setBusy(false);
    }
  };

  const handlePromoteMainHeadline = async (articleId: string) => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch(
        `/api/bff/admin/articles/${encodeURIComponent(articleId)}/main-headline`,
        { method: 'PATCH' },
      );
      if (!res.ok) {
        setBanner({
          type: 'error',
          message: await extractErrorMessage(res, 'Erro ao promover Manchete Principal.'),
        });
        return;
      }
      setBanner({ type: 'success', message: 'Manchete Principal da Home atualizada atomicamente.' });
      await refreshData();
    } finally {
      setBusy(false);
    }
  };

  const handleUnpublish = async (articleId: string, reason?: string) => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch(
        `/api/bff/admin/articles/${encodeURIComponent(articleId)}/unpublish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        },
      );
      if (!res.ok) {
        setBanner({ type: 'error', message: 'Erro ao retirar matéria do ar.' });
        return;
      }
      setBanner({
        type: 'success',
        message: 'Matéria retirada do ar (404 público). Histórico e métricas preservados.',
      });
      await refreshData();
    } finally {
      setBusy(false);
    }
  };

  const handleRepublish = async (articleId: string) => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch(
        `/api/bff/admin/articles/${encodeURIComponent(articleId)}/republish`,
        { method: 'POST' },
      );
      if (!res.ok) {
        setBanner({ type: 'error', message: 'Erro ao republicar matéria.' });
        return;
      }
      setBanner({ type: 'success', message: 'Matéria republicada com sucesso.' });
      await refreshData();
    } finally {
      setBusy(false);
    }
  };

  const handleCreateRss = async (payload: CreateRssSourceRequest) => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch('/api/bff/admin/rss-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        setBanner({ type: 'error', message: err.message || 'Erro ao cadastrar fonte RSS.' });
        return;
      }
      setBanner({ type: 'success', message: 'Fonte RSS cadastrada com sucesso.' });
      await refreshData();
    } finally {
      setBusy(false);
    }
  };

  const handleToggleRss = async (source: RssSourceDto) => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/bff/admin/rss-sources/${encodeURIComponent(source.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !source.active }),
      });
      if (!res.ok) {
        setBanner({
          type: 'error',
          message: await extractErrorMessage(res, 'Erro ao atualizar status da fonte RSS.'),
        });
        return;
      }
      setBanner({ type: 'success', message: `Fonte ${source.name} atualizada.` });
      await refreshData();
    } finally {
      setBusy(false);
    }
  };

  const handleTriggerRss = async (sourceId?: string) => {
    setBusy(true);
    setBanner(null);
    try {
      const url = sourceId
        ? `/api/bff/admin/rss-sources/trigger?sourceId=${encodeURIComponent(sourceId)}`
        : '/api/bff/admin/rss-sources/trigger';
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) {
        setBanner({ type: 'error', message: 'Erro ao disparar coleta RSS.' });
        return;
      }
      setBanner({
        type: 'success',
        message: 'Ciclo de coleta RSS iniciado em segundo plano.',
      });
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="font-mono text-sm text-ink-muted">Verificando sessão da redação...</p>
      </div>
    );
  }

  // Tela de Login Protegida
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="rounded border-2 border-border-strong bg-surface p-6 shadow-hard sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded border-2 border-border-strong bg-brand-fill text-white">
              <Lock className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-headline text-3xl font-extrabold uppercase tracking-tight text-ink-primary">
                Painel da Redação
              </h1>
              <p className="font-mono text-xs text-ink-muted">Acesso restrito a editores</p>
            </div>
          </div>

          <form onSubmit={handleLogin} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
              >
                E-mail editorial
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(loginError)}
                placeholder="editor@crithit.com.br"
                className="w-full rounded border-2 border-border-input bg-surface px-3.5 py-2.5 font-sans text-sm text-ink-primary placeholder:text-ink-placeholder"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
              >
                Senha
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(loginError)}
                className="w-full rounded border-2 border-border-input bg-surface px-3.5 py-2.5 font-sans text-sm text-ink-primary"
              />
            </div>

            {loginError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded p-3 font-sans text-xs font-medium"
                style={{
                  backgroundColor: 'var(--status-error-soft)',
                  color: 'var(--ink-on-error-soft)',
                }}
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginBusy}
              className="inline-flex w-full items-center justify-center gap-2 rounded border-2 border-border-strong bg-brand-fill px-4 py-2.5 font-sans text-sm font-bold uppercase tracking-wide text-white shadow-hard-sm disabled:opacity-60"
            >
              <Lock className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              {loginBusy ? 'Autenticando...' : 'Entrar na Redação'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const safeOriginalUrl = selectedDetail ? getSafeHttpUrl(selectedDetail.attribution.sourceUrl) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      {/* Cabeçalho do Painel */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b-[3px] border-border-strong pb-4">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-brand">
            Human-in-the-Loop Workbench
          </p>
          <h1 className="font-headline text-3xl font-extrabold uppercase tracking-tight text-ink-primary sm:text-4xl">
            Mesa Editorial CritHit!
          </h1>
          <p className="font-mono text-xs text-ink-muted">
            Logado como {user.displayName} ({user.email})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => refreshData()}
            className="inline-flex items-center gap-1.5 rounded border-2 border-border-strong bg-surface px-3.5 py-2 font-mono text-xs font-bold uppercase text-ink-primary shadow-hard-sm hover:bg-surface-alt"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Recarregar
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded border-2 border-border-strong bg-surface-alt px-3.5 py-2 font-mono text-xs font-bold uppercase text-ink-primary hover:bg-highlight hover:text-ink-highlight"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Sair
          </button>
        </div>
      </div>

      {/* Banner de Feedback */}
      {banner && (
        <div
          role={banner.type === 'error' ? 'alert' : 'status'}
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded border-2 border-border-strong p-4"
          style={{
            backgroundColor:
              banner.type === 'success'
                ? 'var(--status-success-soft)'
                : 'var(--status-error-soft)',
            color:
              banner.type === 'success'
                ? 'var(--ink-on-success-soft)'
                : 'var(--ink-on-error-soft)',
          }}
        >
          <div className="flex items-center gap-2 font-sans text-sm font-semibold">
            {banner.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden="true" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden="true" />
            )}
            <span>{banner.message}</span>
          </div>
          {banner.linkSlug && (
            <Link
              href={`/noticia/${banner.linkSlug}`}
              className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase underline"
            >
              Ver matéria publicada
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            </Link>
          )}
        </div>
      )}

      {/* Abas Principais */}
      <div
        role="tablist"
        aria-label="Seções do painel editorial"
        className="mb-6 flex flex-wrap gap-2 border-b-2 border-border-subtle pb-3"
      >
        <button
          role="tab"
          type="button"
          aria-selected={activeTab === 'review'}
          onClick={() => {
            setActiveTab('review');
            setEditingPublished(null);
          }}
          className={`rounded border-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'review'
              ? 'border-border-strong bg-brand-fill text-white shadow-hard-sm'
              : 'border-border-subtle bg-surface text-ink-secondary hover:border-border-strong'
          }`}
        >
          Fila de Revisão ({pendingArticles.length})
        </button>

        <button
          role="tab"
          type="button"
          aria-selected={activeTab === 'published'}
          onClick={() => setActiveTab('published')}
          className={`rounded border-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'published'
              ? 'border-border-strong bg-brand-fill text-white shadow-hard-sm'
              : 'border-border-subtle bg-surface text-ink-secondary hover:border-border-strong'
          }`}
        >
          Matérias Publicadas ({publishedArticles.length})
        </button>

        <button
          role="tab"
          type="button"
          aria-selected={activeTab === 'rss'}
          onClick={() => {
            setActiveTab('rss');
            setEditingPublished(null);
          }}
          className={`rounded border-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'rss'
              ? 'border-border-strong bg-brand-fill text-white shadow-hard-sm'
              : 'border-border-subtle bg-surface text-ink-secondary hover:border-border-strong'
          }`}
        >
          Fontes RSS ({rssSources.length})
        </button>
      </div>

      {/* ABA 1: FILA DE REVISÃO (SPLIT-SCREEN) */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          {pendingArticles.length === 0 ? (
            <div className="rounded border-2 border-border-strong bg-surface p-10 text-center shadow-hard-sm">
              <h2 className="font-headline text-2xl font-extrabold uppercase text-ink-primary">
                Fila de revisão zerada
              </h2>
              <p className="mt-2 font-reading text-sm text-ink-secondary">
                Não há rascunhos pendentes em PENDING_REVIEW no momento.
              </p>
            </div>
          ) : (
            <>
              {/* Seletor rápido de itens na fila */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {pendingArticles.map((item) => {
                  const selected = selectedDetail?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={async () => {
                        const detail = await loadArticleDetail(item.id);
                        setSelectedDetail(detail);
                      }}
                      className={`min-w-[240px] max-w-[300px] shrink-0 rounded border-2 p-3 text-left transition-colors ${
                        selected
                          ? 'border-border-strong bg-highlight text-ink-highlight shadow-hard-sm'
                          : 'border-border-subtle bg-surface text-ink-primary hover:border-border-strong'
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-1.5">
                        <CategoryBadge category={item.category} />
                        <span className="font-mono text-[11px] font-bold">{item.aiStatus}</span>
                      </div>
                      <p className="line-clamp-2 font-sans text-xs font-bold">{item.headline}</p>
                      <p className="mt-1 font-mono text-[11px] opacity-80">
                        {item.attribution.sourceName}
                        {item.matchedSourcesCount > 1
                          ? ` (+${item.matchedSourcesCount - 1} cruzadas)`
                          : ''}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Workbench Split-Screen */}
              {selectedDetail && (
                <div className="grid gap-6 lg:grid-cols-12">
                  {/* Coluna Esquerda: Origem & Fontes Cruzadas (Somente Leitura) */}
                  <section
                    aria-label="Fonte original e fontes cruzadas"
                    className="space-y-4 rounded border-2 border-border-strong bg-surface-alt p-5 lg:col-span-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-brand">
                        Origem RSS / IA
                      </span>
                      <span className="rounded bg-surface px-2 py-0.5 font-mono text-[11px] font-bold text-ink-primary">
                        AI: {selectedDetail.aiStatus}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="font-mono text-xs text-ink-muted">
                        Fonte primária:{' '}
                        <strong className="text-ink-primary">
                          {selectedDetail.attribution.sourceName}
                        </strong>
                      </p>
                      {safeOriginalUrl && (
                        <a
                          href={safeOriginalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 break-all font-mono text-xs text-brand underline"
                        >
                          <span>{safeOriginalUrl}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                          <span className="sr-only">(abre em nova aba)</span>
                        </a>
                      )}
                    </div>

                    <div className="rounded border border-border-subtle bg-surface p-3.5">
                      <h3 className="font-mono text-[11px] font-bold uppercase text-ink-muted">
                        Título Original (raw_title)
                      </h3>
                      <p className="mt-1 font-sans text-sm font-bold text-ink-primary">
                        {selectedDetail.rawTitle || selectedDetail.headline}
                      </p>
                      <h4 className="mt-3 font-mono text-[11px] font-bold uppercase text-ink-muted">
                        Excerto Original (raw_excerpt)
                      </h4>
                      <p className="mt-1 font-reading text-xs leading-relaxed text-ink-secondary">
                        {selectedDetail.rawExcerpt || 'Excerto original não disponível.'}
                      </p>
                    </div>

                    {/* Notas da IA */}
                    {selectedDetail.editorialNotes.length > 0 && (
                      <div className="rounded border border-border-subtle bg-surface p-3.5">
                        <h3 className="font-mono text-[11px] font-bold uppercase text-ink-muted">
                          Notas da Adaptação IA
                        </h3>
                        <ul className="mt-1.5 list-disc space-y-1 pl-4 font-reading text-xs text-ink-secondary">
                          {selectedDetail.editorialNotes.map((note, idx) => (
                            <li key={idx}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Fontes Cruzadas pgvector */}
                    <div className="rounded border border-border-subtle bg-surface p-3.5">
                      <div className="mb-2 flex items-center gap-1.5">
                        <GitFork className="h-4 w-4 text-brand" strokeWidth={1.75} aria-hidden="true" />
                        <h3 className="font-mono text-[11px] font-bold uppercase text-ink-primary">
                          Fontes Cruzadas pgvector ({selectedDetail.matchedSources.length})
                        </h3>
                      </div>
                      {selectedDetail.matchedSources.length === 0 ? (
                        <p className="font-mono text-xs text-ink-muted">
                          Nenhuma fonte cruzada adicional registrada.
                        </p>
                      ) : (
                        <ul className="space-y-2.5">
                          {selectedDetail.matchedSources.map((src) => {
                            const safeUrl = getSafeHttpUrl(src.sourceUrl);
                            return (
                              <li
                                key={src.id}
                                className="rounded border border-border-subtle bg-surface-alt p-2.5 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                                  <strong className="text-ink-primary">{src.sourceName}</strong>
                                  <span className="rounded bg-surface px-1.5 py-0.5 font-bold text-brand">
                                    score {(src.similarityScore * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <p className="mt-1 font-sans font-medium text-ink-secondary">
                                  {src.originalTitle}
                                </p>
                                {safeUrl && (
                                  <a
                                    href={safeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-ink-muted underline hover:text-brand"
                                  >
                                    Abrir origem
                                    <ExternalLink className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                                    <span className="sr-only">(abre em nova aba)</span>
                                  </a>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </section>

                  {/* Coluna Direita: Formulário Editável Completo */}
                  <section
                    aria-label="Formulário de revisão editorial"
                    className="rounded border-2 border-border-strong bg-surface p-5 shadow-hard lg:col-span-7"
                  >
                    <AdminArticleForm
                      article={selectedDetail}
                      mode="review"
                      busy={busy}
                      onSaveEdits={(payload) => handleSaveEdits(selectedDetail.id, payload)}
                      onApprove={(payload, setMain) =>
                        handleApprove(selectedDetail.id, payload, setMain)
                      }
                      onSchedule={(payload, iso) => handleSchedule(selectedDetail.id, payload, iso)}
                      onDiscard={(reason) => handleDiscard(selectedDetail.id, reason)}
                    />
                  </section>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ABA 2: MATÉRIAS PUBLICADAS / UNPUBLISHED */}
      {activeTab === 'published' && (
        <div>
          {editingPublished ? (
            <div className="space-y-4 rounded border-2 border-border-strong bg-surface p-6 shadow-hard">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <button
                  type="button"
                  onClick={() => setEditingPublished(null)}
                  className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-ink-secondary hover:text-brand"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  Voltar para a listagem
                </button>
                <span className="font-mono text-xs font-bold text-brand">
                  Editando: {editingPublished.status}
                </span>
              </div>

              <AdminArticleForm
                article={editingPublished}
                mode="edit"
                busy={busy}
                onSaveEdits={(payload) => handleSaveEdits(editingPublished.id, payload)}
              />
            </div>
          ) : (
            <PublishedArticlesTab
              articles={publishedArticles}
              busy={busy}
              onEdit={async (id) => {
                const detail = await loadArticleDetail(id);
                if (detail) setEditingPublished(detail);
              }}
              onPromoteMainHeadline={handlePromoteMainHeadline}
              onUnpublish={handleUnpublish}
              onRepublish={handleRepublish}
            />
          )}
        </div>
      )}

      {/* ABA 3: FONTES RSS */}
      {activeTab === 'rss' && (
        <RssSourcesTab
          sources={rssSources}
          busy={busy}
          onCreate={handleCreateRss}
          onToggleActive={handleToggleRss}
          onTrigger={handleTriggerRss}
        />
      )}
    </div>
  );
}

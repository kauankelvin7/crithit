'use client';

import { FormEvent, useState } from 'react';
import { AlertCircle, ExternalLink, Plus, RefreshCw, Rss } from 'lucide-react';
import { CategoryBadge } from '@/components/CategoryBadge';
import { CATEGORIES, CATEGORY_LIST } from '@/lib/categories';
import { formatFullDate } from '@/lib/format';
import type { Category, CreateRssSourceRequest, RssSourceDto } from '@/lib/types';
import { getSafeHttpUrl, isValidHttpUrl } from '@/lib/url';

interface RssSourcesTabProps {
  sources: RssSourceDto[];
  busy?: boolean;
  onCreate: (payload: CreateRssSourceRequest) => Promise<void>;
  onToggleActive: (source: RssSourceDto) => Promise<void>;
  onTrigger: (sourceId?: string) => Promise<void>;
}

export function RssSourcesTab({
  sources,
  busy = false,
  onCreate,
  onToggleActive,
  onTrigger,
}: RssSourcesTabProps) {
  const [name, setName] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [language, setLanguage] = useState<'pt-BR' | 'en' | 'es' | 'ja'>('pt-BR');
  const [defaultCategory, setDefaultCategory] = useState<Category>('GAMES');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (name.trim().length < 2) {
      setFormError('Informe um nome válido para a fonte RSS (mínimo 2 caracteres).');
      return;
    }
    if (!isValidHttpUrl(feedUrl)) {
      setFormError('A URL do feed RSS deve iniciar com http:// ou https://.');
      return;
    }
    if (!isValidHttpUrl(siteUrl)) {
      setFormError('A URL do site da fonte deve iniciar com http:// ou https://.');
      return;
    }

    await onCreate({
      name: name.trim(),
      feedUrl: feedUrl.trim(),
      siteUrl: siteUrl.trim(),
      language,
      defaultCategory,
      active: true,
    });

    setName('');
    setFeedUrl('');
    setSiteUrl('');
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Disparo Manual */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border-2 border-border-strong bg-surface p-4 shadow-hard-sm">
        <div className="flex items-center gap-2">
          <Rss className="h-5 w-5 text-brand" strokeWidth={2} aria-hidden="true" />
          <div>
            <h2 className="font-headline text-2xl font-extrabold uppercase text-ink-primary">
              Catálogo de Fontes RSS
            </h2>
            <p className="font-mono text-xs text-ink-muted">
              Monitoramento automático de portais parceiros com detecção de pautas repetidas.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => onTrigger()}
          className="inline-flex items-center gap-2 rounded border-2 border-border-strong bg-brand-fill px-4 py-2 font-sans text-sm font-bold text-white shadow-hard-sm disabled:opacity-60"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Coletar todas as fontes agora
        </button>
      </div>

      {/* Formulário de Cadastro */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4 rounded border-2 border-border-strong bg-surface p-5 shadow-hard-sm"
      >
        <h3 className="font-headline text-xl font-extrabold uppercase text-ink-primary">
          Cadastrar Nova Fonte RSS
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label
              htmlFor="rss-name"
              className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
            >
              Nome do veículo
            </label>
            <input
              id="rss-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Polygon"
              className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-sans text-sm text-ink-primary"
            />
          </div>

          <div>
            <label
              htmlFor="rss-feedUrl"
              className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
            >
              URL do Feed RSS
            </label>
            <input
              id="rss-feedUrl"
              type="url"
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              placeholder="https://site.com/rss.xml"
              className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-mono text-xs text-ink-primary"
            />
          </div>

          <div>
            <label
              htmlFor="rss-siteUrl"
              className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
            >
              URL do Site
            </label>
            <input
              id="rss-siteUrl"
              type="url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://site.com"
              className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-mono text-xs text-ink-primary"
            />
          </div>

          <div>
            <label
              htmlFor="rss-lang"
              className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
            >
              Idioma
            </label>
            <select
              id="rss-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'pt-BR' | 'en' | 'es' | 'ja')}
              className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-mono text-sm text-ink-primary"
            >
              <option value="pt-BR">pt-BR</option>
              <option value="en">en</option>
              <option value="es">es</option>
              <option value="ja">ja</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="rss-category"
              className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
            >
              Editoria Padrão
            </label>
            <select
              id="rss-category"
              value={defaultCategory}
              onChange={(e) => setDefaultCategory(e.target.value as Category)}
              className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-sans text-sm text-ink-primary"
            >
              {CATEGORY_LIST.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORIES[cat].shortLabel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formError && (
          <p role="alert" className="flex items-center gap-1.5 font-sans text-xs text-status-error">
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded border-2 border-border-strong bg-highlight px-4 py-2 font-sans text-sm font-bold text-ink-highlight shadow-hard-sm disabled:opacity-60"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Adicionar Fonte RSS
        </button>
      </form>

      {/* Lista de Fontes */}
      <div className="grid gap-3 md:grid-cols-2">
        {sources.map((src) => {
          const safeSite = getSafeHttpUrl(src.siteUrl);
          return (
            <div
              key={src.id}
              className="flex flex-col justify-between gap-3 rounded border-2 border-border-strong bg-surface p-4 shadow-hard-sm"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-sans text-base font-bold text-ink-primary">{src.name}</h4>
                    <CategoryBadge category={src.defaultCategory} />
                    <span className="rounded bg-surface-alt px-2 py-0.5 font-mono text-[11px] font-bold text-ink-muted">
                      {src.language}
                    </span>
                  </div>
                  <span
                    className="rounded px-2 py-0.5 font-mono text-[11px] font-bold uppercase"
                    style={{
                      backgroundColor: src.active
                        ? 'var(--status-success-soft)'
                        : 'var(--status-warning-soft)',
                      color: src.active
                        ? 'var(--ink-on-success-soft)'
                        : 'var(--ink-on-warning-soft)',
                    }}
                  >
                    {src.active ? 'ATIVA' : 'PAUSADA'}
                  </span>
                </div>

                <p className="break-all font-mono text-xs text-ink-secondary">{src.feedUrl}</p>

                <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-ink-muted">
                  <span>Falhas consecutivas: {src.consecutiveFailures}</span>
                  {src.lastFetchedAt && <span>Última coleta: {formatFullDate(src.lastFetchedAt)}</span>}
                </div>

                {src.lastErrorMessage && (
                  <p className="font-mono text-xs text-status-error">{src.lastErrorMessage}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3">
                {safeSite ? (
                  <a
                    href={safeSite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-ink-secondary underline hover:text-brand"
                  >
                    Abrir site
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    <span className="sr-only">(abre em nova aba)</span>
                  </a>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onToggleActive(src)}
                    className="rounded border-2 border-border-strong bg-surface-alt px-3 py-1 font-mono text-xs font-bold text-ink-primary hover:bg-surface-hover"
                  >
                    {src.active ? 'Pausar' : 'Ativar'}
                  </button>
                  <button
                    type="button"
                    disabled={busy || !src.active}
                    onClick={() => onTrigger(src.id)}
                    className="inline-flex items-center gap-1 rounded border-2 border-border-strong bg-surface px-3 py-1 font-mono text-xs font-bold text-ink-primary hover:bg-highlight hover:text-ink-highlight disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                    Coletar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

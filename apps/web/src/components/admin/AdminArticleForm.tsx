'use client';

import { ChangeEvent, FormEvent, useEffect, useId, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  Check,
  Image as ImageIcon,
  RotateCcw,
  Save,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { EditorialCoverArt } from '@/components/EditorialCoverArt';
import { CATEGORIES, CATEGORY_LIST } from '@/lib/categories';
import { ArticleValidationErrors, validateAdminArticleForm } from '@/lib/format';
import { getSafeHttpUrl } from '@/lib/url';
import type {
  AdminArticleDetail,
  AdminArticleUpsertRequest,
  Category,
  ContentType,
  EditorialFormat,
} from '@/lib/types';

export interface AdminArticleFormProps {
  article: AdminArticleDetail;
  mode: 'review' | 'edit';
  busy?: boolean;
  onSaveEdits: (payload: AdminArticleUpsertRequest) => Promise<void> | void;
  onApprove?: (payload: AdminArticleUpsertRequest, setAsMainHeadline: boolean) => Promise<void> | void;
  onSchedule?: (payload: AdminArticleUpsertRequest, scheduledAtIso: string) => Promise<void> | void;
  onDiscard?: (reason?: string) => Promise<void> | void;
}

export function AdminArticleForm({
  article,
  mode,
  busy = false,
  onSaveEdits,
  onApprove,
  onSchedule,
  onDiscard,
}: AdminArticleFormProps) {
  const formId = useId();

  const [headline, setHeadline] = useState(article.headline);
  const [bulletsText, setBulletsText] = useState(article.subheadlineBullets.join('\n'));
  const [lead, setLead] = useState(article.lead);
  const [bodyText, setBodyText] = useState(article.bodyParagraphs.join('\n\n'));
  const [reelsSummary, setReelsSummary] = useState(article.reelsSummary);
  const [category, setCategory] = useState<Category>(article.category);
  const [editorialFormat, setEditorialFormat] = useState<EditorialFormat>(article.editorialFormat);
  const [tagsText, setTagsText] = useState(article.tags.join(', '));
  const [coverImageUrl, setCoverImageUrl] = useState(article.coverImageUrl ?? '');
  const [readingTimeMinutes, setReadingTimeMinutes] = useState(article.readingTimeMinutes);
  const [reviewScore, setReviewScore] = useState(
    article.reviewScore !== null && article.reviewScore !== undefined
      ? String(article.reviewScore)
      : '',
  );
  const [isUrgent, setIsUrgent] = useState(article.isUrgent);
  const [setAsMainHeadline, setSetAsMainHeadline] = useState(false);

  // Campos de Atribuição Obrigatória
  const [authorName, setAuthorName] = useState(article.attribution.authorName);
  const [contentType, setContentType] = useState<ContentType>(article.attribution.contentType);
  const [sourceName, setSourceName] = useState(article.attribution.sourceName);
  const [sourceUrl, setSourceUrl] = useState(article.attribution.sourceUrl);

  // Agendamento & Confirmação em 2 passos para Descartar
  const [scheduledAtLocal, setScheduledAtLocal] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [discardReason, setDiscardReason] = useState('');
  const cancelDiscardRef = useRef<HTMLButtonElement>(null);

  // Upload local de capa
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [errors, setErrors] = useState<ArticleValidationErrors>({});

  useEffect(() => {
    setHeadline(article.headline);
    setBulletsText(article.subheadlineBullets.join('\n'));
    setLead(article.lead);
    setBodyText(article.bodyParagraphs.join('\n\n'));
    setReelsSummary(article.reelsSummary);
    setCategory(article.category);
    setEditorialFormat(article.editorialFormat);
    setTagsText(article.tags.join(', '));
    setCoverImageUrl(article.coverImageUrl ?? '');
    setReadingTimeMinutes(article.readingTimeMinutes);
    setReviewScore(
      article.reviewScore !== null && article.reviewScore !== undefined
        ? String(article.reviewScore)
        : '',
    );
    setIsUrgent(article.isUrgent);
    setSetAsMainHeadline(false);
    setAuthorName(article.attribution.authorName);
    setContentType(article.attribution.contentType);
    setSourceName(article.attribution.sourceName);
    setSourceUrl(article.attribution.sourceUrl);
    setErrors({});
    setScheduleError('');
    setConfirmDiscardOpen(false);
    setDiscardReason('');
    setUploadError('');
  }, [article]);

  const handleLocalCoverUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/bff/media/upload', {
        method: 'POST',
        body: formData,
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
      if (!res.ok || !data.url) {
        setUploadError(data.message || 'Falha ao enviar a imagem de capa.');
        return;
      }
      setCoverImageUrl(data.url);
      setErrors((prev) => {
        if (!prev.coverImageUrl) return prev;
        const next = { ...prev };
        delete next.coverImageUrl;
        return next;
      });
    } catch {
      setUploadError('Erro de conexão ao enviar imagem local.');
    } finally {
      setUploadingCover(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (confirmDiscardOpen) {
      cancelDiscardRef.current?.focus();
    }
  }, [confirmDiscardOpen]);

  const buildPayload = (): AdminArticleUpsertRequest => {
    const parsedScore = reviewScore.trim() === '' ? null : Number(reviewScore.replace(',', '.'));
    return {
      headline: headline.trim(),
      subheadlineBullets: bulletsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 5),
      lead: lead.trim(),
      bodyParagraphs: bodyText
        .split(/\n{2,}/)
        .map((s) => s.trim())
        .filter(Boolean),
      reelsSummary: reelsSummary.trim(),
      category,
      editorialFormat,
      tags: tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      coverImageUrl: coverImageUrl.trim() === '' ? null : coverImageUrl.trim(),
      readingTimeMinutes: Math.max(1, Math.min(60, Number(readingTimeMinutes) || 2)),
      reviewScore:
        parsedScore !== null && !Number.isNaN(parsedScore)
          ? Math.max(0, Math.min(10, parsedScore))
          : null,
      isUrgent,
      authorName: authorName.trim(),
      contentType,
      sourceName: sourceName.trim(),
      sourceUrl: sourceUrl.trim(),
    };
  };

  const validateAndBuild = (): AdminArticleUpsertRequest | null => {
    const payload = buildPayload();
    const validationErrors = validateAdminArticleForm(payload);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return null;
    }
    return payload;
  };

  const handleSaveSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = validateAndBuild();
    if (!payload) return;
    await onSaveEdits(payload);
  };

  const handleApproveClick = async () => {
    if (!onApprove) return;
    const payload = validateAndBuild();
    if (!payload) return;
    await onApprove(payload, setAsMainHeadline);
  };

  const handleScheduleClick = async () => {
    if (!onSchedule) return;
    setScheduleError('');
    const payload = validateAndBuild();
    if (!payload) return;

    if (!scheduledAtLocal) {
      setScheduleError('Selecione uma data e hora futura para agendar.');
      return;
    }
    const parsed = new Date(scheduledAtLocal);
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
      setScheduleError('A data de agendamento deve estar no futuro.');
      return;
    }

    await onSchedule(payload, parsed.toISOString());
  };

  return (
    <form onSubmit={handleSaveSubmit} noValidate className="space-y-5">
      {/* Manchete */}
      <div>
        <label
          htmlFor={`${formId}-headline`}
          className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
        >
          Manchete Editorial
        </label>
        <input
          id={`${formId}-headline`}
          type="text"
          maxLength={180}
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          aria-invalid={Boolean(errors.headline)}
          aria-describedby={errors.headline ? `${formId}-headline-err` : undefined}
          className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-sans text-sm font-semibold text-ink-primary"
        />
        {errors.headline && (
          <p id={`${formId}-headline-err`} role="alert" className="mt-1 font-sans text-xs text-status-error">
            {errors.headline}
          </p>
        )}
      </div>

      {/* Editoria, Formato, Tempo e Nota */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label
            htmlFor={`${formId}-category`}
            className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
          >
            Editoria
          </label>
          <select
            id={`${formId}-category`}
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-sans text-sm text-ink-primary"
          >
            {CATEGORY_LIST.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORIES[cat].label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={`${formId}-format`}
            className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
          >
            Formato
          </label>
          <select
            id={`${formId}-format`}
            value={editorialFormat}
            onChange={(e) => setEditorialFormat(e.target.value as EditorialFormat)}
            className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-sans text-sm text-ink-primary"
          >
            <option value="NEWS">Notícia (NEWS)</option>
            <option value="COLUMN">Coluna (COLUMN)</option>
            <option value="REVIEW">Review (REVIEW)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor={`${formId}-reading`}
            className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
          >
            Leitura (min)
          </label>
          <input
            id={`${formId}-reading`}
            type="number"
            min={1}
            max={60}
            value={readingTimeMinutes}
            onChange={(e) => setReadingTimeMinutes(Number(e.target.value))}
            className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-mono text-sm text-ink-primary"
          />
        </div>

        <div>
          <label
            htmlFor={`${formId}-score`}
            className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
          >
            Nota Review (0-10)
          </label>
          <input
            id={`${formId}-score`}
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={reviewScore}
            onChange={(e) => setReviewScore(e.target.value)}
            placeholder="Opcional"
            className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-mono text-sm text-ink-primary"
          />
        </div>
      </div>

      {/* Lead */}
      <div>
        <label
          htmlFor={`${formId}-lead`}
          className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
        >
          Lead (Abertura)
        </label>
        <textarea
          id={`${formId}-lead`}
          rows={3}
          value={lead}
          onChange={(e) => setLead(e.target.value)}
          aria-invalid={Boolean(errors.lead)}
          aria-describedby={errors.lead ? `${formId}-lead-err` : undefined}
          className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-reading text-sm text-ink-primary"
        />
        {errors.lead && (
          <p id={`${formId}-lead-err`} role="alert" className="mt-1 font-sans text-xs text-status-error">
            {errors.lead}
          </p>
        )}
      </div>

      {/* Sub-bullets */}
      <div>
        <label
          htmlFor={`${formId}-bullets`}
          className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
        >
          Sub-bullets de resumo (um por linha, até 5)
        </label>
        <textarea
          id={`${formId}-bullets`}
          rows={3}
          value={bulletsText}
          onChange={(e) => setBulletsText(e.target.value)}
          className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-reading text-sm text-ink-primary"
        />
      </div>

      {/* Corpo */}
      <div>
        <label
          htmlFor={`${formId}-body`}
          className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
        >
          Corpo da Matéria (separe parágrafos com uma linha em branco)
        </label>
        <textarea
          id={`${formId}-body`}
          rows={7}
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          aria-invalid={Boolean(errors.bodyParagraphs)}
          aria-describedby={errors.bodyParagraphs ? `${formId}-body-err` : undefined}
          className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-reading text-sm leading-relaxed text-ink-primary"
        />
        {errors.bodyParagraphs && (
          <p id={`${formId}-body-err`} role="alert" className="mt-1 font-sans text-xs text-status-error">
            {errors.bodyParagraphs}
          </p>
        )}
      </div>

      {/* Resumo Reels 9:16 */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label
            htmlFor={`${formId}-reels`}
            className="font-mono text-xs font-bold uppercase text-ink-secondary"
          >
            Resumo para Reels 9:16
          </label>
          <span className="font-mono text-[11px] text-ink-muted">{reelsSummary.length}/320</span>
        </div>
        <textarea
          id={`${formId}-reels`}
          rows={2}
          maxLength={320}
          value={reelsSummary}
          onChange={(e) => setReelsSummary(e.target.value)}
          aria-invalid={Boolean(errors.reelsSummary)}
          aria-describedby={errors.reelsSummary ? `${formId}-reels-err` : undefined}
          className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-reading text-sm text-ink-primary"
        />
        {errors.reelsSummary && (
          <p id={`${formId}-reels-err`} role="alert" className="mt-1 font-sans text-xs text-status-error">
            {errors.reelsSummary}
          </p>
        )}
      </div>

      {/* Capa (URL RSS + Upload Local + Preview ao vivo) e Tags */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label
              htmlFor={`${formId}-cover`}
              className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
            >
              URL da Imagem de Capa (http/https ou vazio para arte vetorial)
            </label>
            <input
              id={`${formId}-cover`}
              type="url"
              value={coverImageUrl}
              onChange={(e) => {
                setCoverImageUrl(e.target.value);
                setUploadError('');
              }}
              aria-invalid={Boolean(errors.coverImageUrl)}
              aria-describedby={errors.coverImageUrl ? `${formId}-cover-err` : undefined}
              placeholder="https://..."
              className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-mono text-xs text-ink-primary"
            />
            {errors.coverImageUrl && (
              <p id={`${formId}-cover-err`} role="alert" className="mt-1 font-sans text-xs text-status-error">
                {errors.coverImageUrl}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleLocalCoverUpload}
              className="sr-only"
              aria-label="Selecionar arquivo de imagem para capa"
            />
            <button
              type="button"
              disabled={busy || uploadingCover}
              onClick={() => fileInputRef.current?.click()}
              className="tactile-btn inline-flex items-center gap-1.5 rounded border-2 border-border-strong bg-surface-alt px-3 py-1.5 font-mono text-xs font-bold uppercase text-ink-primary hover:bg-surface-hover disabled:opacity-60"
            >
              <Upload className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              {uploadingCover ? 'Enviando...' : 'Enviar imagem local'}
            </button>

            {coverImageUrl.trim() !== '' && (
              <button
                type="button"
                disabled={busy || uploadingCover}
                onClick={() => {
                  setCoverImageUrl('');
                  setUploadError('');
                }}
                className="tactile-btn inline-flex items-center gap-1.5 rounded border-2 border-border-subtle bg-surface px-3 py-1.5 font-mono text-xs font-bold uppercase text-ink-secondary hover:border-border-strong hover:text-ink-primary"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                Usar arte editorial
              </button>
            )}
          </div>

          {uploadError && (
            <p role="alert" className="font-sans text-xs text-status-error">
              {uploadError}
            </p>
          )}

          {/* Pré-visualização ao vivo da capa */}
          <div
            aria-label="Pré-visualização da capa editorial"
            className="overflow-hidden rounded border-2 border-border-strong bg-surface-alt shadow-hard-sm"
          >
            <div className="flex items-center justify-between border-b border-border-subtle px-3 py-1.5 font-mono text-[11px] font-bold uppercase text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                Preview da capa
              </span>
              <span>
                {getSafeHttpUrl(coverImageUrl)
                  ? coverImageUrl.includes('/api/media/')
                    ? 'Upload local'
                    : 'Foto externa (RSS / URL)'
                  : 'Arte vetorial da editoria'}
              </span>
            </div>
            <EditorialCoverArt
              coverImageUrl={coverImageUrl}
              coverArtKey={article.coverArtKey}
              category={category}
              alt={headline || 'Pré-visualização da capa'}
              aspectClass="aspect-video"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={`${formId}-tags`}
            className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
          >
            Tags (separadas por vírgula)
          </label>
          <input
            id={`${formId}-tags`}
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-sans text-sm text-ink-primary"
          />
          <p className="mt-2 font-reading text-xs leading-relaxed text-ink-muted">
            Quando a URL da capa estiver preenchida (extraída automaticamente via RSS ou enviada
            localmente), o portal exibe a foto em <code>object-cover</code> com fallback automático
            para a ilustração HQ da editoria caso o servidor da imagem falhe.
          </p>
        </div>
      </div>

      {/* Bloco Destacado: Atribuição Jornalística Obrigatória */}
      <fieldset className="rounded border-2 border-border-strong bg-surface-alt p-4">
        <legend className="px-2 font-mono text-xs font-bold uppercase tracking-wider text-brand">
          Atribuição Jornalística Obrigatória
        </legend>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`${formId}-author`}
              className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
            >
              Autor / Revisor (author_name)
            </label>
            <input
              id={`${formId}-author`}
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              aria-invalid={Boolean(errors.authorName)}
              aria-describedby={errors.authorName ? `${formId}-author-err` : undefined}
              className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-sans text-sm text-ink-primary"
            />
            {errors.authorName && (
              <p id={`${formId}-author-err`} role="alert" className="mt-1 font-sans text-xs text-status-error">
                {errors.authorName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={`${formId}-contentType`}
              className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
            >
              Tipo de Conteúdo (content_type)
            </label>
            <select
              id={`${formId}-contentType`}
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
              className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-mono text-sm text-ink-primary"
            >
              <option value="CURADORIA">CURADORIA (Adaptado de fonte externa)</option>
              <option value="AUTORAL">AUTORAL (Produção original CritHit!)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor={`${formId}-sourceName`}
              className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
            >
              Nome da Fonte (source_name)
            </label>
            <input
              id={`${formId}-sourceName`}
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              aria-invalid={Boolean(errors.sourceName)}
              aria-describedby={errors.sourceName ? `${formId}-sourceName-err` : undefined}
              className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-sans text-sm text-ink-primary"
            />
            {errors.sourceName && (
              <p id={`${formId}-sourceName-err`} role="alert" className="mt-1 font-sans text-xs text-status-error">
                {errors.sourceName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={`${formId}-sourceUrl`}
              className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
            >
              URL da Fonte Original (http/https)
            </label>
            <input
              id={`${formId}-sourceUrl`}
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              aria-invalid={Boolean(errors.sourceUrl)}
              aria-describedby={errors.sourceUrl ? `${formId}-sourceUrl-err` : undefined}
              className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-mono text-xs text-ink-primary"
            />
            {errors.sourceUrl && (
              <p id={`${formId}-sourceUrl-err`} role="alert" className="mt-1 font-sans text-xs text-status-error">
                {errors.sourceUrl}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Flags Editoriais */}
      <div className="flex flex-wrap items-center gap-5">
        <label className="inline-flex cursor-pointer items-center gap-2 font-sans text-sm font-medium text-ink-primary">
          <input
            type="checkbox"
            checked={isUrgent}
            onChange={(e) => setIsUrgent(e.target.checked)}
            className="h-4 w-4 accent-[var(--fill-brand)]"
          />
          Exibir em Urgente na Redação
        </label>

        {mode === 'review' && (
          <label className="inline-flex cursor-pointer items-center gap-2 font-sans text-sm font-medium text-ink-primary">
            <input
              type="checkbox"
              checked={setAsMainHeadline}
              onChange={(e) => setSetAsMainHeadline(e.target.checked)}
              className="h-4 w-4 accent-[var(--fill-brand)]"
            />
            <Star className="h-4 w-4 text-brand" strokeWidth={2} aria-hidden="true" />
            Promover a Manchete Principal ao aprovar
          </label>
        )}
      </div>

      {/* Agendamento (somente na fila de revisão) */}
      {mode === 'review' && onSchedule && (
        <div className="rounded border border-border-subtle bg-surface-alt p-3.5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label
                htmlFor={`${formId}-scheduledAt`}
                className="mb-1 block font-mono text-xs font-bold uppercase text-ink-secondary"
              >
                Agendar Publicação Futura
              </label>
              <input
                id={`${formId}-scheduledAt`}
                type="datetime-local"
                value={scheduledAtLocal}
                onChange={(e) => {
                  setScheduledAtLocal(e.target.value);
                  setScheduleError('');
                }}
                className="w-full rounded border-2 border-border-input bg-surface px-3 py-2 font-mono text-xs text-ink-primary"
              />
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={handleScheduleClick}
              className="inline-flex items-center gap-2 rounded border-2 border-border-strong px-4 py-2 font-sans text-sm font-bold shadow-hard-sm disabled:opacity-60"
              style={{
                backgroundColor: 'var(--fill-info)',
                color: 'var(--ink-on-fill-info)',
              }}
            >
              <CalendarClock className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Agendar
            </button>
          </div>
          {scheduleError && (
            <p role="alert" className="mt-2 flex items-center gap-1.5 font-sans text-xs text-status-error">
              <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
              {scheduleError}
            </p>
          )}
        </div>
      )}

      {/* Barra de Ações Principais */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-border-strong pt-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {mode === 'review' && onApprove && (
            <button
              type="button"
              disabled={busy}
              onClick={handleApproveClick}
              className="inline-flex items-center gap-2 rounded border-2 border-border-strong px-4 py-2.5 font-sans text-sm font-bold shadow-hard-sm disabled:opacity-60"
              style={{
                backgroundColor: 'var(--fill-success)',
                color: 'var(--ink-on-fill-success)',
              }}
            >
              <Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Aprovar e Publicar
            </button>
          )}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded border-2 border-border-strong bg-surface px-4 py-2.5 font-sans text-sm font-bold text-ink-primary shadow-hard-sm hover:bg-surface-alt disabled:opacity-60"
          >
            <Save className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            {mode === 'review' ? 'Salvar rascunho' : 'Salvar alterações'}
          </button>
        </div>

        {mode === 'review' && onDiscard && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmDiscardOpen(true)}
            className="inline-flex items-center gap-2 rounded border-2 border-status-error bg-surface px-4 py-2.5 font-sans text-sm font-bold text-status-error hover:bg-surface-alt disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Descartar
          </button>
        )}
      </div>

      {/* Confirmação em 2 passos para Descartar */}
      {confirmDiscardOpen && onDiscard && (
        <div
          role="alertdialog"
          aria-labelledby={`${formId}-discard-title`}
          className="rounded border-2 border-status-error p-4"
          style={{
            backgroundColor: 'var(--status-error-soft)',
            color: 'var(--ink-on-error-soft)',
          }}
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} aria-hidden="true" />
            <div className="flex-1 space-y-3">
              <div>
                <h3 id={`${formId}-discard-title`} className="font-sans text-sm font-bold">
                  Confirmar descarte deste rascunho?
                </h3>
                <p className="mt-1 font-reading text-xs">
                  O item sairá da fila de revisão e nunca aparecerá nas rotas públicas, mantendo
                  registro apenas para auditoria e deduplicação.
                </p>
              </div>
              <input
                type="text"
                value={discardReason}
                onChange={(e) => setDiscardReason(e.target.value)}
                placeholder="Motivo opcional (ex.: fora de pauta, duplicado)"
                aria-label="Motivo do descarte"
                className="w-full rounded border border-border-input bg-surface px-3 py-1.5 font-sans text-xs text-ink-primary"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  ref={cancelDiscardRef}
                  type="button"
                  onClick={() => setConfirmDiscardOpen(false)}
                  className="rounded border-2 border-border-strong bg-surface px-3 py-1.5 font-sans text-xs font-bold text-ink-primary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onDiscard(discardReason.trim() || undefined)}
                  className="rounded border-2 border-border-strong px-3 py-1.5 font-sans text-xs font-bold"
                  style={{
                    backgroundColor: 'var(--fill-error)',
                    color: 'var(--ink-on-fill-error)',
                  }}
                >
                  Confirmar descarte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

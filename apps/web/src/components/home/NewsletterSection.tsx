'use client';

import { FormEvent, useId, useState } from 'react';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';

export function NewsletterSection() {
  const inputId = useId();
  const feedbackId = useId();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmed || !emailRegex.test(trimmed)) {
      setStatus('error');
      setMessage('Informe um endereço de e-mail válido para assinar o Loot Diário.');
      return;
    }

    setStatus('submitting');
    setMessage('');

    try {
      const res = await fetch('/api/public/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });

      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setStatus('success');
        setMessage(
          data.message || 'Inscrição confirmada! Você receberá o resumo diário da redação.',
        );
        setEmail('');
        return;
      }

      if (res.status === 503) {
        setStatus('success');
        setMessage('Inscrição registrada no modo pré-visualização. Obrigado por acompanhar o CritHit!.');
        setEmail('');
        return;
      }

      const errData = (await res.json().catch(() => ({}))) as { message?: string };
      setStatus('error');
      setMessage(errData.message || 'Não foi possível concluir a inscrição agora.');
    } catch {
      setStatus('error');
      setMessage('Erro de conexão ao registrar seu e-mail. Tente novamente em instantes.');
    }
  };

  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-heading"
      className="my-10 rounded border-2 border-border-strong bg-highlight p-6 text-ink-highlight shadow-hard sm:p-8"
    >
      <div className="grid items-center gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded bg-[#111111] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white">
            <Mail className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            Newsletter Editorial
          </div>
          <h2
            id="newsletter-heading"
            className="font-headline text-3xl font-extrabold uppercase tracking-tight text-ink-highlight sm:text-4xl"
          >
            Loot Diário — O essencial do universo geek às 8h
          </h2>
          <p className="max-w-2xl font-reading text-sm leading-relaxed text-[#27272A] sm:text-base">
            Receba as 5 notícias que realmente importam em games, quadrinhos, cinema e tecnologia,
            revisadas pela redação e sem clickbait.
          </p>
        </div>

        <div className="lg:col-span-5">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor={inputId} className="sr-only">
              Seu e-mail para receber o Loot Diário
            </label>
            <input
              id={inputId}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === 'error') {
                  setStatus('idle');
                  setMessage('');
                }
              }}
              aria-invalid={status === 'error'}
              aria-describedby={message ? feedbackId : undefined}
              placeholder="seu.email@exemplo.com"
              disabled={status === 'submitting' || status === 'success'}
              className="flex-1 rounded border-2 border-[#111111] bg-white px-4 py-2.5 font-sans text-sm text-[#111111] placeholder:text-[#5C5C66] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
            <button
              type="submit"
              disabled={status === 'submitting' || status === 'success'}
              className="inline-flex items-center justify-center gap-2 rounded border-2 border-[#111111] bg-[#111111] px-5 py-2.5 font-sans text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#BE123C] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Mail className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              {status === 'submitting' ? 'Enviando...' : status === 'success' ? 'Inscrito' : 'Assinar'}
            </button>
          </form>

          {message && (
            <div
              id={feedbackId}
              role={status === 'error' ? 'alert' : 'status'}
              aria-live="polite"
              className="mt-3 flex items-start gap-2 rounded border border-[#111111] bg-white px-3 py-2 font-sans text-xs font-medium text-[#111111]"
            >
              {status === 'error' ? (
                <AlertCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#B91C1C]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              ) : (
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#166534]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              )}
              <span>{message}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

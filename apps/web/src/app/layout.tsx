import type { Metadata, Viewport } from 'next';
import {
  Bangers,
  Barlow_Condensed,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from 'next/font/google';
import { Suspense } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { getSiteUrl } from '@/lib/api-client';
import './globals.css';

const bangers = Bangers({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const barlowCondensed = Barlow_Condensed({
  weight: ['600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-headline',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-reading',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  weight: ['500', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('crithit-theme');
    var theme = (stored === 'light' || stored === 'dark')
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'CritHit! — Jornalismo Geek sem Clickbait',
    template: '%s | CritHit!',
  },
  description:
    'Portal independente de jornalismo geek com curadoria internacional e nacional revisada por humanos: games, quadrinhos, cinema, animes e hardware.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'CritHit!',
    title: 'CritHit! — Jornalismo Geek sem Clickbait',
    description:
      'Cobertura editorial diária de games, quadrinhos, mangás, cinema, séries, animes e hardware com atribuição transparente.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CritHit! — Jornalismo Geek sem Clickbait',
    description:
      'Cobertura editorial diária de games, quadrinhos, cinema, animes e hardware com revisão humana.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${bangers.variable} ${barlowCondensed.variable} ${spaceGrotesk.variable} ${plusJakartaSans.variable} ${jetBrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-base font-sans text-ink-primary antialiased">
        <a
          href="#conteudo-principal"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-highlight focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:font-bold focus:text-ink-highlight"
        >
          Pular para o conteúdo principal
        </a>
        <Suspense fallback={<div className="sticky top-0 z-50 h-16 w-full border-b-[3px] border-highlight bg-chrome" />}>
          <SiteHeader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}

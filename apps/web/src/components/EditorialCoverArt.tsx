'use client';

import { useId, useState } from 'react';
import { resolveAuthorAvatar, type AvatarVariantKey } from '@/lib/authors';
import type { Category } from '@/lib/types';
import { getSafeHttpUrl } from '@/lib/url';

export type ArtVariantKey =
  | 'dino-survival'
  | 'gamepad'
  | 'rpg-quest'
  | 'spider'
  | 'batman'
  | 'manga-sea'
  | 'cinema'
  | 'andor-rebel'
  | 'ghibli-sky'
  | 'anime'
  | 'console'
  | 'tech';

interface EditorialCoverArtProps {
  coverImageUrl?: string | null;
  coverArtKey?: string;
  category: Category;
  alt: string;
  className?: string;
  mediaClassName?: string;
  aspectClass?: string;
  compact?: boolean;
  decorative?: boolean;
  priority?: boolean;
  fit?: 'cover' | 'contain';
  fullBleed?: boolean;
}

interface ArtTheme {
  bg1: string;
  bg2: string;
  bg3: string;
  accent: string;
  highlight: string;
}

const ART_THEMES: Record<ArtVariantKey, ArtTheme> = {
  'dino-survival': {
    bg1: '#7F1D1D',
    bg2: '#E11D48',
    bg3: '#0F172A',
    accent: '#FFD600',
    highlight: '#38BDF8',
  },
  gamepad: {
    bg1: '#1E3A8A',
    bg2: '#2563EB',
    bg3: '#090D1F',
    accent: '#FFD600',
    highlight: '#00E5FF',
  },
  'rpg-quest': {
    bg1: '#312E81',
    bg2: '#6D28D9',
    bg3: '#111827',
    accent: '#FBBF24',
    highlight: '#F43F5E',
  },
  spider: {
    bg1: '#991B1B',
    bg2: '#E11D48',
    bg3: '#1E1B4B',
    accent: '#FFD600',
    highlight: '#00E5FF',
  },
  batman: {
    bg1: '#18181B',
    bg2: '#334155',
    bg3: '#09090B',
    accent: '#FFD600',
    highlight: '#94A3B8',
  },
  'manga-sea': {
    bg1: '#9A3412',
    bg2: '#EA580C',
    bg3: '#0F2937',
    accent: '#FDE047',
    highlight: '#22D3EE',
  },
  cinema: {
    bg1: '#78350F',
    bg2: '#D97706',
    bg3: '#1C1917',
    accent: '#FEF08A',
    highlight: '#34D399',
  },
  'andor-rebel': {
    bg1: '#064E3B',
    bg2: '#059669',
    bg3: '#0B1320',
    accent: '#FBBF24',
    highlight: '#6EE7B7',
  },
  'ghibli-sky': {
    bg1: '#0C4A6E',
    bg2: '#0284C7',
    bg3: '#065F46',
    accent: '#FEF3C7',
    highlight: '#34D399',
  },
  anime: {
    bg1: '#164E63',
    bg2: '#0891B2',
    bg3: '#1E1B4B',
    accent: '#FFD600',
    highlight: '#FF2E4C',
  },
  console: {
    bg1: '#1E1B4B',
    bg2: '#4338CA',
    bg3: '#0F172A',
    accent: '#00E5FF',
    highlight: '#FF2E4C',
  },
  tech: {
    bg1: '#3B0764',
    bg2: '#7C3AED',
    bg3: '#090D16',
    accent: '#00E5FF',
    highlight: '#FFD600',
  },
};

function resolveArtVariant(coverArtKey: string | undefined, category: Category): ArtVariantKey {
  if (coverArtKey) {
    const normalized = coverArtKey.toLowerCase();
    if (normalized in ART_THEMES) {
      return normalized as ArtVariantKey;
    }
    if (normalized.includes('dino') || normalized.includes('vice')) return 'dino-survival';
    if (normalized.includes('spider')) return 'spider';
    if (normalized.includes('bat') || normalized.includes('gotham')) return 'batman';
    if (normalized.includes('manga') || normalized.includes('piece')) return 'manga-sea';
    if (normalized.includes('anime') || normalized.includes('frieren')) return 'anime';
    if (normalized.includes('console') || normalized.includes('portat')) return 'console';
    if (normalized.includes('rpg') || normalized.includes('metaphor')) return 'rpg-quest';
    if (normalized.includes('andor') || normalized.includes('rebel')) return 'andor-rebel';
    if (normalized.includes('ghibli')) return 'ghibli-sky';
    if (normalized.includes('cinema') || normalized.includes('duna')) return 'cinema';
    if (normalized.includes('tech') || normalized.includes('chip')) return 'tech';
    if (normalized.includes('game')) return 'gamepad';
  }

  switch (category) {
    case 'GAMES':
      return 'gamepad';
    case 'COMICS':
      return 'spider';
    case 'CINEMA':
      return 'cinema';
    case 'ANIMES':
      return 'anime';
    case 'TECH':
      return 'tech';
    default:
      return 'gamepad';
  }
}

function renderArtworkScene(variant: ArtVariantKey, theme: ArtTheme, compact: boolean) {
  const showPlate = !compact;

  switch (variant) {
    case 'dino-survival':
      return (
        <>
          {/* Grade tática de radar */}
          <g stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="2">
            <circle cx="320" cy="180" r="145" fill="none" />
            <circle cx="320" cy="180" r="92" fill="none" />
            <line x1="120" y1="180" x2="520" y2="180" />
            <line x1="320" y1="20" x2="320" y2="340" />
          </g>
          {/* Explosão HQ de fundo */}
          <polygon
            points="320,26 356,92 434,62 396,130 478,168 398,208 432,276 354,248 320,322 286,248 208,276 242,208 162,168 244,130 206,62 284,92"
            fill={theme.accent}
            stroke="#111111"
            strokeWidth="6"
          />
          {/* Escudo triangular de contenção + marcas de garra */}
          <polygon
            points="320,66 426,250 214,250"
            fill="#FFFDF5"
            stroke="#111111"
            strokeWidth="7"
            strokeLinejoin="round"
          />
          <polygon
            points="320,96 398,232 242,232"
            fill="#E11D48"
            stroke="#111111"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          {/* Três cortes diagonais estilo HQ */}
          <path
            d="M250 112 L344 256 M294 94 L388 238 M218 148 L302 264"
            stroke="#111111"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M250 112 L344 256 M294 94 L388 238 M218 148 L302 264"
            stroke="#FFD600"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          {showPlate && (
            <g transform="translate(244, 18) rotate(-3)">
              <rect width="152" height="40" rx="8" fill="#111111" stroke="#FFD600" strokeWidth="4" />
              <text
                x="76"
                y="28"
                textAnchor="middle"
                fontFamily="var(--font-display), Impact, sans-serif"
                fontSize="25"
                letterSpacing="1.5"
                fill="#FFD600"
              >
                SURVIVAL!
              </text>
            </g>
          )}
        </>
      );

    case 'gamepad':
      return (
        <>
          <circle cx="320" cy="176" r="126" fill={theme.accent} stroke="#111111" strokeWidth="6" />
          <line x1="176" y1="212" x2="464" y2="212" stroke="#E11D48" strokeWidth="10" />
          <line x1="196" y1="238" x2="444" y2="238" stroke="#E11D48" strokeWidth="8" />
          <g transform="translate(0, 6) rotate(-5 320 180)">
            <path
              d="M196 130 C162 130 138 188 148 248 C156 292 200 302 228 262 L258 224 H382 L412 262 C440 302 484 292 492 248 C502 188 478 130 444 130 Z"
              fill="#FFFDF5"
              stroke="#111111"
              strokeWidth="7"
              strokeLinejoin="round"
            />
            {/* D-Pad */}
            <path
              d="M214 162 H238 V186 H262 V210 H238 V234 H214 V210 H190 V186 H214 Z"
              fill="#111111"
            />
            {/* Botões Pop-Art */}
            <circle cx="404" cy="170" r="14" fill="#E11D48" stroke="#111111" strokeWidth="4" />
            <circle cx="434" cy="198" r="14" fill="#00E5FF" stroke="#111111" strokeWidth="4" />
            <circle cx="404" cy="226" r="14" fill="#FFD600" stroke="#111111" strokeWidth="4" />
            <circle cx="374" cy="198" r="14" fill="#059669" stroke="#111111" strokeWidth="4" />
          </g>
          {showPlate && (
            <g transform="translate(248, 22) rotate(-4)">
              <rect width="144" height="42" rx="8" fill="#E11D48" stroke="#111111" strokeWidth="4.5" />
              <text
                x="72"
                y="29"
                textAnchor="middle"
                fontFamily="var(--font-display), Impact, sans-serif"
                fontSize="26"
                letterSpacing="1.5"
                fill="#FFFDF5"
              >
                CRIT HIT!
              </text>
            </g>
          )}
        </>
      );

    case 'rpg-quest':
      return (
        <>
          {/* Rosa dos ventos / brasão tático */}
          <polygon
            points="320,24 352,134 466,180 352,226 320,336 288,226 174,180 288,134"
            fill={theme.accent}
            stroke="#111111"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <circle cx="320" cy="180" r="82" fill="#1E1B4B" stroke="#111111" strokeWidth="6" />
          {/* Espada vertical estilizada */}
          <path
            d="M320 68 L344 108 L334 230 H306 L296 108 Z"
            fill="#FFFDF5"
            stroke="#111111"
            strokeWidth="5.5"
            strokeLinejoin="round"
          />
          <line x1="320" y1="74" x2="320" y2="226" stroke="#A78BFA" strokeWidth="4" />
          <rect x="266" y="224" width="108" height="20" rx="6" fill="#FBBF24" stroke="#111111" strokeWidth="5" />
          <rect x="308" y="244" width="24" height="46" rx="4" fill="#E11D48" stroke="#111111" strokeWidth="5" />
          <circle cx="320" cy="296" r="14" fill="#FBBF24" stroke="#111111" strokeWidth="5" />
          {showPlate && (
            <g transform="translate(252, 18) rotate(3)">
              <rect width="136" height="40" rx="8" fill="#FFD600" stroke="#111111" strokeWidth="4.5" />
              <text
                x="68"
                y="28"
                textAnchor="middle"
                fontFamily="var(--font-display), Impact, sans-serif"
                fontSize="25"
                letterSpacing="1.5"
                fill="#111111"
              >
                REVIEW!
              </text>
            </g>
          )}
        </>
      );

    case 'spider':
      return (
        <>
          {/* Teia geométrica radial */}
          <g stroke="#111111" strokeWidth="3.5" strokeOpacity="0.32" fill="none">
            <line x1="320" y1="0" x2="320" y2="360" />
            <line x1="0" y1="180" x2="640" y2="180" />
            <line x1="90" y1="0" x2="550" y2="360" />
            <line x1="550" y1="0" x2="90" y2="360" />
            <circle cx="320" cy="180" r="82" />
            <circle cx="320" cy="180" r="154" />
          </g>
          <polygon
            points="320,18 358,92 448,64 408,140 500,180 408,220 448,296 358,268 320,342 282,268 192,296 232,220 140,180 232,140 192,64 282,92"
            fill={theme.accent}
            stroke="#111111"
            strokeWidth="6"
          />
          <ellipse cx="320" cy="180" rx="94" ry="110" fill="#E11D48" stroke="#111111" strokeWidth="7" />
          <path
            d="M320 70 V290 M226 180 H414 M254 108 Q320 154 386 108 M250 252 Q320 208 390 252"
            stroke="#111111"
            strokeWidth="4"
            fill="none"
          />
          <path d="M248 156 Q284 144 304 192 Q264 208 248 156 Z" fill="#FFFDF5" stroke="#111111" strokeWidth="7" />
          <path d="M392 156 Q356 144 336 192 Q376 208 392 156 Z" fill="#FFFDF5" stroke="#111111" strokeWidth="7" />
          {showPlate && (
            <g transform="translate(252, 20) rotate(4)">
              <rect width="136" height="40" rx="8" fill="#00E5FF" stroke="#111111" strokeWidth="4.5" />
              <text
                x="68"
                y="28"
                textAnchor="middle"
                fontFamily="var(--font-display), Impact, sans-serif"
                fontSize="26"
                letterSpacing="1.5"
                fill="#111111"
              >
                THWIP!
              </text>
            </g>
          )}
        </>
      );

    case 'batman':
      return (
        <>
          {/* Prédios angulares de Gotham */}
          <g fill="#09090B" stroke="#111111" strokeWidth="4">
            <rect x="28" y="190" width="76" height="170" />
            <rect x="114" y="140" width="66" height="220" />
            <rect x="462" y="150" width="64" height="210" />
            <rect x="536" y="185" width="78" height="175" />
          </g>
          {/* Holofote dourado */}
          <circle cx="320" cy="176" r="126" fill={theme.accent} stroke="#111111" strokeWidth="7" />
          <path
            d="M320 116 L334 146 L348 116 C372 146 410 148 436 132 C422 182 392 218 364 220 C348 222 334 232 320 256 C306 232 292 222 276 220 C248 218 218 182 204 132 C230 148 268 146 292 116 L306 146 Z"
            fill="#111111"
            stroke="#111111"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          {showPlate && (
            <g transform="translate(243, 294) rotate(-3)">
              <rect width="154" height="40" rx="8" fill="#111111" stroke="#FFD600" strokeWidth="4" />
              <text
                x="77"
                y="28"
                textAnchor="middle"
                fontFamily="var(--font-display), Impact, sans-serif"
                fontSize="25"
                letterSpacing="1.5"
                fill="#FFD600"
              >
                GOTHAM!
              </text>
            </g>
          )}
        </>
      );

    case 'manga-sea':
      return (
        <>
          {/* Sol de horizonte mangá */}
          <circle cx="320" cy="166" r="112" fill={theme.accent} stroke="#111111" strokeWidth="6" />
          {/* Ondas estilizadas em camadas */}
          <path
            d="M0 242 Q80 206 160 242 T320 242 T480 242 T640 242 V360 H0 Z"
            fill="#0E7490"
            stroke="#111111"
            strokeWidth="6"
          />
          <path
            d="M0 284 Q90 254 180 284 T360 284 T540 284 T640 284 V360 H0 Z"
            fill="#0F172A"
            stroke="#111111"
            strokeWidth="6"
          />
          {/* Vela de navio + bússola */}
          <path
            d="M272 240 L318 76 L402 224 Q336 206 272 240 Z"
            fill="#FFFDF5"
            stroke="#111111"
            strokeWidth="6.5"
            strokeLinejoin="round"
          />
          <line x1="318" y1="68" x2="318" y2="246" stroke="#111111" strokeWidth="8" />
          <path d="M236 238 H418 L394 274 H260 Z" fill="#B45309" stroke="#111111" strokeWidth="6" />
          {showPlate && (
            <g transform="translate(248, 20) rotate(-3)">
              <rect width="144" height="40" rx="8" fill="#FFFDF5" stroke="#111111" strokeWidth="4.5" />
              <text
                x="72"
                y="28"
                textAnchor="middle"
                fontFamily="var(--font-display), Impact, sans-serif"
                fontSize="25"
                letterSpacing="1.5"
                fill="#111111"
              >
                MANGA!
              </text>
            </g>
          )}
        </>
      );

    case 'cinema':
      return (
        <>
          <circle cx="320" cy="180" r="128" fill="#E11D48" stroke="#111111" strokeWidth="7" />
          <g transform="translate(174, 94) rotate(-5)">
            <rect x="0" y="48" width="292" height="162" rx="14" fill="#111111" stroke="#111111" strokeWidth="6" />
            <rect x="0" y="6" width="292" height="46" rx="8" fill="#FFFDF5" stroke="#111111" strokeWidth="6" />
            <path d="M36 6 L64 52 M100 6 L128 52 M164 6 L192 52 M228 6 L256 52" stroke="#111111" strokeWidth="13" />
            <text
              x="146"
              y="148"
              textAnchor="middle"
              fontFamily="var(--font-display), Impact, sans-serif"
              fontSize="46"
              letterSpacing="2"
              fill="#FFD600"
            >
              TAKE 1!
            </text>
            {showPlate && (
              <text
                x="146"
                y="184"
                textAnchor="middle"
                fontFamily="var(--font-mono), monospace"
                fontSize="15"
                fontWeight="700"
                fill="#34D399"
              >
                IMAX 70MM
              </text>
            )}
          </g>
        </>
      );

    case 'andor-rebel':
      return (
        <>
          {/* Faixas de película lateral */}
          <g fill="#111111" fillOpacity="0.55">
            <rect x="20" y="18" width="44" height="324" rx="6" />
            <rect x="576" y="18" width="44" height="324" rx="6" />
          </g>
          <g fill="#FEF08A">
            {[42, 102, 162, 222, 282].map((y) => (
              <g key={y}>
                <rect x="32" y={y} width="20" height="30" rx="3" />
                <rect x="588" y={y} width="20" height="30" rx="3" />
              </g>
            ))}
          </g>
          {/* Emblema orbital sci-fi */}
          <circle cx="320" cy="180" r="114" fill="#0B1320" stroke="#FBBF24" strokeWidth="6" />
          <ellipse
            cx="320"
            cy="180"
            rx="168"
            ry="44"
            transform="rotate(-18 320 180)"
            fill="none"
            stroke="#34D399"
            strokeWidth="7"
          />
          <polygon
            points="320,96 346,166 416,180 346,194 320,264 294,194 224,180 294,166"
            fill="#FBBF24"
            stroke="#111111"
            strokeWidth="5.5"
          />
          {showPlate && (
            <g transform="translate(248, 20) rotate(3)">
              <rect width="144" height="40" rx="8" fill="#FBBF24" stroke="#111111" strokeWidth="4.5" />
              <text
                x="72"
                y="28"
                textAnchor="middle"
                fontFamily="var(--font-display), Impact, sans-serif"
                fontSize="25"
                letterSpacing="1.5"
                fill="#111111"
              >
                SERIES!
              </text>
            </g>
          )}
        </>
      );

    case 'ghibli-sky':
      return (
        <>
          {/* Nuvens pop-art */}
          <g fill="#FFFDF5" stroke="#111111" strokeWidth="6">
            <circle cx="152" cy="252" r="54" />
            <circle cx="218" cy="240" r="68" />
            <circle cx="294" cy="258" r="56" />
            <circle cx="436" cy="246" r="62" />
            <circle cx="508" cy="258" r="52" />
            <rect x="120" y="246" width="420" height="72" stroke="none" />
          </g>
          {/* Sol quente e torre flutuante */}
          <circle cx="320" cy="148" r="88" fill="#FFD600" stroke="#111111" strokeWidth="6" />
          <path
            d="M274 220 L286 116 L320 84 L354 116 L366 220 Z"
            fill="#047857"
            stroke="#111111"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <rect x="306" y="136" width="28" height="42" rx="14" fill="#FFFDF5" stroke="#111111" strokeWidth="4.5" />
          {showPlate && (
            <g transform="translate(248, 20) rotate(3)">
              <rect width="144" height="40" rx="8" fill="#111111" stroke="#FFFDF5" strokeWidth="4" />
              <text
                x="72"
                y="28"
                textAnchor="middle"
                fontFamily="var(--font-display), Impact, sans-serif"
                fontSize="25"
                letterSpacing="1.5"
                fill="#FFD600"
              >
                4K FILM!
              </text>
            </g>
          )}
        </>
      );

    case 'anime':
      return (
        <>
          <polygon
            points="320,16 356,112 456,48 402,142 522,162 412,212 496,288 378,256 350,348 308,258 202,312 252,214 134,190 248,144 178,54 290,116"
            fill="#00E5FF"
            stroke="#111111"
            strokeWidth="6"
          />
          {/* Corte luminoso de lâmina */}
          <path
            d="M148 308 L452 48 L478 68 L184 326 Z"
            fill="#FFFDF5"
            stroke="#111111"
            strokeWidth="7"
            strokeLinejoin="round"
          />
          <path d="M208 266 L436 70" stroke="#FFD600" strokeWidth="6" />
          <ellipse
            cx="196"
            cy="276"
            rx="26"
            ry="12"
            transform="rotate(-42 196 276)"
            fill="#FFD600"
            stroke="#111111"
            strokeWidth="5.5"
          />
          <path d="M128 334 L184 286" stroke="#E11D48" strokeWidth="16" strokeLinecap="round" />
          {showPlate && (
            <g transform="translate(246, 286) rotate(-4)">
              <rect width="148" height="42" rx="8" fill="#FFD600" stroke="#111111" strokeWidth="4.5" />
              <text
                x="74"
                y="29"
                textAnchor="middle"
                fontFamily="var(--font-display), Impact, sans-serif"
                fontSize="27"
                letterSpacing="1.5"
                fill="#111111"
              >
                SLASH!!
              </text>
            </g>
          )}
        </>
      );

    case 'console':
      return (
        <>
          <g transform="translate(0, 6) rotate(-3 320 180)">
            <rect x="92" y="72" width="456" height="216" rx="38" fill="#111111" stroke="#111111" strokeWidth="7" />
            <path
              d="M92 110 C92 86 112 72 138 72 H174 V288 H138 C112 288 92 272 92 250 Z"
              fill="#00E5FF"
              stroke="#111111"
              strokeWidth="6"
            />
            <circle cx="134" cy="144" r="18" fill="#111111" />
            <circle cx="134" cy="212" r="12" fill="#FFFDF5" stroke="#111111" strokeWidth="4" />
            <path
              d="M466 72 H502 C528 72 548 86 548 110 V250 C548 272 528 288 502 288 H466 Z"
              fill="#E11D48"
              stroke="#111111"
              strokeWidth="6"
            />
            <circle cx="506" cy="208" r="18" fill="#111111" />
            <circle cx="506" cy="140" r="12" fill="#FFD600" stroke="#111111" strokeWidth="4" />
            <rect x="192" y="92" width="256" height="176" rx="14" fill="#FFD600" stroke="#111111" strokeWidth="6" />
            <text
              x="320"
              y="184"
              textAnchor="middle"
              fontFamily="var(--font-display), Impact, sans-serif"
              fontSize="56"
              letterSpacing="2"
              fill="#111111"
            >
              60 FPS!
            </text>
            {showPlate && (
              <text
                x="320"
                y="224"
                textAnchor="middle"
                fontFamily="var(--font-mono), monospace"
                fontSize="16"
                fontWeight="800"
                fill="#BE123C"
              >
                HANDHELD 15W
              </text>
            )}
          </g>
        </>
      );

    case 'tech':
      return (
        <>
          {/* Trilhas de circuito */}
          <g stroke="#FFD600" strokeWidth="7" strokeLinecap="round">
            <line x1="112" y1="122" x2="184" y2="122" />
            <line x1="112" y1="180" x2="184" y2="180" />
            <line x1="112" y1="238" x2="184" y2="238" />
            <line x1="456" y1="122" x2="528" y2="122" />
            <line x1="456" y1="180" x2="528" y2="180" />
            <line x1="456" y1="238" x2="528" y2="238" />
            <line x1="256" y1="28" x2="256" y2="66" />
            <line x1="320" y1="28" x2="320" y2="66" />
            <line x1="384" y1="28" x2="384" y2="66" />
            <line x1="256" y1="294" x2="256" y2="332" />
            <line x1="320" y1="294" x2="320" y2="332" />
            <line x1="384" y1="294" x2="384" y2="332" />
          </g>
          <rect x="184" y="66" width="272" height="228" rx="28" fill="#111111" stroke="#00E5FF" strokeWidth="7" />
          <rect x="212" y="94" width="216" height="172" rx="16" fill="#6D28D9" stroke="#111111" strokeWidth="5.5" />
          <text
            x="320"
            y="186"
            textAnchor="middle"
            fontFamily="var(--font-display), Impact, sans-serif"
            fontSize="54"
            letterSpacing="2"
            fill="#FFD600"
          >
            AI GPU!
          </text>
          {showPlate && (
            <text
              x="320"
              y="224"
              textAnchor="middle"
              fontFamily="var(--font-mono), monospace"
              fontSize="16"
              fontWeight="800"
              fill="#34D399"
            >
              NEURAL RENDER
            </text>
          )}
        </>
      );
  }
}

export function EditorialCoverArt({
  coverImageUrl,
  coverArtKey,
  category,
  alt,
  className = '',
  mediaClassName = '',
  aspectClass = 'aspect-video',
  compact = false,
  decorative = false,
  fit = 'cover',
  fullBleed = false,
}: EditorialCoverArtProps) {
  const [imageError, setImageError] = useState(false);
  const rawUid = useId();
  const uid = rawUid.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeUrl = getSafeHttpUrl(coverImageUrl);

  const variant = resolveArtVariant(coverArtKey, category);
  const theme = ART_THEMES[variant];

  if (safeUrl && !imageError) {
    if (fullBleed) {
      return (
        <div
          className={`relative overflow-hidden bg-[var(--chrome-bg)] ${aspectClass} ${className}`}
        >
          {/* Fundo ambiente desfocado preenchendo 100% da altura vertical sem faixas pretas */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={safeUrl}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
          />
          <div className="relative z-10 flex h-[56%] w-full items-center justify-center px-3 pt-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={safeUrl}
              alt={decorative ? '' : alt}
              aria-hidden={decorative ? 'true' : undefined}
              onError={() => setImageError(true)}
              className={`editorial-cover-media max-h-full w-full rounded-xl object-cover object-center shadow-2xl ${mediaClassName}`}
              loading="lazy"
            />
          </div>
        </div>
      );
    }

    return (
      <div className={`relative overflow-hidden bg-[var(--chrome-bg)] ${aspectClass} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={safeUrl}
          alt={decorative ? '' : alt}
          aria-hidden={decorative ? 'true' : undefined}
          onError={() => setImageError(true)}
          className={`editorial-cover-media h-full w-full object-cover object-center ${mediaClassName}`}
          loading="lazy"
        />
      </div>
    );
  }

  if (fullBleed) {
    return (
      <div
        className={`relative overflow-hidden ${aspectClass} ${className}`}
        style={{
          background: `radial-gradient(circle at 50% 34%, ${theme.bg2} 0%, ${theme.bg1} 52%, ${theme.bg3} 100%)`,
        }}
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : alt}
        aria-hidden={decorative ? 'true' : undefined}
      >
        {/* Fundo contínuo HQ em 100% da altura do card (sunburst + halftone) */}
        <div aria-hidden="true" className="comic-sunburst pointer-events-none absolute inset-0 opacity-75" />
        <div aria-hidden="true" className="bg-halftone-overlay pointer-events-none absolute inset-0 opacity-65" />

        {/* Elemento gráfico principal enquadrado na metade superior sem corte */}
        <div className="relative z-10 flex h-[56%] w-full items-center justify-center pt-11">
          <svg
            viewBox="0 0 640 360"
            preserveAspectRatio="xMidYMid meet"
            className={`editorial-cover-media block h-full w-full ${mediaClassName}`}
            aria-hidden="true"
            focusable="false"
          >
            {renderArtworkScene(variant, theme, compact)}
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${aspectClass} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${theme.bg1} 0%, ${theme.bg2} 55%, ${theme.bg3} 100%)`,
      }}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : alt}
      aria-hidden={decorative ? 'true' : undefined}
    >
      <svg
        viewBox="0 0 640 360"
        preserveAspectRatio={fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'}
        className={`editorial-cover-media block h-full w-full ${mediaClassName}`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={`bg-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.bg1} />
            <stop offset="55%" stopColor={theme.bg2} />
            <stop offset="100%" stopColor={theme.bg3} />
          </linearGradient>
          <pattern id={`dots-${uid}`} width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="3.5" cy="3.5" r="1.7" fill="#111111" fillOpacity="0.24" />
          </pattern>
        </defs>

        <rect width="640" height="360" fill={`url(#bg-${uid})`} />

        {/* Raios comic-sunburst vetoriais leves centrados no quadro */}
        <g fill="#FFFFFF" fillOpacity="0.09">
          <polygon points="320,180 260,0 380,0" />
          <polygon points="320,180 640,40 640,140" />
          <polygon points="320,180 640,260 540,360" />
          <polygon points="320,180 380,360 260,360" />
          <polygon points="320,180 100,360 0,260" />
          <polygon points="320,180 0,140 0,40" />
        </g>

        <rect width="640" height="360" fill={`url(#dots-${uid})`} />

        {/* Faixa diagonal pop-art de profundidade */}
        <polygon points="0,285 640,185 640,360 0,360" fill="#111111" fillOpacity="0.24" />

        {renderArtworkScene(variant, theme, compact)}
      </svg>
    </div>
  );
}

export type { AvatarVariantKey };

interface EditorialAvatarProps {
  authorName: string;
  variant?: AvatarVariantKey;
  sizeClass?: string;
}

export function EditorialAvatar({
  authorName,
  variant,
  sizeClass = 'h-10 w-10',
}: EditorialAvatarProps) {
  const resolved = variant ?? resolveAuthorAvatar(authorName);
  const rawUid = useId();
  const uid = rawUid.replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full border-2 border-border-strong shadow-hard-sm ${sizeClass}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="block h-full w-full" focusable="false">
        <defs>
          <pattern id={`av-dots-${uid}`} width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.1" fill="#111111" fillOpacity="0.16" />
          </pattern>
        </defs>

        {resolved === 'avatar-byte' && (
          <>
            {/* Colunista Games & Hardware: visor ciano tático + headset gamer */}
            <rect width="100" height="100" fill="#2563EB" />
            <polygon points="50,50 18,0 82,0" fill="#00E5FF" fillOpacity="0.24" />
            <polygon points="50,50 100,26 100,74" fill="#FFD600" fillOpacity="0.22" />
            <rect width="100" height="100" fill={`url(#av-dots-${uid})`} />
            {/* Jaqueta tech */}
            <path d="M14 100 C18 74 34 68 50 68 C66 68 82 74 86 100 Z" fill="#111318" stroke="#111111" strokeWidth="4" />
            <path d="M38 70 L50 86 L62 70" fill="#00E5FF" stroke="#111111" strokeWidth="3.5" strokeLinejoin="round" />
            {/* Arco do headset */}
            <path d="M22 48 C22 20 78 20 78 48" fill="none" stroke="#111111" strokeWidth="8" strokeLinecap="round" />
            <path d="M24 46 C24 23 76 23 76 46" fill="none" stroke="#FFD600" strokeWidth="3.5" strokeLinecap="round" />
            {/* Fones laterais */}
            <rect x="16" y="40" width="11" height="22" rx="5" fill="#E11D48" stroke="#111111" strokeWidth="3.5" />
            <rect x="73" y="40" width="11" height="22" rx="5" fill="#E11D48" stroke="#111111" strokeWidth="3.5" />
            {/* Rosto HQ */}
            <circle cx="50" cy="48" r="22" fill="#FDE6C4" stroke="#111111" strokeWidth="4" />
            {/* Cabelo geométrico */}
            <path d="M28 42 C30 24 70 24 72 42 C64 34 56 32 48 34 C40 32 33 36 28 42 Z" fill="#111111" />
            {/* Visor neon ciano */}
            <rect x="30" y="42" width="40" height="12" rx="5" fill="#111111" />
            <rect x="34" y="45" width="32" height="6" rx="3" fill="#00E5FF" />
            <line x1="40" y1="46" x2="46" y2="50" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            {/* Microfone + sorriso */}
            <path d="M22 58 Q32 66 43 62" fill="none" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
            <circle cx="44" cy="62" r="2.5" fill="#FFD600" stroke="#111111" strokeWidth="1.5" />
            <path d="M44 59 Q51 64 58 59" fill="none" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {resolved === 'avatar-tinta' && (
          <>
            {/* Colunista Quadrinhos & Mangás: boina nanquim, óculos redondos e bico de pena */}
            <rect width="100" height="100" fill="#FFD600" />
            <polygon points="0,0 56,0 24,100 0,100" fill="#F59E0B" fillOpacity="0.45" />
            <rect width="100" height="100" fill={`url(#av-dots-${uid})`} />
            {/* Caneta nanquim / stylus atrás da orelha */}
            <path d="M68 22 L86 8 L90 13 L72 28 Z" fill="#FFFDF5" stroke="#111111" strokeWidth="3" strokeLinejoin="round" />
            <path d="M84 9 L91 6 L88 14 Z" fill="#111111" />
            {/* Camisa + lenço vermelho */}
            <path d="M14 100 C18 75 34 69 50 69 C66 69 82 75 86 100 Z" fill="#FFFDF5" stroke="#111111" strokeWidth="4" />
            <polygon points="34,70 66,70 50,88" fill="#E11D48" stroke="#111111" strokeWidth="3.5" strokeLinejoin="round" />
            {/* Rosto */}
            <circle cx="50" cy="49" r="22" fill="#F4C7A1" stroke="#111111" strokeWidth="4" />
            {/* Boina estilosa de quadrinista */}
            <path d="M22 39 C20 18 74 14 78 36 C64 31 36 33 22 39 Z" fill="#B45309" stroke="#111111" strokeWidth="4" strokeLinejoin="round" />
            <path d="M48 18 L52 12" stroke="#111111" strokeWidth="4" strokeLinecap="round" />
            {/* Óculos redondos de tinta */}
            <circle cx="40" cy="48" r="8" fill="#FFFDF5" stroke="#111111" strokeWidth="3.5" />
            <circle cx="60" cy="48" r="8" fill="#FFFDF5" stroke="#111111" strokeWidth="3.5" />
            <line x1="48" y1="48" x2="52" y2="48" stroke="#111111" strokeWidth="3.5" />
            <circle cx="40" cy="48" r="2.8" fill="#111111" />
            <circle cx="60" cy="48" r="2.8" fill="#111111" />
            {/* Expressão confiante */}
            <path d="M42 61 Q50 66 59 60" fill="none" stroke="#111111" strokeWidth="3.2" strokeLinecap="round" />
          </>
        )}

        {resolved === 'avatar-sakuga' && (
          <>
            {/* Colunista Animes: linhas de velocidade, cabelo espetado mangá e cachecol alto */}
            <rect width="100" height="100" fill="#0891B2" />
            <g stroke="#FFFFFF" strokeOpacity="0.28" strokeWidth="2.5">
              <line x1="0" y1="16" x2="36" y2="44" />
              <line x1="100" y1="14" x2="64" y2="44" />
              <line x1="0" y1="84" x2="34" y2="60" />
              <line x1="100" y1="84" x2="66" y2="60" />
            </g>
            <rect width="100" height="100" fill={`url(#av-dots-${uid})`} />
            {/* Ombros + cachecol rubro */}
            <path d="M14 100 C18 76 34 70 50 70 C66 70 82 76 86 100 Z" fill="#1E1B4B" stroke="#111111" strokeWidth="4" />
            <path d="M28 66 Q50 76 72 66 L76 82 Q50 92 24 82 Z" fill="#E11D48" stroke="#111111" strokeWidth="3.8" strokeLinejoin="round" />
            {/* Rosto mangá */}
            <path d="M29 46 C29 28 71 28 71 46 C71 62 60 69 50 69 C40 69 29 62 29 46 Z" fill="#FFF1E6" stroke="#111111" strokeWidth="4" />
            {/* Cabelo espetado estilo shonen */}
            <path
              d="M23 44 L18 24 L34 29 L41 12 L53 26 L67 13 L68 30 L83 25 L75 45 L67 34 L56 41 L47 32 L35 41 Z"
              fill="#111111"
              stroke="#111111"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Olhos mangá expressivos com brilho */}
            <ellipse cx="40" cy="49" rx="4.2" ry="5.2" fill="#111111" />
            <ellipse cx="60" cy="49" rx="4.2" ry="5.2" fill="#111111" />
            <circle cx="38.5" cy="47.5" r="1.6" fill="#FFFFFF" />
            <circle cx="58.5" cy="47.5" r="1.6" fill="#FFFFFF" />
            {/* Bandana / detalhe dourado */}
            <path d="M43 59 Q50 64 57 59" fill="none" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {resolved === 'avatar-frame' && (
          <>
            {/* Colunista Cinema & Séries: holofote esmeralda, boné de diretor e óculos clássicos */}
            <rect width="100" height="100" fill="#047857" />
            <polygon points="50,50 0,0 44,0" fill="#FBBF24" fillOpacity="0.28" />
            <polygon points="50,50 100,0 56,0" fill="#34D399" fillOpacity="0.28" />
            <rect width="100" height="100" fill={`url(#av-dots-${uid})`} />
            {/* Blazer editorial + pin de claquete */}
            <path d="M14 100 C18 74 34 68 50 68 C66 68 82 74 86 100 Z" fill="#18181B" stroke="#111111" strokeWidth="4" />
            <polygon points="40,69 50,86 60,69" fill="#FBBF24" stroke="#111111" strokeWidth="3" strokeLinejoin="round" />
            <rect x="62" y="79" width="12" height="10" rx="2" fill="#FFFDF5" stroke="#111111" strokeWidth="2.5" />
            <line x1="62" y1="83" x2="74" y2="83" stroke="#111111" strokeWidth="2.5" />
            {/* Rosto */}
            <circle cx="50" cy="48" r="22" fill="#E8B894" stroke="#111111" strokeWidth="4" />
            {/* Boné de diretor virado */}
            <path d="M26 38 C28 18 72 18 74 38 Z" fill="#111111" stroke="#111111" strokeWidth="3.5" />
            <path d="M24 37 H82 C85 37 86 42 80 42 H26 Z" fill="#FBBF24" stroke="#111111" strokeWidth="3.2" strokeLinejoin="round" />
            {/* Óculos de aro quadrado clássico */}
            <rect x="31" y="43" width="16" height="11" rx="3" fill="#FFFDF5" stroke="#111111" strokeWidth="3.5" />
            <rect x="53" y="43" width="16" height="11" rx="3" fill="#FFFDF5" stroke="#111111" strokeWidth="3.5" />
            <line x1="47" y1="48" x2="53" y2="48" stroke="#111111" strokeWidth="3.5" />
            <circle cx="39" cy="48.5" r="2.6" fill="#111111" />
            <circle cx="61" cy="48.5" r="2.6" fill="#111111" />
            {/* Sorriso sereno */}
            <path d="M43 60 Q50 64 57 60" fill="none" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
      </svg>
    </div>
  );
}

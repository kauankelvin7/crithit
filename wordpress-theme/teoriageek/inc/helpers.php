<?php
/**
 * Teoria Geek — Funções utilitárias, consultas otimizadas ao wp_post_views,
 * extração de notas/metadados legados, contraste WCAG e ícones SVG inline.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Repara sequências mojibake de importações Windows CP850/CP437 (ex.: J├í -> Já, An├®is -> Anéis,
 * espa├ºo -> espaço, p├┤ster -> pôster) apenas em tempo de renderização, sem alterar o banco.
 * Textos UTF-8 limpos retornam imediatamente no fast-path em O(1).
 *
 * @param string $text Texto de entrada.
 * @return string
 */
function teoriageek_fix_mojibake( $text ) {
	$text = (string) $text;
	if ( '' === $text ) {
		return '';
	}

	// Fast-path zero custo para strings UTF-8 limpas (produção).
	if (
		false === strpos( $text, "\xE2\x94\x9C" ) && // ├ (0xC3 em CP850)
		false === strpos( $text, "\xE2\x94\xAC" ) && // ┬ (0xC2 em CP850)
		false === strpos( $text, "\xC3\x94\xC3\x87" ) // ÔÇ (0xE2 0x80 em CP850)
	) {
		return $text;
	}

	static $cp850_to_byte = null;
	if ( null === $cp850_to_byte ) {
		// Tabela oficial completa IBM CP850 (0x80 a 0xFF) -> byte original.
		$cp850_chars = array(
			0x80 => "\u{00C7}", 0x81 => "\u{00FC}", 0x82 => "\u{00E9}", 0x83 => "\u{00E2}",
			0x84 => "\u{00E4}", 0x85 => "\u{00E0}", 0x86 => "\u{00E5}", 0x87 => "\u{00E7}",
			0x88 => "\u{00EA}", 0x89 => "\u{00EB}", 0x8A => "\u{00E8}", 0x8B => "\u{00EF}",
			0x8C => "\u{00EE}", 0x8D => "\u{00EC}", 0x8E => "\u{00C4}", 0x8F => "\u{00C5}",
			0x90 => "\u{00C9}", 0x91 => "\u{00E6}", 0x92 => "\u{00C6}", 0x93 => "\u{00F4}",
			0x94 => "\u{00F6}", 0x95 => "\u{00F2}", 0x96 => "\u{00FB}", 0x97 => "\u{00F9}",
			0x98 => "\u{00FF}", 0x99 => "\u{00D6}", 0x9A => "\u{00DC}", 0x9B => "\u{00F8}",
			0x9C => "\u{00A3}", 0x9D => "\u{00D8}", 0x9E => "\u{00D7}", 0x9F => "\u{0192}",
			0xA0 => "\u{00E1}", 0xA1 => "\u{00ED}", 0xA2 => "\u{00F3}", 0xA3 => "\u{00FA}",
			0xA4 => "\u{00F1}", 0xA5 => "\u{00D1}", 0xA6 => "\u{00AA}", 0xA7 => "\u{00BA}",
			0xA8 => "\u{00BF}", 0xA9 => "\u{00AE}", 0xAA => "\u{00AC}", 0xAB => "\u{00BD}",
			0xAC => "\u{00BC}", 0xAD => "\u{00A1}", 0xAE => "\u{00AB}", 0xAF => "\u{00BB}",
			0xB0 => "\u{2591}", 0xB1 => "\u{2592}", 0xB2 => "\u{2593}", 0xB3 => "\u{2502}",
			0xB4 => "\u{2524}", 0xB5 => "\u{00C1}", 0xB6 => "\u{00C2}", 0xB7 => "\u{00C0}",
			0xB8 => "\u{00A9}", 0xB9 => "\u{2563}", 0xBA => "\u{2551}", 0xBB => "\u{2557}",
			0xBC => "\u{255D}", 0xBD => "\u{00A2}", 0xBE => "\u{00A5}", 0xBF => "\u{2510}",
			0xC0 => "\u{2514}", 0xC1 => "\u{2534}", 0xC2 => "\u{252C}", 0xC3 => "\u{251C}",
			0xC4 => "\u{2500}", 0xC5 => "\u{253C}", 0xC6 => "\u{00E3}", 0xC7 => "\u{00C3}",
			0xC8 => "\u{255A}", 0xC9 => "\u{2554}", 0xCA => "\u{2569}", 0xCB => "\u{2566}",
			0xCC => "\u{2560}", 0xCD => "\u{2550}", 0xCE => "\u{256C}", 0xCF => "\u{00A4}",
			0xD0 => "\u{00F0}", 0xD1 => "\u{00D0}", 0xD2 => "\u{00CA}", 0xD3 => "\u{00CB}",
			0xD4 => "\u{00C8}", 0xD5 => "\u{0131}", 0xD6 => "\u{00CD}", 0xD7 => "\u{00CE}",
			0xD8 => "\u{00CF}", 0xD9 => "\u{2518}", 0xDA => "\u{250C}", 0xDB => "\u{2588}",
			0xDC => "\u{2584}", 0xDD => "\u{00A6}", 0xDE => "\u{00CC}", 0xDF => "\u{2580}",
			0xE0 => "\u{00D3}", 0xE1 => "\u{00DF}", 0xE2 => "\u{00D4}", 0xE3 => "\u{00D2}",
			0xE4 => "\u{00F5}", 0xE5 => "\u{00D5}", 0xE6 => "\u{00B5}", 0xE7 => "\u{00FE}",
			0xE8 => "\u{00DE}", 0xE9 => "\u{00DA}", 0xEA => "\u{00DB}", 0xEB => "\u{00D9}",
			0xEC => "\u{00FD}", 0xED => "\u{00DD}", 0xEE => "\u{00AF}", 0xEF => "\u{00B4}",
			0xF0 => "\u{00AD}", 0xF1 => "\u{00B1}", 0xF2 => "\u{2017}", 0xF3 => "\u{00BE}",
			0xF4 => "\u{00B6}", 0xF5 => "\u{00A7}", 0xF6 => "\u{00F7}", 0xF7 => "\u{00B8}",
			0xF8 => "\u{00B0}", 0xF9 => "\u{00A8}", 0xFA => "\u{00B7}", 0xFB => "\u{00B9}",
			0xFC => "\u{00B3}", 0xFD => "\u{00B2}", 0xFE => "\u{25A0}", 0xFF => "\u{00A0}",
		);
		$cp850_to_byte = array();
		foreach ( $cp850_chars as $byte_val => $utf8_char ) {
			$cp850_to_byte[ $utf8_char ] = chr( $byte_val );
		}
	}

	return (string) preg_replace_callback(
		'/(?:\x{251C}.|\x{252C}.|\x{00D4}\x{00C7}.)/u',
		static function ( $m ) use ( $cp850_to_byte ) {
			$chars   = preg_split( '//u', $m[0], -1, PREG_SPLIT_NO_EMPTY );
			$rebuilt = '';
			foreach ( (array) $chars as $ch ) {
				if ( isset( $cp850_to_byte[ $ch ] ) ) {
					$rebuilt .= $cp850_to_byte[ $ch ];
				} elseif ( strlen( $ch ) === 1 ) {
					$rebuilt .= $ch;
				} else {
					return $m[0];
				}
			}
			return mb_check_encoding( $rebuilt, 'UTF-8' ) ? $rebuilt : $m[0];
		},
		$text
	);
}

/**
 * Normaliza título editorial para exibição (reparo UTF-8, entidades HTML5 e respiro em separadores "|").
 *
 * @param string $title Título bruto.
 * @return string
 */
function teoriageek_clean_title( $title ) {
	$clean = html_entity_decode( teoriageek_fix_mojibake( (string) $title ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	// Garante respiro tipográfico ao redor de "|" (ex.: "Na Literatura| Cartas" -> "Na Literatura | Cartas").
	$clean = (string) preg_replace( '/\s*\|\s*/u', ' | ', $clean );
	return trim( (string) preg_replace( '/\s{2,}/u', ' ', $clean ) );
}

/**
 * Remove blocos legados de Ficha Técnica (HTML `.ficha` e texto corrido "Ficha Técnica ...")
 * para impedir poluição nos excerpts e cards da capa/arquivos.
 *
 * @param string $html Conteúdo HTML ou texto bruto.
 * @return string
 */
function teoriageek_strip_ficha_tecnica( $html ) {
	$html = (string) $html;
	if ( '' === $html ) {
		return '';
	}
	// Remove o bloco estrutural `.ficha` completo (incluindo .capa, .col, tabelas e .sinop).
	$clean = (string) preg_replace( '#<div[^>]*class=["\'][^"\']*\bficha\b[^"\']*["\'][^>]*>[\s\S]*?</table>(?:\s*(?:&nbsp;|\xc2\xa0|\s|<p[^>]*>(?:&nbsp;|\xc2\xa0|\s)*</p>)*</div>){1,3}#iu', ' ', $html );
	// Fallback para trechos textuais onde tags já foram removidas antes do filtro.
	$clean = (string) preg_replace( '/Ficha\s+T[eé]cnica[\s\S]{0,650}?(?:Sinopse\s*:|Dispon[ií]vel\s+para\s*:[^\n.]{0,120}|Classifica[cç][aã]o(?:\s+indicativa)?\s*:[^\n.]{0,60})/iu', ' ', $clean );
	return $clean;
}

/**
 * Retorna a lista de "Estreias da Semana" configurada no Personalizador (com cache via Transients API de 30 min).
 *
 * @return array<int, array{title:string,platform:string,date:string}>
 */
function teoriageek_get_weekly_premieres() {
	$cached = get_transient( 'teoriageek_weekly_premieres_v1' );
	if ( is_array( $cached ) ) {
		return $cached;
	}

	$raw   = trim( (string) get_theme_mod( 'teoriageek_premieres_list', '' ) );
	$items = array();
	if ( '' !== $raw ) {
		$lines = preg_split( '/\r\n|\r|\n/', $raw );
		foreach ( (array) $lines as $line ) {
			$line = trim( (string) $line );
			if ( '' === $line ) {
				continue;
			}
			$parts    = array_map( 'trim', explode( '|', $line ) );
			$title    = isset( $parts[0] ) ? sanitize_text_field( $parts[0] ) : '';
			$platform = isset( $parts[1] ) ? sanitize_text_field( $parts[1] ) : '';
			$date     = isset( $parts[2] ) ? sanitize_text_field( $parts[2] ) : '';
			if ( '' !== $title ) {
				$items[] = array(
					'title'    => $title,
					'platform' => $platform,
					'date'     => $date,
				);
			}
			if ( count( $items ) >= 6 ) {
				break;
			}
		}
	}

	set_transient( 'teoriageek_weekly_premieres_v1', $items, 30 * MINUTE_IN_SECONDS );
	return $items;
}

/**
 * Verifica se a requisição atual corresponde à experiência Reels (/reels/).
 *
 * @return bool
 */
function teoriageek_is_reels_page() {
	if ( (int) get_query_var( 'teoriageek_reels', 0 ) === 1 ) {
		return true;
	}
	if ( is_page_template( 'page-reels.php' ) ) {
		return true;
	}
	if ( is_page( 'reels' ) ) {
		return true;
	}
	return false;
}

/**
 * Retorna a URL da página de Reels (com suporte a deep-link por slug).
 *
 * @param string $post_slug Slug opcional.
 * @return string
 */
function teoriageek_get_reels_url( $post_slug = '' ) {
	$base = home_url( '/reels/' );
	if ( '' !== (string) $post_slug ) {
		return add_query_arg( 'post', sanitize_title( (string) $post_slug ), $base );
	}
	return $base;
}

/**
 * Valida estritamente URLs http:// ou https:// (anti-XSS em links externos).
 *
 * @param string $url URL a validar.
 * @return string
 */
function teoriageek_safe_http_url( $url ) {
	$url = trim( (string) $url );
	if ( '' === $url || ! preg_match( '#^https?://#i', $url ) ) {
		return '';
	}
	$sanitized = esc_url_raw( $url, array( 'http', 'https' ) );
	return $sanitized ? $sanitized : '';
}

/**
 * Calcula luminância relativa WCAG 2.1 (0.0 a 1.0) para uma cor hexadecimal.
 *
 * @param string $hex Cor hexadecimal (#RRGGBB).
 * @return float
 */
function teoriageek_hex_luminance( $hex ) {
	$hex = ltrim( (string) $hex, '#' );
	if ( 3 === strlen( $hex ) ) {
		$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
	}
	if ( 6 !== strlen( $hex ) || ! ctype_xdigit( $hex ) ) {
		return 0.15;
	}

	$r = hexdec( substr( $hex, 0, 2 ) ) / 255;
	$g = hexdec( substr( $hex, 2, 2 ) ) / 255;
	$b = hexdec( substr( $hex, 4, 2 ) ) / 255;

	$to_linear = static function ( $c ) {
		return ( $c <= 0.03928 ) ? ( $c / 12.92 ) : pow( ( $c + 0.055 ) / 1.055, 2.4 );
	};

	return 0.2126 * $to_linear( $r ) + 0.7152 * $to_linear( $g ) + 0.0722 * $to_linear( $b );
}

/**
 * Retorna cor de texto de alto contraste (#111111 ou #FFFFFF) sobre um fundo hexadecimal.
 *
 * @param string $hex Cor de fundo.
 * @return string
 */
function teoriageek_contrast_ink( $hex ) {
	return ( teoriageek_hex_luminance( $hex ) > 0.36 ) ? '#111111' : '#FFFFFF';
}

/**
 * Escurece ou clareia uma cor hexadecimal em porcentagem (-100 a +100).
 *
 * @param string $hex     Cor base.
 * @param int    $percent Ajuste percentual.
 * @return string
 */
function teoriageek_adjust_hex( $hex, $percent ) {
	$hex = ltrim( (string) $hex, '#' );
	if ( 3 === strlen( $hex ) ) {
		$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
	}
	if ( 6 !== strlen( $hex ) || ! ctype_xdigit( $hex ) ) {
		return '#116EBF';
	}
	$rgb = array(
		hexdec( substr( $hex, 0, 2 ) ),
		hexdec( substr( $hex, 2, 2 ) ),
		hexdec( substr( $hex, 4, 2 ) ),
	);
	foreach ( $rgb as $i => $val ) {
		if ( $percent >= 0 ) {
			$rgb[ $i ] = (int) round( $val + ( 255 - $val ) * ( $percent / 100 ) );
		} else {
			$rgb[ $i ] = (int) round( $val * ( 1 + ( $percent / 100 ) ) );
		}
		$rgb[ $i ] = max( 0, min( 255, $rgb[ $i ] ) );
	}
	return sprintf( '#%02X%02X%02X', $rgb[0], $rgb[1], $rgb[2] );
}

/**
 * Mapeia os 25+ slugs reais de categorias do Teoria Geek para os tokens semânticos Azul/Amarelo e editorias.
 * Críticas e Reviews recebem o Amarelo de destaque (--tg-accent) com texto escuro (#0B0F19).
 *
 * @param string $slug Slug da categoria.
 * @return array{fill:string,ink:string,accent:string,art:string}
 */
function teoriageek_get_category_style( $slug ) {
	$slug = sanitize_title( (string) $slug );

	$map = array(
		'games'                                           => array( 'fill' => 'var(--tg-primary)', 'ink' => 'var(--ink-on-fill-brand)', 'accent' => 'var(--accent-brand)', 'art' => 'games' ),
		'e-sports-esports'                                => array( 'fill' => 'var(--tg-primary)', 'ink' => 'var(--ink-on-fill-brand)', 'accent' => 'var(--accent-brand)', 'art' => 'games' ),
		'platina-trofeus-ps5-ps4-xbox-nintendo-games-pc'  => array( 'fill' => 'var(--tg-primary)', 'ink' => 'var(--ink-on-fill-brand)', 'accent' => 'var(--accent-brand)', 'art' => 'games' ),
		'hands-on'                                        => array( 'fill' => 'var(--tg-accent)', 'ink' => '#0B0F19', 'accent' => 'var(--accent-brand)', 'art' => 'games' ),
		'retro'                                           => array( 'fill' => 'var(--tg-primary)', 'ink' => 'var(--ink-on-fill-brand)', 'accent' => 'var(--accent-brand)', 'art' => 'games' ),
		'esportes-futebol-games-e-sports-vloley-basquete' => array( 'fill' => 'var(--tg-primary)', 'ink' => 'var(--ink-on-fill-brand)', 'accent' => 'var(--accent-brand)', 'art' => 'games' ),
		'futebol'                                         => array( 'fill' => 'var(--tg-primary)', 'ink' => 'var(--ink-on-fill-brand)', 'accent' => 'var(--accent-brand)', 'art' => 'games' ),
		'outros-esportes'                                 => array( 'fill' => 'var(--tg-primary)', 'ink' => 'var(--ink-on-fill-brand)', 'accent' => 'var(--accent-brand)', 'art' => 'games' ),

		'filmes'                                          => array( 'fill' => 'var(--fill-cinema)', 'ink' => 'var(--ink-on-fill-cinema)', 'accent' => 'var(--accent-cinema)', 'art' => 'cinema' ),
		'series'                                          => array( 'fill' => 'var(--fill-cinema)', 'ink' => 'var(--ink-on-fill-cinema)', 'accent' => 'var(--accent-cinema)', 'art' => 'cinema' ),
		'eventos-shows-festivais'                         => array( 'fill' => 'var(--fill-cinema)', 'ink' => 'var(--ink-on-fill-cinema)', 'accent' => 'var(--accent-cinema)', 'art' => 'cinema' ),

		'animes-mangas'                                   => array( 'fill' => 'var(--fill-animes)', 'ink' => 'var(--ink-on-fill-animes)', 'accent' => 'var(--accent-animes)', 'art' => 'animes' ),
		'animes-e-mangas'                                 => array( 'fill' => 'var(--fill-animes)', 'ink' => 'var(--ink-on-fill-animes)', 'accent' => 'var(--accent-animes)', 'art' => 'animes' ),

		'livros-hqs'                                      => array( 'fill' => 'var(--fill-comics)', 'ink' => 'var(--ink-on-fill-comics)', 'accent' => 'var(--accent-comics)', 'art' => 'comics' ),
		'literatura-e-hqs'                                => array( 'fill' => 'var(--fill-comics)', 'ink' => 'var(--ink-on-fill-comics)', 'accent' => 'var(--accent-comics)', 'art' => 'comics' ),

		'especial-teoria-geek'                            => array( 'fill' => 'var(--fill-tech)', 'ink' => 'var(--ink-on-fill-tech)', 'accent' => 'var(--accent-tech)', 'art' => 'tech' ),
		'especiais'                                       => array( 'fill' => 'var(--fill-tech)', 'ink' => 'var(--ink-on-fill-tech)', 'accent' => 'var(--accent-tech)', 'art' => 'tech' ),
		'perifericos'                                     => array( 'fill' => 'var(--fill-tech)', 'ink' => 'var(--ink-on-fill-tech)', 'accent' => 'var(--accent-tech)', 'art' => 'tech' ),
		'musicas'                                         => array( 'fill' => 'var(--fill-tech)', 'ink' => 'var(--ink-on-fill-tech)', 'accent' => 'var(--accent-tech)', 'art' => 'tech' ),
		'entrevista'                                      => array( 'fill' => 'var(--fill-tech)', 'ink' => 'var(--ink-on-fill-tech)', 'accent' => 'var(--accent-tech)', 'art' => 'tech' ),

		'criticas'                                        => array( 'fill' => 'var(--tg-accent)', 'ink' => '#0B0F19', 'accent' => 'var(--accent-brand)', 'art' => 'cinema' ),
		'reviews'                                         => array( 'fill' => 'var(--tg-accent)', 'ink' => '#0B0F19', 'accent' => 'var(--accent-brand)', 'art' => 'games' ),
	);

	if ( isset( $map[ $slug ] ) ) {
		return $map[ $slug ];
	}

	return array(
		'fill'   => 'var(--tg-primary)',
		'ink'    => 'var(--ink-on-fill-brand)',
		'accent' => 'var(--accent-brand)',
		'art'    => 'games',
	);
}

/**
 * Seleciona a categoria editorial principal do post (respeitando _yoast_wpseo_primary_category quando específico
 * e priorizando editorias temáticas sobre agrupadores genéricos como destaque/noticias/diversos/categorias).
 *
 * @param int $post_id ID do post.
 * @return WP_Term|null
 */
function teoriageek_get_primary_category( $post_id ) {
	$post_id = (int) $post_id;
	$terms   = get_the_category( $post_id );
	if ( empty( $terms ) || is_wp_error( $terms ) ) {
		return null;
	}

	$deprioritize = array( 'destaque', 'noticias', 'diversos', 'categorias', 'uncategorized', 'games-filmes-series-eventos' );

	$yoast_primary_id = (int) get_post_meta( $post_id, '_yoast_wpseo_primary_category', true );
	if ( $yoast_primary_id > 0 ) {
		foreach ( $terms as $term ) {
			if ( (int) $term->term_id === $yoast_primary_id && ! in_array( $term->slug, $deprioritize, true ) ) {
				return $term;
			}
		}
	}

	foreach ( $terms as $term ) {
		if ( ! in_array( $term->slug, $deprioritize, true ) ) {
			return $term;
		}
	}

	return $terms[0];
}

/**
 * Lê de forma segura o array legado `td_post_theme_settings` do tema Newspaper em PHP 8.3 (sem instanciar objetos).
 *
 * @param int $post_id ID do post.
 * @return array<string, mixed>
 */
function teoriageek_get_legacy_td_settings( $post_id ) {
	static $cache = array();
	$post_id      = (int) $post_id;

	if ( isset( $cache[ $post_id ] ) ) {
		return $cache[ $post_id ];
	}

	$raw = get_post_meta( $post_id, 'td_post_theme_settings', true );
	if ( is_array( $raw ) ) {
		$cache[ $post_id ] = $raw;
		return $raw;
	}

	if ( is_string( $raw ) && '' !== $raw && is_serialized( $raw ) ) {
		$parsed = @unserialize( trim( $raw ), array( 'allowed_classes' => false ) );
		if ( is_array( $parsed ) ) {
			$cache[ $post_id ] = $parsed;
			return $parsed;
		}
	}

	$cache[ $post_id ] = array();
	return array();
}

/**
 * Detecta automaticamente o formato editorial do post.
 *
 * @param int $post_id ID do post.
 * @return array{key:string,label:string}
 */
function teoriageek_get_post_format_badge( $post_id ) {
	$post_id  = (int) $post_id;
	$explicit = (string) get_post_meta( $post_id, '_tg_editorial_format', true );
	$labels   = array(
		'noticia'  => __( 'Notícia', 'teoriageek' ),
		'critica'  => __( 'Crítica', 'teoriageek' ),
		'review'   => __( 'Review', 'teoriageek' ),
		'especial' => __( 'Especial', 'teoriageek' ),
	);

	if ( '' !== $explicit && isset( $labels[ $explicit ] ) ) {
		return array(
			'key'   => $explicit,
			'label' => $labels[ $explicit ],
		);
	}

	$cat_criticas  = teoriageek_get_mapped_category_slug( 'criticas' );
	$cat_reviews   = teoriageek_get_mapped_category_slug( 'reviews' );
	$cat_especiais = teoriageek_get_mapped_category_slug( 'especiais' );

	if ( has_category( array_filter( array( $cat_reviews, 'reviews', 'hands-on' ) ), $post_id ) ) {
		return array( 'key' => 'review', 'label' => $labels['review'] );
	}
	if ( has_category( array_filter( array( $cat_criticas, 'criticas' ) ), $post_id ) ) {
		return array( 'key' => 'critica', 'label' => $labels['critica'] );
	}
	if ( has_category( array_filter( array( $cat_especiais, 'especial-teoria-geek', 'especiais', 'entrevista' ) ), $post_id ) ) {
		return array( 'key' => 'especial', 'label' => $labels['especial'] );
	}

	return array( 'key' => 'noticia', 'label' => $labels['noticia'] );
}

/**
 * Extrai detalhes completos de review/crítica (nota 0.0–10.0, critérios de `td_post_theme_settings`,
 * resumo de veredito e selo oficial `selo-teoria-geek-*`).
 *
 * @param int $post_id ID do post.
 * @return array{score:string,criteria:array<int,array{label:string,score:string}>,summary:string}|null
 */
function teoriageek_get_review_details( $post_id ) {
	static $details_cache = array();
	$post_id              = (int) $post_id;

	if ( array_key_exists( $post_id, $details_cache ) ) {
		return $details_cache[ $post_id ];
	}

	// 1. Meta nativa da Ficha Editorial.
	$raw = get_post_meta( $post_id, '_tg_review_score', true );
	if ( '' !== $raw && null !== $raw && is_numeric( str_replace( ',', '.', (string) $raw ) ) ) {
		$num = (float) str_replace( ',', '.', (string) $raw );
		if ( $num >= 0 && $num <= 10 ) {
			$details_cache[ $post_id ] = array(
				'score'    => number_format( $num, 1, '.', '' ),
				'criteria' => array(),
				'summary'  => '',
			);
			return $details_cache[ $post_id ];
		}
	}

	// 2. Metadado legado Newspaper (`td_post_theme_settings`).
	$td = teoriageek_get_legacy_td_settings( $post_id );
	if ( ! empty( $td['has_review'] ) ) {
		$type     = (string) $td['has_review'];
		$rows     = array();
		$criteria = array();

		$source_key = '';
		$multiplier = 1.0;
		if ( 'rate_stars' === $type && ! empty( $td['p_review_stars'] ) && is_array( $td['p_review_stars'] ) ) {
			$source_key = 'p_review_stars';
			$multiplier = 2.0;
		} elseif ( 'rate_point' === $type && ! empty( $td['p_review_points'] ) && is_array( $td['p_review_points'] ) ) {
			$source_key = 'p_review_points';
			$multiplier = 1.0;
		} elseif ( 'rate_percent' === $type && ! empty( $td['p_review_percents'] ) && is_array( $td['p_review_percents'] ) ) {
			$source_key = 'p_review_percents';
			$multiplier = 0.1;
		}

		if ( '' !== $source_key ) {
			foreach ( $td[ $source_key ] as $row ) {
				if ( isset( $row['rate'] ) && is_numeric( $row['rate'] ) ) {
					$val    = max( 0.0, min( 10.0, ( (float) $row['rate'] ) * $multiplier ) );
					$rows[] = $val;
					$desc   = isset( $row['desc'] ) ? sanitize_text_field( (string) $row['desc'] ) : '';
					if ( '' !== $desc ) {
						$criteria[] = array(
							'label' => $desc,
							'score' => number_format( $val, 1, '.', '' ),
						);
					}
				}
			}
		}

		if ( ! empty( $rows ) ) {
			$avg     = max( 0.0, min( 10.0, array_sum( $rows ) / count( $rows ) ) );
			$summary = ! empty( $td['review'] ) && is_string( $td['review'] ) ? wp_strip_all_tags( $td['review'] ) : '';

			$details_cache[ $post_id ] = array(
				'score'    => number_format( $avg, 1, '.', '' ),
				'criteria' => $criteria,
				'summary'  => $summary,
			);
			return $details_cache[ $post_id ];
		}
	}

	// 3. Selo gráfico oficial do Teoria Geek no HTML da matéria.
	$content = (string) get_post_field( 'post_content', $post_id );
	if ( '' !== $content && false !== stripos( $content, 'selo-teoria-geek' ) ) {
		if ( preg_match( '/selo-teoria-geek-[a-z0-9_-]*?-([0-9]{1,2}(?:[.,][0-9])?)\.(?:png|webp|jpe?g)/i', $content, $m ) ) {
			$val = (float) str_replace( ',', '.', $m[1] );
			if ( $val >= 0 && $val <= 10 ) {
				$details_cache[ $post_id ] = array(
					'score'    => number_format( $val, 1, '.', '' ),
					'criteria' => array(),
					'summary'  => '',
				);
				return $details_cache[ $post_id ];
			}
		}
	}

	$details_cache[ $post_id ] = null;
	return null;
}

/**
 * Extrai apenas a nota formatada ("9.0") ou null quando inexistente.
 *
 * @param int $post_id ID do post.
 * @return string|null
 */
function teoriageek_get_post_score( $post_id ) {
	$details = teoriageek_get_review_details( $post_id );
	return $details ? $details['score'] : null;
}

/**
 * Rótulo semântico do veredito editorial para uma nota de 0 a 10.
 *
 * @param float $score Nota numérica.
 * @return string
 */
function teoriageek_get_score_verdict( $score ) {
	$s = (float) $score;
	if ( $s >= 9.5 ) {
		return __( 'Obra-Prima — Obrigatório', 'teoriageek' );
	}
	if ( $s >= 8.5 ) {
		return __( 'Excelente — Recomendadíssimo', 'teoriageek' );
	}
	if ( $s >= 7.5 ) {
		return __( 'Muito Bom — Vale a Pena', 'teoriageek' );
	}
	if ( $s >= 6.0 ) {
		return __( 'Bom — Com Ressalvas', 'teoriageek' );
	}
	if ( $s >= 4.5 ) {
		return __( 'Regular — Mediano', 'teoriageek' );
	}
	return __( 'Abaixo do Esperado', 'teoriageek' );
}

/**
 * Extrai linha fina / lead limpo do post (excerpt -> td_subtitle -> abertura narrativa limpa).
 *
 * @param int $post_id   ID do post.
 * @param int $max_chars Limite de caracteres.
 * @return string
 */
function teoriageek_get_post_lead( $post_id, $max_chars = 220 ) {
	$post_id = (int) $post_id;

	$raw_excerpt = trim( (string) get_post_field( 'post_excerpt', $post_id ) );
	if ( '' !== $raw_excerpt ) {
		$clean = teoriageek_fix_mojibake( teoriageek_strip_ficha_tecnica( $raw_excerpt ) );
		$clean = teoriageek_strip_emojis( html_entity_decode( wp_strip_all_tags( strip_shortcodes( $clean ) ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
		if ( '' !== $clean && 0 !== stripos( $clean, 'Ficha Técnica' ) ) {
			return ( mb_strlen( $clean, 'UTF-8' ) > $max_chars ) ? rtrim( mb_substr( $clean, 0, $max_chars - 1, 'UTF-8' ) ) . '…' : $clean;
		}
	}

	$td = teoriageek_get_legacy_td_settings( $post_id );
	if ( ! empty( $td['td_subtitle'] ) && is_string( $td['td_subtitle'] ) ) {
		$sub = teoriageek_strip_emojis( html_entity_decode( teoriageek_fix_mojibake( wp_strip_all_tags( $td['td_subtitle'] ) ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
		if ( mb_strlen( $sub, 'UTF-8' ) >= 12 ) {
			return ( mb_strlen( $sub, 'UTF-8' ) > $max_chars ) ? rtrim( mb_substr( $sub, 0, $max_chars - 1, 'UTF-8' ) ) . '…' : $sub;
		}
	}

	$bullets = teoriageek_get_post_bullets( $post_id );
	if ( ! empty( $bullets ) ) {
		$joined = implode( ' ', array_slice( $bullets, 0, 2 ) );
		return ( mb_strlen( $joined, 'UTF-8' ) > $max_chars ) ? rtrim( mb_substr( $joined, 0, $max_chars - 1, 'UTF-8' ) ) . '…' : $joined;
	}

	return '';
}

/**
 * Calcula tempo estimado de leitura em minutos (mínimo 1 min).
 *
 * @param int $post_id ID do post.
 * @return int
 */
function teoriageek_get_reading_time( $post_id ) {
	$post_id = (int) $post_id;
	$content = (string) get_post_field( 'post_content', $post_id );
	$plain   = trim( wp_strip_all_tags( strip_shortcodes( $content ) ) );
	if ( '' !== $plain ) {
		$words = count( preg_split( '/\s+/u', $plain, -1, PREG_SPLIT_NO_EMPTY ) );
		return max( 1, (int) ceil( $words / 200 ) );
	}

	$yoast_mins = (int) get_post_meta( $post_id, '_yoast_wpseo_estimated-reading-time-minutes', true );
	return max( 1, $yoast_mins );
}

/**
 * Retorna data relativa amigável em PT-BR.
 *
 * @param int $post_id ID do post.
 * @return string
 */
function teoriageek_get_relative_date( $post_id ) {
	$timestamp = (int) get_post_time( 'U', true, $post_id );
	$now       = time();
	$diff      = max( 0, $now - $timestamp );

	if ( $diff < 60 ) {
		return __( 'Agora', 'teoriageek' );
	}
	if ( $diff < 3600 ) {
		return sprintf( 'Há %d min', (int) floor( $diff / 60 ) );
	}
	if ( $diff < 86400 ) {
		return sprintf( 'Há %dh', (int) floor( $diff / 3600 ) );
	}
	if ( $diff < 7 * 86400 ) {
		$days = (int) floor( $diff / 86400 );
		return ( 1 === $days ) ? 'Ontem' : sprintf( 'Há %d dias', $days );
	}

	return wp_date( 'd M Y', $timestamp );
}

/**
 * Formata contadores numéricos de forma compacta (ex.: 1.4k, 12.8k).
 *
 * @param int $value Valor numérico.
 * @return string
 */
function teoriageek_format_compact( $value ) {
	$n = (int) $value;
	if ( $n >= 1000000 ) {
		return number_format( $n / 1000000, 1, '.', '' ) . 'M';
	}
	if ( $n >= 1000 ) {
		return number_format( $n / 1000, 1, '.', '' ) . 'k';
	}
	return (string) max( 0, $n );
}

/**
 * Verifica com segurança e cache estático se a tabela `wp_post_views` existe no banco atual.
 *
 * @return bool
 */
function teoriageek_has_post_views_table() {
	static $exists = null;
	if ( null !== $exists ) {
		return $exists;
	}

	global $wpdb;
	$table  = $wpdb->prefix . 'post_views';
	$found  = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) );
	$exists = ( $found === $table );
	return $exists;
}

/**
 * Pré-carrega visualizações de múltiplos posts em UMA única query SQL indexada em `wp_post_views`,
 * eliminando consultas N+1 na Home, Sidebar e `/reels/`.
 *
 * @param int[] $post_ids Lista de IDs.
 */
function teoriageek_prime_post_views( $post_ids ) {
	global $teoriageek_views_cache;
	if ( ! is_array( $teoriageek_views_cache ) ) {
		$teoriageek_views_cache = array();
	}

	$ids = array();
	foreach ( (array) $post_ids as $raw_id ) {
		$pid = (int) $raw_id;
		if ( $pid > 0 && ! isset( $teoriageek_views_cache[ $pid ] ) ) {
			$ids[ $pid ] = $pid;
		}
	}
	if ( empty( $ids ) ) {
		return;
	}

	$pvc_map = array();
	if ( teoriageek_has_post_views_table() ) {
		global $wpdb;
		$table        = $wpdb->prefix . 'post_views';
		$placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );
		// Usa o índice coberto `id_type_period_count (id, type, period, count)` em lote.
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT id, SUM(count) AS total_views FROM {$table} WHERE type = 0 AND id IN ({$placeholders}) GROUP BY id", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				array_values( $ids )
			),
			ARRAY_A
		);
		if ( is_array( $rows ) ) {
			foreach ( $rows as $row ) {
				$pvc_map[ (int) $row['id'] ] = (int) $row['total_views'];
			}
		}
	}

	foreach ( $ids as $pid ) {
		$best = isset( $pvc_map[ $pid ] ) ? $pvc_map[ $pid ] : 0;
		foreach ( array( '_tg_views_count', 'post_views_count', 'views', '_post_views_count' ) as $meta_key ) {
			$val = get_post_meta( $pid, $meta_key, true );
			if ( is_numeric( $val ) && (int) $val > $best ) {
				$best = (int) $val;
			}
		}
		$teoriageek_views_cache[ $pid ] = $best;
	}
}

/**
 * Retorna contagem de visualizações de um post (combinando wp_post_views indexado, meta legado e contador próprio).
 *
 * @param int $post_id ID do post.
 * @return int
 */
function teoriageek_get_post_views( $post_id ) {
	global $teoriageek_views_cache;
	if ( ! is_array( $teoriageek_views_cache ) ) {
		$teoriageek_views_cache = array();
	}

	$post_id = (int) $post_id;
	if ( isset( $teoriageek_views_cache[ $post_id ] ) ) {
		return $teoriageek_views_cache[ $post_id ];
	}

	teoriageek_prime_post_views( array( $post_id ) );
	return isset( $teoriageek_views_cache[ $post_id ] ) ? $teoriageek_views_cache[ $post_id ] : 0;
}

/**
 * Incrementa visualizações do post em post_meta próprio sem alterar tabelas de plugins externos.
 *
 * @param int $post_id ID do post.
 * @return int
 */
function teoriageek_increment_post_views( $post_id ) {
	$post_id = (int) $post_id;
	$current = teoriageek_get_post_views( $post_id );
	$next    = $current + 1;
	update_post_meta( $post_id, '_tg_views_count', $next );
	return $next;
}

/**
 * Retorna contagem de curtidas do post.
 *
 * @param int $post_id ID do post.
 * @return int
 */
function teoriageek_get_post_likes( $post_id ) {
	return max( 0, (int) get_post_meta( (int) $post_id, '_tg_likes_count', true ) );
}

/**
 * Remove emojis Unicode de textos da interface.
 *
 * @param string $text Texto de entrada.
 * @return string
 */
function teoriageek_strip_emojis( $text ) {
	$clean = preg_replace( '/[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{FE0F}]/u', '', (string) $text );
	return trim( (string) preg_replace( '/\s+/u', ' ', (string) $clean ) );
}

/**
 * Extrai até 3 pontos-chave do post (Ficha Editorial ou extração limpa de parágrafos narrativos).
 *
 * @param int  $post_id   ID do post.
 * @param bool $only_meta Quando true, retorna apenas pontos explicitamente preenchidos pelo redator.
 * @return string[]
 */
function teoriageek_get_post_bullets( $post_id, $only_meta = false ) {
	$post_id = (int) $post_id;
	$bullets = array();

	for ( $i = 1; $i <= 3; $i++ ) {
		$val = trim( (string) get_post_meta( $post_id, '_tg_bullet_' . $i, true ) );
		if ( '' !== $val ) {
			$bullets[] = teoriageek_strip_emojis( $val );
		}
	}
	if ( ! empty( $bullets ) || $only_meta ) {
		return $bullets;
	}

	$candidates  = array();
	$raw_excerpt = trim( (string) get_post_field( 'post_excerpt', $post_id ) );
	if ( '' !== $raw_excerpt ) {
		$candidates[] = wp_strip_all_tags( strip_shortcodes( $raw_excerpt ) );
	}

	$content       = teoriageek_fix_mojibake( (string) get_post_field( 'post_content', $post_id ) );
	$content_clean = teoriageek_strip_ficha_tecnica( $content );
	$content_clean = preg_replace( '#\[/?[a-zA-Z0-9_-]+[^\]]*\]#', '', (string) $content_clean );

	if ( preg_match_all( '#<p[^>]*>([\s\S]*?)</p>#i', (string) $content_clean, $matches ) ) {
		foreach ( $matches[1] as $p ) {
			$txt = html_entity_decode( wp_strip_all_tags( $p ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
			$txt = teoriageek_strip_emojis( $txt );
			if ( mb_strlen( $txt, 'UTF-8' ) >= 35 && ! preg_match( '/^(quer saber mais|conheça nosso canal|ficha técnica|leia também|título:|desenvolvido por:|publicado por:)/iu', $txt ) ) {
				$candidates[] = $txt;
			}
			if ( count( $candidates ) >= 6 ) {
				break;
			}
		}
	}

	if ( empty( $candidates ) ) {
		$plain = html_entity_decode( wp_strip_all_tags( (string) $content_clean ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		$plain = teoriageek_strip_emojis( $plain );
		if ( mb_strlen( $plain, 'UTF-8' ) > 20 ) {
			$candidates[] = $plain;
		}
	}

	$sentences = array();
	foreach ( $candidates as $block ) {
		$parts = preg_split( '/(?<=[.!?])\s+/u', trim( $block ) );
		foreach ( (array) $parts as $sent ) {
			$sent = trim( (string) $sent );
			if ( mb_strlen( $sent, 'UTF-8' ) >= 28 && ! preg_match( '#^https?://#i', $sent ) && ! preg_match( '/^(ficha técnica|título:|desenvolvido por:)/iu', $sent ) ) {
				if ( mb_strlen( $sent, 'UTF-8' ) > 145 ) {
					$sent = rtrim( mb_substr( $sent, 0, 142, 'UTF-8' ) ) . '…';
				}
				if ( ! in_array( $sent, $sentences, true ) ) {
					$sentences[] = $sent;
				}
			}
			if ( count( $sentences ) >= 3 ) {
				break 2;
			}
		}
	}

	if ( empty( $sentences ) ) {
		$sentences[] = teoriageek_strip_emojis( teoriageek_clean_title( get_the_title( $post_id ) ) );
	}

	return array_slice( $sentences, 0, 3 );
}

/**
 * Gera resumo curto para Reels (até 235 caracteres).
 *
 * @param int $post_id ID do post.
 * @return string
 */
function teoriageek_get_reels_summary( $post_id ) {
	return teoriageek_get_post_lead( $post_id, 235 );
}

/**
 * Retorna dados de fonte externa opcional (Ficha Editorial ou meta legado `td_source` do Newspaper).
 *
 * @param int $post_id ID do post.
 * @return array{name:string,url:string}|null
 */
function teoriageek_get_external_source( $post_id ) {
	$post_id = (int) $post_id;
	$name    = trim( (string) get_post_meta( $post_id, '_tg_source_name', true ) );
	$url     = teoriageek_safe_http_url( (string) get_post_meta( $post_id, '_tg_source_url', true ) );

	if ( '' === $name && '' === $url ) {
		$td = teoriageek_get_legacy_td_settings( $post_id );
		if ( ! empty( $td['td_source'] ) && is_string( $td['td_source'] ) ) {
			$name = sanitize_text_field( $td['td_source'] );
		}
		if ( ! empty( $td['td_source_url'] ) && is_string( $td['td_source_url'] ) ) {
			$url = teoriageek_safe_http_url( $td['td_source_url'] );
		}
	}

	if ( '' === $name && '' === $url ) {
		return null;
	}

	$host = $url ? (string) wp_parse_url( $url, PHP_URL_HOST ) : '';
	return array(
		'name' => ( '' !== $name ) ? $name : $host,
		'url'  => $url,
	);
}

/**
 * Retorna o slug mapeado de uma categoria configurável no Personalizador.
 *
 * @param string $slot Chave do bloco da Home.
 * @return string
 */
function teoriageek_get_mapped_category_slug( $slot ) {
	$defaults = array(
		'destaque'  => 'destaque',
		'noticias'  => 'noticias',
		'criticas'  => 'criticas',
		'reviews'   => 'reviews',
		'especiais' => 'especial-teoria-geek',
		'col_1'     => 'games',
		'col_2'     => 'filmes',
		'col_3'     => 'series',
		'col_4'     => 'animes-mangas',
		'col_5'     => 'livros-hqs',
	);
	$default = isset( $defaults[ $slot ] ) ? $defaults[ $slot ] : '';
	return sanitize_title( (string) get_theme_mod( 'teoriageek_cat_' . $slot, $default ) );
}

/**
 * Retorna redes sociais oficiais configuradas no Personalizador.
 *
 * @return array<int, array{id:string,label:string,url:string,icon:string}>
 */
function teoriageek_get_social_links() {
	$definitions = array(
		array( 'id' => 'instagram', 'label' => 'Instagram', 'default' => 'https://www.instagram.com/teoria.geek' ),
		array( 'id' => 'youtube',   'label' => 'YouTube',   'default' => 'https://www.youtube.com/channel/UCgZV_gtBut_mNmFQtIx9KEQ' ),
		array( 'id' => 'spotify',   'label' => 'Spotify',   'default' => 'https://open.spotify.com/show/5MJY6UjHHW6Gne68xfw3Rz' ),
		array( 'id' => 'twitch',    'label' => 'Twitch',    'default' => 'https://www.twitch.tv/teoriageekgames' ),
		array( 'id' => 'twitter',   'label' => 'X / Twitter', 'default' => 'https://twitter.com/teoriageeks' ),
		array( 'id' => 'facebook',  'label' => 'Facebook',  'default' => 'https://www.facebook.com/TeoriaGeeks' ),
	);

	$active = array();
	foreach ( $definitions as $def ) {
		$val = get_theme_mod( 'teoriageek_social_' . $def['id'], $def['default'] );
		$url = teoriageek_safe_http_url( (string) $val );
		if ( '' !== $url ) {
			$active[] = array(
				'id'    => $def['id'],
				'label' => $def['label'],
				'url'   => $url,
				'icon'  => $def['id'],
			);
		}
	}
	return $active;
}

/**
 * Renderiza ícones vetoriais SVG inline (zero emojis Unicode).
 *
 * @param string $name  Identificador do ícone.
 * @param string $class Classes CSS dimensionais/cor.
 * @return string
 */
function teoriageek_icon( $name, $class = 'h-4 w-4' ) {
	$c     = esc_attr( $class );
	$attrs = 'class="' . $c . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';

	$paths = array(
		'search'        => '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
		'sun'           => '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
		'moon'          => '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
		'newspaper'     => '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>',
		'film'          => '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/>',
		'play'          => '<polygon points="6 3 20 12 6 21 6 3"/>',
		'menu'          => '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
		'x'             => '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
		'zap'           => '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
		'clock'         => '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
		'eye'           => '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
		'heart'         => '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
		'bookmark'      => '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
		'share'         => '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
		'copy'          => '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
		'message'       => '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
		'arrow-right'   => '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
		'arrow-left'    => '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
		'chevron-right' => '<path d="m9 18 6-6-6-6"/>',
		'chevron-left'  => '<path d="m15 18-6-6 6-6"/>',
		'chevron-up'    => '<path d="m18 15-6-6-6 6"/>',
		'chevron-down'  => '<path d="m6 9 6 6 6-6"/>',
		'external'      => '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
		'flame'         => '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
		'compass'       => '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
		'star'          => '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
		'award'         => '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
		'list-checks'   => '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
		'tag'           => '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
		'user'          => '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
		'pen-tool'      => '<path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z"/><path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18"/><path d="m2.3 2.3 7.286 7.286"/><circle cx="11" cy="11" r="2"/>',
		'shield-check'  => '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
		'send'          => '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
		'trending'      => '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
		'radio'         => '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>',
		'book-open'     => '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
		'check'         => '<path d="M20 6 9 17l-5-5"/>',
		'rss'           => '<path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>',
		'whatsapp'      => '<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>',
		'instagram'     => '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
		'youtube'       => '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
		'facebook'      => '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
		'twitter'       => '<path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/>',
		'twitch'        => '<path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7"/>',
		'spotify'       => '<circle cx="12" cy="12" r="10"/><path d="M8 14.5c2.5-.8 5.5-.6 8 .7"/><path d="M7.5 11.5c3-.9 6.5-.7 9.5.8"/><path d="M7 8.5c3.5-1 7.5-.7 11 1"/>',
	);

	$body = isset( $paths[ $name ] ) ? $paths[ $name ] : $paths['star'];
	return '<svg ' . $attrs . '>' . $body . '</svg>';
}

/**
 * Busca otimizada de IDs de posts para um bloco editorial com deduplicação via `$shown_ids`
 * e fallback automático quando a categoria possui poucos posts restantes.
 *
 * @param array<string, mixed> $base_args Argumentos base de WP_Query.
 * @param int                  $needed    Quantidade desejada.
 * @param int[]                $shown_ids IDs já exibidos (passado por referência e atualizado).
 * @return int[]
 */
function teoriageek_query_dedup_ids( $base_args, $needed, &$shown_ids ) {
	$needed = max( 1, (int) $needed );
	$args   = array_merge(
		array(
			'post_type'              => 'post',
			'post_status'            => 'publish',
			'posts_per_page'         => $needed,
			'ignore_sticky_posts'    => true,
			'no_found_rows'          => true,
			'fields'                 => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
		),
		$base_args
	);

	if ( ! empty( $shown_ids ) ) {
		$args['post__not_in'] = array_values( array_unique( array_map( 'intval', $shown_ids ) ) );
	}

	$q   = new WP_Query( $args );
	$ids = array_values( array_map( 'intval', (array) $q->posts ) );

	// Fallback seguro caso a categoria tenha poucos posts fora de $shown_ids.
	if ( count( $ids ) < $needed && ! empty( $args['post__not_in'] ) ) {
		$fb_args                   = $args;
		$fb_args['posts_per_page'] = $needed - count( $ids );
		if ( ! empty( $ids ) ) {
			$fb_args['post__not_in'] = $ids;
		} else {
			unset( $fb_args['post__not_in'] );
		}
		$fb_q = new WP_Query( $fb_args );
		foreach ( (array) $fb_q->posts as $fid ) {
			$fid = (int) $fid;
			if ( $fid > 0 && ! in_array( $fid, $ids, true ) ) {
				$ids[] = $fid;
			}
		}
	}

	foreach ( $ids as $id ) {
		if ( ! in_array( $id, $shown_ids, true ) ) {
			$shown_ids[] = $id;
		}
	}

	return array_slice( $ids, 0, $needed );
}

/**
 * Monta e cacheia em Transient (10 min) todos os blocos de IDs da Home (`front-page.php`)
 * com deduplicação global `$shown_ids` e hidratação em lote em uma única `WP_Query`.
 *
 * @return array<string, mixed>
 */
function teoriageek_get_home_blocks() {
	static $runtime_cache = null;
	if ( is_array( $runtime_cache ) ) {
		return $runtime_cache;
	}

	$transient_key = 'teoriageek_home_blocks_v2';
	$id_map        = get_transient( $transient_key );

	if ( ! is_array( $id_map ) || empty( $id_map['hero'] ) ) {
		$shown_ids = array();

		// 1. Manchete Principal (_tg_main_headline -> DESTAQUE -> último post).
		$hero_id  = 0;
		$pinned_q = new WP_Query(
			array(
				'post_type'              => 'post',
				'post_status'            => 'publish',
				'posts_per_page'         => 1,
				'ignore_sticky_posts'    => true,
				'no_found_rows'          => true,
				'fields'                 => 'ids',
				'meta_key'               => '_tg_main_headline',
				'meta_value'             => '1',
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
			)
		);
		if ( ! empty( $pinned_q->posts ) ) {
			$hero_id = (int) $pinned_q->posts[0];
		}

		$destaque_slug = teoriageek_get_mapped_category_slug( 'destaque' );
		$destaque_term = ( '' !== $destaque_slug ) ? get_category_by_slug( $destaque_slug ) : null;
		$destaque_pool = array();
		if ( $destaque_term && ! is_wp_error( $destaque_term ) ) {
			$dq            = new WP_Query(
				array(
					'post_type'              => 'post',
					'post_status'            => 'publish',
					'cat'                    => (int) $destaque_term->term_id,
					'posts_per_page'         => 8,
					'ignore_sticky_posts'    => true,
					'no_found_rows'          => true,
					'fields'                 => 'ids',
					'update_post_meta_cache' => false,
					'update_post_term_cache' => false,
				)
			);
			$destaque_pool = array_map( 'intval', (array) $dq->posts );
		}

		$recent_q    = new WP_Query(
			array(
				'post_type'              => 'post',
				'post_status'            => 'publish',
				'posts_per_page'         => 24,
				'ignore_sticky_posts'    => true,
				'no_found_rows'          => true,
				'fields'                 => 'ids',
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
			)
		);
		$recent_pool = array_map( 'intval', (array) $recent_q->posts );

		if ( 0 === $hero_id && ! empty( $destaque_pool ) ) {
			$hero_id = $destaque_pool[0];
		}
		if ( 0 === $hero_id && ! empty( $recent_pool ) ) {
			$hero_id = $recent_pool[0];
		}
		if ( $hero_id > 0 ) {
			$shown_ids[] = $hero_id;
		}

		// 2. 3 Destaques Secundários.
		$secondary_ids = array();
		foreach ( array_merge( $destaque_pool, $recent_pool ) as $cid ) {
			if ( $cid > 0 && ! in_array( $cid, $shown_ids, true ) ) {
				$secondary_ids[] = $cid;
				$shown_ids[]     = $cid;
			}
			if ( count( $secondary_ids ) >= 3 ) {
				break;
			}
		}

		// 3. Reel em Destaque (1) + Radar na Redação (2).
		$reel_id = 0;
		foreach ( $recent_pool as $cid ) {
			if ( $cid > 0 && ! in_array( $cid, $shown_ids, true ) ) {
				$reel_id     = $cid;
				$shown_ids[] = $cid;
				break;
			}
		}

		$urgent_ids = array();
		foreach ( $recent_pool as $cid ) {
			if ( $cid > 0 && ! in_array( $cid, $shown_ids, true ) ) {
				$urgent_ids[] = $cid;
				$shown_ids[]  = $cid;
			}
			if ( count( $urgent_ids ) >= 3 ) {
				break;
			}
		}

		// 4. Plantão Geek (8 itens — meta _tg_plantao ou últimas notícias).
		$plantao_q   = new WP_Query(
			array(
				'post_type'              => 'post',
				'post_status'            => 'publish',
				'posts_per_page'         => 8,
				'ignore_sticky_posts'    => true,
				'no_found_rows'          => true,
				'fields'                 => 'ids',
				'meta_key'               => '_tg_plantao',
				'meta_value'             => '1',
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
			)
		);
		$ticker_ids  = array_map( 'intval', (array) $plantao_q->posts );
		if ( count( $ticker_ids ) < 8 ) {
			foreach ( $recent_pool as $rid ) {
				if ( $rid > 0 && ! in_array( $rid, $ticker_ids, true ) ) {
					$ticker_ids[] = $rid;
				}
				if ( count( $ticker_ids ) >= 8 ) {
					break;
				}
			}
		}

		// 5. Giro Geek — Últimas Notícias (8 cards sem repetir a dobra principal).
		$noticias_slug = teoriageek_get_mapped_category_slug( 'noticias' );
		$noticias_term = ( '' !== $noticias_slug ) ? get_category_by_slug( $noticias_slug ) : null;
		$giro_base     = ( $noticias_term && ! is_wp_error( $noticias_term ) ) ? array( 'cat' => (int) $noticias_term->term_id ) : array();
		$giro_ids      = teoriageek_query_dedup_ids( $giro_base, 8, $shown_ids );

		// 6. Críticas & Reviews (4 cards sem repetir).
		$review_cat_ids = array();
		foreach ( array( teoriageek_get_mapped_category_slug( 'criticas' ), teoriageek_get_mapped_category_slug( 'reviews' ) ) as $r_slug ) {
			if ( '' !== $r_slug ) {
				$r_term = get_category_by_slug( $r_slug );
				if ( $r_term && ! is_wp_error( $r_term ) ) {
					$review_cat_ids[] = (int) $r_term->term_id;
				}
			}
		}
		$reviews_base = ! empty( $review_cat_ids ) ? array( 'category__in' => $review_cat_ids ) : array();
		$reviews_ids  = teoriageek_query_dedup_ids( $reviews_base, 4, $shown_ids );

		// 7. Especiais & Colunas (4 cards sem repetir).
		$especiais_slug = teoriageek_get_mapped_category_slug( 'especiais' );
		$especiais_term = ( '' !== $especiais_slug ) ? get_category_by_slug( $especiais_slug ) : null;
		$especiais_ids  = array();
		if ( $especiais_term && ! is_wp_error( $especiais_term ) ) {
			$especiais_ids = teoriageek_query_dedup_ids( array( 'cat' => (int) $especiais_term->term_id ), 4, $shown_ids );
		}

		// 8. Carrossel de Reels (5 itens verticais Web Stories — prioriza itens fora dos já exibidos).
		$reels_strip_ids = array();
		foreach ( $recent_pool as $rid ) {
			if ( $rid > 0 && ! in_array( $rid, $shown_ids, true ) ) {
				$reels_strip_ids[] = $rid;
				$shown_ids[]       = $rid;
			}
			if ( count( $reels_strip_ids ) >= 5 ) {
				break;
			}
		}
		if ( count( $reels_strip_ids ) < 5 ) {
			foreach ( $recent_pool as $rid ) {
				if ( $rid > 0 && ! in_array( $rid, $reels_strip_ids, true ) ) {
					$reels_strip_ids[] = $rid;
				}
				if ( count( $reels_strip_ids ) >= 5 ) {
					break;
				}
			}
		}

		// 9. Colunas de Editorias (5 blocos x 4 posts, sem duplicar matérias já exibidas na Home).
		$col_blocks = array();
		foreach ( array( 'col_1', 'col_2', 'col_3', 'col_4', 'col_5' ) as $col_slot ) {
			$col_slug = teoriageek_get_mapped_category_slug( $col_slot );
			$col_term = ( '' !== $col_slug ) ? get_category_by_slug( $col_slug ) : null;
			if ( ! $col_term || is_wp_error( $col_term ) ) {
				continue;
			}
			$col_ids = teoriageek_query_dedup_ids( array( 'cat' => (int) $col_term->term_id ), 4, $shown_ids );
			if ( ! empty( $col_ids ) ) {
				$col_blocks[ $col_slot ] = array(
					'term_id' => (int) $col_term->term_id,
					'ids'     => $col_ids,
				);
			}
		}

		$id_map = array(
			'hero'        => $hero_id,
			'secondary'   => $secondary_ids,
			'reel'        => $reel_id,
			'urgent'      => $urgent_ids,
			'ticker'      => $ticker_ids,
			'giro'        => $giro_ids,
			'reviews'     => $reviews_ids,
			'especiais'   => $especiais_ids,
			'reels_strip' => $reels_strip_ids,
			'cols'        => $col_blocks,
		);

		set_transient( $transient_key, $id_map, 10 * MINUTE_IN_SECONDS );
	}

	// Hidrata TODOS os posts da Home em UMA única consulta em lote + caches de meta, termos, capas e autores.
	$all_ids = array();
	if ( ! empty( $id_map['hero'] ) ) {
		$all_ids[] = (int) $id_map['hero'];
	}
	if ( ! empty( $id_map['reel'] ) ) {
		$all_ids[] = (int) $id_map['reel'];
	}
	foreach ( array( 'secondary', 'urgent', 'ticker', 'giro', 'reviews', 'especiais', 'reels_strip' ) as $list_key ) {
		foreach ( (array) ( $id_map[ $list_key ] ?? array() ) as $pid ) {
			$all_ids[] = (int) $pid;
		}
	}
	foreach ( (array) ( $id_map['cols'] ?? array() ) as $col_data ) {
		foreach ( (array) ( $col_data['ids'] ?? array() ) as $pid ) {
			$all_ids[] = (int) $pid;
		}
	}
	$all_ids = array_values( array_unique( array_filter( $all_ids ) ) );

	$post_map   = array();
	$author_ids = array();
	if ( ! empty( $all_ids ) ) {
		$hydrate_q = new WP_Query(
			array(
				'post_type'              => 'post',
				'post_status'            => 'publish',
				'post__in'               => $all_ids,
				'posts_per_page'         => count( $all_ids ),
				'ignore_sticky_posts'    => true,
				'no_found_rows'          => true,
				'orderby'                => 'post__in',
				'update_post_meta_cache' => true,
				'update_post_term_cache' => true,
			)
		);
		update_post_thumbnail_cache( $hydrate_q );
		foreach ( $hydrate_q->posts as $p ) {
			$post_map[ (int) $p->ID ] = $p;
			$author_ids[]             = (int) $p->post_author;
		}
		if ( ! empty( $author_ids ) && function_exists( 'cache_users' ) ) {
			cache_users( array_values( array_unique( $author_ids ) ) );
		}
		teoriageek_prime_post_views( $all_ids );
	}

	$resolve_list = static function ( $ids ) use ( $post_map ) {
		$out = array();
		foreach ( (array) $ids as $id ) {
			$id = (int) $id;
			if ( isset( $post_map[ $id ] ) ) {
				$out[] = $post_map[ $id ];
			}
		}
		return $out;
	};

	$resolved_cols = array();
	foreach ( (array) ( $id_map['cols'] ?? array() ) as $slot => $col_data ) {
		$term  = get_category( (int) ( $col_data['term_id'] ?? 0 ) );
		$posts = $resolve_list( $col_data['ids'] ?? array() );
		if ( $term && ! is_wp_error( $term ) && ! empty( $posts ) ) {
			$resolved_cols[ $slot ] = array(
				'term'  => $term,
				'posts' => $posts,
			);
		}
	}

	$runtime_cache = array(
		'hero'        => isset( $post_map[ (int) ( $id_map['hero'] ?? 0 ) ] ) ? $post_map[ (int) $id_map['hero'] ] : null,
		'secondary'   => $resolve_list( $id_map['secondary'] ?? array() ),
		'reel'        => isset( $post_map[ (int) ( $id_map['reel'] ?? 0 ) ] ) ? $post_map[ (int) $id_map['reel'] ] : null,
		'urgent'      => $resolve_list( $id_map['urgent'] ?? array() ),
		'ticker'      => $resolve_list( $id_map['ticker'] ?? array() ),
		'giro'        => $resolve_list( $id_map['giro'] ?? array() ),
		'reviews'     => $resolve_list( $id_map['reviews'] ?? array() ),
		'especiais'   => $resolve_list( $id_map['especiais'] ?? array() ),
		'reels_strip' => $resolve_list( $id_map['reels_strip'] ?? array() ),
		'cols'        => $resolved_cols,
	);

	return $runtime_cache;
}

/**
 * Retorna categorias do `/reels/` com cache em transient (15 min) evitando múltiplas queries de termo.
 *
 * @return array<int, array{slug:string,name:string,count:int}>
 */
function teoriageek_get_reels_categories() {
	$cached = get_transient( 'teoriageek_reels_cats_v1' );
	if ( is_array( $cached ) ) {
		return $cached;
	}

	$slugs = array( 'noticias', 'games', 'filmes', 'series', 'animes-mangas', 'criticas', 'reviews' );
	$terms = get_terms(
		array(
			'taxonomy'   => 'category',
			'slug'       => $slugs,
			'hide_empty' => true,
		)
	);

	$indexed = array();
	if ( is_array( $terms ) ) {
		foreach ( $terms as $t ) {
			if ( $t instanceof WP_Term ) {
				$indexed[ $t->slug ] = array(
					'slug'  => $t->slug,
					'name'  => teoriageek_fix_mojibake( html_entity_decode( $t->name, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) ),
					'count' => (int) $t->count,
				);
			}
		}
	}

	$ordered = array();
	foreach ( $slugs as $slug ) {
		if ( isset( $indexed[ $slug ] ) ) {
			$ordered[] = $indexed[ $slug ];
		}
	}

	set_transient( 'teoriageek_reels_cats_v1', $ordered, 15 * MINUTE_IN_SECONDS );
	return $ordered;
}

/**
 * Invalida transients editoriais automaticamente ao publicar, editar, excluir posts ou salvar o Customizer.
 *
 * @param int $post_id ID opcional do post.
 */
function teoriageek_flush_editorial_transients( $post_id = 0 ) {
	if ( $post_id > 0 && ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) ) {
		return;
	}
	delete_transient( 'teoriageek_home_blocks_v1' );
	delete_transient( 'teoriageek_home_blocks_v2' );
	delete_transient( 'teoriageek_reels_cats_v1' );
}
add_action( 'save_post_post', 'teoriageek_flush_editorial_transients' );
add_action( 'deleted_post', 'teoriageek_flush_editorial_transients' );
add_action( 'trashed_post', 'teoriageek_flush_editorial_transients' );
add_action( 'customize_save_after', 'teoriageek_flush_editorial_transients' );

/**
 * Gera arte vetorial editorial elegante em Azul e Amarelo para capas ausentes ou quebradas,
 * evitando retângulos pretos vazios.
 *
 * @param string $category_slug Slug da categoria.
 * @param bool   $full_bleed    Modo vertical (Reels).
 * @return string
 */
function teoriageek_render_fallback_art( $category_slug, $full_bleed = false ) {
	$style = teoriageek_get_category_style( $category_slug );
	$art   = $style['art'];

	$palettes = array(
		'games'  => array( '#0B132B', '#1D4ED8', '#2563EB', '#FACC15', 'GAMES', 'play' ),
		'cinema' => array( '#062C22', '#047857', '#059669', '#FACC15', 'CINE & SÉRIES', 'film' ),
		'animes' => array( '#082F49', '#0E7490', '#0284C7', '#FACC15', 'ANIMES', 'zap' ),
		'comics' => array( '#3B1805', '#B45309', '#D97706', '#FACC15', 'HQS & LIVROS', 'book-open' ),
		'tech'   => array( '#172554', '#1D4ED8', '#3B82F6', '#FACC15', 'TEORIA GEEK', 'newspaper' ),
	);
	$pal = isset( $palettes[ $art ] ) ? $palettes[ $art ] : $palettes['tech'];

	$bg = $full_bleed
		? sprintf( 'radial-gradient(circle at 50%% 32%%, %s 0%%, %s 52%%, %s 100%%)', $pal[2], $pal[1], $pal[0] )
		: sprintf( 'linear-gradient(135deg, %s 0%%, %s 58%%, %s 100%%)', $pal[0], $pal[1], $pal[2] );

	$svg = '<svg viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" class="block h-full w-full" aria-hidden="true" focusable="false">'
		. '<defs><pattern id="tg-grid-' . esc_attr( $art ) . '" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="rgba(255,255,255,0.16)"/></pattern></defs>'
		. '<rect width="640" height="360" fill="url(#tg-grid-' . esc_attr( $art ) . ')"/>'
		. '<circle cx="520" cy="70" r="140" fill="' . esc_attr( $pal[3] ) . '" opacity="0.12"/>'
		. '<circle cx="110" cy="300" r="120" fill="#FFFFFF" opacity="0.08"/>'
		. '<rect x="272" y="114" width="96" height="96" rx="20" fill="rgba(11,15,25,0.72)" stroke="' . esc_attr( $pal[3] ) . '" stroke-width="4"/>'
		. '<polygon points="308,142 344,162 308,182" fill="' . esc_attr( $pal[3] ) . '"/>'
		. '<text x="320" y="250" text-anchor="middle" font-family="Barlow Condensed, Space Grotesk, sans-serif" font-weight="800" font-size="24" letter-spacing="3" fill="#FFFFFF" opacity="0.92">' . esc_html( $pal[4] ) . '</text>'
		. '</svg>';

	return '<div class="relative flex h-full w-full items-center justify-center overflow-hidden" style="background:' . esc_attr( $bg ) . ';" aria-hidden="true">'
		. $svg
		. '</div>';
}

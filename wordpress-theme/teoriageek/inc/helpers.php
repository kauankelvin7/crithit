<?php
/**
 * Teoria Geek — Funções utilitárias, ícones SVG, badges, contagem de views e fallbacks.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Verifica se a requisição atual corresponde à tela de Reels (/reels/ ou página com template page-reels.php).
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
 * Retorna a URL da página de Reels (com suporte opcional a deep-link por slug de post).
 *
 * @param string $post_slug Slug opcional do post alvo.
 * @return string
 */
function teoriageek_get_reels_url( $post_slug = '' ) {
	$base = home_url( '/reels/' );
	if ( ! empty( $post_slug ) ) {
		return add_query_arg( 'post', sanitize_title( $post_slug ), $base );
	}
	return $base;
}

/**
 * Valida se uma URL usa estritamente protocolo http:// ou https://.
 *
 * @param string $url URL a validar.
 * @return string URL segura ou string vazia.
 */
function teoriageek_safe_http_url( $url ) {
	$url = trim( (string) $url );
	if ( '' === $url ) {
		return '';
	}
	if ( ! preg_match( '#^https?://#i', $url ) ) {
		return '';
	}
	$sanitized = esc_url_raw( $url, array( 'http', 'https' ) );
	return $sanitized ? $sanitized : '';
}

/**
 * Calcula cor de texto de alto contraste (#111111 ou #FFFFFF) com base na luminância relativa WCAG.
 *
 * @param string $hex Cor hexadecimal (#RRGGBB).
 * @return string
 */
function teoriageek_contrast_ink( $hex ) {
	$hex = ltrim( (string) $hex, '#' );
	if ( strlen( $hex ) === 3 ) {
		$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
	}
	if ( strlen( $hex ) !== 6 || ! ctype_xdigit( $hex ) ) {
		return '#FFFFFF';
	}

	$r = hexdec( substr( $hex, 0, 2 ) ) / 255;
	$g = hexdec( substr( $hex, 2, 2 ) ) / 255;
	$b = hexdec( substr( $hex, 4, 2 ) ) / 255;

	$to_linear = function ( $c ) {
		return ( $c <= 0.03928 ) ? $c / 12.92 : pow( ( $c + 0.055 ) / 1.055, 2.4 );
	};

	$lum = 0.2126 * $to_linear( $r ) + 0.7152 * $to_linear( $g ) + 0.0722 * $to_linear( $b );
	return ( $lum > 0.42 ) ? '#111111' : '#FFFFFF';
}

/**
 * Escurece ou clareia uma cor hexadecimal em porcentagem (-100 a +100).
 *
 * @param string $hex     Cor base.
 * @param int    $percent Percentual de ajuste.
 * @return string
 */
function teoriageek_adjust_hex( $hex, $percent ) {
	$hex = ltrim( (string) $hex, '#' );
	if ( strlen( $hex ) !== 6 || ! ctype_xdigit( $hex ) ) {
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
 * Retorna a paleta semântica de uma categoria pelo slug (compatível com os 25 slugs reais do Teoria Geek).
 *
 * @param string $slug Slug da categoria.
 * @return array{fill:string,ink:string,accent:string,art:string}
 */
function teoriageek_get_category_style( $slug ) {
	$slug = sanitize_title( (string) $slug );

	$map = array(
		'games'                                          => array( 'fill' => 'var(--fill-games)', 'ink' => 'var(--ink-on-fill-games)', 'accent' => 'var(--accent-games)', 'art' => 'games' ),
		'e-sports-esports'                               => array( 'fill' => 'var(--fill-games)', 'ink' => 'var(--ink-on-fill-games)', 'accent' => 'var(--accent-games)', 'art' => 'games' ),
		'platina-trofeus-ps5-ps4-xbox-nintendo-games-pc' => array( 'fill' => 'var(--fill-games)', 'ink' => 'var(--ink-on-fill-games)', 'accent' => 'var(--accent-games)', 'art' => 'games' ),
		'hands-on'                                       => array( 'fill' => 'var(--fill-games)', 'ink' => 'var(--ink-on-fill-games)', 'accent' => 'var(--accent-games)', 'art' => 'games' ),
		'retro'                                          => array( 'fill' => 'var(--fill-games)', 'ink' => 'var(--ink-on-fill-games)', 'accent' => 'var(--accent-games)', 'art' => 'games' ),

		'filmes'                                         => array( 'fill' => 'var(--fill-cinema)', 'ink' => 'var(--ink-on-fill-cinema)', 'accent' => 'var(--accent-cinema)', 'art' => 'cinema' ),
		'series'                                         => array( 'fill' => 'var(--fill-cinema)', 'ink' => 'var(--ink-on-fill-cinema)', 'accent' => 'var(--accent-cinema)', 'art' => 'cinema' ),

		'animes-mangas'                                  => array( 'fill' => 'var(--fill-animes)', 'ink' => 'var(--ink-on-fill-animes)', 'accent' => 'var(--accent-animes)', 'art' => 'animes' ),
		'animes-e-mangas'                                => array( 'fill' => 'var(--fill-animes)', 'ink' => 'var(--ink-on-fill-animes)', 'accent' => 'var(--accent-animes)', 'art' => 'animes' ),

		'livros-hqs'                                     => array( 'fill' => 'var(--fill-comics)', 'ink' => 'var(--ink-on-fill-comics)', 'accent' => 'var(--accent-comics)', 'art' => 'comics' ),
		'literatura-e-hqs'                               => array( 'fill' => 'var(--fill-comics)', 'ink' => 'var(--ink-on-fill-comics)', 'accent' => 'var(--accent-comics)', 'art' => 'comics' ),

		'especial-teoria-geek'                           => array( 'fill' => 'var(--fill-tech)', 'ink' => 'var(--ink-on-fill-tech)', 'accent' => 'var(--accent-tech)', 'art' => 'tech' ),
		'especiais'                                      => array( 'fill' => 'var(--fill-tech)', 'ink' => 'var(--ink-on-fill-tech)', 'accent' => 'var(--accent-tech)', 'art' => 'tech' ),
		'perifericos'                                    => array( 'fill' => 'var(--fill-tech)', 'ink' => 'var(--ink-on-fill-tech)', 'accent' => 'var(--accent-tech)', 'art' => 'tech' ),
		'musicas'                                        => array( 'fill' => 'var(--fill-tech)', 'ink' => 'var(--ink-on-fill-tech)', 'accent' => 'var(--accent-tech)', 'art' => 'tech' ),

		'criticas'                                       => array( 'fill' => 'var(--fill-brand)', 'ink' => 'var(--ink-on-fill-brand)', 'accent' => 'var(--accent-brand)', 'art' => 'cinema' ),
		'reviews'                                        => array( 'fill' => 'var(--fill-brand)', 'ink' => 'var(--ink-on-fill-brand)', 'accent' => 'var(--accent-brand)', 'art' => 'games' ),
	);

	if ( isset( $map[ $slug ] ) ) {
		return $map[ $slug ];
	}

	return array(
		'fill'   => 'var(--fill-brand)',
		'ink'    => 'var(--ink-on-fill-brand)',
		'accent' => 'var(--accent-brand)',
		'art'    => 'games',
	);
}

/**
 * Seleciona a categoria editorial mais específica de um post (priorizando editorias sobre 'destaque'/'noticias'/'diversos').
 *
 * @param int $post_id ID do post.
 * @return WP_Term|null
 */
function teoriageek_get_primary_category( $post_id ) {
	$terms = get_the_category( $post_id );
	if ( empty( $terms ) || is_wp_error( $terms ) ) {
		return null;
	}

	$deprioritize = array( 'destaque', 'noticias', 'diversos', 'categorias', 'uncategorized', 'games-filmes-series-eventos' );

	foreach ( $terms as $term ) {
		if ( ! in_array( $term->slug, $deprioritize, true ) ) {
			return $term;
		}
	}

	return $terms[0];
}

/**
 * Detecta automaticamente o formato editorial do post (meta explícita ou inferência por categoria).
 *
 * @param int $post_id ID do post.
 * @return array{key:string,label:string}
 */
function teoriageek_get_post_format_badge( $post_id ) {
	$explicit = get_post_meta( $post_id, '_tg_editorial_format', true );
	$labels   = array(
		'noticia'  => __( 'Notícia', 'teoriageek' ),
		'critica'  => __( 'Crítica', 'teoriageek' ),
		'review'   => __( 'Review', 'teoriageek' ),
		'especial' => __( 'Especial', 'teoriageek' ),
	);

	if ( $explicit && isset( $labels[ $explicit ] ) ) {
		return array(
			'key'   => $explicit,
			'label' => $labels[ $explicit ],
		);
	}

	$cat_criticas  = teoriageek_get_mapped_category_slug( 'criticas' );
	$cat_reviews   = teoriageek_get_mapped_category_slug( 'reviews' );
	$cat_especiais = teoriageek_get_mapped_category_slug( 'especiais' );

	if ( has_category( array( $cat_reviews, 'reviews' ), $post_id ) ) {
		return array( 'key' => 'review', 'label' => $labels['review'] );
	}
	if ( has_category( array( $cat_criticas, 'criticas' ), $post_id ) ) {
		return array( 'key' => 'critica', 'label' => $labels['critica'] );
	}
	if ( has_category( array( $cat_especiais, 'especial-teoria-geek', 'especiais' ), $post_id ) ) {
		return array( 'key' => 'especial', 'label' => $labels['especial'] );
	}

	return array( 'key' => 'noticia', 'label' => $labels['noticia'] );
}

/**
 * Retorna a nota editorial (0.0 a 10.0) se preenchida na Ficha Editorial.
 *
 * @param int $post_id ID do post.
 * @return string|null Nota formatada (ex.: "9.2") ou null.
 */
function teoriageek_get_post_score( $post_id ) {
	$raw = get_post_meta( $post_id, '_tg_review_score', true );
	if ( '' === $raw || null === $raw ) {
		return null;
	}
	$num = (float) str_replace( ',', '.', (string) $raw );
	if ( $num < 0 || $num > 10 ) {
		return null;
	}
	return number_format( $num, 1, '.', '' );
}

/**
 * Calcula tempo estimado de leitura em minutos (mínimo 1 min).
 *
 * @param int $post_id ID do post.
 * @return int
 */
function teoriageek_get_reading_time( $post_id ) {
	$content = get_post_field( 'post_content', $post_id );
	$words   = str_word_count( wp_strip_all_tags( strip_shortcodes( (string) $content ) ) );
	return max( 1, (int) ceil( $words / 200 ) );
}

/**
 * Retorna data relativa amigável em PT-BR (ex.: "Há 2h", "Há 3 dias" ou "18 nov. 2026").
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
		$mins = (int) floor( $diff / 60 );
		return sprintf( 'Há %d min', $mins );
	}
	if ( $diff < 86400 ) {
		$hours = (int) floor( $diff / 3600 );
		return sprintf( 'Há %dh', $hours );
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
 * Retorna contagem de visualizações do post (compatível com contador próprio e plugins legados).
 *
 * @param int $post_id ID do post.
 * @return int
 */
function teoriageek_get_post_views( $post_id ) {
	$views = get_post_meta( $post_id, '_tg_views_count', true );
	if ( '' !== $views && null !== $views ) {
		return max( 0, (int) $views );
	}

	// Fallback somente leitura para meta legada comum (Post Views Counter / Newspaper).
	foreach ( array( 'post_views_count', 'views', '_post_views_count' ) as $legacy_key ) {
		$legacy = get_post_meta( $post_id, $legacy_key, true );
		if ( is_numeric( $legacy ) && (int) $legacy > 0 ) {
			return (int) $legacy;
		}
	}

	return 0;
}

/**
 * Incrementa visualizações de um post de forma segura.
 *
 * @param int $post_id ID do post.
 * @return int Novo total.
 */
function teoriageek_increment_post_views( $post_id ) {
	$current = teoriageek_get_post_views( $post_id );
	$next    = $current + 1;
	update_post_meta( $post_id, '_tg_views_count', $next );
	return $next;
}

/**
 * Retorna contagem de curtidas salvas em post_meta.
 *
 * @param int $post_id ID do post.
 * @return int
 */
function teoriageek_get_post_likes( $post_id ) {
	return max( 0, (int) get_post_meta( $post_id, '_tg_likes_count', true ) );
}

/**
 * Remove emojis Unicode de trechos gerados para a interface (ex.: Reels).
 *
 * @param string $text Texto bruto.
 * @return string
 */
function teoriageek_strip_emojis( $text ) {
	$clean = preg_replace( '/[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{FE0F}]/u', '', (string) $text );
	return trim( preg_replace( '/\s+/u', ' ', (string) $clean ) );
}

/**
 * Extrai os 3 pontos-chave do post: usa os campos da Ficha Editorial ou gera automaticamente
 * 3 trechos curtos e limpos a partir do resumo e primeiros parágrafos para compatibilidade com o acervo antigo.
 *
 * @param int $post_id ID do post.
 * @return string[]
 */
function teoriageek_get_post_bullets( $post_id ) {
	$bullets = array();
	for ( $i = 1; $i <= 3; $i++ ) {
		$val = trim( (string) get_post_meta( $post_id, '_tg_bullet_' . $i, true ) );
		if ( '' !== $val ) {
			$bullets[] = teoriageek_strip_emojis( $val );
		}
	}
	if ( ! empty( $bullets ) ) {
		return $bullets;
	}

	// Geração automática limpa a partir do resumo + primeiros parágrafos reais (ignora Ficha Técnica legada).
	$candidates = array();

	$raw_excerpt = get_post_field( 'post_excerpt', $post_id );
	if ( ! empty( $raw_excerpt ) ) {
		$candidates[] = wp_strip_all_tags( $raw_excerpt );
	}

	$content = (string) get_post_field( 'post_content', $post_id );
	// Remove tabela/bloco legado de ficha técnica antes de extrair parágrafos narrativos.
	$content_clean = preg_replace( '#<div[^>]*class=["\'][^"\']*ficha[^"\']*["\'][^>]*>[\s\S]*?</table>\s*(?:<p>&nbsp;</p>\s*)?</div>\s*</div>#i', '', $content );
	$content_clean = strip_shortcodes( (string) $content_clean );

	if ( preg_match_all( '#<p[^>]*>([\s\S]*?)</p>#i', $content_clean, $matches ) ) {
		foreach ( $matches[1] as $p ) {
			$txt = html_entity_decode( wp_strip_all_tags( $p ), ENT_QUOTES, 'UTF-8' );
			$txt = teoriageek_strip_emojis( $txt );
			if ( mb_strlen( $txt ) >= 35 && ! preg_match( '/^(quer saber mais|conheça nosso canal|ficha técnica)/i', $txt ) ) {
				$candidates[] = $txt;
			}
			if ( count( $candidates ) >= 6 ) {
				break;
			}
		}
	}

	if ( empty( $candidates ) ) {
		$plain = html_entity_decode( wp_strip_all_tags( $content_clean ), ENT_QUOTES, 'UTF-8' );
		$plain = teoriageek_strip_emojis( $plain );
		if ( mb_strlen( $plain ) > 20 ) {
			$candidates[] = $plain;
		}
	}

	$sentences = array();
	foreach ( $candidates as $block ) {
		$parts = preg_split( '/(?<=[.!?])\s+/u', trim( $block ) );
		foreach ( (array) $parts as $sent ) {
			$sent = trim( $sent );
			if ( mb_strlen( $sent ) >= 28 ) {
				if ( mb_strlen( $sent ) > 145 ) {
					$sent = rtrim( mb_substr( $sent, 0, 142 ) ) . '…';
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
		$sentences[] = html_entity_decode( get_the_title( $post_id ), ENT_QUOTES, 'UTF-8' );
	}

	return array_slice( $sentences, 0, 3 );
}

/**
 * Gera resumo limpo (máximo 240 chars) para a Lâmina 1 do Reels.
 *
 * @param int $post_id ID do post.
 * @return string
 */
function teoriageek_get_reels_summary( $post_id ) {
	$excerpt = get_post_field( 'post_excerpt', $post_id );
	if ( empty( $excerpt ) ) {
		$bullets = teoriageek_get_post_bullets( $post_id );
		$excerpt = implode( ' ', array_slice( $bullets, 0, 2 ) );
	}
	$clean = html_entity_decode( wp_strip_all_tags( (string) $excerpt ), ENT_QUOTES, 'UTF-8' );
	$clean = teoriageek_strip_emojis( $clean );
	if ( mb_strlen( $clean ) > 235 ) {
		$clean = rtrim( mb_substr( $clean, 0, 232 ) ) . '…';
	}
	return $clean;
}

/**
 * Retorna dados de fonte externa opcional (vazio em matérias 100% autorais).
 *
 * @param int $post_id ID do post.
 * @return array{name:string,url:string}|null
 */
function teoriageek_get_external_source( $post_id ) {
	$name = trim( (string) get_post_meta( $post_id, '_tg_source_name', true ) );
	$url  = teoriageek_safe_http_url( (string) get_post_meta( $post_id, '_tg_source_url', true ) );

	if ( '' === $name && '' === $url ) {
		return null;
	}

	return array(
		'name' => $name ?: wp_parse_url( $url, PHP_URL_HOST ),
		'url'  => $url,
	);
}

/**
 * Retorna o slug mapeado de uma categoria configurável no Personalizador.
 *
 * @param string $slot Chave do slot (destaque, noticias, criticas, reviews, especiais).
 * @return string
 */
function teoriageek_get_mapped_category_slug( $slot ) {
	$defaults = array(
		'destaque'  => 'destaque',
		'noticias'  => 'noticias',
		'criticas'  => 'criticas',
		'reviews'   => 'reviews',
		'especiais' => 'especial-teoria-geek',
	);
	$default = isset( $defaults[ $slot ] ) ? $defaults[ $slot ] : '';
	return sanitize_title( (string) get_theme_mod( 'teoriageek_cat_' . $slot, $default ) );
}

/**
 * Retorna redes sociais configuradas (pré-populadas com as contas reais do Teoria Geek).
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
		$url = teoriageek_safe_http_url( $val );
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
 * Renderiza ícones SVG inline estilo Lucide (zero emojis Unicode, zero fonte de ícone externa).
 *
 * @param string $name  Nome do ícone.
 * @param string $class Classes CSS adicionais.
 * @return string Markup SVG seguro.
 */
function teoriageek_icon( $name, $class = 'h-4 w-4' ) {
	$c = esc_attr( $class );
	$attrs = 'class="' . $c . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';

	$paths = array(
		'search'        => '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
		'sun'           => '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
		'moon'          => '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
		'film'          => '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/>',
		'play'          => '<polygon points="6 3 20 12 6 21 6 3"/>',
		'menu'          => '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
		'x'             => '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
		'zap'           => '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
		'clock'         => '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
		'heart'         => '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
		'bookmark'      => '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
		'share'         => '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
		'message'       => '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
		'arrow-right'   => '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
		'chevron-right' => '<path d="m9 18 6-6-6-6"/>',
		'chevron-left'  => '<path d="m15 18-6-6 6-6"/>',
		'chevron-up'    => '<path d="m18 15-6-6-6 6"/>',
		'chevron-down'  => '<path d="m6 9 6 6 6-6"/>',
		'external'      => '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
		'flame'         => '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
		'compass'       => '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
		'star'          => '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
		'list-checks'   => '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
		'send'          => '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
		'trending'      => '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
		'radio'         => '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>',
		'book-open'     => '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
		'check'         => '<path d="M20 6 9 17l-5-5"/>',
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
 * Gera arte vetorial Pop-Art de fallback para posts antigos sem imagem destacada.
 *
 * @param string $category_slug Slug da categoria principal.
 * @param bool   $full_bleed    Se deve renderizar no formato vertical full-bleed (Reels).
 * @return string HTML seguro com SVG.
 */
function teoriageek_render_fallback_art( $category_slug, $full_bleed = false ) {
	$style = teoriageek_get_category_style( $category_slug );
	$art   = $style['art'];

	$palettes = array(
		'games'  => array( '#0F172A', '#1D4ED8', '#2563EB', '#FFD600', 'PLAY!' ),
		'cinema' => array( '#062C22', '#047857', '#059669', '#FFD600', 'CINE!' ),
		'animes' => array( '#082F49', '#0E7490', '#06B6D4', '#FFD600', 'POP!' ),
		'comics' => array( '#451A03', '#B45309', '#D97706', '#FFD600', 'HQ!' ),
		'tech'   => array( '#2E1065', '#6D28D9', '#7C3AED', '#FFD600', 'GEEK!' ),
	);
	$pal = isset( $palettes[ $art ] ) ? $palettes[ $art ] : $palettes['games'];

	$bg = $full_bleed
		? sprintf( 'radial-gradient(circle at 50%% 34%%, %s 0%%, %s 55%%, %s 100%%)', $pal[2], $pal[1], $pal[0] )
		: sprintf( 'linear-gradient(135deg, %s 0%%, %s 55%%, %s 100%%)', $pal[0], $pal[1], $pal[2] );

	$svg = '<svg viewBox="0 0 640 360" preserveAspectRatio="xMidYMid meet" class="block h-full w-full" aria-hidden="true" focusable="false">';
	$svg .= '<polygon points="320,38 358,118 446,96 398,166 476,204 390,224 414,306 334,264 282,322 266,240 182,254 226,184 156,138 242,126 236,48 302,102" fill="' . esc_attr( $pal[3] ) . '" stroke="#111111" stroke-width="8" stroke-linejoin="round"/>';
	$svg .= '<rect x="235" y="142" width="170" height="68" rx="10" transform="rotate(-4 320 176)" fill="#111111" stroke="' . esc_attr( $pal[3] ) . '" stroke-width="5"/>';
	$svg .= '<text x="320" y="188" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="38" letter-spacing="2" fill="' . esc_attr( $pal[3] ) . '">' . esc_html( $pal[4] ) . '</text>';
	$svg .= '</svg>';

	if ( $full_bleed ) {
		return '<div class="relative h-full w-full overflow-hidden" style="background:' . esc_attr( $bg ) . ';" aria-hidden="true">'
			. '<div class="comic-sunburst pointer-events-none absolute inset-0 opacity-75"></div>'
			. '<div class="bg-halftone-overlay pointer-events-none absolute inset-0 opacity-60"></div>'
			. '<div class="relative z-10 flex h-[56%] w-full items-center justify-center pt-10">' . $svg . '</div>'
			. '</div>';
	}

	return '<div class="relative flex h-full w-full items-center justify-center overflow-hidden" style="background:' . esc_attr( $bg ) . ';" aria-hidden="true">'
		. '<div class="comic-sunburst pointer-events-none absolute inset-0 opacity-55"></div>'
		. '<div class="bg-halftone-overlay pointer-events-none absolute inset-0 opacity-45"></div>'
		. '<div class="relative z-10 h-full w-full">' . $svg . '</div>'
		. '</div>';
}

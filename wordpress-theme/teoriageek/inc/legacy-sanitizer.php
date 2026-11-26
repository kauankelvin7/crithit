<?php
/**
 * Teoria Geek — Higiene de conteúdo legado em tempo de renderização (somente leitura no banco).
 *
 * Neutraliza shortcodes órfãos de temas/builders anteriores (Newspaper/tagDiv, WPBakery/VC,
 * Pixwell/Ruby Composer e plugins inativos) sem apagar texto útil, envolve iframes órfãos em
 * containers responsivos e injeta opcionalmente o slot de anúncio no meio do artigo sem CLS.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Decodifica com segurança blocos [vc_raw_html] legados caso contenham HTML editorial seguro.
 *
 * @param array $matches Captura regex.
 * @return string
 */
function teoriageek_decode_vc_raw_html( $matches ) {
	$encoded = trim( wp_strip_all_tags( (string) $matches[1] ) );
	if ( '' === $encoded ) {
		return '';
	}
	$raw_url = rawurldecode( (string) base64_decode( $encoded, true ) );
	if ( '' === $raw_url || preg_match( '/<(script|style|link)\b/i', $raw_url ) ) {
		return '';
	}
	return wp_kses_post( $raw_url );
}

/**
 * Limpa shortcodes órfãos de construtores visuais antes/depois do do_shortcode().
 *
 * @param string $content Conteúdo bruto ou pré-processado.
 * @return string
 */
function teoriageek_strip_orphan_legacy_shortcodes( $content ) {
	if ( '' === $content || false === strpos( $content, '[' ) ) {
		return $content;
	}

	// 1. [vc_raw_html]base64[/vc_raw_html] quando WPBakery não está ativo.
	if ( ! shortcode_exists( 'vc_raw_html' ) && false !== stripos( $content, '[vc_raw_html' ) ) {
		$content = (string) preg_replace_callback(
			'#\[vc_raw_html[^\]]*\]([\s\S]*?)\[/vc_raw_html\]#i',
			'teoriageek_decode_vc_raw_html',
			$content
		);
	}

	// 2. Desempacota containers estruturais mantendo todo o texto/HTML interno intacto.
	$wrapper_prefixes = array(
		'vc_row',
		'vc_row_inner',
		'vc_column',
		'vc_column_inner',
		'vc_column_text',
		'vc_section',
		'vc_tta_tabs',
		'vc_tta_section',
		'tdc_zone',
		'rbc_sec_content',
		'rbc_sec_fullwidth',
	);

	foreach ( $wrapper_prefixes as $tag ) {
		if ( ! shortcode_exists( $tag ) ) {
			$quoted  = preg_quote( $tag, '#' );
			$content = (string) preg_replace( '#\[/?' . $quoted . '(?:\s[^\]]*)?\]#i', '', $content );
		}
	}

	// 3. Remove blocos dinâmicos exclusivos do tema antigo (td_block_*, tdb_*, tdc_*, vc_empty_space, etc.) quando inativos.
	$content = (string) preg_replace_callback(
		'#\[(/?)([a-zA-Z0-9_-]+)([^\]]*)\]#',
		static function ( $m ) {
			$slash = $m[1];
			$tag   = strtolower( $m[2] );

			// Preserva qualquer shortcode que possua plugin/handler registrado no WordPress atual.
			if ( shortcode_exists( $tag ) ) {
				return $m[0];
			}

			// Prefixos conhecidos de temas/plugins legados desativados.
			$legacy_prefixes = array(
				'vc_',
				'td_',
				'tdc_',
				'tdb_',
				'tdm_',
				'tds_',
				'rbc_',
				'ruby_',
				'pixwell_',
				'tmm',
				'bbp-',
				'wpforms',
				'bwg_',
				'yop_poll',
				'totalpoll',
				'Total_Soft_Poll',
				'asq_',
			);

			foreach ( $legacy_prefixes as $prefix ) {
				if ( 0 === stripos( $tag, $prefix ) ) {
					return '';
				}
			}

			return $m[0];
		},
		$content
	);

	return $content;
}
add_filter( 'the_content', 'teoriageek_strip_orphan_legacy_shortcodes', 8 );
add_filter( 'get_the_excerpt', 'teoriageek_strip_orphan_legacy_shortcodes', 8 );

/**
 * Repara mojibake UTF-8 e filtra Ficha Técnica de resumos em tempo de renderização.
 */
function teoriageek_filter_clean_text_output( $text ) {
	if ( is_admin() ) {
		return $text;
	}
	return teoriageek_fix_mojibake( (string) $text );
}
add_filter( 'the_title', 'teoriageek_filter_clean_text_output', 5 );
add_filter( 'single_post_title', 'teoriageek_filter_clean_text_output', 5 );
add_filter( 'the_content', 'teoriageek_filter_clean_text_output', 5 );

function teoriageek_filter_clean_excerpt( $excerpt ) {
	if ( is_admin() ) {
		return $excerpt;
	}
	$clean = teoriageek_fix_mojibake( teoriageek_strip_ficha_tecnica( (string) $excerpt ) );
	return trim( $clean );
}
add_filter( 'get_the_excerpt', 'teoriageek_filter_clean_excerpt', 5 );
add_filter( 'the_excerpt', 'teoriageek_filter_clean_excerpt', 5 );

/**
 * Repara mojibake no título da aba do navegador (<title>).
 *
 * @param array<string, string> $parts Partes do título.
 * @return array<string, string>
 */
function teoriageek_filter_document_title_mojibake( $parts ) {
	foreach ( $parts as $k => $v ) {
		if ( is_string( $v ) ) {
			$parts[ $k ] = teoriageek_fix_mojibake( $v );
		}
	}
	return $parts;
}
add_filter( 'document_title_parts', 'teoriageek_filter_document_title_mojibake', 20 );

/**
 * Shortcode nativo [spoiler titulo="..."]Conteúdo oculto[/spoiler] usando <details><summary> + CSS puro.
 *
 * @param array<string, string> $atts    Atributos.
 * @param string|null           $content Conteúdo interno.
 * @return string
 */
function teoriageek_spoiler_shortcode( $atts, $content = null ) {
	$atts  = shortcode_atts(
		array(
			'titulo' => __( 'Alerta de Spoiler — Clique para revelar', 'teoriageek' ),
		),
		(array) $atts,
		'spoiler'
	);
	$inner = do_shortcode( wp_kses_post( (string) $content ) );
	return sprintf(
		'<details class="tg-spoiler"><summary class="tg-spoiler-summary">%1$s</summary><div class="tg-spoiler-body">%2$s</div></details>',
		esc_html( $atts['titulo'] ),
		$inner
	);
}
add_shortcode( 'spoiler', 'teoriageek_spoiler_shortcode' );

/**
 * Pós-processa o HTML renderizado de matérias e páginas:
 * - Envolve iframes de vídeo/áudio órfãos em wrapper responsivo sem quebrar embeds já tratados;
 * - Adiciona lazy loading seguro em imagens internas abaixo da dobra;
 * - Remove parágrafos vazios consecutivos gerados por shortcodes removidos;
 * - Injeta opcionalmente o slot de monetização no meio do artigo (após o 3º parágrafo).
 *
 * @param string $html HTML renderizado por the_content.
 * @return string
 */
function teoriageek_enhance_rendered_content( $html ) {
	if ( is_admin() || is_feed() || '' === trim( $html ) ) {
		return $html;
	}

	// 1. Limpa excesso de <p>&nbsp;</p> consecutivos herdados de colagens antigas.
	$html = (string) preg_replace( '#^(?:\s*<p[^>]*>(?:&nbsp;|\xc2\xa0|\s)*</p>\s*)+#iu', '', $html );
	$html = (string) preg_replace( '#(?:\s*<p[^>]*>(?:&nbsp;|\xc2\xa0|\s)*</p>\s*){2,}#iu', '', $html );

	// 2. Garante alt acessível (em imagens legadas sem atributo alt, como img.selo), lazy loading e decoding async.
	$html = (string) preg_replace_callback(
		'#<img\b([^>]*)>#i',
		static function ( $m ) {
			$attrs    = $m[1];
			$self_end = '';
			if ( preg_match( '#/\s*$#', $attrs ) ) {
				$attrs    = (string) preg_replace( '#/\s*$#', '', $attrs );
				$self_end = ' /';
			}
			if ( ! preg_match( '/\balt\s*=/i', $attrs ) ) {
				$alt_text = '';
				if ( preg_match( '/selo-teoria-geek-[a-z0-9_-]*?-([0-9]{1,2}(?:[.,][0-9])?)\.(?:png|webp|jpe?g)/i', $attrs, $sm ) ) {
					$alt_text = sprintf( 'Selo Teoria Geek — Nota %s de 10', str_replace( ',', '.', $sm[1] ) );
				}
				$attrs .= ' alt="' . esc_attr( $alt_text ) . '"';
			}
			if ( false === stripos( $attrs, 'loading=' ) ) {
				$attrs .= ' loading="lazy"';
			}
			if ( false === stripos( $attrs, 'decoding=' ) ) {
				$attrs .= ' decoding="async"';
			}
			return '<img' . $attrs . $self_end . '>';
		},
		$html
	);

	// 3. Envolve iframes de YouTube/Vimeo/Dailymotion/Twitch que não estejam dentro de container responsivo.
	$html = (string) preg_replace_callback(
		'#(<div[^>]*class=["\'][^"\']*(?:youtube-embed|wp-block-embed|tg-embed-responsive)[^"\']*["\'][^>]*>[\s\S]*?</div>)|(<iframe\b[^>]*src=["\'][^"\']*(?:youtube\.com|youtu\.be|youtube-nocookie\.com|player\.vimeo\.com|player\.twitch\.tv|dailymotion\.com)[^"\']*["\'][^>]*>\s*</iframe>)#i',
		static function ( $m ) {
			if ( ! empty( $m[1] ) ) {
				return $m[1];
			}
			$iframe = $m[2];
			if ( false === stripos( $iframe, 'loading=' ) ) {
				$iframe = str_ireplace( '<iframe', '<iframe loading="lazy"', $iframe );
			}
			return '<div class="tg-embed-responsive">' . $iframe . '</div>';
		},
		$html
	);

	// 4. Injeção opcional de slot de anúncio no meio do artigo (apenas em single post principal).
	if ( is_singular( 'post' ) && in_the_loop() && is_main_query() ) {
		$mid_ad = teoriageek_get_ad_slot_markup( 'mid_article' );
		if ( '' !== $mid_ad ) {
			$parts = explode( '</p>', $html );
			if ( count( $parts ) > 4 ) {
				$parts[2] .= '</p>' . $mid_ad;
				$rebuilt   = '';
				$last_idx  = count( $parts ) - 1;
				foreach ( $parts as $idx => $chunk ) {
					$rebuilt .= $chunk;
					if ( $idx !== 2 && $idx < $last_idx ) {
						$rebuilt .= '</p>';
					}
				}
				$html = $rebuilt;
			}
		}
	}

	return $html;
}
add_filter( 'the_content', 'teoriageek_enhance_rendered_content', 20 );

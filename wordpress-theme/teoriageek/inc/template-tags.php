<?php
/**
 * Teoria Geek — Template Tags reutilizáveis (badges, breadcrumbs, paginação e menus).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Renderiza o selo colorido da categoria editorial.
 *
 * @param WP_Term|null $term   Categoria.
 * @param bool         $linked Se o selo deve ser um link para o arquivo da categoria.
 * @param string       $size   'sm' ou 'md'.
 */
function teoriageek_category_badge( $term, $linked = false, $size = 'sm' ) {
	if ( ! $term instanceof WP_Term ) {
		return;
	}
	$style      = teoriageek_get_category_style( $term->slug );
	$size_class = ( 'md' === $size ) ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';
	$inline     = sprintf( 'background-color:%s;color:%s;', $style['fill'], $style['ink'] );

	if ( $linked ) {
		printf(
			'<a href="%1$s" class="inline-flex items-center rounded font-mono %2$s font-bold uppercase tracking-wider transition-opacity hover:opacity-90" style="%3$s">%4$s</a>',
			esc_url( get_category_link( $term->term_id ) ),
			esc_attr( $size_class ),
			esc_attr( $inline ),
			esc_html( $term->name )
		);
		return;
	}

	printf(
		'<span class="inline-flex items-center rounded font-mono %1$s font-bold uppercase tracking-wider" style="%2$s">%3$s</span>',
		esc_attr( $size_class ),
		esc_attr( $inline ),
		esc_html( $term->name )
	);
}

/**
 * Renderiza breadcrumb acessível para matérias e arquivos.
 */
function teoriageek_breadcrumb() {
	echo '<nav aria-label="' . esc_attr__( 'Navegação estrutural', 'teoriageek' ) . '" class="mb-4 flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-muted">';
	echo '<a href="' . esc_url( home_url( '/' ) ) . '" class="font-bold text-ink-secondary hover:text-brand hover:underline">' . esc_html__( 'Capa', 'teoriageek' ) . '</a>';

	if ( is_singular( 'post' ) ) {
		$cat = teoriageek_get_primary_category( get_the_ID() );
		if ( $cat ) {
			echo '<span aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
			echo '<a href="' . esc_url( get_category_link( $cat->term_id ) ) . '" class="font-bold text-ink-secondary hover:text-brand hover:underline">' . esc_html( $cat->name ) . '</a>';
		}
		$fmt = teoriageek_get_post_format_badge( get_the_ID() );
		echo '<span aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span aria-current="page" class="text-ink-primary">' . esc_html( $fmt['label'] ) . '</span>';
	} elseif ( is_category() ) {
		echo '<span aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span aria-current="page" class="font-bold text-ink-primary">' . esc_html( single_cat_title( '', false ) ) . '</span>';
	} elseif ( is_tag() ) {
		echo '<span aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span aria-current="page" class="font-bold text-ink-primary">#' . esc_html( single_tag_title( '', false ) ) . '</span>';
	} elseif ( is_search() ) {
		echo '<span aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span aria-current="page" class="font-bold text-ink-primary">' . esc_html__( 'Busca', 'teoriageek' ) . '</span>';
	} elseif ( is_archive() ) {
		echo '<span aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span aria-current="page" class="font-bold text-ink-primary">' . wp_kses_post( get_the_archive_title() ) . '</span>';
	}

	echo '</nav>';
}

/**
 * Renderiza menu fallback elegante caso o editor ainda não tenha atribuído um menu em Aparência > Menus.
 */
function teoriageek_fallback_primary_menu() {
	$preferred_slugs = array( 'noticias', 'games', 'filmes', 'series', 'animes-mangas', 'livros-hqs', 'criticas', 'reviews', 'especial-teoria-geek' );
	echo '<ul class="tg-primary-menu flex items-center gap-1">';
	echo '<li><a href="' . esc_url( home_url( '/' ) ) . '">' . esc_html__( 'Capa', 'teoriageek' ) . '</a></li>';
	$shown = 0;
	foreach ( $preferred_slugs as $slug ) {
		$term = get_category_by_slug( $slug );
		if ( $term && ! is_wp_error( $term ) ) {
			echo '<li><a href="' . esc_url( get_category_link( $term->term_id ) ) . '">' . esc_html( $term->name ) . '</a></li>';
			$shown++;
			if ( $shown >= 6 ) {
				break;
			}
		}
	}
	echo '</ul>';
}

/**
 * Paginação editorial estilizada para arquivos e resultados de busca.
 */
function teoriageek_pagination() {
	$links = paginate_links(
		array(
			'type'      => 'array',
			'prev_text' => __( 'Anterior', 'teoriageek' ),
			'next_text' => __( 'Próxima', 'teoriageek' ),
		)
	);

	if ( empty( $links ) ) {
		return;
	}

	echo '<nav aria-label="' . esc_attr__( 'Paginação de matérias', 'teoriageek' ) . '" class="mt-10 flex flex-wrap items-center justify-center gap-2">';
	foreach ( $links as $link ) {
		$is_current = strpos( $link, 'current' ) !== false;
		$wrap_class = $is_current
			? 'tg-page-link is-current'
			: 'tg-page-link';
		echo '<span class="' . esc_attr( $wrap_class ) . '">' . wp_kses_post( $link ) . '</span>';
	}
	echo '</nav>';
}

/**
 * Renderiza a logo do portal no cabeçalho (custom_logo, logo escura opcional ou selo textual Pop-Art).
 */
function teoriageek_render_brand_logo() {
	$site_name = get_theme_mod( 'teoriageek_site_name', get_bloginfo( 'name' ) ?: 'Teoria Geek' );
	$dark_logo = get_theme_mod( 'teoriageek_logo_dark', '' );
	$logo_id   = get_theme_mod( 'custom_logo' );
	$logo_url  = $dark_logo ?: ( $logo_id ? wp_get_attachment_image_url( $logo_id, 'medium' ) : '' );

	echo '<a href="' . esc_url( home_url( '/' ) ) . '" class="inline-flex shrink-0 items-center gap-2 focus-visible:outline-highlight" aria-label="' . esc_attr( $site_name . ' — Página inicial' ) . '">';
	if ( $logo_url ) {
		printf(
			'<img src="%1$s" alt="%2$s" class="h-10 w-auto max-w-[165px] object-contain" decoding="async" />',
			esc_url( $logo_url ),
			esc_attr( $site_name )
		);
	} else {
		printf(
			'<span class="inline-flex items-center rounded border-2 border-highlight bg-brand-fill px-3 py-1 font-display text-2xl leading-none tracking-wider text-white shadow-hard-sm">%s</span>',
			esc_html( strtoupper( $site_name ) )
		);
	}
	echo '</a>';
}

/**
 * Busca os posts mais lidos usando o contador nativo `_tg_views_count` (com fallback para recentes).
 *
 * @param int   $limit       Quantidade desejada.
 * @param array $exclude_ids IDs a excluir opcionalmente.
 * @return WP_Post[]
 */
function teoriageek_get_most_read_posts( $limit = 5, $exclude_ids = array() ) {
	$query = new WP_Query(
		array(
			'post_type'           => 'post',
			'post_status'         => 'publish',
			'posts_per_page'      => $limit,
			'post__not_in'        => array_map( 'intval', $exclude_ids ),
			'ignore_sticky_posts' => true,
			'meta_key'            => '_tg_views_count',
			'orderby'             => 'meta_value_num',
			'order'               => 'DESC',
			'no_found_rows'       => true,
		)
	);

	$posts = $query->posts;
	if ( count( $posts ) < $limit ) {
		$already  = array_merge( array_map( 'intval', $exclude_ids ), wp_list_pluck( $posts, 'ID' ) );
		$fallback = new WP_Query(
			array(
				'post_type'           => 'post',
				'post_status'         => 'publish',
				'posts_per_page'      => $limit - count( $posts ),
				'post__not_in'        => $already,
				'ignore_sticky_posts' => true,
				'orderby'             => 'comment_count date',
				'order'               => 'DESC',
				'no_found_rows'       => true,
			)
		);
		$posts = array_merge( $posts, $fallback->posts );
	}

	return $posts;
}

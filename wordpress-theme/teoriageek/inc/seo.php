<?php
/**
 * Teoria Geek — SEO Técnico enxuto (OpenGraph, Twitter Cards e JSON-LD NewsArticle, Review, BreadcrumbList e ProfilePage).
 * Suprimido automaticamente quando plugins dedicados de SEO (Yoast, AIOSEO, RankMath) estão ativos.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Verifica se há um plugin completo de SEO gerenciando meta tags sociais e schema.
 *
 * @return bool
 */
function teoriageek_has_seo_plugin() {
	return defined( 'WPSEO_VERSION' ) || defined( 'AIOSEO_VERSION' ) || defined( 'RANK_MATH_VERSION' );
}

/**
 * Imprime meta tags OpenGraph e Twitter Cards enxutas no <head> quando não há plugin SEO ativo.
 */
function teoriageek_output_social_meta_tags() {
	if ( teoriageek_has_seo_plugin() || is_admin() || is_feed() ) {
		return;
	}

	$site_name = (string) get_theme_mod( 'teoriageek_site_name', get_bloginfo( 'name' ) ?: 'Teoria Geek' );
	$og_type   = is_singular( 'post' ) ? 'article' : 'website';
	$og_url    = is_singular() ? get_permalink() : home_url( add_query_arg( array(), $GLOBALS['wp']->request ?? '' ) );
	$og_title  = wp_get_document_title();
	$og_desc   = (string) get_bloginfo( 'description' );
	$og_image  = teoriageek_get_brand_logo_url( 'header' );

	if ( is_singular( 'post' ) ) {
		$pid      = (int) get_the_ID();
		$og_title = teoriageek_clean_title( get_the_title( $pid ) );
		$lead     = teoriageek_get_post_lead( $pid, 165 );
		if ( '' !== $lead ) {
			$og_desc = $lead;
		}
		$thumb = get_the_post_thumbnail_url( $pid, 'tg-hero' );
		if ( $thumb ) {
			$og_image = $thumb;
		}
	} elseif ( is_category() || is_tag() || is_tax() ) {
		$term_desc = trim( wp_strip_all_tags( (string) term_description() ) );
		if ( '' !== $term_desc ) {
			$og_desc = $term_desc;
		}
	}

	echo "\n<!-- Teoria Geek OpenGraph & Twitter Cards -->\n";
	echo '<meta property="og:locale" content="' . esc_attr( get_locale() ) . '" />' . "\n";
	echo '<meta property="og:site_name" content="' . esc_attr( $site_name ) . '" />' . "\n";
	echo '<meta property="og:type" content="' . esc_attr( $og_type ) . '" />' . "\n";
	echo '<meta property="og:title" content="' . esc_attr( $og_title ) . '" />' . "\n";
	echo '<meta property="og:description" content="' . esc_attr( $og_desc ) . '" />' . "\n";
	echo '<meta property="og:url" content="' . esc_url( (string) $og_url ) . '" />' . "\n";
	if ( '' !== $og_image ) {
		echo '<meta property="og:image" content="' . esc_url( $og_image ) . '" />' . "\n";
	}
	echo '<meta name="twitter:card" content="summary_large_image" />' . "\n";
	echo '<meta name="twitter:title" content="' . esc_attr( $og_title ) . '" />' . "\n";
	echo '<meta name="twitter:description" content="' . esc_attr( $og_desc ) . '" />' . "\n";
	if ( '' !== $og_image ) {
		echo '<meta name="twitter:image" content="' . esc_url( $og_image ) . '" />' . "\n";
	}
	if ( is_singular( 'post' ) ) {
		echo '<meta property="article:published_time" content="' . esc_attr( get_the_date( DATE_W3C ) ) . '" />' . "\n";
		echo '<meta property="article:modified_time" content="' . esc_attr( get_the_modified_date( DATE_W3C ) ) . '" />' . "\n";
	}
}
add_action( 'wp_head', 'teoriageek_output_social_meta_tags', 5 );

/**
 * Mapeia a categoria editorial para um tipo Schema.org aceito pelo Google Rich Results em Review.
 *
 * @param WP_Term|null $cat Categoria principal do post.
 * @return string
 */
function teoriageek_resolve_review_schema_type( $cat ) {
	if ( ! $cat instanceof WP_Term ) {
		return 'CreativeWork';
	}
	$slug = sanitize_title( (string) $cat->slug );
	if ( preg_match( '/filme|cinema|movie/', $slug ) ) {
		return 'Movie';
	}
	if ( preg_match( '/serie|tv|streaming|anime/', $slug ) ) {
		return 'TVSeries';
	}
	if ( preg_match( '/game|jogo|xbox|playstation|nintendo|pc/', $slug ) ) {
		return 'VideoGame';
	}
	if ( preg_match( '/hq|manga|livro|quadrinho|comic/', $slug ) ) {
		return 'Book';
	}
	if ( preg_match( '/tech|hardware|gadget|hands-on/', $slug ) ) {
		return 'Product';
	}
	return 'CreativeWork';
}

/**
 * Monta o JSON-LD estruturado (NewsArticle ou Review com reviewRating) para um post individual.
 *
 * @param int $post_id ID do post.
 * @return array<string, mixed>
 */
function teoriageek_build_single_schema( $post_id ) {
	$post_id     = (int) $post_id;
	$title       = teoriageek_clean_title( get_the_title( $post_id ) );
	$lead        = teoriageek_get_post_lead( $post_id, 200 );
	$author_id   = (int) get_post_field( 'post_author', $post_id );
	$author_name = get_the_author_meta( 'display_name', $author_id );
	$author_url  = get_author_posts_url( $author_id );
	$thumb_url   = get_the_post_thumbnail_url( $post_id, 'full' );
	$cat         = teoriageek_get_primary_category( $post_id );
	$review      = teoriageek_get_review_details( $post_id );
	$logo_url    = teoriageek_get_brand_logo_url( 'header' );

	$publisher = array(
		'@type' => 'Organization',
		'name'  => (string) get_theme_mod( 'teoriageek_site_name', get_bloginfo( 'name' ) ?: 'Teoria Geek' ),
		'url'   => home_url( '/' ),
	);
	if ( '' !== $logo_url ) {
		$publisher['logo'] = array(
			'@type' => 'ImageObject',
			'url'   => $logo_url,
		);
	}

	if ( null !== $review ) {
		$schema = array(
			'@context'      => 'https://schema.org',
			'@type'         => 'Review',
			'name'          => $title,
			'headline'      => $title,
			'description'   => '' !== $lead ? $lead : $title,
			'datePublished' => get_the_date( DATE_W3C, $post_id ),
			'dateModified'  => get_the_modified_date( DATE_W3C, $post_id ),
			'url'           => get_permalink( $post_id ),
			'author'        => array(
				'@type' => 'Person',
				'name'  => $author_name,
				'url'   => $author_url,
			),
			'publisher'     => $publisher,
			'itemReviewed'  => array(
				'@type' => teoriageek_resolve_review_schema_type( $cat ),
				'name'  => $title,
			),
			'reviewRating'  => array(
				'@type'       => 'Rating',
				'ratingValue' => (float) $review['score'],
				'bestRating'  => 10,
				'worstRating' => 0,
			),
		);
	} else {
		$schema = array(
			'@context'         => 'https://schema.org',
			'@type'            => 'NewsArticle',
			'headline'         => $title,
			'description'      => '' !== $lead ? $lead : $title,
			'datePublished'    => get_the_date( DATE_W3C, $post_id ),
			'dateModified'     => get_the_modified_date( DATE_W3C, $post_id ),
			'mainEntityOfPage' => array(
				'@type' => 'WebPage',
				'@id'   => get_permalink( $post_id ),
			),
			'author'           => array(
				'@type' => 'Person',
				'name'  => $author_name,
				'url'   => $author_url,
			),
			'publisher'        => $publisher,
		);
		if ( $cat ) {
			$schema['articleSection'] = html_entity_decode( $cat->name, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		}
	}

	if ( $thumb_url ) {
		$schema['image'] = array( $thumb_url );
	}

	return $schema;
}

/**
 * Emite schema BreadcrumbList em JSON-LD quando não há plugin dedicado de SEO ativo.
 */
function teoriageek_output_breadcrumb_schema() {
	if ( teoriageek_has_seo_plugin() || is_front_page() || is_home() ) {
		return;
	}
	$items = array(
		array(
			'@type'    => 'ListItem',
			'position' => 1,
			'name'     => __( 'Capa', 'teoriageek' ),
			'item'     => home_url( '/' ),
		),
	);
	$pos   = 2;
	if ( is_singular( 'post' ) ) {
		$cat = teoriageek_get_primary_category( get_the_ID() );
		if ( $cat ) {
			$items[] = array(
				'@type'    => 'ListItem',
				'position' => $pos++,
				'name'     => html_entity_decode( $cat->name, ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
				'item'     => get_category_link( $cat->term_id ),
			);
		}
		$items[] = array(
			'@type'    => 'ListItem',
			'position' => $pos,
			'name'     => teoriageek_clean_title( get_the_title() ),
			'item'     => get_permalink(),
		);
	} elseif ( is_category() || is_tag() || is_tax( 'universo' ) ) {
		$term = get_queried_object();
		if ( $term instanceof WP_Term ) {
			$items[] = array(
				'@type'    => 'ListItem',
				'position' => $pos,
				'name'     => html_entity_decode( $term->name, ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
				'item'     => get_term_link( $term ),
			);
		}
	}
	if ( count( $items ) < 2 ) {
		return;
	}
	$schema = array(
		'@context'        => 'https://schema.org',
		'@type'           => 'BreadcrumbList',
		'itemListElement' => $items,
	);
	echo '<script type="application/ld+json">' . wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . "</script>
";
}
add_action( 'wp_head', 'teoriageek_output_breadcrumb_schema', 6 );

/**
 * Evita indexação de páginas de busca, 404 e combinações de filtros (?ordem=... / ?tg_cat=...).
 *
 * @param array<string, mixed> $robots Diretivas wp_robots.
 * @return array<string, mixed>
 */
function teoriageek_filter_wp_robots( $robots ) {
	$has_filter = isset( $_GET['ordem'] ) || isset( $_GET['tg_cat'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( is_search() || is_404() || ( ( is_category() || is_tax( 'universo' ) ) && $has_filter ) ) {
		$robots['noindex'] = true;
		$robots['follow']  = true;
	}
	return $robots;
}
add_filter( 'wp_robots', 'teoriageek_filter_wp_robots', 20 );

/**
 * Garante canonical limpo (sem ?ordem=...) em categorias/universos no Yoast ou no fallback nativo.
 *
 * @param string $canonical URL canônica atual.
 * @return string
 */
function teoriageek_clean_filtered_canonical( $canonical ) {
	if ( ( is_category() || is_tax( 'universo' ) ) && isset( $_GET['ordem'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$term = get_queried_object();
		if ( $term instanceof WP_Term ) {
			$link = get_term_link( $term );
			if ( ! is_wp_error( $link ) ) {
				return (string) $link;
			}
		}
	}
	return $canonical;
}
add_filter( 'wpseo_canonical', 'teoriageek_clean_filtered_canonical', 20 );

/**
 * Emite JSON-LD ProfilePage/Person em páginas de autor (author.php) quando não há plugin SEO ativo.
 */
function teoriageek_output_author_schema() {
	if ( teoriageek_has_seo_plugin() || ! is_author() ) {
		return;
	}
	$author = get_queried_object();
	if ( ! $author instanceof WP_User ) {
		return;
	}
	$schema = array(
		'@context'   => 'https://schema.org',
		'@type'      => 'ProfilePage',
		'mainEntity' => array(
			'@type'       => 'Person',
			'name'        => $author->display_name,
			'url'         => get_author_posts_url( (int) $author->ID ),
			'description' => trim( (string) get_the_author_meta( 'description', (int) $author->ID ) ),
			'image'       => get_avatar_url( (int) $author->ID, array( 'size' => 160 ) ),
		),
	);
	echo '<script type="application/ld+json">' . wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . "</script>
";
}
add_action( 'wp_head', 'teoriageek_output_author_schema', 7 );

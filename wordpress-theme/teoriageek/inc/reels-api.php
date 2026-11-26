<?php
/**
 * Teoria Geek — Rota virtual `/reels/` e endpoints REST `teoriageek/v1`
 * para Reels, Busca Instantânea, Curtidas, Visualizações e Comentários.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registra regra de rewrite para `/reels/` sem exigir criação manual de página no banco.
 */
function teoriageek_register_reels_rewrite() {
	add_rewrite_rule( '^reels/?$', 'index.php?teoriageek_reels=1', 'top' );
	if ( '2' !== get_option( 'teoriageek_rewrite_version' ) ) {
		flush_rewrite_rules( false );
		update_option( 'teoriageek_rewrite_version', '2', true );
	}
}
add_action( 'init', 'teoriageek_register_reels_rewrite' );

/**
 * Registra query var `teoriageek_reels`.
 *
 * @param string[] $vars Variáveis públicas.
 * @return string[]
 */
function teoriageek_register_query_vars( $vars ) {
	$vars[] = 'teoriageek_reels';
	return $vars;
}
add_filter( 'query_vars', 'teoriageek_register_query_vars' );

/**
 * Intercepta `/reels/` para carregar `page-reels.php` com HTTP 200.
 *
 * @param string $template Template atual.
 * @return string
 */
function teoriageek_reels_template_include( $template ) {
	if ( (int) get_query_var( 'teoriageek_reels', 0 ) === 1 ) {
		global $wp_query;
		$wp_query->is_404  = false;
		$wp_query->is_home = false;
		status_header( 200 );
		$reels_tpl = TEORIAGEEK_DIR . '/page-reels.php';
		if ( file_exists( $reels_tpl ) ) {
			return $reels_tpl;
		}
	}
	return $template;
}
add_filter( 'template_include', 'teoriageek_reels_template_include', 99 );

/**
 * Título amigável na aba do navegador para `/reels/`.
 *
 * @param array $title Partes do título.
 * @return array
 */
function teoriageek_reels_document_title( $title ) {
	if ( teoriageek_is_reels_page() ) {
		$title['title'] = __( 'Reels — Resumo Geek Vertical', 'teoriageek' );
	}
	return $title;
}
add_filter( 'document_title_parts', 'teoriageek_reels_document_title' );

/**
 * Serializa uma lista de posts para o player Reels fazendo batch-priming de views e autores
 * (eliminando consultas N+1).
 *
 * @param WP_Post[] $posts Lista de posts.
 * @return array<int, array<string, mixed>>
 */
function teoriageek_serialize_reels_batch( $posts ) {
	if ( empty( $posts ) ) {
		return array();
	}
	$ids        = array();
	$author_ids = array();
	foreach ( $posts as $p ) {
		if ( $p instanceof WP_Post ) {
			$ids[]        = (int) $p->ID;
			$author_ids[] = (int) $p->post_author;
		}
	}
	teoriageek_prime_post_views( $ids );
	if ( ! empty( $author_ids ) && function_exists( 'cache_users' ) ) {
		cache_users( array_values( array_unique( $author_ids ) ) );
	}
	return array_values( array_map( 'teoriageek_serialize_post_card', $posts ) );
}

/**
 * Formata um WP_Post para consumo leve no Reels e na Busca Instantânea.
 *
 * @param WP_Post $post Post publicado.
 * @return array<string, mixed>
 */
function teoriageek_serialize_post_card( $post ) {
	$pid   = (int) $post->ID;
	$cat   = teoriageek_get_primary_category( $pid );
	$style = teoriageek_get_category_style( $cat ? $cat->slug : 'noticias' );
	$fmt   = teoriageek_get_post_format_badge( $pid );
	$thumb = get_the_post_thumbnail_url( $pid, 'tg-card' );
	$src   = teoriageek_get_external_source( $pid );
	$score = teoriageek_get_post_score( $pid );

	return array(
		'id'            => $pid,
		'slug'          => $post->post_name,
		'title'         => teoriageek_clean_title( get_the_title( $pid ) ),
		'url'           => get_permalink( $pid ),
		'reelsUrl'      => teoriageek_get_reels_url( $post->post_name ),
		'summary'       => teoriageek_get_reels_summary( $pid ),
		'bullets'       => teoriageek_get_post_bullets( $pid ),
		'coverUrl'      => $thumb ? $thumb : '',
		'categoryName'  => $cat ? teoriageek_fix_mojibake( html_entity_decode( $cat->name, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) ) : 'GEEK',
		'categorySlug'  => $cat ? $cat->slug : 'noticias',
		'categoryUrl'   => $cat ? get_category_link( $cat->term_id ) : home_url( '/' ),
		'fillColor'     => $style['fill'],
		'inkColor'      => $style['ink'],
		'artKey'        => $style['art'],
		'formatLabel'   => $fmt['label'],
		'score'         => $score,
		'verdict'       => $score ? teoriageek_get_score_verdict( (float) $score ) : '',
		'authorName'    => get_the_author_meta( 'display_name', (int) $post->post_author ),
		'dateRelative'  => teoriageek_get_relative_date( $pid ),
		'readingTime'   => teoriageek_get_reading_time( $pid ),
		'views'         => teoriageek_get_post_views( $pid ),
		'likes'         => teoriageek_get_post_likes( $pid ),
		'commentsCount' => (int) get_comments_number( $pid ),
		'sourceName'    => $src ? $src['name'] : '',
		'sourceUrl'     => $src ? $src['url'] : '',
	);
}

/**
 * Registra endpoints REST `teoriageek/v1`.
 */
function teoriageek_register_rest_routes() {
	register_rest_route(
		'teoriageek/v1',
		'/search',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'permission_callback' => '__return_true',
			'args'                => array(
				'q' => array(
					'type'              => 'string',
					'required'          => true,
					'sanitize_callback' => 'sanitize_text_field',
				),
			),
			'callback'            => static function ( WP_REST_Request $request ) {
				$q = trim( (string) $request->get_param( 'q' ) );
				if ( mb_strlen( $q ) < 2 ) {
					return rest_ensure_response( array( 'items' => array() ) );
				}
				$query = new WP_Query(
					array(
						'post_type'              => 'post',
						'post_status'            => 'publish',
						's'                      => $q,
						'search_columns'         => array( 'post_title' ),
						'posts_per_page'         => 6,
						'ignore_sticky_posts'    => true,
						'no_found_rows'          => true,
						'update_post_meta_cache' => false,
					)
				);
				$items = array();
				foreach ( $query->posts as $post ) {
					$pid   = (int) $post->ID;
					$cat   = teoriageek_get_primary_category( $pid );
					$style = teoriageek_get_category_style( $cat ? $cat->slug : 'noticias' );
					$items[] = array(
						'id'           => $pid,
						'title'        => teoriageek_clean_title( get_the_title( $pid ) ),
						'url'          => get_permalink( $pid ),
						'categoryName' => $cat ? html_entity_decode( $cat->name, ENT_QUOTES, 'UTF-8' ) : 'GEEK',
						'fillColor'    => $style['fill'],
						'inkColor'     => $style['ink'],
						'dateRelative' => teoriageek_get_relative_date( $pid ),
					);
				}
				return rest_ensure_response( array( 'items' => $items ) );
			},
		)
	);

	register_rest_route(
		'teoriageek/v1',
		'/reels',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'permission_callback' => '__return_true',
			'callback'            => static function ( WP_REST_Request $request ) {
				$page     = max( 1, (int) $request->get_param( 'page' ) );
				$per_page = min( 16, max( 1, (int) ( $request->get_param( 'per_page' ) ?: 10 ) ) );
				$category = sanitize_title( (string) $request->get_param( 'category' ) );
				$tab      = sanitize_key( (string) $request->get_param( 'tab' ) );
				$focus    = sanitize_title( (string) $request->get_param( 'post' ) );
				$focus_id = (int) $request->get_param( 'id' );
				$slugs_q  = trim( (string) $request->get_param( 'slugs' ) );

				if ( 'saved' === $tab ) {
					$slug_list = array_values( array_filter( array_map( 'sanitize_title', explode( ',', $slugs_q ) ) ) );
					$posts     = array();
					if ( ! empty( $slug_list ) ) {
						$sq = new WP_Query(
							array(
								'post_type'           => 'post',
								'post_status'         => 'publish',
								'post_name__in'       => array_slice( $slug_list, 0, 20 ),
								'posts_per_page'      => 20,
								'ignore_sticky_posts' => true,
								'no_found_rows'       => true,
							)
						);
						update_post_thumbnail_cache( $sq );
						$posts = $sq->posts;
					}
				} elseif ( 'trending' === $tab ) {
					$posts = teoriageek_get_most_read_posts( 12 );
				} else {
					$args = array(
						'post_type'           => 'post',
						'post_status'         => 'publish',
						'posts_per_page'      => $per_page,
						'paged'               => $page,
						'ignore_sticky_posts' => true,
						'no_found_rows'       => true,
					);
					if ( '' !== $category ) {
						$cat_term = get_category_by_slug( $category );
						if ( $cat_term && ! is_wp_error( $cat_term ) ) {
							$args['cat'] = (int) $cat_term->term_id;
						} else {
							$args['category_name'] = $category;
						}
					}
					$q = new WP_Query( $args );
					update_post_thumbnail_cache( $q );
					$posts = $q->posts;
				}

				// Se houver post alvo via ?post=slug ou ?id=123 na página 1, coloca-o em primeiro lugar.
				if ( 1 === $page && ( '' !== $focus || $focus_id > 0 ) ) {
					$target = ( $focus_id > 0 ) ? get_post( $focus_id ) : get_page_by_path( $focus, OBJECT, 'post' );
					if ( $target instanceof WP_Post && 'post' === $target->post_type && 'publish' === $target->post_status ) {
						$filtered = array_filter(
							$posts,
							static function ( $p ) use ( $target ) {
								return (int) $p->ID !== (int) $target->ID;
							}
						);
						array_unshift( $filtered, $target );
						$posts = array_slice( $filtered, 0, $per_page );
					}
				}

				return rest_ensure_response(
					array(
						'items' => teoriageek_serialize_reels_batch( $posts ),
						'page'  => $page,
					)
				);
			},
		)
	);

	register_rest_route(
		'teoriageek/v1',
		'/posts/(?P<id>\d+)/like',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'permission_callback' => '__return_true',
			'callback'            => static function ( WP_REST_Request $request ) {
				$pid  = (int) $request['id'];
				$post = get_post( $pid );
				if ( ! $post || 'post' !== $post->post_type || 'publish' !== $post->post_status ) {
					return new WP_Error( 'not_found', __( 'Matéria não encontrada.', 'teoriageek' ), array( 'status' => 404 ) );
				}
				$delta = ( 'unlike' === sanitize_key( (string) $request->get_param( 'action' ) ) ) ? -1 : 1;
				$next  = max( 0, teoriageek_get_post_likes( $pid ) + $delta );
				return rest_ensure_response( array( 'likes' => $next ) );
			},
		)
	);

	register_rest_route(
		'teoriageek/v1',
		'/posts/(?P<id>\d+)/view',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'permission_callback' => '__return_true',
			'callback'            => static function ( WP_REST_Request $request ) {
				$pid  = (int) $request['id'];
				$post = get_post( $pid );
				if ( ! $post || 'post' !== $post->post_type || 'publish' !== $post->post_status ) {
					return new WP_Error( 'not_found', __( 'Matéria não encontrada.', 'teoriageek' ), array( 'status' => 404 ) );
				}
				if ( function_exists( 'pvc_view_post' ) ) {
					pvc_view_post( $pid );
				}
				return rest_ensure_response( array( 'views' => teoriageek_get_post_views( $pid ) ) );
			},
		)
	);
}
add_action( 'rest_api_init', 'teoriageek_register_rest_routes' );

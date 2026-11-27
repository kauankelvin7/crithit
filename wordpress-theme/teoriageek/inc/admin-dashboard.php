<?php
/**
 * Painel Administrativo Dinâmico "Central Teoria Geek" no /wp-admin/ (v2.12.1).
 *
 * Carregado diretamente em `functions.php` para que a rota REST `/wp-json/teoriageek/v1/admin-metrics`
 * seja registrada mesmo quando `is_admin()` é `false` em requisições REST. Todos os demais hooks
 * (`admin_menu`, `admin_enqueue_scripts`, `wp_dashboard_setup`, `admin_post_*`, `manage_post_posts_*`,
 * `restrict_manage_posts` e `pre_get_posts` com guarda `is_admin()`) não executam no front-end público.
 *
 * Inclui dashboards completos de Analytics First-Party (estilo Google Analytics):
 * - Leitores online agora (5 min), sessões, visualizações, bounce rate e tempo ativo médio
 * - Mapa de cliques por zona do portal ("aonde mais clicaram") e top 15 links/elementos clicados
 * - Origens de tráfego (Referrers), top domínios, campanhas UTM, dispositivos, horários de pico e Scroll Depth
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registra o menu principal "Teoria Geek" logo abaixo de Painel no /wp-admin/
 * e armazena o `$hook_suffix` retornado para enfileiramento condicional de assets.
 */
function teoriageek_register_admin_menu() {
	$hook = add_menu_page(
		__( 'Central Teoria Geek', 'teoriageek' ),
		__( 'Teoria Geek', 'teoriageek' ),
		'edit_posts',
		'teoriageek-central',
		'teoriageek_render_admin_central_page',
		'dashicons-chart-area',
		3
	);
	$GLOBALS['teoriageek_admin_page_hook'] = is_string( $hook ) ? $hook : 'toplevel_page_teoriageek-central';
}
add_action( 'admin_menu', 'teoriageek_register_admin_menu' );

/**
 * Enfileira CSS e JS dedicados do painel administrativo no hook oficial `admin_enqueue_scripts`.
 *
 * @param string $hook_suffix Identificador oficial da tela atual no /wp-admin/.
 */
function teoriageek_enqueue_admin_assets( $hook_suffix ) {
	$central_hook = isset( $GLOBALS['teoriageek_admin_page_hook'] ) ? (string) $GLOBALS['teoriageek_admin_page_hook'] : 'toplevel_page_teoriageek-central';
	$is_central   = ( $hook_suffix === $central_hook );
	$is_supported = $is_central || in_array( $hook_suffix, array( 'index.php', 'edit.php' ), true );

	if ( ! $is_supported ) {
		return;
	}

	$css_path = TEORIAGEEK_DIR . '/assets/css/admin-dashboard.css';
	if ( file_exists( $css_path ) ) {
		wp_enqueue_style(
			'teoriageek-admin-dashboard',
			TEORIAGEEK_URI . '/assets/css/admin-dashboard.css',
			array(),
			(string) filemtime( $css_path )
		);
	}

	if ( $is_central ) {
		$js_path = TEORIAGEEK_DIR . '/assets/js/admin-dashboard.js';
		if ( file_exists( $js_path ) ) {
			wp_enqueue_script(
				'teoriageek-admin-dashboard',
				TEORIAGEEK_URI . '/assets/js/admin-dashboard.js',
				array(),
				(string) filemtime( $js_path ),
				true
			);
			wp_localize_script(
				'teoriageek-admin-dashboard',
				'teoriageekAdminData',
				array(
					'restUrl' => esc_url_raw( rest_url( 'teoriageek/v1/admin-metrics' ) ),
					'nonce'   => wp_create_nonce( 'wp_rest' ),
					'pollMs'  => 120000,
					'range'   => '7d',
					'payload' => teoriageek_get_admin_dashboard_payload( '7d' ),
				)
			);
		}
	}
}
add_action( 'admin_enqueue_scripts', 'teoriageek_enqueue_admin_assets' );

/**
 * Registra widget resumo no Painel inicial do WordPress (`index.php`).
 */
function teoriageek_register_dashboard_widget() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		return;
	}
	wp_add_dashboard_widget(
		'teoriageek_dashboard_summary',
		__( 'Teoria Geek — Resumo Rápido', 'teoriageek' ),
		'teoriageek_render_dashboard_widget'
	);
}
add_action( 'wp_dashboard_setup', 'teoriageek_register_dashboard_widget' );

/**
 * Registra rota REST administrativa para atualizar métricas e relatórios Analytics sem F5.
 * Exige `current_user_can( 'edit_posts' )` (retorna 401/403 para visitantes anônimos).
 */
function teoriageek_register_admin_rest_route() {
	register_rest_route(
		'teoriageek/v1',
		'/admin-metrics',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'permission_callback' => static function () {
				return current_user_can( 'edit_posts' );
			},
			'args'                => array(
				'refresh' => array(
					'type'              => 'string',
					'required'          => false,
					'sanitize_callback' => 'sanitize_key',
				),
				'range'   => array(
					'type'              => 'string',
					'required'          => false,
					'default'           => '7d',
					'sanitize_callback' => 'sanitize_key',
				),
			),
			'callback'            => static function ( WP_REST_Request $request ) {
				if ( '1' === (string) $request->get_param( 'refresh' ) ) {
					delete_transient( 'teoriageek_admin_kpis_v2' );
					delete_transient( 'teoriageek_admin_series_v1' );
					teoriageek_delete_admin_extra_cache();
				}
				$range = sanitize_key( (string) $request->get_param( 'range' ) );
				if ( ! in_array( $range, array( 'today', '7d', '14d', '30d' ), true ) ) {
					$range = '7d';
				}
				$res = rest_ensure_response( teoriageek_get_admin_dashboard_payload( $range ) );
				if ( $res instanceof WP_REST_Response ) {
					$res->header( 'Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0' );
				}
				return $res;
			},
		)
	);
}
add_action( 'rest_api_init', 'teoriageek_register_admin_rest_route' );

/**
 * Trata a ação administrativa de zerar dados de Analytics First-Party (`admin-post.php`).
 */
function teoriageek_handle_admin_reset_analytics() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Sem permissão para zerar os dados de Analytics.', 'teoriageek' ) );
	}
	check_admin_referer( 'teoriageek_reset_analytics' );

	if ( function_exists( 'teoriageek_analytics_reset_data' ) ) {
		teoriageek_analytics_reset_data();
	}

	wp_safe_redirect(
		add_query_arg(
			array(
				'page'               => 'teoriageek-central',
				'tg_analytics_reset' => '1',
			),
			admin_url( 'admin.php' )
		)
	);
	exit;
}
add_action( 'admin_post_teoriageek_reset_analytics', 'teoriageek_handle_admin_reset_analytics' );

/**
 * Alterna se visitas da equipe logada (`edit_posts`) entram ou são ignoradas no Analytics First-Party.
 */
function teoriageek_handle_admin_toggle_analytics_staff() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Sem permissão para alterar configurações de Analytics.', 'teoriageek' ) );
	}
	check_admin_referer( 'teoriageek_toggle_analytics_staff' );

	$current = '1' === (string) get_option( 'teoriageek_analytics_ignore_staff', '0' );
	update_option( 'teoriageek_analytics_ignore_staff', $current ? '0' : '1', false );

	wp_safe_redirect(
		add_query_arg(
			array(
				'page'                => 'teoriageek-central',
				'tg_staff_pref_saved' => '1',
			),
			admin_url( 'admin.php' )
		)
	);
	exit;
}
add_action( 'admin_post_teoriageek_toggle_analytics_staff', 'teoriageek_handle_admin_toggle_analytics_staff' );

/**
 * Trata a ação de limpeza manual de cache do tema via `admin-post.php`.
 */
function teoriageek_handle_admin_flush_cache() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Sem permissão para limpar o cache.', 'teoriageek' ) );
	}
	check_admin_referer( 'teoriageek_flush_cache' );

	if ( function_exists( 'teoriageek_flush_editorial_transients' ) ) {
		teoriageek_flush_editorial_transients( 0 );
	}
	delete_transient( 'teoriageek_most_read_pvc_7d_v2' );
	delete_transient( 'teoriageek_most_read_pvc_24h_v2' );
	delete_transient( 'teoriageek_rest_alerts_v1' );
	delete_transient( 'teoriageek_weekly_premieres_v1' );
	delete_transient( 'teoriageek_admin_kpis_v2' );
	delete_transient( 'teoriageek_admin_series_v1' );
	teoriageek_delete_admin_extra_cache();

	if ( function_exists( 'wp_cache_clear_cache' ) ) {
		wp_cache_clear_cache();
	}

	wp_safe_redirect(
		add_query_arg(
			array(
				'page'             => 'teoriageek-central',
				'tg_cache_flushed' => '1',
			),
			admin_url( 'admin.php' )
		)
	);
	exit;
}
add_action( 'admin_post_teoriageek_flush_cache', 'teoriageek_handle_admin_flush_cache' );

/**
 * Coleta totais agregados de engajamento do tema com cache curto (5 min).
 *
 * @return array{likes_total:int,community_votes:int,posts_published:int,views_24h:int,views_7d:int}
 */
function teoriageek_get_admin_kpi_totals() {
	$cached = get_transient( 'teoriageek_admin_kpis_v2' );
	if ( is_array( $cached ) ) {
		return $cached;
	}

	global $wpdb;
	$likes_total = (int) $wpdb->get_var(
		"SELECT COALESCE(SUM(CAST(meta_value AS UNSIGNED)), 0)
		 FROM {$wpdb->postmeta}
		 WHERE meta_key = '_tg_likes_count'"
	);
	$community_votes = (int) $wpdb->get_var(
		"SELECT COALESCE(SUM(CAST(meta_value AS UNSIGNED)), 0)
		 FROM {$wpdb->postmeta}
		 WHERE meta_key = '_tg_community_score_count'"
	);
	$counts          = wp_count_posts( 'post' );
	$posts_published = isset( $counts->publish ) ? (int) $counts->publish : 0;

	$series    = teoriageek_get_admin_14d_series();
	$views_24h = 0;
	$views_7d  = 0;
	$total_pts = count( $series );
	foreach ( $series as $i => $pt ) {
		if ( $i >= $total_pts - 2 ) {
			$views_24h += (int) $pt['views'];
		}
		if ( $i >= $total_pts - 7 ) {
			$views_7d += (int) $pt['views'];
		}
	}

	$data = array(
		'likes_total'     => max( 0, $likes_total ),
		'community_votes' => max( 0, $community_votes ),
		'posts_published' => max( 0, $posts_published ),
		'views_24h'       => max( 0, $views_24h ),
		'views_7d'        => max( 0, $views_7d ),
	);
	set_transient( 'teoriageek_admin_kpis_v2', $data, 5 * MINUTE_IN_SECONDS );
	return $data;
}

/**
 * Monta série diária dos últimos 14 dias lendo `wp_post_views` ou `_tg_views_daily`.
 *
 * @return array<int, array{date:string,label:string,views:int}>
 */
function teoriageek_get_admin_14d_series() {
	$cached = get_transient( 'teoriageek_admin_series_v1' );
	if ( is_array( $cached ) ) {
		return $cached;
	}

	$tz      = wp_timezone();
	$buckets = array();
	for ( $d = 13; $d >= 0; $d-- ) {
		$dt              = new DateTimeImmutable( '-' . $d . ' days', $tz );
		$key             = $dt->format( 'Ymd' );
		$buckets[ $key ] = array(
			'date'  => $key,
			'label' => $dt->format( 'd/m' ),
			'views' => 0,
		);
	}

	$used_pvc = false;
	if ( function_exists( 'teoriageek_has_post_views_table' ) && teoriageek_has_post_views_table() ) {
		global $wpdb;
		$table   = $wpdb->prefix . 'post_views';
		$min_day = array_key_first( $buckets );
		$rows    = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT period, SUM(count) AS total_views
				 FROM {$table}
				 WHERE type = 0 AND period >= %s
				 GROUP BY period
				 ORDER BY period ASC", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$min_day
			),
			ARRAY_A
		);
		if ( is_array( $rows ) && ! empty( $rows ) ) {
			foreach ( $rows as $row ) {
				$p = (string) ( $row['period'] ?? '' );
				if ( isset( $buckets[ $p ] ) ) {
					$buckets[ $p ]['views'] = max( 0, (int) $row['total_views'] );
					$used_pvc               = true;
				}
			}
		}
	}

	if ( ! $used_pvc ) {
		global $wpdb;
		$meta_rows = $wpdb->get_col(
			"SELECT meta_value FROM {$wpdb->postmeta} WHERE meta_key = '_tg_views_daily' LIMIT 500"
		);
		if ( is_array( $meta_rows ) ) {
			foreach ( $meta_rows as $raw ) {
				$arr = maybe_unserialize( $raw );
				if ( is_array( $arr ) ) {
					foreach ( $arr as $day_key => $cnt ) {
						$day_str = (string) $day_key;
						if ( isset( $buckets[ $day_str ] ) ) {
							$buckets[ $day_str ]['views'] += max( 0, (int) $cnt );
						}
					}
				}
			}
		}
	}

	$series = array_values( $buckets );
	set_transient( 'teoriageek_admin_series_v1', $series, 5 * MINUTE_IN_SECONDS );
	return $series;
}

/**
 * Monta distribuição por editoria (top 6 categorias) para o gráfico Donut.
 *
 * @return array<int, array{name:string,slug:string,count:int,color:string}>
 */
function teoriageek_get_admin_category_distribution() {
	$cats = get_categories(
		array(
			'orderby'    => 'count',
			'order'      => 'DESC',
			'number'     => 6,
			'hide_empty' => true,
		)
	);
	$palette = array( '#0073E6', '#FACC15', '#10B981', '#8B5CF6', '#06B6D4', '#F97316' );
	$out     = array();
	foreach ( (array) $cats as $idx => $cat ) {
		if ( ! $cat instanceof WP_Term ) {
			continue;
		}
		$out[] = array(
			'name'  => html_entity_decode( (string) $cat->name, ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
			'slug'  => (string) $cat->slug,
			'count' => (int) $cat->count,
			'color' => $palette[ $idx % count( $palette ) ],
		);
	}
	return $out;
}

/**
 * Chave de cache (por usuário) do bloco extra do painel: as listas dependem de permissões.
 *
 * @return string
 */
function teoriageek_admin_extra_cache_key() {
	return 'teoriageek_admin_extra_v1_' . (int) get_current_user_id();
}

/**
 * Remove o cache do bloco extra do usuário atual.
 */
function teoriageek_delete_admin_extra_cache() {
	delete_transient( teoriageek_admin_extra_cache_key() );
}

/**
 * Título limpo para listas do painel.
 *
 * @param int $post_id ID do post.
 * @return string
 */
function teoriageek_admin_clean_title( $post_id ) {
	$title = html_entity_decode( wp_trim_words( get_the_title( $post_id ), 12 ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	return '' !== trim( $title ) ? $title : __( '(sem título)', 'teoriageek' );
}

/**
 * Normaliza um post para as listas da Central.
 *
 * @param WP_Post $p          Post.
 * @param string  $date_field Campo de data a exibir (post_date ou post_modified).
 * @return array<string,mixed>
 */
function teoriageek_admin_map_post( $p, $date_field = 'post_date' ) {
	$pid    = (int) $p->ID;
	$author = get_userdata( (int) $p->post_author );
	return array(
		'id'      => $pid,
		'title'   => teoriageek_admin_clean_title( $pid ),
		'editUrl' => get_edit_post_link( $pid, 'raw' ) ?: get_permalink( $pid ),
		'viewUrl' => get_permalink( $pid ),
		'author'  => $author ? (string) $author->display_name : '',
		'status'  => (string) $p->post_status,
		'date'    => mysql2date( 'd/m H:i', $p->{$date_field} ),
	);
}

/**
 * Monta o bloco extra (críticas, curtidas, fila editorial, destaques, autores e publicações/dia).
 * Cache curto de 2 minutos por usuário.
 *
 * @return array<string,mixed>
 */
function teoriageek_get_admin_extra_payload() {
	$key    = teoriageek_admin_extra_cache_key();
	$cached = get_transient( $key );
	if ( is_array( $cached ) ) {
		return $cached;
	}

	global $wpdb;
	$base = array(
		'post_type'              => 'post',
		'ignore_sticky_posts'    => true,
		'no_found_rows'          => true,
		'update_post_term_cache' => false,
	);

	// Críticas: nota da redação vs. média da comunidade.
	$critics = array();
	$rated_q = new WP_Query(
		array_merge(
			$base,
			array(
				'post_status'    => 'publish',
				'posts_per_page' => 5,
				'meta_key'       => '_tg_community_score_count',
				'orderby'        => 'meta_value_num',
				'order'          => 'DESC',
			)
		)
	);
	foreach ( $rated_q->posts as $rp ) {
		$rev   = function_exists( 'teoriageek_get_review_details' ) ? teoriageek_get_review_details( $rp->ID ) : null;
		$comm  = function_exists( 'teoriageek_get_community_score' ) ? teoriageek_get_community_score( $rp->ID ) : array( 'average' => 0, 'count' => 0 );
		$critics[] = array(
			'id'      => (int) $rp->ID,
			'title'   => teoriageek_admin_clean_title( $rp->ID ),
			'editUrl' => get_edit_post_link( $rp->ID, 'raw' ) ?: get_permalink( $rp->ID ),
			'ed'      => $rev ? (float) $rev['score'] : null,
			'pub'     => (float) $comm['average'],
			'votes'   => (int) $comm['count'],
		);
	}

	// Mais curtidas.
	$most_liked = array();
	$liked_q    = new WP_Query(
		array_merge(
			$base,
			array(
				'post_status'    => 'publish',
				'posts_per_page' => 6,
				'meta_key'       => '_tg_likes_count',
				'orderby'        => 'meta_value_num',
				'order'          => 'DESC',
			)
		)
	);
	foreach ( $liked_q->posts as $lp ) {
		$item          = teoriageek_admin_map_post( $lp );
		$item['likes'] = function_exists( 'teoriageek_get_post_likes' ) ? (int) teoriageek_get_post_likes( $lp->ID ) : 0;
		$most_liked[]  = $item;
	}

	// Fila editorial (apenas quem edita matérias de outros autores).
	$queue = null;
	if ( current_user_can( 'edit_others_posts' ) ) {
		$counts    = wp_count_posts( 'post' );
		$scheduled = array();
		$drafts    = array();
		$sched_q   = new WP_Query(
			array_merge(
				$base,
				array(
					'post_status'    => 'future',
					'posts_per_page' => 5,
					'orderby'        => 'date',
					'order'          => 'ASC',
				)
			)
		);
		foreach ( $sched_q->posts as $sp ) {
			$scheduled[] = teoriageek_admin_map_post( $sp, 'post_date' );
		}
		$draft_q = new WP_Query(
			array_merge(
				$base,
				array(
					'post_status'    => array( 'draft', 'pending' ),
					'posts_per_page' => 6,
					'orderby'        => 'modified',
					'order'          => 'DESC',
				)
			)
		);
		foreach ( $draft_q->posts as $dp ) {
			$drafts[] = teoriageek_admin_map_post( $dp, 'post_modified' );
		}
		$queue = array(
			'draft'     => isset( $counts->draft ) ? (int) $counts->draft : 0,
			'pending'   => isset( $counts->pending ) ? (int) $counts->pending : 0,
			'future'    => isset( $counts->future ) ? (int) $counts->future : 0,
			'scheduled' => $scheduled,
			'drafts'    => $drafts,
		);
	}

	// Destaques da capa: Manchete (_tg_main_headline), Plantão (_tg_plantao) e Spoiler (_tg_has_spoilers), mantendo retrocompatibilidade com chaves antigas.
	$flags    = array();
	$flag_map = array(
		'hero'    => array( '_tg_main_headline', '_tg_is_hero' ),
		'ticker'  => array( '_tg_plantao', '_tg_in_ticker' ),
		'spoiler' => array( '_tg_has_spoilers' ),
	);
	foreach ( $flag_map as $flag_key => $meta_keys ) {
		$mq = array( 'relation' => 'OR' );
		foreach ( $meta_keys as $mk ) {
			$mq[] = array(
				'key'   => $mk,
				'value' => '1',
			);
		}
		$fq    = new WP_Query(
			array(
				'post_type'              => 'post',
				'post_status'            => 'publish',
				'posts_per_page'         => 4,
				'ignore_sticky_posts'    => true,
				'update_post_term_cache' => false,
				'orderby'                => 'date',
				'order'                  => 'DESC',
				'meta_query'             => $mq,
			)
		);
		$items = array();
		foreach ( $fq->posts as $fp ) {
			$items[] = teoriageek_admin_map_post( $fp );
		}
		$flags[ $flag_key ] = array(
			'count' => (int) $fq->found_posts,
			'items' => $items,
		);
	}

	// Autores nos últimos 30 dias (matérias e curtidas).
	$since30 = wp_date( 'Y-m-d H:i:s', time() - 30 * DAY_IN_SECONDS );
	$a_rows  = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT post_author, COUNT(*) AS n FROM {$wpdb->posts}
			 WHERE post_type = 'post' AND post_status = 'publish' AND post_date >= %s
			 GROUP BY post_author ORDER BY n DESC LIMIT 6", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$since30
		),
		ARRAY_A
	);
	$l_rows  = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT p.post_author, COALESCE(SUM(CAST(m.meta_value AS UNSIGNED)), 0) AS likes
			 FROM {$wpdb->posts} p
			 INNER JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = '_tg_likes_count'
			 WHERE p.post_type = 'post' AND p.post_status = 'publish' AND p.post_date >= %s
			 GROUP BY p.post_author", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$since30
		),
		ARRAY_A
	);
	$likes_by = array();
	if ( is_array( $l_rows ) ) {
		foreach ( $l_rows as $lr ) {
			$likes_by[ (int) $lr['post_author'] ] = (int) $lr['likes'];
		}
	}
	$authors = array();
	if ( is_array( $a_rows ) ) {
		foreach ( $a_rows as $ar ) {
			$uid  = (int) $ar['post_author'];
			$user = get_userdata( $uid );
			if ( ! $user ) {
				continue;
			}
			$authors[] = array(
				'id'     => $uid,
				'name'   => (string) $user->display_name,
				'posts'  => (int) $ar['n'],
				'likes'  => isset( $likes_by[ $uid ] ) ? $likes_by[ $uid ] : 0,
				'url'    => admin_url( 'edit.php?author=' . $uid ),
			);
		}
	}

	// Publicações por dia nos últimos 14 dias.
	$tz        = wp_timezone();
	$pub_days  = array();
	for ( $d = 13; $d >= 0; $d-- ) {
		$pub_days[ ( new DateTimeImmutable( '-' . $d . ' days', $tz ) )->format( 'Y-m-d' ) ] = 0;
	}
	$first_day = array_key_first( $pub_days ) . ' 00:00:00';
	$p_rows    = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT DATE(post_date) AS d, COUNT(*) AS n FROM {$wpdb->posts}
			 WHERE post_type = 'post' AND post_status = 'publish' AND post_date >= %s
			 GROUP BY DATE(post_date)", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$first_day
		),
		ARRAY_A
	);
	if ( is_array( $p_rows ) ) {
		foreach ( $p_rows as $pr ) {
			if ( isset( $pub_days[ $pr['d'] ] ) ) {
				$pub_days[ $pr['d'] ] = (int) $pr['n'];
			}
		}
	}

	$extra = array(
		'critics'   => $critics,
		'mostLiked' => $most_liked,
		'queue'     => $queue,
		'flags'     => $flags,
		'authors'   => $authors,
		'pubSeries' => array_values( $pub_days ),
	);
	set_transient( $key, $extra, 2 * MINUTE_IN_SECONDS );
	return $extra;
}

/**
 * Monta payload completo de métricas editoriais + relatório de Analytics First-Party.
 *
 * @param string $range Período do relatório Analytics (`today`, `7d`, `14d`, `30d`).
 * @return array<string,mixed>
 */
function teoriageek_get_admin_dashboard_payload( $range = '7d' ) {
	if ( ! in_array( $range, array( 'today', '7d', '14d', '30d' ), true ) ) {
		$range = '7d';
	}
	$kpis       = teoriageek_get_admin_kpi_totals();
	$series_14d = teoriageek_get_admin_14d_series();
	$categories = teoriageek_get_admin_category_distribution();
	$top_24h    = function_exists( 'teoriageek_get_most_read_posts' ) ? teoriageek_get_most_read_posts( 6, array(), '24h' ) : array();
	$top_7d     = function_exists( 'teoriageek_get_most_read_posts' ) ? teoriageek_get_most_read_posts( 6, array(), '7d' ) : array();
	$analytics  = function_exists( 'teoriageek_analytics_get_report' ) ? teoriageek_analytics_get_report( $range ) : null;

	$map_posts = static function ( $posts, $window ) {
		$items = array();
		foreach ( (array) $posts as $p ) {
			$pid     = (int) $p->ID;
			$w_views = function_exists( 'teoriageek_get_post_window_views' ) ? teoriageek_get_post_window_views( $pid, $window ) : 0;
			$total   = function_exists( 'teoriageek_get_post_views' ) ? teoriageek_get_post_views( $pid ) : 0;
			$likes   = function_exists( 'teoriageek_get_post_likes' ) ? teoriageek_get_post_likes( $pid ) : 0;
			$items[] = array(
				'id'      => $pid,
				'title'   => html_entity_decode( wp_trim_words( get_the_title( $pid ), 10 ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
				'editUrl' => get_edit_post_link( $pid, 'raw' ) ?: get_permalink( $pid ),
				'viewUrl' => get_permalink( $pid ),
				'views'   => ( '24h' === $window && $w_views > 0 ) ? $w_views : $total,
				'total'   => $total,
				'likes'   => $likes,
			);
		}
		return $items;
	};

	return array_merge(
		array(
			'kpis'       => $kpis,
			'series14d'  => $series_14d,
			'categories' => $categories,
			'top24h'     => $map_posts( $top_24h, '24h' ),
			'top7d'      => $map_posts( $top_7d, '7d' ),
			'analytics'  => $analytics,
			'range'      => $range,
			'updatedAt'  => wp_date( 'H:i:s' ),
			'ts'         => time(),
		),
		teoriageek_get_admin_extra_payload()
	);
}

/**
 * Renderiza o widget compacto no Painel inicial do WordPress (`index.php`).
 */
function teoriageek_render_dashboard_widget() {
	$kpis    = teoriageek_get_admin_kpi_totals();
	$top_24h = function_exists( 'teoriageek_get_most_read_posts' ) ? teoriageek_get_most_read_posts( 3, array(), '24h' ) : array();
	?>
	<div class="tg-adm-widget">
		<p style="margin-top:0;">
			<strong><?php esc_html_e( 'Publicações:', 'teoriageek' ); ?></strong> <?php echo esc_html( number_format_i18n( $kpis['posts_published'] ) ); ?>
			&nbsp;·&nbsp;
			<strong><?php esc_html_e( 'Leituras 24h:', 'teoriageek' ); ?></strong> <?php echo esc_html( number_format_i18n( $kpis['views_24h'] ) ); ?>
			&nbsp;·&nbsp;
			<strong><?php esc_html_e( 'Curtidas:', 'teoriageek' ); ?></strong> <?php echo esc_html( number_format_i18n( $kpis['likes_total'] ) ); ?>
		</p>
		<?php if ( ! empty( $top_24h ) ) : ?>
			<p style="margin-bottom:6px;"><strong><?php esc_html_e( 'Em alta nas últimas 24h:', 'teoriageek' ); ?></strong></p>
			<ol style="margin:0 0 12px 18px;">
				<?php foreach ( $top_24h as $p ) : ?>
					<li>
						<a href="<?php echo esc_url( get_edit_post_link( $p->ID ) ?: get_permalink( $p->ID ) ); ?>">
							<?php echo esc_html( wp_trim_words( get_the_title( $p->ID ), 10 ) ); ?>
						</a>
					</li>
				<?php endforeach; ?>
			</ol>
		<?php endif; ?>
		<p style="margin-bottom:0;">
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=teoriageek-central' ) ); ?>" class="button button-primary">
				<?php esc_html_e( 'Abrir Central com Gráficos', 'teoriageek' ); ?>
			</a>
		</p>
	</div>
	<?php
}

/**
 * Renderiza a casca da página "Central Teoria Geek" no /wp-admin/.
 * Os blocos de dados são desenhados por `assets/js/admin-dashboard.js` a partir do payload.
 */
function teoriageek_render_admin_central_page() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_die( esc_html__( 'Você não tem permissão para acessar esta página.', 'teoriageek' ) );
	}

	$hour     = (int) wp_date( 'G' );
	$greeting = $hour < 12 ? __( 'Bom dia', 'teoriageek' ) : ( $hour < 18 ? __( 'Boa tarde', 'teoriageek' ) : __( 'Boa noite', 'teoriageek' ) );
	$user     = wp_get_current_user();
	$first    = ( $user && $user->exists() ) ? (string) strtok( (string) $user->display_name, ' ' ) : '';
	$version  = defined( 'TEORIAGEEK_VERSION' ) ? TEORIAGEEK_VERSION : '2.12.1';

	$has_wa         = '' !== trim( (string) get_theme_mod( 'teoriageek_channel_whatsapp', '' ) );
	$has_tg         = '' !== trim( (string) get_theme_mod( 'teoriageek_channel_telegram', '' ) );
	$has_gnews      = '' !== trim( (string) get_theme_mod( 'teoriageek_channel_google_news', '' ) );
	$has_newsletter = '' !== trim( (string) get_theme_mod( 'teoriageek_newsletter_action_url', '' ) );
	$has_ads        = '' !== trim( (string) get_theme_mod( 'teoriageek_ad_top', '' ) . (string) get_theme_mod( 'teoriageek_ad_mid_article', '' ) . (string) get_theme_mod( 'teoriageek_ad_sidebar', '' ) );
	$has_cache      = function_exists( 'wp_cache_clear_cache' );
	$has_pvc        = function_exists( 'pvc_view_post' );
	$ignore_staff   = '1' === (string) get_option( 'teoriageek_analytics_ignore_staff', '0' );
	$rules          = get_option( 'rewrite_rules' );
	$has_reels_rule = is_array( $rules ) && isset( $rules['^reels/?$'] );

	$flushed       = isset( $_GET['tg_cache_flushed'] ) && '1' === (string) wp_unslash( $_GET['tg_cache_flushed'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$an_reset      = isset( $_GET['tg_analytics_reset'] ) && '1' === (string) wp_unslash( $_GET['tg_analytics_reset'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$staff_updated = isset( $_GET['tg_staff_pref_saved'] ) && '1' === (string) wp_unslash( $_GET['tg_staff_pref_saved'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	?>
	<div class="tg-adm-wrap" id="tg-admin-app" data-theme="dark">
		<script>try{var tgT=localStorage.getItem('tgAdmTheme');if(tgT==='light'||tgT==='dark'){document.getElementById('tg-admin-app').setAttribute('data-theme',tgT);}}catch(e){}</script>

		<?php if ( $flushed ) : ?>
			<div class="notice notice-success is-dismissible" style="margin: 0 0 16px;">
				<p><strong><?php esc_html_e( 'Cache do tema limpo com sucesso!', 'teoriageek' ); ?></strong> <?php esc_html_e( 'Home, Mais Lidas, Alertas, Estreias e métricas foram atualizados.', 'teoriageek' ); ?></p>
			</div>
		<?php endif; ?>
		<?php if ( $an_reset ) : ?>
			<div class="notice notice-success is-dismissible" style="margin: 0 0 16px;">
				<p><strong><?php esc_html_e( 'Dados de Analytics zerados com sucesso!', 'teoriageek' ); ?></strong> <?php esc_html_e( 'A nova coleta começa imediatamente a partir dos próximos acessos ao portal.', 'teoriageek' ); ?></p>
			</div>
		<?php endif; ?>
		<?php if ( $staff_updated ) : ?>
			<div class="notice notice-success is-dismissible" style="margin: 0 0 16px;">
				<p><strong><?php esc_html_e( 'Preferência de rastreamento atualizada!', 'teoriageek' ); ?></strong></p>
			</div>
		<?php endif; ?>

		<header class="tg-hero">
			<div class="tg-hero-copy">
				<div class="tg-hero-top">
					<p class="tg-hello"><?php echo esc_html( '' !== $first ? $greeting . ', ' . $first : $greeting ); ?></p>
					<button type="button" class="tg-live-pill" id="tg-live-pill" title="<?php esc_attr_e( 'Leitores ativos no portal nos últimos 5 minutos. Clique para abrir Audiência & Origem.', 'teoriageek' ); ?>">
						<span class="tg-live-dot" aria-hidden="true"></span>
						<strong id="tg-live-count">0</strong>
						<span><?php esc_html_e( 'online agora', 'teoriageek' ); ?></span>
					</button>
				</div>
				<h1><?php esc_html_e( 'Central Teoria Geek', 'teoriageek' ); ?></h1>
				<div class="tg-hero-stat">
					<span class="tg-hero-num" data-tg-kpi="views_7d">0</span>
					<span class="tg-hero-label"><?php esc_html_e( 'leituras nos últimos 7 dias', 'teoriageek' ); ?></span>
					<span class="tg-delta" id="tg-hero-delta" hidden></span>
				</div>
				<p class="tg-hero-date"><?php echo esc_html( wp_date( 'l, j \d\e F' ) . ' — v' . $version ); ?></p>
			</div>
			<div class="tg-hero-stage" id="tg-slab-stage" role="img" aria-label="<?php esc_attr_e( 'Leituras por dia nos últimos 14 dias, em colunas em 3D', 'teoriageek' ); ?>"></div>
		</header>

		<div class="tg-toolbar">
			<button type="button" id="tg-adm-refresh-btn" class="tg-adm-btn tg-adm-btn-sec"><?php esc_html_e( 'Atualizar agora', 'teoriageek' ); ?></button>
			<button type="button" id="tg-adm-theme-btn" class="tg-adm-btn tg-adm-btn-sec" aria-pressed="false"><?php esc_html_e( 'Tema claro', 'teoriageek' ); ?></button>
			<button type="button" id="tg-adm-board-btn" class="tg-adm-btn tg-adm-btn-sec"><?php esc_html_e( 'Big Board', 'teoriageek' ); ?></button>
			<span class="tg-toolbar-gap"></span>
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" target="_blank" rel="noopener noreferrer" class="tg-adm-btn tg-adm-btn-sec"><?php esc_html_e( 'Ver capa', 'teoriageek' ); ?></a>
			<a href="<?php echo esc_url( function_exists( 'teoriageek_get_reels_url' ) ? teoriageek_get_reels_url() : home_url( '/reels/' ) ); ?>" target="_blank" rel="noopener noreferrer" class="tg-adm-btn tg-adm-btn-sec"><?php esc_html_e( 'Abrir Reels', 'teoriageek' ); ?></a>
			<a href="<?php echo esc_url( admin_url( 'post-new.php' ) ); ?>" class="tg-adm-btn tg-adm-btn-pri"><?php esc_html_e( 'Nova matéria', 'teoriageek' ); ?></a>
		</div>

		<div class="tg-kpis" id="tg-kpis">
			<div class="tg-kpi" data-tilt>
				<span class="tg-kpi-label"><?php esc_html_e( 'Leituras em 24h', 'teoriageek' ); ?></span>
				<span class="tg-kpi-val" data-tg-kpi="views_24h">0</span>
				<span class="tg-kpi-sub" id="tg-kpi-sub-views"></span>
				<span class="tg-spark" id="tg-spark-views" aria-hidden="true"></span>
			</div>
			<div class="tg-kpi" data-tilt>
				<span class="tg-kpi-label"><?php esc_html_e( 'Curtidas totais', 'teoriageek' ); ?></span>
				<span class="tg-kpi-val" data-tg-kpi="likes_total">0</span>
				<span class="tg-kpi-sub" id="tg-kpi-sub-likes"></span>
			</div>
			<div class="tg-kpi" data-tilt>
				<span class="tg-kpi-label"><?php esc_html_e( 'Votos da comunidade', 'teoriageek' ); ?></span>
				<span class="tg-kpi-val" data-tg-kpi="community_votes">0</span>
				<span class="tg-kpi-sub" id="tg-kpi-sub-votes"></span>
			</div>
			<div class="tg-kpi" data-tilt>
				<span class="tg-kpi-label"><?php esc_html_e( 'Matérias no acervo', 'teoriageek' ); ?></span>
				<span class="tg-kpi-val" data-tg-kpi="posts_published">0</span>
				<span class="tg-kpi-sub" id="tg-kpi-sub-posts"></span>
				<span class="tg-spark" id="tg-spark-posts" aria-hidden="true"></span>
			</div>
		</div>

		<nav class="tg-nav" aria-label="<?php esc_attr_e( 'Seções da Central Teoria Geek', 'teoriageek' ); ?>">
			<div class="tg-adm-tablist" role="tablist">
				<button type="button" role="tab" id="tg-tab-overview" aria-selected="true" aria-controls="tg-panel-overview" data-tg-adm-tab="overview" class="tg-adm-tab is-active"><?php esc_html_e( 'Visão geral', 'teoriageek' ); ?></button>
				<button type="button" role="tab" id="tg-tab-analytics" aria-selected="false" aria-controls="tg-panel-analytics" data-tg-adm-tab="analytics" class="tg-adm-tab" tabindex="-1"><?php esc_html_e( 'Audiência & Origem', 'teoriageek' ); ?></button>
				<button type="button" role="tab" id="tg-tab-clicks" aria-selected="false" aria-controls="tg-panel-clicks" data-tg-adm-tab="clicks" class="tg-adm-tab" tabindex="-1"><?php esc_html_e( 'Cliques & Comportamento', 'teoriageek' ); ?></button>
				<button type="button" role="tab" id="tg-tab-newsroom" aria-selected="false" aria-controls="tg-panel-newsroom" data-tg-adm-tab="newsroom" class="tg-adm-tab" tabindex="-1"><?php esc_html_e( 'Redação', 'teoriageek' ); ?></button>
				<button type="button" role="tab" id="tg-tab-rankings" aria-selected="false" aria-controls="tg-panel-rankings" data-tg-adm-tab="rankings" class="tg-adm-tab" tabindex="-1"><?php esc_html_e( 'Rankings', 'teoriageek' ); ?></button>
				<?php if ( current_user_can( 'manage_options' ) ) : ?>
					<button type="button" role="tab" id="tg-tab-health" aria-selected="false" aria-controls="tg-panel-health" data-tg-adm-tab="health" class="tg-adm-tab" tabindex="-1"><?php esc_html_e( 'Saúde e atalhos', 'teoriageek' ); ?></button>
				<?php endif; ?>
			</div>
			<div class="tg-nav-right">
				<div class="tg-range-switch" role="group" aria-label="<?php esc_attr_e( 'Período do Analytics', 'teoriageek' ); ?>">
					<button type="button" data-tg-range="today" aria-pressed="false"><?php esc_html_e( 'Hoje', 'teoriageek' ); ?></button>
					<button type="button" data-tg-range="7d" class="is-active" aria-pressed="true"><?php esc_html_e( '7d', 'teoriageek' ); ?></button>
					<button type="button" data-tg-range="14d" aria-pressed="false"><?php esc_html_e( '14d', 'teoriageek' ); ?></button>
					<button type="button" data-tg-range="30d" aria-pressed="false"><?php esc_html_e( '30d', 'teoriageek' ); ?></button>
				</div>
				<span class="tg-sync" title="<?php esc_attr_e( 'Métricas do Analytics atualizam em tempo real; KPIs de acervo têm cache de até 5 min.', 'teoriageek' ); ?>">
					<span class="tg-sync-dot" aria-hidden="true"></span>
					<span id="tg-adm-sync"><?php esc_html_e( 'Atualizado agora', 'teoriageek' ); ?></span>
				</span>
			</div>
		</nav>

		<div class="tg-stage" id="tg-stage">
			<!-- Visão geral -->
			<section class="tg-adm-panel" id="tg-panel-overview" role="tabpanel" aria-labelledby="tg-tab-overview" data-tg-adm-panel="overview">
				<div class="tg-grid">
					<div class="span-12 tg-pulse-strip" id="tg-overview-pulse"></div>
					<article class="tg-card span-8">
						<div class="tg-card-head">
							<div>
								<h2><?php esc_html_e( 'Tendência de leituras', 'teoriageek' ); ?></h2>
								<span class="tg-card-sub"><?php esc_html_e( 'Últimos 14 dias. Passe o cursor para ver o dia exato.', 'teoriageek' ); ?></span>
							</div>
						</div>
						<div class="tg-chart-stage" id="tg-area-chart-stage"></div>
					</article>
					<article class="tg-card span-4">
						<div class="tg-card-head">
							<div>
								<h2><?php esc_html_e( 'Acervo por editoria', 'teoriageek' ); ?></h2>
								<span class="tg-card-sub"><?php esc_html_e( 'As seis maiores categorias do portal.', 'teoriageek' ); ?></span>
							</div>
						</div>
						<div class="tg-donut-wrap" id="tg-donut-stage"></div>
					</article>
					<article class="tg-card span-7">
						<div class="tg-card-head">
							<div>
								<h2><?php esc_html_e( 'Mais lidas', 'teoriageek' ); ?></h2>
								<span class="tg-card-sub"><?php esc_html_e( 'Alterne entre 24 horas e 7 dias.', 'teoriageek' ); ?></span>
							</div>
							<div class="tg-bar-switch" role="group" aria-label="<?php esc_attr_e( 'Janela de desempenho', 'teoriageek' ); ?>">
								<button type="button" data-tg-bar-win="24h" class="is-active" aria-pressed="true"><?php esc_html_e( '24h', 'teoriageek' ); ?></button>
								<button type="button" data-tg-bar-win="7d" aria-pressed="false"><?php esc_html_e( '7 dias', 'teoriageek' ); ?></button>
							</div>
						</div>
						<div class="tg-bars-list" id="tg-bars-stage"></div>
					</article>
					<article class="tg-card span-5">
						<div class="tg-card-head">
							<div>
								<h2><?php esc_html_e( 'Críticas: redação e comunidade', 'teoriageek' ); ?></h2>
								<span class="tg-card-sub"><?php esc_html_e( 'Nota oficial em amarelo, média do público em azul.', 'teoriageek' ); ?></span>
							</div>
						</div>
						<div id="tg-critics-stage"></div>
					</article>
				</div>
			</section>

			<!-- Audiência & Origem (Analytics First-Party) -->
			<section class="tg-adm-panel" id="tg-panel-analytics" role="tabpanel" aria-labelledby="tg-tab-analytics" data-tg-adm-panel="analytics" hidden>
				<div class="tg-grid">
					<div class="span-12 tg-an-tiles" id="tg-an-kpis"></div>

					<article class="tg-card span-7">
						<div class="tg-card-head">
							<div>
								<h2><?php esc_html_e( 'Origens de tráfego (Referrers)', 'teoriageek' ); ?></h2>
								<span class="tg-card-sub" id="tg-an-ref-sub"><?php esc_html_e( 'De onde chegam os leitores (Google, Discover, redes sociais e acesso direto).', 'teoriageek' ); ?></span>
							</div>
						</div>
						<div id="tg-an-referrers"></div>
						<div id="tg-an-domains" class="tg-domain-chips"></div>
					</article>

					<article class="tg-card span-5">
						<div class="tg-card-head">
							<div>
								<h2><?php esc_html_e( 'Dispositivos & tipos de página', 'teoriageek' ); ?></h2>
								<span class="tg-card-sub"><?php esc_html_e( 'Distribuição Mobile, Desktop e Tablet no período selecionado.', 'teoriageek' ); ?></span>
							</div>
						</div>
						<div class="tg-donut-wrap" id="tg-an-devices"></div>
						<div class="tg-pagetypes-wrap" id="tg-an-pagetypes"></div>
					</article>

					<article class="tg-card span-7">
						<div class="tg-card-head">
							<div>
								<h2><?php esc_html_e( 'Horários de pico (00h–23h)', 'teoriageek' ); ?></h2>
								<span class="tg-card-sub"><?php esc_html_e( 'Volume de visualizações por hora no fuso horário do WordPress.', 'teoriageek' ); ?></span>
							</div>
							<span class="tg-adm-pill tg-pill-info" id="tg-an-peak-badge" hidden></span>
						</div>
						<div id="tg-an-hourly"></div>
					</article>

					<article class="tg-card span-5">
						<div class="tg-card-head">
							<div>
								<h2><?php esc_html_e( 'Funil de profundidade de leitura', 'teoriageek' ); ?></h2>
								<span class="tg-card-sub"><?php esc_html_e( 'Até onde os leitores rolam nas matérias (Scroll Depth 25% a 100%).', 'teoriageek' ); ?></span>
							</div>
						</div>
						<div id="tg-an-scroll"></div>
					</article>

					<article class="tg-card span-8">
						<div class="tg-card-head">
							<div>
								<h2><?php esc_html_e( 'Páginas mais acessadas', 'teoriageek' ); ?></h2>
								<span class="tg-card-sub"><?php esc_html_e( 'Visualizações, cliques originados e tempo ativo médio em cada URL.', 'teoriageek' ); ?></span>
							</div>
						</div>
						<div id="tg-an-pages"></div>
					</article>

					<article class="tg-card span-4">
						<div class="tg-card-head">
							<div>
								<h2><?php esc_html_e( 'Ao vivo (5 min) & campanhas UTM', 'teoriageek' ); ?></h2>
								<span class="tg-card-sub"><?php esc_html_e( 'Páginas abertas agora e links com utm_source / utm_campaign.', 'teoriageek' ); ?></span>
							</div>
						</div>
						<div id="tg-an-live-pages"></div>
						<div id="tg-an-utm" class="tg-utm-block"></div>
					</article>
				</div>
			</section>

			<!-- Cliques & Comportamento (Aonde mais clicaram!) -->
			<section class="tg-adm-panel" id="tg-panel-clicks" role="tabpanel" aria-labelledby="tg-tab-clicks" data-tg-adm-panel="clicks" hidden>
				<div class="tg-grid">
					<div class="span-12 tg-an-tiles tg-an-tiles--4" id="tg-clk-kpis"></div>

					<article class="tg-card span-7">
						<div class="tg-card-head">
							<div>
								<h2><?php esc_html_e( 'Aonde mais clicaram — Mapa por zona', 'teoriageek' ); ?></h2>
								<span class="tg-card-sub"><?php esc_html_e( 'Ranking real de cliques em cada bloco do portal (Hero, Giro, Mais Lidas, Reels, Menu, Rodapé).', 'teoriageek' ); ?></span>
							</div>
						</div>
						<div id="tg-clk-zones"></div>
					</article>

					<article class="tg-card span-5">
						<div class="tg-card-head">
							<div>
								<h2><?php esc_html_e( 'Conversões & ações editoriais', 'teoriageek' ); ?></h2>
								<span class="tg-card-sub"><?php esc_html_e( 'Cliques em canais oficiais, newsletter, compartilhamento, spoilers, YouTube e Reels.', 'teoriageek' ); ?></span>
							</div>
						</div>
						<div id="tg-clk-conversions"></div>
					</article>

					<article class="tg-card span-8">
						<div class="tg-card-head">
							<div>
								<h2><?php esc_html_e( 'Links e botões mais clicados (Top 15)', 'teoriageek' ); ?></h2>
								<span class="tg-card-sub"><?php esc_html_e( 'Elemento exato clicado pelo leitor, em qual bloco apareceu e destino.', 'teoriageek' ); ?></span>
							</div>
						</div>
						<div id="tg-clk-top"></div>
					</article>

					<article class="tg-card span-4">
						<div class="tg-card-head">
							<div>
								<h2><?php esc_html_e( 'Termos mais buscados', 'teoriageek' ); ?></h2>
								<span class="tg-card-sub"><?php esc_html_e( 'Pesquisas reais dos leitores; buscas sem resultado viram pauta.', 'teoriageek' ); ?></span>
							</div>
						</div>
						<div id="tg-clk-searches"></div>
					</article>
				</div>
			</section>

			<!-- Redação -->
			<section class="tg-adm-panel" id="tg-panel-newsroom" role="tabpanel" aria-labelledby="tg-tab-newsroom" data-tg-adm-panel="newsroom" hidden>
				<div class="tg-grid">
					<div class="span-12 tg-queue-tiles" id="tg-queue-tiles"></div>
					<article class="tg-card span-6">
						<div class="tg-card-head">
							<div>
								<h2><?php esc_html_e( 'Próximas publicações', 'teoriageek' ); ?></h2>
								<span class="tg-card-sub"><?php esc_html_e( 'Matérias agendadas, da mais próxima para a mais distante.', 'teoriageek' ); ?></span>
							</div>
						</div>
						<div id="tg-scheduled-stage"></div>
					</article>
					<article class="tg-card span-6">
						<div class="tg-card-head">
							<div>
								<h2><?php esc_html_e( 'Rascunhos e revisões', 'teoriageek' ); ?></h2>
								<span class="tg-card-sub"><?php esc_html_e( 'Mexidos por último primeiro.', 'teoriageek' ); ?></span>
							</div>
						</div>
						<div id="tg-drafts-stage"></div>
					</article>
					<article class="tg-card span-7">
						<div class="tg-card-head">
							<div>
								<h2><?php esc_html_e( 'Destaques no ar', 'teoriageek' ); ?></h2>
								<span class="tg-card-sub"><?php esc_html_e( 'Manchete da capa, Plantão Geek e matérias com alerta de spoiler.', 'teoriageek' ); ?></span>
							</div>
						</div>
						<div class="tg-flags" id="tg-flags-stage"></div>
					</article>
					<article class="tg-card span-5">
						<div class="tg-card-head">
							<div>
								<h2><?php esc_html_e( 'Autores nos últimos 30 dias', 'teoriageek' ); ?></h2>
								<span class="tg-card-sub"><?php esc_html_e( 'Matérias publicadas e curtidas recebidas.', 'teoriageek' ); ?></span>
							</div>
						</div>
						<div id="tg-authors-stage"></div>
					</article>
				</div>
			</section>

			<!-- Rankings -->
			<section class="tg-adm-panel" id="tg-panel-rankings" role="tabpanel" aria-labelledby="tg-tab-rankings" data-tg-adm-panel="rankings" hidden>
				<div class="tg-grid">
					<article class="tg-card span-7">
						<div class="tg-card-head">
							<h2><?php esc_html_e( 'Top mais lidas em 7 dias', 'teoriageek' ); ?></h2>
						</div>
						<div id="tg-top7-stage"></div>
					</article>
					<article class="tg-card span-5">
						<div class="tg-card-head">
							<h2><?php esc_html_e( 'Mais curtidas', 'teoriageek' ); ?></h2>
						</div>
						<div id="tg-liked-stage"></div>
					</article>
				</div>
			</section>

			<!-- Saúde e atalhos -->
			<?php if ( current_user_can( 'manage_options' ) ) : ?>
				<section class="tg-adm-panel" id="tg-panel-health" role="tabpanel" aria-labelledby="tg-tab-health" data-tg-adm-panel="health" hidden>
					<div class="tg-grid">
						<article class="tg-card span-12">
							<div class="tg-card-head">
								<div>
									<h2><?php esc_html_e( 'Saúde e produção', 'teoriageek' ); ?></h2>
									<span class="tg-card-sub"><?php esc_html_e( 'O que está ativo, o que falta configurar e manutenção rápida.', 'teoriageek' ); ?></span>
								</div>
								<div class="tg-health-actions">
									<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post" style="margin:0;">
										<input type="hidden" name="action" value="teoriageek_toggle_analytics_staff" />
										<?php wp_nonce_field( 'teoriageek_toggle_analytics_staff' ); ?>
										<button type="submit" class="tg-adm-btn tg-adm-btn-sec">
											<?php echo $ignore_staff ? esc_html__( 'Contar visitas da equipe', 'teoriageek' ) : esc_html__( 'Ignorar visitas da equipe', 'teoriageek' ); ?>
										</button>
									</form>
									<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post" style="margin:0;" id="tg-reset-analytics-form">
										<input type="hidden" name="action" value="teoriageek_reset_analytics" />
										<?php wp_nonce_field( 'teoriageek_reset_analytics' ); ?>
										<button type="submit" class="tg-adm-btn tg-adm-btn-sec"><?php esc_html_e( 'Zerar Analytics', 'teoriageek' ); ?></button>
									</form>
									<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post" style="margin:0;">
										<input type="hidden" name="action" value="teoriageek_flush_cache" />
										<?php wp_nonce_field( 'teoriageek_flush_cache' ); ?>
										<button type="submit" class="tg-adm-btn tg-adm-btn-sec"><?php esc_html_e( 'Limpar cache do tema', 'teoriageek' ); ?></button>
									</form>
								</div>
							</div>
							<ul class="tg-adm-status-list">
								<li class="tg-adm-status-item">
									<span><?php esc_html_e( 'Analytics First-Party (/telemetry)', 'teoriageek' ); ?></span>
									<span class="tg-adm-pill tg-pill-ok"><?php esc_html_e( 'Ativo (30 dias, sem cookies)', 'teoriageek' ); ?></span>
								</li>
								<li class="tg-adm-status-item">
									<span><?php esc_html_e( 'Visitas de editores logados', 'teoriageek' ); ?></span>
									<span class="tg-adm-pill <?php echo $ignore_staff ? 'tg-pill-info' : 'tg-pill-ok'; ?>"><?php echo $ignore_staff ? esc_html__( 'Ignoradas', 'teoriageek' ) : esc_html__( 'Contabilizadas', 'teoriageek' ); ?></span>
								</li>
								<li class="tg-adm-status-item">
									<span><?php esc_html_e( 'Rota /reels/ (permalinks)', 'teoriageek' ); ?></span>
									<span class="tg-adm-pill <?php echo $has_reels_rule ? 'tg-pill-ok' : 'tg-pill-warn'; ?>"><?php echo $has_reels_rule ? esc_html__( 'Ativa', 'teoriageek' ) : esc_html__( 'Salvar permalinks', 'teoriageek' ); ?></span>
								</li>
								<li class="tg-adm-status-item">
									<span><?php esc_html_e( 'Canal WhatsApp', 'teoriageek' ); ?></span>
									<span class="tg-adm-pill <?php echo $has_wa ? 'tg-pill-ok' : 'tg-pill-warn'; ?>"><?php echo $has_wa ? esc_html__( 'Configurado', 'teoriageek' ) : esc_html__( 'Pendente', 'teoriageek' ); ?></span>
								</li>
								<li class="tg-adm-status-item">
									<span><?php esc_html_e( 'Canal Telegram', 'teoriageek' ); ?></span>
									<span class="tg-adm-pill <?php echo $has_tg ? 'tg-pill-ok' : 'tg-pill-warn'; ?>"><?php echo $has_tg ? esc_html__( 'Configurado', 'teoriageek' ) : esc_html__( 'Pendente', 'teoriageek' ); ?></span>
								</li>
								<li class="tg-adm-status-item">
									<span><?php esc_html_e( 'Google Notícias', 'teoriageek' ); ?></span>
									<span class="tg-adm-pill <?php echo $has_gnews ? 'tg-pill-ok' : 'tg-pill-warn'; ?>"><?php echo $has_gnews ? esc_html__( 'Configurado', 'teoriageek' ) : esc_html__( 'Opcional', 'teoriageek' ); ?></span>
								</li>
								<li class="tg-adm-status-item">
									<span><?php esc_html_e( 'Newsletter (1 campo)', 'teoriageek' ); ?></span>
									<span class="tg-adm-pill <?php echo $has_newsletter ? 'tg-pill-ok' : 'tg-pill-warn'; ?>"><?php echo $has_newsletter ? esc_html__( 'Ativa', 'teoriageek' ) : esc_html__( 'Opcional', 'teoriageek' ); ?></span>
								</li>
								<li class="tg-adm-status-item">
									<span><?php esc_html_e( 'WP Super Cache', 'teoriageek' ); ?></span>
									<span class="tg-adm-pill <?php echo $has_cache ? 'tg-pill-ok' : 'tg-pill-info'; ?>"><?php echo $has_cache ? esc_html__( 'Integrado', 'teoriageek' ) : esc_html__( 'Não detectado', 'teoriageek' ); ?></span>
								</li>
								<li class="tg-adm-status-item">
									<span><?php esc_html_e( 'Post Views Counter', 'teoriageek' ); ?></span>
									<span class="tg-adm-pill <?php echo $has_pvc ? 'tg-pill-ok' : 'tg-pill-info'; ?>"><?php echo $has_pvc ? esc_html__( 'Ativo', 'teoriageek' ) : esc_html__( 'Contador nativo', 'teoriageek' ); ?></span>
								</li>
								<li class="tg-adm-status-item">
									<span><?php esc_html_e( 'Slots de anúncios', 'teoriageek' ); ?></span>
									<span class="tg-adm-pill <?php echo $has_ads ? 'tg-pill-ok' : 'tg-pill-info'; ?>"><?php echo $has_ads ? esc_html__( 'Preenchidos', 'teoriageek' ) : esc_html__( 'Auto Ads ou vazio', 'teoriageek' ); ?></span>
								</li>
							</ul>
						</article>

						<article class="tg-card span-12">
							<div class="tg-card-head">
								<h2><?php esc_html_e( 'Atalhos do Personalizador e da redação', 'teoriageek' ); ?></h2>
							</div>
							<div class="tg-adm-shortcuts">
								<a class="tg-adm-shortcut" href="<?php echo esc_url( admin_url( 'customize.php?autofocus[section]=teoriageek_editorial_extras' ) ); ?>">
									<strong><?php esc_html_e( 'Estreias, canais e newsletter', 'teoriageek' ); ?></strong>
									<span><?php esc_html_e( 'WhatsApp, Telegram, Google Notícias e Estreias', 'teoriageek' ); ?></span>
								</a>
								<a class="tg-adm-shortcut" href="<?php echo esc_url( admin_url( 'customize.php?autofocus[section]=teoriageek_colors_identity' ) ); ?>">
									<strong><?php esc_html_e( 'Cores e logotipo', 'teoriageek' ); ?></strong>
									<span><?php esc_html_e( 'Paleta azul e amarela e logo do portal', 'teoriageek' ); ?></span>
								</a>
								<a class="tg-adm-shortcut" href="<?php echo esc_url( admin_url( 'customize.php?autofocus[section]=teoriageek_home_categories' ) ); ?>">
									<strong><?php esc_html_e( 'Categorias da capa', 'teoriageek' ); ?></strong>
									<span><?php esc_html_e( 'Mapear os blocos da página inicial', 'teoriageek' ); ?></span>
								</a>
								<a class="tg-adm-shortcut" href="<?php echo esc_url( admin_url( 'customize.php?autofocus[section]=teoriageek_monetization' ) ); ?>">
									<strong><?php esc_html_e( 'Anúncios e oferecimento', 'teoriageek' ); ?></strong>
									<span><?php esc_html_e( 'Slots AdSense/Site Kit e patrocínio', 'teoriageek' ); ?></span>
								</a>
								<a class="tg-adm-shortcut" href="<?php echo esc_url( admin_url( 'edit-tags.php?taxonomy=universo' ) ); ?>">
									<strong><?php esc_html_e( 'Hubs de universo', 'teoriageek' ); ?></strong>
									<span><?php esc_html_e( 'Gerenciar franquias e séries especiais', 'teoriageek' ); ?></span>
								</a>
								<a class="tg-adm-shortcut" href="<?php echo esc_url( admin_url( 'options-permalink.php' ) ); ?>">
									<strong><?php esc_html_e( 'Links permanentes', 'teoriageek' ); ?></strong>
									<span><?php esc_html_e( 'Atualizar as rotas /reels/ e /universo/', 'teoriageek' ); ?></span>
								</a>
							</div>
						</article>
					</div>
				</section>
			<?php endif; ?>
		</div>

		<div id="tg-chart-tooltip" class="tg-chart-tooltip" role="status" aria-live="polite"></div>
		<div id="tg-adm-toast" class="tg-toast" role="status" aria-live="polite"></div>
	</div>
	<?php
}

/**
 * Adiciona colunas "Métricas" e "Destaques" na tabela de Todos os Posts (`edit.php`).
 *
 * @param array<string,string> $columns Colunas existentes.
 * @return array<string,string>
 */
function teoriageek_add_post_admin_columns( $columns ) {
	$new = array();
	foreach ( $columns as $key => $label ) {
		$new[ $key ] = $label;
		if ( 'title' === $key ) {
			$new['tg_metrics'] = __( 'Métricas', 'teoriageek' );
			$new['tg_flags']   = __( 'Destaques', 'teoriageek' );
		}
	}
	return $new;
}
add_filter( 'manage_post_posts_columns', 'teoriageek_add_post_admin_columns' );

/**
 * Renderiza o conteúdo das colunas "Métricas" e "Destaques" em `edit.php`.
 *
 * @param string $column  Nome da coluna.
 * @param int    $post_id ID do post.
 */
function teoriageek_render_post_admin_column( $column, $post_id ) {
	if ( 'tg_metrics' === $column ) {
		$views = function_exists( 'teoriageek_get_post_views' ) ? teoriageek_get_post_views( $post_id ) : 0;
		$likes = function_exists( 'teoriageek_get_post_likes' ) ? teoriageek_get_post_likes( $post_id ) : 0;
		$rev   = function_exists( 'teoriageek_get_review_details' ) ? teoriageek_get_review_details( $post_id ) : null;
		echo '<span class="tg-col-metric">' . esc_html( number_format_i18n( $views ) ) . ' ' . esc_html__( 'views', 'teoriageek' ) . '</span>';
		if ( $likes > 0 ) {
			echo '<span class="tg-col-metric">· ' . esc_html( number_format_i18n( $likes ) ) . ' ' . esc_html__( 'curtidas', 'teoriageek' ) . '</span>';
		}
		if ( $rev ) {
			echo '<br><span class="tg-col-metric">' . esc_html( sprintf( __( 'Nota: %s/10', 'teoriageek' ), $rev['score'] ) ) . '</span>';
		}
	} elseif ( 'tg_flags' === $column ) {
		$is_hero    = '1' === (string) get_post_meta( $post_id, '_tg_main_headline', true ) || '1' === (string) get_post_meta( $post_id, '_tg_is_hero', true );
		$is_ticker  = '1' === (string) get_post_meta( $post_id, '_tg_plantao', true ) || '1' === (string) get_post_meta( $post_id, '_tg_in_ticker', true );
		$is_spoiler = '1' === (string) get_post_meta( $post_id, '_tg_has_spoilers', true );
		if ( $is_hero ) {
			echo '<span class="tg-col-flag tg-pill-info">' . esc_html__( 'Manchete', 'teoriageek' ) . '</span>';
		}
		if ( $is_ticker ) {
			echo '<span class="tg-col-flag tg-pill-ok">' . esc_html__( 'Plantão', 'teoriageek' ) . '</span>';
		}
		if ( $is_spoiler ) {
			echo '<span class="tg-col-flag tg-pill-spoiler">' . esc_html__( 'Spoiler', 'teoriageek' ) . '</span>';
		}
		if ( ! $is_hero && ! $is_ticker && ! $is_spoiler ) {
			echo '<span style="color:#94a3b8;">—</span>';
		}
	}
}
add_action( 'manage_post_posts_custom_column', 'teoriageek_render_post_admin_column', 10, 2 );

/**
 * Adiciona filtro rápido de destaques do Teoria Geek no topo da tabela de Posts (`edit.php`).
 *
 * @param string $post_type Tipo de post atual.
 */
function teoriageek_add_admin_post_filter( $post_type ) {
	if ( 'post' !== $post_type ) {
		return;
	}
	$current = isset( $_GET['tg_flag'] ) ? sanitize_key( (string) wp_unslash( $_GET['tg_flag'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	?>
	<select name="tg_flag" aria-label="<?php esc_attr_e( 'Filtrar por destaque Teoria Geek', 'teoriageek' ); ?>">
		<option value=""><?php esc_html_e( 'Todos os destaques TG', 'teoriageek' ); ?></option>
		<option value="hero" <?php selected( $current, 'hero' ); ?>><?php esc_html_e( 'Manchete da Capa', 'teoriageek' ); ?></option>
		<option value="ticker" <?php selected( $current, 'ticker' ); ?>><?php esc_html_e( 'No Plantão Geek', 'teoriageek' ); ?></option>
		<option value="spoiler" <?php selected( $current, 'spoiler' ); ?>><?php esc_html_e( 'Com Alerta de Spoiler', 'teoriageek' ); ?></option>
	</select>
	<?php
}
add_action( 'restrict_manage_posts', 'teoriageek_add_admin_post_filter' );

/**
 * Aplica o filtro rápido `tg_flag` na listagem de posts do /wp-admin/.
 *
 * @param WP_Query $query Query administrativa principal.
 */
function teoriageek_apply_admin_post_filter( $query ) {
	if ( ! is_admin() || ! $query->is_main_query() || 'post' !== $query->get( 'post_type' ) ) {
		return;
	}
	$flag = isset( $_GET['tg_flag'] ) ? sanitize_key( (string) wp_unslash( $_GET['tg_flag'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$map  = array(
		'hero'    => array( '_tg_main_headline', '_tg_is_hero' ),
		'ticker'  => array( '_tg_plantao', '_tg_in_ticker' ),
		'spoiler' => array( '_tg_has_spoilers' ),
	);
	if ( isset( $map[ $flag ] ) ) {
		$mq = array( 'relation' => 'OR' );
		foreach ( $map[ $flag ] as $mk ) {
			$mq[] = array(
				'key'   => $mk,
				'value' => '1',
			);
		}
		$query->set( 'meta_query', $mq );
	}
}
add_action( 'pre_get_posts', 'teoriageek_apply_admin_post_filter' );

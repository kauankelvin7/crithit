<?php
/**
 * Teoria Geek — Template Tags reutilizáveis (badges, breadcrumbs Yoast+nativo,
 * menus com detecção inteligente, paginação, slots de anúncios e Mais Lidas via wp_post_views).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Renderiza o selo colorido de categoria editorial.
 *
 * @param WP_Term|null $term   Termo de categoria.
 * @param bool         $linked Se deve renderizar como link.
 * @param string       $size   'sm' ou 'md'.
 * @param bool         $skewed Se aplica inclinação editorial -skew-x-6.
 */
function teoriageek_category_badge( $term, $linked = false, $size = 'sm', $skewed = false ) {
	if ( ! $term instanceof WP_Term ) {
		return;
	}
	$style      = teoriageek_get_category_style( $term->slug );
	$size_class = ( 'md' === $size ) ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';
	$skew_outer = $skewed ? '-skew-x-6' : 'rounded-sm';
	$skew_inner = $skewed ? 'skew-x-6 inline-block' : '';
	$inline     = sprintf( 'background-color:%s;color:%s;', $style['fill'], $style['ink'] );
	$label      = html_entity_decode( $term->name, ENT_QUOTES, 'UTF-8' );

	if ( $linked ) {
		printf(
			'<a href="%1$s" class="inline-flex items-center font-mono %2$s %3$s font-bold uppercase tracking-wider leading-tight transition-opacity hover:opacity-90" style="%4$s"><span class="%5$s">%6$s</span></a>',
			esc_url( get_category_link( $term->term_id ) ),
			esc_attr( $size_class ),
			esc_attr( $skew_outer ),
			esc_attr( $inline ),
			esc_attr( $skew_inner ),
			esc_html( $label )
		);
		return;
	}

	printf(
		'<span class="inline-flex items-center font-mono %1$s %2$s font-bold uppercase tracking-wider leading-tight" style="%3$s"><span class="%4$s">%5$s</span></span>',
		esc_attr( $size_class ),
		esc_attr( $skew_outer ),
		esc_attr( $inline ),
		esc_attr( $skew_inner ),
		esc_html( $label )
	);
}

/**
 * Renderiza breadcrumb acessível integrado ao Yoast SEO quando ativo, com fallback nativo completo.
 */
function teoriageek_breadcrumb() {
	if ( function_exists( 'yoast_breadcrumb' ) ) {
		$yoast = yoast_breadcrumb( '<nav aria-label="' . esc_attr__( 'Navegação estrutural', 'teoriageek' ) . '" class="tg-yoast-breadcrumb mb-5 font-mono text-xs text-ink-secondary">', '</nav>', false );
		if ( ! empty( $yoast ) ) {
			echo wp_kses_post( $yoast );
			return;
		}
	}

	echo '<nav aria-label="' . esc_attr__( 'Navegação estrutural', 'teoriageek' ) . '" class="mb-5 flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-secondary">';
	echo '<a href="' . esc_url( home_url( '/' ) ) . '" class="font-semibold hover:text-brand hover:underline">' . esc_html__( 'Capa', 'teoriageek' ) . '</a>';

	if ( is_singular( 'post' ) ) {
		$cat = teoriageek_get_primary_category( get_the_ID() );
		if ( $cat ) {
			echo '<span class="text-ink-muted" aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
			echo '<a href="' . esc_url( get_category_link( $cat->term_id ) ) . '" class="font-semibold hover:text-brand hover:underline">' . esc_html( html_entity_decode( $cat->name, ENT_QUOTES, 'UTF-8' ) ) . '</a>';
		}
		$fmt = teoriageek_get_post_format_badge( get_the_ID() );
		echo '<span class="text-ink-muted" aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span aria-current="page" class="font-bold text-ink-primary">' . esc_html( $fmt['label'] ) . '</span>';
	} elseif ( is_category() ) {
		$queried = get_queried_object();
		if ( $queried instanceof WP_Term && $queried->parent > 0 ) {
			$parent = get_Category( $queried->parent );
			if ( $parent && ! is_wp_error( $parent ) ) {
				echo '<span class="text-ink-muted" aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
				echo '<a href="' . esc_url( get_category_link( $parent->term_id ) ) . '" class="font-semibold hover:text-brand hover:underline">' . esc_html( html_entity_decode( $parent->name, ENT_QUOTES, 'UTF-8' ) ) . '</a>';
			}
		}
		echo '<span class="text-ink-muted" aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span aria-current="page" class="font-bold text-ink-primary">' . esc_html( html_entity_decode( single_cat_title( '', false ), ENT_QUOTES, 'UTF-8' ) ) . '</span>';
	} elseif ( is_tag() ) {
		echo '<span class="text-ink-muted" aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span aria-current="page" class="font-bold text-ink-primary">#' . esc_html( html_entity_decode( single_tag_title( '', false ), ENT_QUOTES, 'UTF-8' ) ) . '</span>';
	} elseif ( is_author() ) {
		echo '<span class="text-ink-muted" aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span aria-current="page" class="font-bold text-ink-primary">' . esc_html( get_the_author() ) . '</span>';
	} elseif ( is_search() ) {
		echo '<span class="text-ink-muted" aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span aria-current="page" class="font-bold text-ink-primary">' . esc_html__( 'Busca', 'teoriageek' ) . '</span>';
	} elseif ( is_page() ) {
		echo '<span class="text-ink-muted" aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span aria-current="page" class="font-bold text-ink-primary">' . esc_html( get_the_title() ) . '</span>';
	} elseif ( is_archive() ) {
		echo '<span class="text-ink-muted" aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span aria-current="page" class="font-bold text-ink-primary">' . wp_kses_post( get_the_archive_title() ) . '</span>';
	}

	echo '</nav>';
}

/**
 * Renderiza o menu principal (usa a localização `primary`, ou detecta automaticamente o menu real
 * `menu-principal` já cadastrado no banco do Teoria Geek, ou monta fallback pelas categorias principais).
 *
 * @param string $menu_class Classes UL.
 */
function teoriageek_render_primary_nav( $menu_class = 'tg-primary-menu flex items-center gap-0.5' ) {
	if ( has_nav_menu( 'primary' ) ) {
		wp_nav_menu(
			array(
				'theme_location' => 'primary',
				'container'      => false,
				'menu_class'     => $menu_class,
				'depth'          => 2,
			)
		);
		return;
	}

	// Tenta aproveitar automaticamente o menu real já salvo no banco (`menu-principal` / `Menu Principal`).
	foreach ( array( 'menu-principal', 'Menu Principal', 'menu' ) as $candidate ) {
		$nav_obj = wp_get_nav_menu_object( $candidate );
		if ( $nav_obj && ! is_wp_error( $nav_obj ) && (int) $nav_obj->count > 0 ) {
			wp_nav_menu(
				array(
					'menu'       => $nav_obj->term_id,
					'container'  => false,
					'menu_class' => $menu_class,
					'depth'      => 2,
				)
			);
			return;
		}
	}

	$preferred_slugs = array( 'noticias', 'games', 'filmes', 'series', 'animes-mangas', 'livros-hqs', 'criticas', 'reviews' );
	echo '<ul class="' . esc_attr( $menu_class ) . '">';
	echo '<li><a href="' . esc_url( home_url( '/' ) ) . '">' . esc_html__( 'Capa', 'teoriageek' ) . '</a></li>';
	$shown = 0;
	foreach ( $preferred_slugs as $slug ) {
		$term = get_category_by_slug( $slug );
		if ( $term && ! is_wp_error( $term ) ) {
			echo '<li><a href="' . esc_url( get_category_link( $term->term_id ) ) . '">' . esc_html( html_entity_decode( $term->name, ENT_QUOTES, 'UTF-8' ) ) . '</a></li>';
			++$shown;
			if ( $shown >= 7 ) {
				break;
			}
		}
	}
	echo '</ul>';
}

/**
 * Paginação editorial reutilizando template-parts/pagination.php.
 */
function teoriageek_pagination() {
	get_template_part( 'template-parts/pagination' );
}

/**
 * Retorna a URL da logo oficial do portal (Personalizador -> Logo padrão WP -> Logo oficial embutida do Teoria Geek).
 *
 * @param string $variant 'header' ou 'footer'.
 * @return string
 */
function teoriageek_get_brand_logo_url( $variant = 'header' ) {
	$dark_logo = trim( (string) get_theme_mod( 'teoriageek_logo_dark', '' ) );
	if ( '' !== $dark_logo ) {
		return $dark_logo;
	}

	$logo_id = (int) get_theme_mod( 'custom_logo' );
	if ( $logo_id > 0 ) {
		$custom_url = (string) wp_get_attachment_image_url( $logo_id, 'medium' );
		if ( '' !== $custom_url ) {
			return $custom_url;
		}
	}

	$rel = ( 'footer' === $variant && file_exists( TEORIAGEEK_DIR . '/assets/images/logo-teoria-geek-footer.png' ) )
		? '/assets/images/logo-teoria-geek-footer.png'
		: '/assets/images/logo-teoria-geek.png';

	if ( file_exists( TEORIAGEEK_DIR . $rel ) ) {
		return TEORIAGEEK_URI . $rel;
	}

	return '';
}

/**
 * Renderiza a logo oficial do portal no cabeçalho (mantendo a logo clássica do Teoria Geek por padrão).
 */
function teoriageek_render_brand_logo() {
	$site_name = (string) get_theme_mod( 'teoriageek_site_name', get_bloginfo( 'name' ) ?: 'Teoria Geek' );
	$logo_url  = teoriageek_get_brand_logo_url( 'header' );

	echo '<a href="' . esc_url( home_url( '/' ) ) . '" class="inline-flex shrink-0 items-center gap-2.5 group focus-visible:outline-highlight" aria-label="' . esc_attr( $site_name . ' — Ir para a capa' ) . '">';
	if ( '' !== $logo_url ) {
		printf(
			'<img src="%1$s" alt="%2$s" width="300" height="190" class="tg-brand-logo h-12 w-auto max-w-[150px] object-contain transition-transform duration-150 group-hover:scale-105 sm:h-14" decoding="async" fetchpriority="high" />',
			esc_url( $logo_url ),
			esc_attr( $site_name )
		);
	} else {
		printf(
			'<span class="inline-flex items-center rounded border-2 border-highlight bg-brand-fill px-3 py-1 font-display text-2xl leading-none tracking-wider text-white shadow-hard-sm transition-transform group-hover:-translate-y-0.5">%s</span>',
			esc_html( strtoupper( $site_name ) )
		);
	}
	echo '</a>';
}

/**
 * Obtém o HTML de um slot opcional de anúncio (Customizer ou Widget) com reserva de altura anti-CLS.
 *
 * @param string $slot 'top', 'mid_article' ou 'sidebar'.
 * @return string
 */
function teoriageek_get_ad_slot_markup( $slot ) {
	$sidebar_map = array(
		'top'         => 'tg-top-banner',
		'mid_article' => 'tg-mid-article',
		'sidebar'     => 'tg-single-sidebar',
	);
	$min_h_map   = array(
		'top'         => 'min-h-[90px]',
		'mid_article' => 'min-h-[250px]',
		'sidebar'     => 'min-h-[250px]',
	);

	$custom_code = trim( (string) get_theme_mod( 'teoriageek_ad_' . $slot, '' ) );
	$sidebar_id  = isset( $sidebar_map[ $slot ] ) ? $sidebar_map[ $slot ] : '';
	$has_widget  = ( '' !== $sidebar_id && is_active_sidebar( $sidebar_id ) );

	if ( '' === $custom_code && ! $has_widget ) {
		return '';
	}

	ob_start();
	$min_h = isset( $min_h_map[ $slot ] ) ? $min_h_map[ $slot ] : 'min-h-[90px]';
	?>
	<aside aria-label="<?php esc_attr_e( 'Publicidade', 'teoriageek' ); ?>" class="tg-ad-slot my-6 rounded border border-border-subtle bg-surface-alt p-3 text-center">
		<span class="mb-1.5 block font-mono text-[11px] uppercase tracking-widest text-ink-muted">
			<?php esc_html_e( 'Publicidade', 'teoriageek' ); ?>
		</span>
		<div class="mx-auto flex items-center justify-center overflow-hidden <?php echo esc_attr( $min_h ); ?>">
			<?php
			if ( '' !== $custom_code ) {
				echo $custom_code; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Sanitizado em teoriageek_sanitize_ad_code().
			} elseif ( $has_widget ) {
				dynamic_sidebar( $sidebar_id );
			}
			?>
		</div>
	</aside>
	<?php
	return (string) ob_get_clean();
}

/**
 * Consulta otimizada dos posts "Mais Lidas" lendo `wp_post_views` (com verificação segura da tabela,
 * uso estrito do índice primário `(type, period, id)`, cache transient de 15 min e fallback automático).
 *
 * @param int   $limit       Quantidade desejada.
 * @param int[] $exclude_ids IDs a excluir opcionalmente.
 * @return WP_Post[]
 */
function teoriageek_get_most_read_posts( $limit = 5, $exclude_ids = array() ) {
	$limit       = max( 1, (int) $limit );
	$exclude_ids = array_values( array_filter( array_map( 'intval', (array) $exclude_ids ) ) );
	$posts       = array();

	// 1. Tenta consultar a tabela real `wp_post_views` (Post Views Counter) com cache em transient.
	if ( teoriageek_has_post_views_table() ) {
		$top_rows = get_transient( 'teoriageek_most_read_pvc_v1' );

		if ( ! is_array( $top_rows ) ) {
			global $wpdb;
			$table = $wpdb->prefix . 'post_views';

			// Busca o último período diário disponível via índice primário `(type, period)` em O(1).
			$max_period = $wpdb->get_var( "SELECT MAX(period) FROM {$table} WHERE type = 0" ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$top_rows   = array();

			if ( is_string( $max_period ) && preg_match( '/^\d{8}$/', $max_period ) ) {
				$max_dt     = DateTimeImmutable::createFromFormat( 'Ymd', $max_period, wp_timezone() );
				$min_period = $max_dt ? $max_dt->modify( '-21 days' )->format( 'Ymd' ) : $max_period;

				$results = $wpdb->get_results(
					$wpdb->prepare(
						"SELECT pv.id, SUM(pv.count) AS total_views
						 FROM {$table} pv
						 INNER JOIN {$wpdb->posts} p ON p.ID = pv.id
						 WHERE pv.type = 0
						   AND pv.period BETWEEN %s AND %s
						   AND p.post_type = 'post'
						   AND p.post_status = 'publish'
						 GROUP BY pv.id
						 ORDER BY total_views DESC
						 LIMIT 20", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
						$min_period,
						$max_period
					),
					ARRAY_A
				);

				if ( is_array( $results ) ) {
					$top_rows = $results;
				}
			}

			set_transient( 'teoriageek_most_read_pvc_v1', $top_rows, 15 * MINUTE_IN_SECONDS );
		}

		if ( ! empty( $top_rows ) ) {
			$candidate_ids = array();
			foreach ( $top_rows as $row ) {
				$pid = isset( $row['id'] ) ? (int) $row['id'] : 0;
				if ( $pid > 0 && ! in_array( $pid, $exclude_ids, true ) ) {
					$candidate_ids[] = $pid;
				}
				if ( count( $candidate_ids ) >= $limit ) {
					break;
				}
			}

			if ( ! empty( $candidate_ids ) ) {
				$pvc_query = new WP_Query(
					array(
						'post_type'           => 'post',
						'post_status'         => 'publish',
						'post__in'            => $candidate_ids,
						'orderby'             => 'post__in',
						'posts_per_page'      => $limit,
						'ignore_sticky_posts' => true,
						'no_found_rows'       => true,
					)
				);
				$posts = $pvc_query->posts;
			}
		}
	}

	// 2. Fallback para contador em post_meta (`post_views_count` / `_tg_views_count`).
	if ( count( $posts ) < $limit ) {
		$already    = array_merge( $exclude_ids, wp_list_pluck( $posts, 'ID' ) );
		$meta_query = new WP_Query(
			array(
				'post_type'           => 'post',
				'post_status'         => 'publish',
				'posts_per_page'      => $limit - count( $posts ),
				'post__not_in'        => $already,
				'ignore_sticky_posts' => true,
				'meta_key'            => 'post_views_count',
				'orderby'             => 'meta_value_num',
				'order'               => 'DESC',
				'date_query'          => array(
					array(
						'after' => '90 days ago',
					),
				),
				'no_found_rows'       => true,
			)
		);
		$posts = array_merge( $posts, $meta_query->posts );
	}

	// 3. Fallback final garantido para posts recentes/comentados.
	if ( count( $posts ) < $limit ) {
		$already  = array_merge( $exclude_ids, wp_list_pluck( $posts, 'ID' ) );
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

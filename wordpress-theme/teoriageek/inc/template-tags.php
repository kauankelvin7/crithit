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
	unset( $skewed );
	$style      = teoriageek_get_category_style( $term->slug );
	$size_class = ( 'md' === $size ) ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';
	$inline     = sprintf( 'background-color:%s;color:%s;', $style['fill'], $style['ink'] );
	$label      = teoriageek_fix_mojibake( html_entity_decode( $term->name, ENT_QUOTES, 'UTF-8' ) );

	if ( $linked ) {
		printf(
			'<a href="%1$s" title="%4$s" class="tg-cat-badge inline-flex max-w-full items-center overflow-hidden whitespace-nowrap rounded-sm font-headline %2$s font-bold uppercase tracking-wider leading-tight transition-opacity hover:opacity-90" style="%3$s"><span class="truncate">%4$s</span></a>',
			esc_url( get_category_link( $term->term_id ) ),
			esc_attr( $size_class ),
			esc_attr( $inline ),
			esc_html( $label )
		);
		return;
	}

	printf(
		'<span title="%3$s" class="tg-cat-badge inline-flex max-w-full items-center overflow-hidden whitespace-nowrap rounded-sm font-headline %1$s font-bold uppercase tracking-wider leading-tight" style="%2$s"><span class="truncate">%3$s</span></span>',
		esc_attr( $size_class ),
		esc_attr( $inline ),
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
			$parent = get_category( $queried->parent );
			if ( $parent && ! is_wp_error( $parent ) ) {
				echo '<span class="text-ink-muted" aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
				echo '<a href="' . esc_url( get_category_link( $parent->term_id ) ) . '" class="font-semibold hover:text-brand hover:underline">' . esc_html( teoriageek_fix_mojibake( html_entity_decode( $parent->name, ENT_QUOTES, 'UTF-8' ) ) ) . '</a>';
			}
		}
		echo '<span class="text-ink-muted" aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span aria-current="page" class="font-bold text-ink-primary">' . esc_html( teoriageek_fix_mojibake( html_entity_decode( single_cat_title( '', false ), ENT_QUOTES, 'UTF-8' ) ) ) . '</span>';
	} elseif ( is_tax( 'universo' ) ) {
		echo '<span class="text-ink-muted" aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span class="font-semibold text-ink-secondary">' . esc_html__( 'Universo', 'teoriageek' ) . '</span>';
		echo '<span class="text-ink-muted" aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span aria-current="page" class="font-bold text-ink-primary">' . esc_html( teoriageek_fix_mojibake( html_entity_decode( single_term_title( '', false ), ENT_QUOTES, 'UTF-8' ) ) ) . '</span>';
	} elseif ( is_tag() ) {
		echo '<span class="text-ink-muted" aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span aria-current="page" class="font-bold text-ink-primary">#' . esc_html( teoriageek_fix_mojibake( html_entity_decode( single_tag_title( '', false ), ENT_QUOTES, 'UTF-8' ) ) ) . '</span>';
	} elseif ( is_author() ) {
		echo '<span class="text-ink-muted" aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span aria-current="page" class="font-bold text-ink-primary">' . esc_html( get_the_author() ) . '</span>';
	} elseif ( is_search() ) {
		echo '<span class="text-ink-muted" aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span aria-current="page" class="font-bold text-ink-primary">' . esc_html__( 'Busca', 'teoriageek' ) . '</span>';
	} elseif ( is_page() ) {
		echo '<span class="text-ink-muted" aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span aria-current="page" class="font-bold text-ink-primary">' . esc_html( teoriageek_clean_title( get_the_title() ) ) . '</span>';
	} elseif ( is_archive() ) {
		echo '<span class="text-ink-muted" aria-hidden="true">' . teoriageek_icon( 'chevron-right', 'h-3.5 w-3.5' ) . '</span>';
		echo '<span aria-current="page" class="font-bold text-ink-primary">' . wp_kses_post( teoriageek_fix_mojibake( get_the_archive_title() ) ) . '</span>';
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
			'<img src="%1$s" alt="%2$s" width="300" height="190" class="tg-brand-logo h-11 w-auto max-w-[144px] object-contain transition-opacity duration-150 group-hover:opacity-90 sm:h-12 sm:max-w-[156px]" decoding="async" fetchpriority="high" />',
			esc_url( $logo_url ),
			esc_attr( $site_name )
		);
	} else {
		printf(
			'<span class="inline-flex items-center rounded-sm border border-highlight bg-brand-fill px-3 py-1 font-headline text-2xl font-extrabold leading-none tracking-wider text-white transition-opacity group-hover:opacity-90">%s</span>',
			esc_html( strtoupper( $site_name ) )
		);
	}
	echo '</a>';
}

/**
 * Identifica se o HTML renderizado de uma sidebar corresponde a código real de anúncio/monetização
 * (AdSense, Google Ad Manager, Taboola, Outbrain, etc.) em vez de widgets nativos comuns do WordPress.
 *
 * @param string $html HTML renderizado pelos widgets do slot.
 * @return bool
 */
function teoriageek_is_ad_markup( $html ) {
	if ( '' === trim( $html ) ) {
		return false;
	}
	return (bool) preg_match(
		'/(?:adsbygoogle|googlesyndication|doubleclick\.net|googletag|gpt-ad|data-ad-client|data-ad-slot|ad-inserter|adinserter|taboola|outbrain|mgid|amzn_assoc)/i',
		$html
	);
}

/**
 * Obtém o HTML de um slot opcional de anúncio (Customizer ou Widget) com reserva de altura anti-CLS
 * e empilhamento estritamente vertical. Suprime o rótulo "PUBLICIDADE" quando o slot exibe widgets comuns do WP.
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

	$widget_html = '';
	if ( '' === $custom_code && $has_widget ) {
		ob_start();
		dynamic_sidebar( $sidebar_id );
		$widget_html = trim( (string) ob_get_clean() );
		if ( '' === $widget_html ) {
			return '';
		}
	}

	$is_real_ad = ( '' !== $custom_code ) || teoriageek_is_ad_markup( $widget_html );

	// Quando o slot contém widgets comuns do WordPress (ex.: Busca, Posts Recentes, Categorias),
	// empilha verticalmente em coluna única e NÃO exibe o rótulo "PUBLICIDADE".
	if ( ! $is_real_ad ) {
		$margin_cls = ( 'sidebar' === $slot ) ? '' : 'my-6 ';
		return sprintf(
			'<div class="tg-sidebar-widgets tg-widget-stack %1$sflex w-full min-w-0 flex-col gap-5 text-left">%2$s</div>',
			esc_attr( $margin_cls ),
			$widget_html
		);
	}

	ob_start();
	$min_h = isset( $min_h_map[ $slot ] ) ? $min_h_map[ $slot ] : 'min-h-[90px]';
	?>
	<aside aria-label="<?php esc_attr_e( 'Publicidade', 'teoriageek' ); ?>" class="tg-ad-slot tg-ad-slot--ad my-6 flex w-full min-w-0 flex-col rounded-sm border border-border-subtle bg-surface-alt p-3 text-center">
		<span class="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
			<?php esc_html_e( 'Publicidade', 'teoriageek' ); ?>
		</span>
		<div class="tg-ad-slot__inner mx-auto flex w-full min-w-0 flex-col items-stretch justify-center gap-4 overflow-hidden <?php echo esc_attr( $min_h ); ?>">
			<?php
			if ( '' !== $custom_code ) {
				echo $custom_code; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Sanitizado em teoriageek_sanitize_ad_code().
			} else {
				echo $widget_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Saída nativa de dynamic_sidebar().
			}
			?>
		</div>
	</aside>
	<?php
	return (string) ob_get_clean();
}

/**
 * Renderiza o selo editorial de "Oferecimento" quando configurado para a categoria alvo no Customizer.
 *
 * @param string $category_slug Slug da categoria atual.
 */
function teoriageek_render_sponsor_badge( $category_slug ) {
	$target_slug  = sanitize_title( (string) get_theme_mod( 'teoriageek_sponsor_category', '' ) );
	$sponsor_name = trim( (string) get_theme_mod( 'teoriageek_sponsor_name', '' ) );
	if ( '' === $target_slug || '' === $sponsor_name || sanitize_title( (string) $category_slug ) !== $target_slug ) {
		return;
	}
	$label = trim( (string) get_theme_mod( 'teoriageek_sponsor_label', 'Oferecimento' ) ) ?: 'Oferecimento';
	$url   = teoriageek_safe_http_url( (string) get_theme_mod( 'teoriageek_sponsor_url', '' ) );
	?>
	<span class="inline-flex items-center gap-1.5 rounded border border-[#0B0F19]/25 bg-highlight px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[#0B0F19]">
		<span class="opacity-75"><?php echo esc_html( $label ); ?>:</span>
		<?php if ( '' !== $url ) : ?>
			<a href="<?php echo esc_url( $url ); ?>" target="_blank" rel="sponsored noopener noreferrer" class="underline decoration-2 underline-offset-2">
				<?php echo esc_html( $sponsor_name ); ?>
			</a>
		<?php else : ?>
			<span><?php echo esc_html( $sponsor_name ); ?></span>
		<?php endif; ?>
	</span>
	<?php
}

/**
 * Consulta otimizada dos posts "Mais Lidas" lendo `wp_post_views` em janela 24h ou 7d,
 * com verificação segura da tabela, uso estrito do índice primário `(type, period, id)`,
 * cache transient de 15 min e fallback automático.
 *
 * @param int    $limit       Quantidade desejada.
 * @param int[]  $exclude_ids IDs a excluir opcionalmente.
 * @param string $window      Janela temporal: '7d' (padrão) ou '24h'.
 * @return WP_Post[]
 */
function teoriageek_get_most_read_posts( $limit = 5, $exclude_ids = array(), $window = '7d' ) {
	$limit       = max( 1, (int) $limit );
	$exclude_ids = array_values( array_filter( array_map( 'intval', (array) $exclude_ids ) ) );
	$window      = ( '24h' === $window ) ? '24h' : '7d';
	$posts       = array();

	// 1. Tenta consultar a tabela real `wp_post_views` (Post Views Counter) com cache em transient (15 min).
	if ( teoriageek_has_post_views_table() ) {
		$transient_key = 'teoriageek_most_read_pvc_' . $window . '_v2';
		$top_rows      = get_transient( $transient_key );

		if ( ! is_array( $top_rows ) ) {
			global $wpdb;
			$table = $wpdb->prefix . 'post_views';

			// Busca o último período diário disponível via índice primário `(type, period)` em O(1).
			$max_period = $wpdb->get_var( "SELECT MAX(period) FROM {$table} WHERE type = 0" ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$top_rows   = array();

			if ( is_string( $max_period ) && preg_match( '/^\d{8}$/', $max_period ) ) {
				$max_dt     = DateTimeImmutable::createFromFormat( 'Ymd', $max_period, wp_timezone() );
				$days_back  = ( '24h' === $window ) ? '-1 days' : '-7 days';
				$min_period = $max_dt ? $max_dt->modify( $days_back )->format( 'Ymd' ) : $max_period;

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

			set_transient( $transient_key, $top_rows, 15 * MINUTE_IN_SECONDS );
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

	if ( ! empty( $posts ) ) {
		teoriageek_prime_post_views( wp_list_pluck( $posts, 'ID' ) );
	}

	return $posts;
}


/**
 * Renderiza avatar circular + nome do autor nos cards editoriais (estilo Metrópoles).
 *
 * @param int  $author_id ID do autor.
 * @param int  $size      Tamanho em px (18, 20 ou 24).
 * @param bool $prefix    Se inclui o prefixo "Por ".
 */
function teoriageek_render_author_chip( $author_id, $size = 20, $prefix = false ) {
	$author_id = (int) $author_id;
	$name      = get_the_author_meta( 'display_name', $author_id );
	if ( '' === $name ) {
		return;
	}
	$size       = max( 16, min( 32, (int) $size ) );
	$avatar_url = get_avatar_url( $author_id, array( 'size' => $size * 2 ) );
	$initial    = mb_strtoupper( mb_substr( trim( $name ), 0, 1, 'UTF-8' ), 'UTF-8' );
	$label      = $prefix ? sprintf( __( 'Por %s', 'teoriageek' ), $name ) : $name;
	?>
	<span class="tgx-author-chip inline-flex min-w-0 items-center gap-1.5">
		<?php if ( $avatar_url ) : ?>
			<img
				src="<?php echo esc_url( $avatar_url ); ?>"
				alt="<?php echo esc_attr( $name ); ?>"
				width="<?php echo esc_attr( (string) $size ); ?>"
				height="<?php echo esc_attr( (string) $size ); ?>"
				loading="lazy"
				decoding="async"
				class="tgx-author-avatar shrink-0 rounded-full object-cover"
				style="width:<?php echo esc_attr( (string) $size ); ?>px;height:<?php echo esc_attr( (string) $size ); ?>px;"
			/>
		<?php else : ?>
			<span class="tgx-author-avatar-fallback inline-flex shrink-0 items-center justify-center rounded-full bg-brand-fill font-bold text-white" style="width:<?php echo esc_attr( (string) $size ); ?>px;height:<?php echo esc_attr( (string) $size ); ?>px;font-size:11px;" aria-hidden="true">
				<?php echo esc_html( $initial ); ?>
			</span>
		<?php endif; ?>
		<span class="truncate font-medium text-ink-secondary"><?php echo esc_html( $label ); ?></span>
	</span>
	<?php
}

/**
 * Renderiza faixa horizontal rolável de editorias rápidas no mobile (< 1024px), estilo Metrópoles.
 */
function teoriageek_render_mobile_cat_strip() {
	$slugs = array( 'noticias', 'games', 'filmes', 'series', 'animes-mangas', 'criticas', 'reviews', 'livros-hqs', 'especial-teoria-geek' );
	$items = array();
	foreach ( $slugs as $slug ) {
		$term = get_category_by_slug( $slug );
		if ( $term && ! is_wp_error( $term ) ) {
			$items[] = $term;
		}
	}
	if ( empty( $items ) ) {
		return;
	}
	$current_cat_id = 0;
	if ( is_category() ) {
		$current_cat_id = (int) get_queried_object_id();
	} elseif ( is_singular( 'post' ) ) {
		$primary_cat    = teoriageek_get_primary_category( get_the_ID() );
		$current_cat_id = ( $primary_cat instanceof WP_Term ) ? (int) $primary_cat->term_id : 0;
	}
	$is_home_active = is_front_page();

	echo '<nav aria-label="' . esc_attr__( 'Acesso rápido às editorias', 'teoriageek' ) . '" class="tgx-mobile-cat-strip lg:hidden border-t border-white/10 bg-chrome-surface">';
	echo '<div class="tgx-mobile-cat-scroll flex items-center gap-1 overflow-x-auto px-3">';
	echo '<a href="' . esc_url( home_url( '/' ) ) . '"' . ( $is_home_active ? ' aria-current="page"' : '' ) . ' class="tgx-mobile-cat-pill' . ( $is_home_active ? ' is-active' : '' ) . '">' . esc_html__( 'Capa', 'teoriageek' ) . '</a>';
	foreach ( $items as $term ) {
		$is_curr = ( $current_cat_id === (int) $term->term_id );
		echo '<a href="' . esc_url( get_category_link( $term->term_id ) ) . '"' . ( $is_curr ? ' aria-current="page"' : '' ) . ' class="tgx-mobile-cat-pill' . ( $is_curr ? ' is-active' : '' ) . '">' . esc_html( teoriageek_fix_mojibake( html_entity_decode( $term->name, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) ) ) . '</a>';
	}
	echo '</div></nav>';
}

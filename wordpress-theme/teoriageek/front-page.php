<?php
/**
 * Página Inicial Editorial (Home) — Teoria Geek.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
get_template_part( 'template-parts/breaking-ticker' );

$tg_used_ids = array();

// 1. Manchete Principal (meta explícita _tg_main_headline -> categoria DESTAQUE -> último post).
$tg_hero_post = null;

$tg_pinned_q = new WP_Query(
	array(
		'post_type'           => 'post',
		'post_status'         => 'publish',
		'posts_per_page'      => 1,
		'ignore_sticky_posts' => true,
		'meta_key'            => '_tg_main_headline',
		'meta_value'          => '1',
		'no_found_rows'       => true,
	)
);
if ( ! empty( $tg_pinned_q->posts ) ) {
	$tg_hero_post = $tg_pinned_q->posts[0];
}

$tg_destaque_slug = teoriageek_get_mapped_category_slug( 'destaque' );
$tg_destaque_args = array(
	'post_type'           => 'post',
	'post_status'         => 'publish',
	'posts_per_page'      => 6,
	'ignore_sticky_posts' => true,
	'no_found_rows'       => true,
);
if ( '' !== $tg_destaque_slug && get_category_by_slug( $tg_destaque_slug ) ) {
	$tg_destaque_args['category_name'] = $tg_destaque_slug;
}
$tg_destaque_q    = new WP_Query( $tg_destaque_args );
$tg_destaque_pool = $tg_destaque_q->posts;

if ( ! $tg_hero_post && ! empty( $tg_destaque_pool ) ) {
	$tg_hero_post = $tg_destaque_pool[0];
}

$tg_recent_q    = new WP_Query(
	array(
		'post_type'           => 'post',
		'post_status'         => 'publish',
		'posts_per_page'      => 16,
		'ignore_sticky_posts' => true,
		'no_found_rows'       => true,
	)
);
$tg_recent_pool = $tg_recent_q->posts;

if ( ! $tg_hero_post && ! empty( $tg_recent_pool ) ) {
	$tg_hero_post = $tg_recent_pool[0];
}

if ( $tg_hero_post ) {
	$tg_used_ids[] = (int) $tg_hero_post->ID;
}

// 2. Três Destaques Secundários (sem repetir o Hero).
$tg_secondary = array();
foreach ( array_merge( $tg_destaque_pool, $tg_recent_pool ) as $tg_cand ) {
	$tg_cid = (int) $tg_cand->ID;
	if ( ! in_array( $tg_cid, $tg_used_ids, true ) ) {
		$tg_secondary[] = $tg_cand;
		$tg_used_ids[]  = $tg_cid;
	}
	if ( count( $tg_secondary ) >= 3 ) {
		break;
	}
}

// 3. Reel em Destaque + 2 Radar na Redação (sem repetição na 1ª dobra).
$tg_featured_reel = null;
foreach ( $tg_recent_pool as $tg_cand ) {
	$tg_cid = (int) $tg_cand->ID;
	if ( ! in_array( $tg_cid, $tg_used_ids, true ) ) {
		$tg_featured_reel = $tg_cand;
		$tg_used_ids[]    = $tg_cid;
		break;
	}
}

$tg_urgent_posts = array();
foreach ( $tg_recent_pool as $tg_cand ) {
	$tg_cid = (int) $tg_cand->ID;
	if ( ! in_array( $tg_cid, $tg_used_ids, true ) ) {
		$tg_urgent_posts[] = $tg_cand;
		$tg_used_ids[]     = $tg_cid;
	}
	if ( count( $tg_urgent_posts ) >= 2 ) {
		break;
	}
}

// 4. Giro Geek — Últimas Notícias (8 cards).
$tg_noticias_slug = teoriageek_get_mapped_category_slug( 'noticias' );
$tg_giro_args     = array(
	'post_type'           => 'post',
	'post_status'         => 'publish',
	'posts_per_page'      => 8,
	'post__not_in'        => $tg_used_ids,
	'ignore_sticky_posts' => true,
	'no_found_rows'       => true,
);
if ( '' !== $tg_noticias_slug && get_category_by_slug( $tg_noticias_slug ) ) {
	$tg_giro_args['category_name'] = $tg_noticias_slug;
}
$tg_giro_q     = new WP_Query( $tg_giro_args );
$tg_giro_posts = $tg_giro_q->posts;

// 5. Mais Lidas 7d & 24h (lendo wp_post_views via Transients API).
$tg_most_read_7d  = teoriageek_get_most_read_posts( 5, array(), '7d' );
$tg_most_read_24h = teoriageek_get_most_read_posts( 5, array(), '24h' );
$tg_premieres     = teoriageek_get_weekly_premieres();
$tg_top_ad        = teoriageek_get_ad_slot_markup( 'top' );

// 6. Críticas & Reviews (4 cards com nota extraída).
$tg_review_cat_ids = array();
foreach ( array( teoriageek_get_mapped_category_slug( 'criticas' ), teoriageek_get_mapped_category_slug( 'reviews' ) ) as $tg_r_slug ) {
	if ( '' !== $tg_r_slug ) {
		$tg_r_term = get_category_by_slug( $tg_r_slug );
		if ( $tg_r_term && ! is_wp_error( $tg_r_term ) ) {
			$tg_review_cat_ids[] = (int) $tg_r_term->term_id;
		}
	}
}
$tg_reviews_args = array(
	'post_type'           => 'post',
	'post_status'         => 'publish',
	'posts_per_page'      => 4,
	'ignore_sticky_posts' => true,
	'no_found_rows'       => true,
);
if ( ! empty( $tg_review_cat_ids ) ) {
	$tg_reviews_args['category__in'] = $tg_review_cat_ids;
}
$tg_reviews_q     = new WP_Query( $tg_reviews_args );
$tg_reviews_posts = $tg_reviews_q->posts;

// 7. Especiais & Colunas (4 cards).
$tg_especiais_slug  = teoriageek_get_mapped_category_slug( 'especiais' );
$tg_especiais_posts = array();
if ( '' !== $tg_especiais_slug && get_category_by_slug( $tg_especiais_slug ) ) {
	$tg_esp_q           = new WP_Query(
		array(
			'post_type'           => 'post',
			'post_status'         => 'publish',
			'category_name'       => $tg_especiais_slug,
			'posts_per_page'      => 4,
			'ignore_sticky_posts' => true,
			'no_found_rows'       => true,
		)
	);
	$tg_especiais_posts = $tg_esp_q->posts;
}

// 8. Carrossel de Reels (6 itens).
$tg_reels_strip = array_slice( $tg_recent_pool, 0, 6 );

// 9. Colunas de Editorias configuráveis (3 superiores + 2 inferiores).
$tg_primary_cols   = array( 'col_1', 'col_2', 'col_3' );
$tg_secondary_cols = array( 'col_4', 'col_5' );
?>

<main id="conteudo-principal" class="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
	<?php
	get_template_part(
		'template-parts/hero-home',
		null,
		array(
			'hero'      => $tg_hero_post,
			'secondary' => $tg_secondary,
			'reel'      => $tg_featured_reel,
			'urgent'    => $tg_urgent_posts,
		)
	);

	// Slot opcional de banner posicionado APÓS a 1ª dobra para não empurrar o Hero e manter CLS zero.
	if ( '' !== $tg_top_ad ) {
		echo $tg_top_ad; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
	?>

	<?php if ( ! empty( $tg_giro_posts ) ) : ?>
		<section aria-labelledby="tg-giro-heading" class="mt-12">
			<div class="mb-5 flex items-end justify-between border-b-2 border-border-strong pb-2">
				<div>
					<p class="font-mono text-xs font-bold uppercase tracking-widest text-brand">
						<?php esc_html_e( 'Radar de Notícias', 'teoriageek' ); ?>
					</p>
					<h2 id="tg-giro-heading" class="font-headline text-3xl font-extrabold uppercase tracking-[0.005em] text-ink-primary">
						<?php esc_html_e( 'Giro Geek — Últimas Publicações', 'teoriageek' ); ?>
					</h2>
				</div>
				<?php
				$tg_noticias_term = ( '' !== $tg_noticias_slug ) ? get_category_by_slug( $tg_noticias_slug ) : null;
				if ( $tg_noticias_term ) :
					?>
					<a href="<?php echo esc_url( get_category_link( $tg_noticias_term->term_id ) ); ?>" class="hidden sm:inline-flex items-center gap-1 font-mono text-xs font-bold uppercase text-ink-secondary hover:text-brand">
						<span><?php esc_html_e( 'Ver todas as notícias', 'teoriageek' ); ?></span>
						<?php echo teoriageek_icon( 'arrow-right', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</a>
				<?php endif; ?>
			</div>

			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<?php foreach ( $tg_giro_posts as $tg_g_post ) : ?>
					<?php get_template_part( 'template-parts/card-compact', null, array( 'post' => $tg_g_post ) ); ?>
				<?php endforeach; ?>
			</div>
		</section>
	<?php endif; ?>

	<?php if ( ! empty( $tg_most_read_7d ) ) : ?>
		<section aria-labelledby="tg-most-read-heading" class="mt-12 rounded-lg border border-border-subtle bg-surface p-5 shadow-sm sm:p-6">
			<div class="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
				<div class="flex items-center gap-2.5">
					<span class="inline-flex h-8 w-8 items-center justify-center rounded border border-[#0B0F19] bg-highlight text-ink-highlight">
						<?php echo teoriageek_icon( 'trending', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</span>
					<div>
						<p class="font-mono text-[11px] font-bold uppercase tracking-widest text-brand">
							<?php esc_html_e( 'Em Alta na Comunidade', 'teoriageek' ); ?>
						</p>
						<h2 id="tg-most-read-heading" class="font-headline text-2xl font-extrabold uppercase tracking-[0.005em] text-ink-primary sm:text-3xl">
							<?php esc_html_e( 'Mais Lidas do Teoria Geek', 'teoriageek' ); ?>
						</h2>
					</div>
				</div>

				<div role="tablist" aria-label="<?php esc_attr_e( 'Período do ranking', 'teoriageek' ); ?>" class="inline-flex rounded border border-border-subtle bg-surface-alt p-0.5 font-mono text-xs font-bold">
					<button type="button" role="tab" aria-selected="true" data-tg-mr-tab="7d" class="rounded bg-brand-fill px-3 py-1 text-white">
						<?php esc_html_e( '7 dias', 'teoriageek' ); ?>
					</button>
					<button type="button" role="tab" aria-selected="false" data-tg-mr-tab="24h" class="rounded px-3 py-1 text-ink-secondary hover:text-ink-primary">
						<?php esc_html_e( '24 horas', 'teoriageek' ); ?>
					</button>
				</div>
			</div>

			<?php
			$tg_mr_panels = array(
				'7d'  => $tg_most_read_7d,
				'24h' => ! empty( $tg_most_read_24h ) ? $tg_most_read_24h : $tg_most_read_7d,
			);
			foreach ( $tg_mr_panels as $tg_win => $tg_mr_list ) :
				?>
				<ol data-tg-mr-panel="<?php echo esc_attr( $tg_win ); ?>" class="<?php echo '24h' === $tg_win ? 'hidden ' : ''; ?>grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
					<?php foreach ( $tg_mr_list as $tg_idx => $tg_m_post ) : ?>
						<?php
						$tg_m_id    = (int) $tg_m_post->ID;
						$tg_m_cat   = teoriageek_get_primary_category( $tg_m_id );
						$tg_m_views = teoriageek_get_post_views( $tg_m_id );
						?>
						<li class="editorial-card editorial-card-soft group flex flex-col justify-between rounded-lg border border-border-subtle bg-surface-alt p-4">
							<div>
								<div class="mb-2.5 flex items-center justify-between gap-2">
									<span class="font-display text-3xl leading-none text-brand">#<?php echo esc_html( (string) ( $tg_idx + 1 ) ); ?></span>
									<?php teoriageek_category_badge( $tg_m_cat, false, 'sm' ); ?>
								</div>
								<h3 class="line-clamp-3 font-sans text-sm font-bold leading-snug text-ink-primary group-hover:text-brand">
									<a href="<?php echo esc_url( get_permalink( $tg_m_id ) ); ?>" class="hover:underline">
										<?php echo esc_html( teoriageek_clean_title( get_the_title( $tg_m_id ) ) ); ?>
									</a>
								</h3>
							</div>
							<div class="mt-3 flex items-center justify-between border-t border-border-subtle pt-2 font-mono text-[11px] text-ink-muted">
								<span><?php echo esc_html( teoriageek_get_relative_date( $tg_m_id ) ); ?></span>
								<?php if ( $tg_m_views > 0 ) : ?>
									<span class="inline-flex items-center gap-1 font-semibold text-ink-secondary">
										<?php echo teoriageek_icon( 'eye', 'h-3 w-3' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
										<?php echo esc_html( teoriageek_format_compact( $tg_m_views ) ); ?>
									</span>
								<?php endif; ?>
							</div>
						</li>
					<?php endforeach; ?>
				</ol>
			<?php endforeach; ?>
		</section>
	<?php endif; ?>

	<?php if ( ! empty( $tg_premieres ) ) : ?>
		<section aria-labelledby="tg-premieres-heading" class="mt-10 rounded-lg border border-border-subtle bg-surface p-5 shadow-sm">
			<div class="mb-4 flex items-center justify-between border-b border-border-subtle pb-2.5">
				<h2 id="tg-premieres-heading" class="font-headline text-2xl font-extrabold uppercase tracking-[0.005em] text-ink-primary">
					<?php esc_html_e( 'Estreias da Semana', 'teoriageek' ); ?>
				</h2>
				<span class="rounded bg-highlight px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-ink-highlight">
					<?php esc_html_e( 'Agenda Geek', 'teoriageek' ); ?>
				</span>
			</div>
			<ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				<?php foreach ( $tg_premieres as $tg_pr ) : ?>
					<li class="flex items-center justify-between gap-3 rounded border border-border-subtle bg-surface-alt px-3.5 py-2.5">
						<div class="min-w-0">
							<p class="truncate font-sans text-sm font-bold text-ink-primary"><?php echo esc_html( $tg_pr['title'] ); ?></p>
							<?php if ( '' !== $tg_pr['platform'] ) : ?>
								<span class="font-mono text-[11px] text-ink-muted"><?php echo esc_html( $tg_pr['platform'] ); ?></span>
							<?php endif; ?>
						</div>
						<?php if ( '' !== $tg_pr['date'] ) : ?>
							<span class="shrink-0 rounded bg-brand-fill px-2 py-0.5 font-mono text-[11px] font-bold text-white"><?php echo esc_html( $tg_pr['date'] ); ?></span>
						<?php endif; ?>
					</li>
				<?php endforeach; ?>
			</ul>
		</section>
	<?php endif; ?>

	<?php if ( ! empty( $tg_reviews_posts ) ) : ?>
		<section aria-labelledby="tg-reviews-heading" class="mt-12">
			<div class="mb-5 flex items-end justify-between border-b-[3px] border-border-strong pb-2">
				<div>
					<p class="font-mono text-xs font-bold uppercase tracking-widest text-brand">
						<?php esc_html_e( 'Análises & Vereditos', 'teoriageek' ); ?>
					</p>
					<h2 id="tg-reviews-heading" class="font-headline text-3xl font-extrabold uppercase tracking-tight text-ink-primary">
						<?php esc_html_e( 'Críticas & Reviews', 'teoriageek' ); ?>
					</h2>
				</div>
				<?php
				$tg_crit_term = get_category_by_slug( teoriageek_get_mapped_category_slug( 'criticas' ) );
				if ( $tg_crit_term ) :
					?>
					<a href="<?php echo esc_url( get_category_link( $tg_crit_term->term_id ) ); ?>" class="hidden sm:inline-flex items-center gap-1 font-mono text-xs font-bold uppercase text-ink-secondary hover:text-brand">
						<span><?php esc_html_e( 'Ver análises', 'teoriageek' ); ?></span>
						<?php echo teoriageek_icon( 'arrow-right', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</a>
				<?php endif; ?>
			</div>

			<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
				<?php foreach ( $tg_reviews_posts as $tg_rev_post ) : ?>
					<?php
					get_template_part(
						'template-parts/card-article',
						null,
						array(
							'post'    => $tg_rev_post,
							'variant' => 'review',
						)
					);
					?>
				<?php endforeach; ?>
			</div>
		</section>
	<?php endif; ?>

	<?php if ( ! empty( $tg_reels_strip ) ) : ?>
		<section aria-labelledby="tg-reels-strip-heading" data-chrome="dark" class="mt-12 rounded-lg border-2 border-border-strong bg-chrome p-5 text-chrome-ink shadow-hard sm:p-6">
			<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
				<div class="flex items-center gap-2.5">
					<span class="rounded border-2 border-[#0B0F19] bg-highlight px-2.5 py-0.5 font-display text-xl tracking-wider text-ink-highlight">
						REELS
					</span>
					<h2 id="tg-reels-strip-heading" class="font-headline text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl">
						<?php esc_html_e( 'Teoria Geek Reels — Resumo Rápido', 'teoriageek' ); ?>
					</h2>
				</div>
				<a href="<?php echo esc_url( teoriageek_get_reels_url() ); ?>" class="tactile-btn inline-flex items-center gap-1.5 rounded border-2 border-highlight bg-highlight px-3.5 py-1.5 font-mono text-xs font-bold uppercase text-ink-highlight hover:bg-white">
					<span><?php esc_html_e( 'Ver todos os Reels', 'teoriageek' ); ?></span>
					<?php echo teoriageek_icon( 'arrow-right', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</a>
			</div>

			<div class="reels-scroller grid grid-flow-col auto-cols-[72%] gap-4 overflow-x-auto pb-2 sm:auto-cols-[38%] lg:grid-flow-row lg:grid-cols-6">
				<?php foreach ( $tg_reels_strip as $tg_rs_post ) : ?>
					<?php
					$tg_rs_id  = (int) $tg_rs_post->ID;
					$tg_rs_cat = teoriageek_get_primary_category( $tg_rs_id );
					?>
					<a href="<?php echo esc_url( teoriageek_get_reels_url( $tg_rs_post->post_name ) ); ?>" class="editorial-card group relative flex aspect-[9/16] flex-col justify-end overflow-hidden rounded border-2 border-white/15 bg-chrome-surface hover:border-highlight">
						<?php
						get_template_part(
							'template-parts/cover-media',
							null,
							array(
								'post_id'      => $tg_rs_id,
								'size'         => 'tg-card',
								'aspect_class' => 'absolute inset-0 h-full w-full',
								'decorative'   => true,
							)
						);
						?>
						<div class="relative z-20 flex h-full flex-col justify-between p-3" style="background:linear-gradient(to top, var(--scrim-reels) 0%, rgba(9,10,15,0.78) 52%, rgba(9,10,15,0.18) 100%);">
							<div class="flex items-center justify-between gap-1">
								<?php teoriageek_category_badge( $tg_rs_cat, false, 'sm' ); ?>
								<span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/75 text-highlight">
									<?php echo teoriageek_icon( 'play', 'h-3.5 w-3.5 fill-current' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
								</span>
							</div>
							<h3 class="line-clamp-3 font-headline text-lg font-bold leading-tight text-white group-hover:text-highlight">
								<?php echo esc_html( teoriageek_clean_title( get_the_title( $tg_rs_id ) ) ); ?>
							</h3>
						</div>
					</a>
				<?php endforeach; ?>
			</div>
		</section>
	<?php endif; ?>

	<?php if ( ! empty( $tg_especiais_posts ) ) : ?>
		<section aria-labelledby="tg-especiais-heading" class="mt-12">
			<div class="mb-5 flex items-end justify-between border-b-[3px] border-border-strong pb-2">
				<div>
					<p class="font-mono text-xs font-bold uppercase tracking-widest text-brand">
						<?php esc_html_e( 'Artigos & Bastidores', 'teoriageek' ); ?>
					</p>
					<h2 id="tg-especiais-heading" class="font-headline text-3xl font-extrabold uppercase tracking-tight text-ink-primary">
						<?php esc_html_e( 'Especiais & Colunas', 'teoriageek' ); ?>
					</h2>
				</div>
				<?php
				$tg_esp_term = get_category_by_slug( $tg_especiais_slug );
				if ( $tg_esp_term ) :
					?>
					<a href="<?php echo esc_url( get_category_link( $tg_esp_term->term_id ) ); ?>" class="hidden sm:inline-flex items-center gap-1 font-mono text-xs font-bold uppercase text-ink-secondary hover:text-brand">
						<span><?php esc_html_e( 'Ver especiais', 'teoriageek' ); ?></span>
						<?php echo teoriageek_icon( 'arrow-right', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</a>
				<?php endif; ?>
			</div>

			<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
				<?php foreach ( $tg_especiais_posts as $tg_esp_post ) : ?>
					<?php get_template_part( 'template-parts/card-article', null, array( 'post' => $tg_esp_post ) ); ?>
				<?php endforeach; ?>
			</div>
		</section>
	<?php endif; ?>

	<section id="editorias" aria-labelledby="tg-editorias-heading" class="mt-12">
		<div class="mb-5 border-b-[3px] border-border-strong pb-2">
			<p class="font-mono text-xs font-bold uppercase tracking-widest text-brand">
				<?php esc_html_e( 'Cobertura por Universo', 'teoriageek' ); ?>
			</p>
			<h2 id="tg-editorias-heading" class="font-headline text-3xl font-extrabold uppercase tracking-tight text-ink-primary">
				<?php esc_html_e( 'Editorias em Destaque', 'teoriageek' ); ?>
			</h2>
		</div>

		<div class="grid gap-6 lg:grid-cols-3">
			<?php foreach ( $tg_primary_cols as $tg_col_slot ) : ?>
				<?php
				$tg_col_slug = teoriageek_get_mapped_category_slug( $tg_col_slot );
				$tg_col_term = ( '' !== $tg_col_slug ) ? get_category_by_slug( $tg_col_slug ) : null;
				if ( ! $tg_col_term ) {
					continue;
				}
				$tg_col_q = new WP_Query(
					array(
						'post_type'           => 'post',
						'post_status'         => 'publish',
						'cat'                 => (int) $tg_col_term->term_id,
						'posts_per_page'      => 4,
						'ignore_sticky_posts' => true,
						'no_found_rows'       => true,
					)
				);
				if ( empty( $tg_col_q->posts ) ) {
					continue;
				}
				$tg_col_style = teoriageek_get_category_style( $tg_col_term->slug );
				$tg_col_lead  = $tg_col_q->posts[0];
				$tg_col_rest  = array_slice( $tg_col_q->posts, 1, 3 );
				?>
				<div class="flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-sm">
					<div class="flex flex-wrap items-center justify-between gap-2 px-4 py-3" style="<?php echo esc_attr( sprintf( 'background-color:%s;color:%s;', $tg_col_style['fill'], $tg_col_style['ink'] ) ); ?>">
						<div class="flex items-center gap-2">
							<h3 class="font-headline text-xl font-extrabold uppercase tracking-wide">
								<?php echo esc_html( html_entity_decode( $tg_col_term->name, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) ); ?>
							</h3>
							<?php teoriageek_render_sponsor_badge( $tg_col_term->slug ); ?>
						</div>
						<a href="<?php echo esc_url( get_category_link( $tg_col_term->term_id ) ); ?>" class="font-mono text-[11px] font-bold uppercase underline underline-offset-2">
							<?php esc_html_e( 'Ver tudo', 'teoriageek' ); ?>
						</a>
					</div>

					<div class="flex flex-1 flex-col gap-4 p-4">
						<article class="group space-y-2.5">
							<a href="<?php echo esc_url( get_permalink( $tg_col_lead->ID ) ); ?>" tabindex="-1" aria-hidden="true" class="block overflow-hidden rounded border border-border-subtle">
								<?php
								get_template_part(
									'template-parts/cover-media',
									null,
									array(
										'post_id'      => $tg_col_lead->ID,
										'size'         => 'tg-card',
										'aspect_class' => 'aspect-[16/9]',
										'decorative'   => true,
									)
								);
								?>
							</a>
							<h4 class="font-sans text-base font-bold leading-snug text-ink-primary group-hover:text-brand">
								<a href="<?php echo esc_url( get_permalink( $tg_col_lead->ID ) ); ?>" class="hover:underline">
									<?php echo esc_html( teoriageek_clean_title( get_the_title( $tg_col_lead->ID ) ) ); ?>
								</a>
							</h4>
							<p class="font-mono text-[11px] text-ink-muted">
								<?php echo esc_html( sprintf( 'Por %s · %s', get_the_author_meta( 'display_name', (int) $tg_col_lead->post_author ), teoriageek_get_relative_date( $tg_col_lead->ID ) ) ); ?>
							</p>
						</article>

						<?php if ( ! empty( $tg_col_rest ) ) : ?>
							<ul class="mt-auto divide-y divide-border-subtle border-t border-border-subtle pt-2">
								<?php foreach ( $tg_col_rest as $tg_sub_item ) : ?>
									<li class="flex items-center gap-3 py-2.5">
										<a href="<?php echo esc_url( get_permalink( $tg_sub_item->ID ) ); ?>" tabindex="-1" aria-hidden="true" class="h-14 w-16 shrink-0 overflow-hidden rounded border border-border-subtle">
											<?php
											get_template_part(
												'template-parts/cover-media',
												null,
												array(
													'post_id'      => $tg_sub_item->ID,
													'size'         => 'tg-thumb',
													'aspect_class' => 'h-full w-full',
													'decorative'   => true,
												)
											);
											?>
										</a>
										<div class="min-w-0 flex-1">
											<a href="<?php echo esc_url( get_permalink( $tg_sub_item->ID ) ); ?>" class="line-clamp-2 block font-sans text-sm font-semibold leading-snug text-ink-primary hover:text-brand">
												<?php echo esc_html( teoriageek_clean_title( get_the_title( $tg_sub_item->ID ) ) ); ?>
											</a>
											<span class="mt-1 block font-mono text-[11px] text-ink-muted">
												<?php echo esc_html( teoriageek_get_relative_date( $tg_sub_item->ID ) ); ?>
											</span>
										</div>
									</li>
								<?php endforeach; ?>
							</ul>
						<?php endif; ?>
					</div>
				</div>
			<?php endforeach; ?>
		</div>

		<div class="mt-6 grid gap-6 lg:grid-cols-2">
			<?php foreach ( $tg_secondary_cols as $tg_col_slot ) : ?>
				<?php
				$tg_col_slug = teoriageek_get_mapped_category_slug( $tg_col_slot );
				$tg_col_term = ( '' !== $tg_col_slug ) ? get_category_by_slug( $tg_col_slug ) : null;
				if ( ! $tg_col_term ) {
					continue;
				}
				$tg_col_q = new WP_Query(
					array(
						'post_type'           => 'post',
						'post_status'         => 'publish',
						'cat'                 => (int) $tg_col_term->term_id,
						'posts_per_page'      => 4,
						'ignore_sticky_posts' => true,
						'no_found_rows'       => true,
					)
				);
				if ( empty( $tg_col_q->posts ) ) {
					continue;
				}
				$tg_col_style = teoriageek_get_category_style( $tg_col_term->slug );
				$tg_col_lead  = $tg_col_q->posts[0];
				$tg_col_rest  = array_slice( $tg_col_q->posts, 1, 3 );
				?>
				<div class="flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-sm">
					<div class="flex flex-wrap items-center justify-between gap-2 px-4 py-3" style="<?php echo esc_attr( sprintf( 'background-color:%s;color:%s;', $tg_col_style['fill'], $tg_col_style['ink'] ) ); ?>">
						<div class="flex items-center gap-2">
							<h3 class="font-headline text-xl font-extrabold uppercase tracking-wide">
								<?php echo esc_html( html_entity_decode( $tg_col_term->name, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) ); ?>
							</h3>
							<?php teoriageek_render_sponsor_badge( $tg_col_term->slug ); ?>
						</div>
						<a href="<?php echo esc_url( get_category_link( $tg_col_term->term_id ) ); ?>" class="font-mono text-[11px] font-bold uppercase underline underline-offset-2">
							<?php esc_html_e( 'Ver tudo', 'teoriageek' ); ?>
						</a>
					</div>

					<div class="grid flex-1 gap-4 p-4 sm:grid-cols-2">
						<article class="group space-y-2.5">
							<a href="<?php echo esc_url( get_permalink( $tg_col_lead->ID ) ); ?>" tabindex="-1" aria-hidden="true" class="block overflow-hidden rounded border border-border-subtle">
								<?php
								get_template_part(
									'template-parts/cover-media',
									null,
									array(
										'post_id'      => $tg_col_lead->ID,
										'size'         => 'tg-card',
										'aspect_class' => 'aspect-[16/9]',
										'decorative'   => true,
									)
								);
								?>
							</a>
							<h4 class="font-sans text-base font-bold leading-snug text-ink-primary group-hover:text-brand">
								<a href="<?php echo esc_url( get_permalink( $tg_col_lead->ID ) ); ?>" class="hover:underline">
									<?php echo esc_html( teoriageek_clean_title( get_the_title( $tg_col_lead->ID ) ) ); ?>
								</a>
							</h4>
							<p class="font-mono text-[11px] text-ink-muted">
								<?php echo esc_html( teoriageek_get_relative_date( $tg_col_lead->ID ) ); ?>
							</p>
						</article>

						<?php if ( ! empty( $tg_col_rest ) ) : ?>
							<ul class="divide-y divide-border-subtle">
								<?php foreach ( $tg_col_rest as $tg_sub_item ) : ?>
									<li class="flex items-center gap-3 py-2.5 first:pt-0">
										<a href="<?php echo esc_url( get_permalink( $tg_sub_item->ID ) ); ?>" tabindex="-1" aria-hidden="true" class="h-14 w-16 shrink-0 overflow-hidden rounded border border-border-subtle">
											<?php
											get_template_part(
												'template-parts/cover-media',
												null,
												array(
													'post_id'      => $tg_sub_item->ID,
													'size'         => 'tg-thumb',
													'aspect_class' => 'h-full w-full',
													'decorative'   => true,
												)
											);
											?>
										</a>
										<div class="min-w-0 flex-1">
											<a href="<?php echo esc_url( get_permalink( $tg_sub_item->ID ) ); ?>" class="line-clamp-2 block font-sans text-sm font-semibold leading-snug text-ink-primary hover:text-brand">
												<?php echo esc_html( teoriageek_clean_title( get_the_title( $tg_sub_item->ID ) ) ); ?>
											</a>
											<span class="mt-1 block font-mono text-[11px] text-ink-muted">
												<?php echo esc_html( teoriageek_get_relative_date( $tg_sub_item->ID ) ); ?>
											</span>
										</div>
									</li>
								<?php endforeach; ?>
							</ul>
						<?php endif; ?>
					</div>
				</div>
			<?php endforeach; ?>
		</div>
	</section>

	<?php get_template_part( 'template-parts/community-cta' ); ?>
</main>

<?php
get_footer();

<?php
/**
 * Template Part: Faixa "Teoria Geek Reels — Resumo Rápido" em estilo Web Stories 3:4 full-bleed.
 * - Desktop (>= 1024px): 5 colunas proporcionais com imagem 100% full-bleed
 * - Mobile/Tablet (< 1024px): carrossel horizontal fluido com scroll-snap-type: x mandatory
 *
 * @package TeoriaGeek
 * @var array $args { posts?: WP_Post[] }
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_max_cols    = ( isset( $args['columns'] ) && 3 === (int) $args['columns'] ) ? 3 : 5;
$tg_reels_strip = ( isset( $args['posts'] ) && is_array( $args['posts'] ) ) ? array_slice( $args['posts'], 0, $tg_max_cols ) : array();
if ( empty( $tg_reels_strip ) && ! empty( $args['auto_query'] ) ) {
	$tg_exclude_id = isset( $args['exclude_id'] ) ? (int) $args['exclude_id'] : 0;
	$tg_auto_q     = new WP_Query(
		array(
			'post_type'           => 'post',
			'post_status'         => 'publish',
			'posts_per_page'      => $tg_max_cols,
			'post__not_in'        => $tg_exclude_id > 0 ? array( $tg_exclude_id ) : array(),
			'ignore_sticky_posts' => true,
			'no_found_rows'       => true,
		)
	);
	update_post_thumbnail_cache( $tg_auto_q );
	$tg_reels_strip = $tg_auto_q->posts;
}
if ( empty( $tg_reels_strip ) ) {
	return;
}

$tg_short_labels = array(
	'livros-hqs'                                      => 'Literatura',
	'literatura-e-hqs'                                => 'Literatura',
	'animes-mangas'                                   => 'Animes',
	'animes-e-mangas'                                 => 'Animes',
	'especial-teoria-geek'                            => 'Especiais',
	'eventos-shows-festivais'                         => 'Eventos',
	'esportes-futebol-games-e-sports-vloley-basquete' => 'Esportes',
	'platina-trofeus-ps5-ps4-xbox-nintendo-games-pc'  => 'Platina',
);
$tg_heading_id = ! empty( $args['heading_id'] ) ? sanitize_html_class( (string) $args['heading_id'] ) : 'tg-reels-strip-heading';
?>
<section aria-labelledby="<?php echo esc_attr( $tg_heading_id ); ?>" data-chrome="dark" class="mt-10 rounded-sm border border-white/15 bg-chrome p-4 text-chrome-ink sm:p-6">
	<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
		<div class="flex min-w-0 flex-wrap items-center gap-2.5">
			<span class="rounded-sm border border-[#0B0F19] bg-highlight px-2.5 py-0.5 font-display text-xl tracking-wider text-ink-highlight">
				REELS
			</span>
			<h2 id="<?php echo esc_attr( $tg_heading_id ); ?>" class="font-headline text-xl font-extrabold uppercase tracking-[0.005em] text-white sm:text-3xl">
				<?php esc_html_e( 'Teoria Geek Reels — Resumo Rápido', 'teoriageek' ); ?>
			</h2>
		</div>
		<a href="<?php echo esc_url( teoriageek_get_reels_url() ); ?>" class="tactile-btn inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-[#0B0F19] bg-highlight px-3.5 py-1.5 font-sans text-xs font-extrabold uppercase text-ink-highlight hover:bg-white">
			<span><?php esc_html_e( 'Ver todos os Reels', 'teoriageek' ); ?></span>
			<?php echo teoriageek_icon( 'arrow-right', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		</a>
	</div>

	<div class="tg-story-grid<?php echo 3 === $tg_max_cols ? ' tg-story-grid--3' : ''; ?>">
		<?php foreach ( $tg_reels_strip as $tg_rs_post ) : ?>
			<?php
			$tg_rs_id       = (int) $tg_rs_post->ID;
			$tg_rs_cat      = teoriageek_get_primary_category( $tg_rs_id );
			$tg_rs_slug     = $tg_rs_cat ? $tg_rs_cat->slug : 'noticias';
			$tg_rs_style    = teoriageek_get_category_style( $tg_rs_slug );
			$tg_rs_cat_name = $tg_rs_cat ? teoriageek_fix_mojibake( html_entity_decode( $tg_rs_cat->name, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) ) : 'Geek';
			if ( isset( $tg_short_labels[ $tg_rs_slug ] ) ) {
				$tg_rs_cat_name = $tg_short_labels[ $tg_rs_slug ];
			}
			$tg_rs_title = teoriageek_clean_title( get_the_title( $tg_rs_id ) );
			$tg_rs_img   = (string) get_the_post_thumbnail_url( $tg_rs_id, 'tg-card' );
			?>
			<a href="<?php echo esc_url( teoriageek_get_reels_url( $tg_rs_post->post_name ) ); ?>" class="tg-story-card tg-cover-wrap group block">
				<!-- Fallback visual editorial elegante sempre visível atrás da foto (evita caixa preta no lazy-load ou erro) -->
				<div class="tg-cover-fallback pointer-events-none absolute inset-0 z-0">
					<?php echo teoriageek_render_fallback_art( $tg_rs_slug, true ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</div>

				<?php if ( '' !== $tg_rs_img ) : ?>
					<img
						src="<?php echo esc_url( $tg_rs_img ); ?>"
						alt=""
						aria-hidden="true"
						loading="lazy"
						decoding="async"
						class="tg-cover-img tg-story-img"
					/>
				<?php endif; ?>

				<!-- Overlay gradiente full-bleed alto contraste -->
				<div class="tg-story-scrim" aria-hidden="true"></div>

				<!-- Topo: 3 barrinhas estilo Story à esquerda + botão circular amarelo Play à direita -->
				<div class="tg-story-top">
					<div class="tg-story-bars" aria-hidden="true">
						<span class="tg-story-bar is-active"></span>
						<span class="tg-story-bar"></span>
						<span class="tg-story-bar"></span>
					</div>
					<span class="tg-story-play" aria-hidden="true">
						<?php echo teoriageek_icon( 'play', 'h-3.5 w-3.5 fill-current' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</span>
				</div>

				<!-- Rodapé ancorado na base sobre o gradiente: 1 badge limpa + título 3 linhas sem vão morto -->
				<div class="tg-story-footer">
					<span class="tg-cat-badge inline-flex max-w-full items-center rounded-sm px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider leading-tight" style="<?php echo esc_attr( sprintf( 'background-color:%s;color:%s;', $tg_rs_style['fill'], $tg_rs_style['ink'] ) ); ?>">
						<?php echo esc_html( $tg_rs_cat_name ); ?>
					</span>
					<h3 class="tg-story-title font-headline text-lg font-extrabold text-white group-hover:text-highlight">
						<?php echo esc_html( $tg_rs_title ); ?>
					</h3>
				</div>
			</a>
		<?php endforeach; ?>
	</div>
</section>

<?php
/**
 * Template Part: Dobra Principal da Home (Carrossel Editorial Hero 8 cols com Halftone HQ WebGL
 * + 3 Secundárias + Reels em Destaque vertical 3:4 com Facade Pattern + Radar na Redação).
 *
 * @package TeoriaGeek
 * @var array $args { hero?: WP_Post|null, hero_slides?: WP_Post[], secondary: WP_Post[], reel: WP_Post|null, urgent: WP_Post[] }
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_hero_slides = array();
if ( isset( $args['hero_slides'] ) && is_array( $args['hero_slides'] ) ) {
	foreach ( $args['hero_slides'] as $tg_hs ) {
		if ( $tg_hs instanceof WP_Post ) {
			$tg_hero_slides[] = $tg_hs;
		}
	}
}
$tg_hero = isset( $args['hero'] ) && $args['hero'] instanceof WP_Post ? $args['hero'] : ( ! empty( $tg_hero_slides ) ? $tg_hero_slides[0] : null );
if ( empty( $tg_hero_slides ) && $tg_hero instanceof WP_Post ) {
	$tg_hero_slides = array( $tg_hero );
}
$tg_hero_slides = array_slice( $tg_hero_slides, 0, 5 );
$tg_slide_count = count( $tg_hero_slides );
$tg_is_carousel = $tg_slide_count > 1;

$tg_secondary = isset( $args['secondary'] ) && is_array( $args['secondary'] ) ? $args['secondary'] : array();
$tg_reel      = isset( $args['reel'] ) && $args['reel'] instanceof WP_Post ? $args['reel'] : $tg_hero;
$tg_urgent    = isset( $args['urgent'] ) && is_array( $args['urgent'] ) ? $args['urgent'] : array();
?>
<section aria-label="<?php esc_attr_e( 'Destaques principais da capa', 'teoriageek' ); ?>" class="grid gap-6 lg:grid-cols-12">
	<div class="tg-hero-main-col min-w-0 space-y-6 lg:col-span-8">
		<?php if ( $tg_slide_count > 0 ) : ?>
			<div
				class="tg-hero-carousel tgx-hero-card relative overflow-hidden"
				role="region"
				aria-roledescription="<?php esc_attr_e( 'carousel', 'teoriageek' ); ?>"
				aria-label="<?php esc_attr_e( 'Carrossel editorial de destaques', 'teoriageek' ); ?>"
				<?php if ( $tg_is_carousel ) : ?>
					data-tg-hero-carousel
					data-interval="4200"
				<?php endif; ?>
			>
				<div class="relative">
					<div class="tg-hero-track" data-tg-hero-track>
						<?php foreach ( $tg_hero_slides as $tg_s_idx => $tg_slide_post ) : ?>
							<?php
							$tg_is_first = ( 0 === $tg_s_idx );
							$tg_s_id     = (int) $tg_slide_post->ID;
							$tg_s_cat    = teoriageek_get_primary_category( $tg_s_id );
							$tg_s_score  = teoriageek_get_post_score( $tg_s_id );
							$tg_s_title  = teoriageek_clean_title( get_the_title( $tg_s_id ) );
							$tg_s_lead   = teoriageek_get_post_lead( $tg_s_id, 210 );
							$tg_s_url    = get_permalink( $tg_s_id );
							$tg_s_thumb  = get_the_post_thumbnail_url( $tg_s_id, 'tg-hero' );
							$tg_h_tag    = $tg_is_first ? 'h1' : 'h2';
							?>
							<article
								class="tg-hero-slide editorial-card group<?php echo $tg_is_first ? ' is-active' : ''; ?>"
								data-tg-hero-slide="<?php echo esc_attr( (string) $tg_s_idx ); ?>"
								data-tg-hero-img="<?php echo esc_url( is_string( $tg_s_thumb ) ? $tg_s_thumb : '' ); ?>"
								role="group"
								aria-roledescription="<?php esc_attr_e( 'slide', 'teoriageek' ); ?>"
								aria-label="<?php echo esc_attr( sprintf( __( '%1$d de %2$d: %3$s', 'teoriageek' ), $tg_s_idx + 1, $tg_slide_count, $tg_s_title ) ); ?>"
								aria-hidden="<?php echo $tg_is_first ? 'false' : 'true'; ?>"
								<?php echo $tg_is_first ? '' : 'inert'; ?>
							>
								<div class="tg-hero-media relative overflow-hidden rounded-sm">
									<a href="<?php echo esc_url( $tg_s_url ); ?>" class="block overflow-hidden" tabindex="<?php echo $tg_is_first ? '0' : '-1'; ?>">
										<?php
										get_template_part(
											'template-parts/cover-media',
											null,
											array(
												'post_id'      => $tg_s_id,
												'size'         => 'tg-hero',
												'aspect_class' => 'w-full aspect-[16/9] lg:h-[360px] lg:aspect-auto',
												'priority'     => $tg_is_first,
											)
										);
										?>
									</a>

									<?php if ( null !== $tg_s_score ) : ?>
										<div class="absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-sm border border-[#0B0F19] bg-highlight px-2.5 py-1 font-display text-xl leading-none text-ink-highlight">
											<?php echo teoriageek_icon( 'star', 'h-4 w-4 fill-current' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
											<span><?php echo esc_html( $tg_s_score ); ?></span>
										</div>
									<?php endif; ?>
								</div>

								<div class="tg-hero-body space-y-2.5 pt-4">
									<div class="tg-hero-stagger tg-hero-stagger-1 flex flex-wrap items-center gap-2.5">
										<?php teoriageek_category_badge( $tg_s_cat, true, 'md', true ); ?>
										<span class="font-mono text-xs text-ink-muted">
											<?php echo esc_html( sprintf( __( '%d min de leitura', 'teoriageek' ), teoriageek_get_reading_time( $tg_s_id ) ) ); ?>
										</span>
										<span aria-hidden="true" class="text-border-subtle">·</span>
										<span class="font-mono text-xs text-ink-muted">
											<?php echo esc_html( teoriageek_get_relative_date( $tg_s_id ) ); ?>
										</span>
									</div>

									<<?php echo esc_html( $tg_h_tag ); ?> class="tg-hero-title tg-hero-stagger tg-hero-stagger-2 line-clamp-2 min-h-[2.2em] font-headline text-2xl font-extrabold leading-[1.1] tracking-[0.005em] text-ink-primary sm:text-[2.15rem]">
										<a href="<?php echo esc_url( $tg_s_url ); ?>" class="hover:text-brand" tabindex="<?php echo $tg_is_first ? '0' : '-1'; ?>">
											<?php echo esc_html( $tg_s_title ); ?>
										</a>
									</<?php echo esc_html( $tg_h_tag ); ?>>

									<p class="tg-hero-lead tg-hero-stagger tg-hero-stagger-3 line-clamp-2 min-h-[2.95em] font-reading text-sm leading-relaxed text-ink-secondary sm:text-base">
										<?php echo esc_html( '' !== $tg_s_lead ? $tg_s_lead : $tg_s_title ); ?>
									</p>

									<div class="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-3">
										<span class="font-sans text-xs font-medium text-ink-secondary">
											<?php teoriageek_render_author_chip( (int) $tg_slide_post->post_author, 24, true ); ?>
										</span>

										<a href="<?php echo esc_url( $tg_s_url ); ?>" class="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-brand hover:underline" tabindex="<?php echo $tg_is_first ? '0' : '-1'; ?>">
											<span><?php esc_html_e( 'Ler matéria', 'teoriageek' ); ?></span>
											<?php echo teoriageek_icon( 'arrow-right', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
										</a>
									</div>
								</div>
							</article>
						<?php endforeach; ?>
					</div>

					<?php if ( $tg_is_carousel ) : ?>
						<!-- Camada WebGL Halftone HQ + dock discreto no canto inferior direito (foto 100% limpa) -->
						<div class="tg-hero-media-chrome pointer-events-none absolute inset-x-0 top-0 z-30 w-full aspect-[16/9] overflow-hidden rounded-sm lg:h-[360px] lg:aspect-auto">
							<canvas class="tg-hero-gl" data-tg-hero-gl aria-hidden="true"></canvas>

							<div class="tg-hero-nav-dock pointer-events-auto">
								<span class="tg-hero-dock-counter" aria-live="off">
									<em data-tg-hero-current>01</em> / <?php echo esc_html( sprintf( '%02d', $tg_slide_count ) ); ?>
								</span>
								<button
									type="button"
									data-tg-hero-pause
									aria-pressed="false"
									aria-label="<?php esc_attr_e( 'Pausar troca automática', 'teoriageek' ); ?>"
									class="tg-hero-dock-btn tg-hero-dock-pause"
								>
									<span data-tg-pause-icon="pause" class="inline-flex"><?php echo teoriageek_icon( 'pause', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
									<span data-tg-pause-icon="play" class="hidden"><?php echo teoriageek_icon( 'play', 'h-3.5 w-3.5 fill-current' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
								</button>
								<button
									type="button"
									data-tg-hero-prev
									aria-label="<?php esc_attr_e( 'Slide anterior', 'teoriageek' ); ?>"
									class="tg-hero-dock-btn"
								>
									<?php echo teoriageek_icon( 'chevron-left', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
								</button>
								<button
									type="button"
									data-tg-hero-next
									aria-label="<?php esc_attr_e( 'Próximo slide', 'teoriageek' ); ?>"
									class="tg-hero-dock-btn"
								>
									<?php echo teoriageek_icon( 'chevron-right', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
								</button>
							</div>

							<div class="tg-hero-minimap pointer-events-auto" style="grid-template-columns: repeat(<?php echo esc_attr( (string) $tg_slide_count ); ?>, minmax(0, 1fr));" aria-label="<?php esc_attr_e( 'Mapa de destaques', 'teoriageek' ); ?>">
								<?php for ( $tg_m_idx = 0; $tg_m_idx < $tg_slide_count; $tg_m_idx++ ) : ?>
									<button
										type="button"
										data-tg-hero-go="<?php echo esc_attr( (string) $tg_m_idx ); ?>"
										data-tg-hero-seg="<?php echo esc_attr( (string) $tg_m_idx ); ?>"
										aria-label="<?php echo esc_attr( sprintf( __( 'Destaque %1$d de %2$d', 'teoriageek' ), $tg_m_idx + 1, $tg_slide_count ) ); ?>"
										class="tg-hero-seg<?php echo 0 === $tg_m_idx ? ' is-active' : ''; ?>"
									>
										<span class="tg-hero-seg-track"><span class="tg-hero-seg-fill"></span></span>
									</button>
								<?php endfor; ?>
							</div>
						</div>
					<?php endif; ?>
				</div>

				<?php if ( $tg_is_carousel ) : ?>
					<!-- Trilho numerado editorial com barra de progresso 2px sincronizada (Desktop + Mobile) -->
					<div
						class="tg-hero-rail mt-3 grid border-t border-border-subtle"
						style="grid-template-columns: repeat(<?php echo esc_attr( (string) $tg_slide_count ); ?>, minmax(0, 1fr));"
						role="tablist"
						data-tg-hero-rail
						aria-label="<?php esc_attr_e( 'Índice de destaques da capa', 'teoriageek' ); ?>"
					>
						<?php foreach ( $tg_hero_slides as $tg_t_idx => $tg_t_post ) : ?>
							<?php
							$tg_t_active = ( 0 === $tg_t_idx );
							$tg_t_title  = teoriageek_clean_title( get_the_title( (int) $tg_t_post->ID ) );
							?>
							<button
								type="button"
								role="tab"
								data-tg-hero-go="<?php echo esc_attr( (string) $tg_t_idx ); ?>"
								data-tg-hero-tab="<?php echo esc_attr( (string) $tg_t_idx ); ?>"
								tabindex="<?php echo $tg_t_active ? '0' : '-1'; ?>"
								aria-selected="<?php echo $tg_t_active ? 'true' : 'false'; ?>"
								aria-current="<?php echo $tg_t_active ? 'true' : 'false'; ?>"
								aria-label="<?php echo esc_attr( sprintf( __( 'Ir para o destaque %1$d: %2$s', 'teoriageek' ), $tg_t_idx + 1, $tg_t_title ) ); ?>"
								class="tg-hero-tab<?php echo $tg_t_active ? ' is-active' : ''; ?>"
							>
								<span class="tg-hero-tab-prog" aria-hidden="true">
									<span class="tg-hero-tab-prog-fill"></span>
								</span>
								<span class="tg-hero-tab-num font-display text-sm font-extrabold leading-none tracking-wider">
									<?php echo esc_html( sprintf( '%02d', $tg_t_idx + 1 ) ); ?>
								</span>
								<span class="tg-hero-tab-title w-full font-sans text-xs font-semibold leading-snug">
									<?php echo esc_html( $tg_t_title ); ?>
								</span>
							</button>
						<?php endforeach; ?>
					</div>
				<?php endif; ?>
			</div>
		<?php endif; ?>

		<?php if ( ! empty( $tg_secondary ) ) : ?>
			<div class="grid gap-4 sm:grid-cols-3">
				<?php foreach ( $tg_secondary as $tg_sec_post ) : ?>
					<?php
					get_template_part(
						'template-parts/card-article',
						null,
						array(
							'post'        => $tg_sec_post,
							'variant'     => 'compact-grid',
							'heading_tag' => 'h2',
						)
					);
					?>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
	</div>

	<aside aria-label="<?php esc_attr_e( 'Reels em Destaque e Radar da Redação', 'teoriageek' ); ?>" class="min-w-0 space-y-6 lg:col-span-4">
		<?php if ( $tg_reel ) : ?>
			<?php
			$tg_r_id    = (int) $tg_reel->ID;
			$tg_r_cat   = teoriageek_get_primary_category( $tg_r_id );
			$tg_r_title = teoriageek_clean_title( get_the_title( $tg_r_id ) );
			?>
			<div data-chrome="dark" class="overflow-hidden rounded-sm border border-border-subtle bg-chrome text-chrome-ink">
				<div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
					<div class="flex items-center gap-2">
						<span class="text-highlight"><?php echo teoriageek_icon( 'film', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
						<h2 class="font-display text-xl tracking-wider text-highlight">
							<?php esc_html_e( 'REELS EM DESTAQUE', 'teoriageek' ); ?>
						</h2>
					</div>
					<a href="<?php echo esc_url( teoriageek_get_reels_url() ); ?>" class="font-sans text-[11px] font-bold uppercase tracking-wider text-chrome-ink hover:text-highlight">
						<?php esc_html_e( 'Abrir Reels', 'teoriageek' ); ?>
					</a>
				</div>

				<!-- Facade Pattern 3:4: thumbnail leve; carrega micro-story sob demanda ao clicar -->
				<div class="tg-reel-facade relative aspect-[3/4] max-h-[430px] w-full overflow-hidden lg:max-h-[460px]" data-tg-reel-slug="<?php echo esc_attr( $tg_reel->post_name ); ?>" data-tg-reel-full-url="<?php echo esc_url( teoriageek_get_reels_url( $tg_reel->post_name ) ); ?>">
					<?php
					get_template_part(
						'template-parts/cover-media',
						null,
						array(
							'post_id'      => $tg_r_id,
							'size'         => 'tg-card',
							'aspect_class' => 'h-full w-full',
							'priority'     => true,
							'decorative'   => true,
						)
					);
					?>
					<div class="tg-reel-facade-overlay absolute inset-0 z-20 flex flex-col justify-end p-5" style="background:linear-gradient(to top, var(--scrim-reels) 4%, rgba(8,11,18,0.82) 52%, rgba(8,11,18,0.14) 100%);">
						<div class="mb-2.5 flex items-center justify-between">
							<?php teoriageek_category_badge( $tg_r_cat, false, 'sm' ); ?>
							<button type="button" data-tg-reel-facade-play aria-label="<?php echo esc_attr( sprintf( __( 'Reproduzir resumo rápido: %s', 'teoriageek' ), $tg_r_title ) ); ?>" class="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-[#0B0F19] bg-highlight text-ink-highlight">
								<?php echo teoriageek_icon( 'play', 'h-4 w-4 fill-current' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
							</button>
						</div>
						<a href="<?php echo esc_url( teoriageek_get_reels_url( $tg_reel->post_name ) ); ?>" class="group/reel-title block">
							<h3 class="font-headline text-2xl font-bold leading-[1.12] tracking-[0.005em] text-white group-hover/reel-title:text-highlight">
								<?php echo esc_html( $tg_r_title ); ?>
							</h3>
						</a>
						<p class="mt-2 line-clamp-2 font-reading text-xs leading-relaxed text-white/90">
							<?php echo esc_html( teoriageek_get_reels_summary( $tg_r_id ) ); ?>
						</p>
					</div>
				</div>
			</div>
		<?php endif; ?>

		<?php if ( ! empty( $tg_urgent ) ) : ?>
			<div class="rounded-lg border border-border-subtle bg-surface p-4 shadow-sm">
				<div class="mb-3.5 flex items-center justify-between border-b border-border-subtle pb-2.5">
					<h2 class="font-headline text-xl font-extrabold uppercase tracking-[0.01em] text-ink-primary">
						<?php esc_html_e( 'Radar na Redação', 'teoriageek' ); ?>
					</h2>
					<span class="font-mono text-[11px] font-bold uppercase tracking-wider text-brand">
						<?php esc_html_e( 'Agora', 'teoriageek' ); ?>
					</span>
				</div>

				<div class="space-y-3">
					<?php foreach ( $tg_urgent as $tg_u_post ) : ?>
						<?php
						get_template_part(
							'template-parts/card-compact',
							null,
							array(
								'post'    => $tg_u_post,
								'surface' => 'alt',
							)
						);
						?>
					<?php endforeach; ?>
				</div>
			</div>
		<?php endif; ?>
	</aside>
</section>

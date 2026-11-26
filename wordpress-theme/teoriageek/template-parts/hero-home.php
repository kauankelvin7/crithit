<?php
/**
 * Template Part: Dobra Principal da Home (Hero 8 cols com borda HQ + 3 Secundárias suaves
 * + Reels em Destaque vertical 3:4 com Facade Pattern + Radar na Redação suavizado).
 *
 * @package TeoriaGeek
 * @var array $args { hero: WP_Post|null, secondary: WP_Post[], reel: WP_Post|null, urgent: WP_Post[] }
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_hero      = isset( $args['hero'] ) && $args['hero'] instanceof WP_Post ? $args['hero'] : null;
$tg_secondary = isset( $args['secondary'] ) && is_array( $args['secondary'] ) ? $args['secondary'] : array();
$tg_reel      = isset( $args['reel'] ) && $args['reel'] instanceof WP_Post ? $args['reel'] : $tg_hero;
$tg_urgent    = isset( $args['urgent'] ) && is_array( $args['urgent'] ) ? $args['urgent'] : array();
?>
<section aria-label="<?php esc_attr_e( 'Destaques principais da capa', 'teoriageek' ); ?>" class="grid gap-6 lg:grid-cols-12">
	<div class="space-y-6 lg:col-span-8">
		<?php if ( $tg_hero ) : ?>
			<?php
			$tg_h_id      = (int) $tg_hero->ID;
			$tg_h_cat     = teoriageek_get_primary_category( $tg_h_id );
			$tg_h_score   = teoriageek_get_post_score( $tg_h_id );
			$tg_h_title   = teoriageek_clean_title( get_the_title( $tg_h_id ) );
			$tg_h_lead    = teoriageek_get_post_lead( $tg_h_id, 230 );
			$tg_h_bullets = teoriageek_get_post_bullets( $tg_h_id, true );
			$tg_h_author  = get_the_author_meta( 'display_name', (int) $tg_hero->post_author );
			$tg_h_url     = get_permalink( $tg_h_id );
			?>
			<article class="editorial-card group overflow-hidden rounded-lg border-2 border-border-strong bg-surface shadow-hard">
				<div class="relative overflow-hidden">
					<a href="<?php echo esc_url( $tg_h_url ); ?>" class="block overflow-hidden">
						<?php
						get_template_part(
							'template-parts/cover-media',
							null,
							array(
								'post_id'      => $tg_h_id,
								'size'         => 'tg-hero',
								'aspect_class' => 'aspect-[16/9] max-h-[250px] sm:max-h-[330px] lg:max-h-[375px]',
								'priority'     => true,
							)
						);
						?>
					</a>
					<?php if ( null !== $tg_h_score ) : ?>
						<div class="absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded border-2 border-[#0B0F19] bg-highlight px-2.5 py-1 font-display text-xl leading-none text-ink-highlight shadow-hard-sm">
							<?php echo teoriageek_icon( 'star', 'h-4 w-4 fill-current' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
							<span><?php echo esc_html( $tg_h_score ); ?></span>
						</div>
					<?php endif; ?>
				</div>

				<div class="space-y-3 p-4 sm:p-5">
					<div class="flex flex-wrap items-center gap-2.5">
						<?php teoriageek_category_badge( $tg_h_cat, true, 'md', true ); ?>
						<span class="font-mono text-xs text-ink-muted">
							<?php echo esc_html( sprintf( __( '%d min de leitura', 'teoriageek' ), teoriageek_get_reading_time( $tg_h_id ) ) ); ?>
						</span>
						<span aria-hidden="true" class="text-border-subtle">·</span>
						<span class="font-mono text-xs text-ink-muted">
							<?php echo esc_html( teoriageek_get_relative_date( $tg_h_id ) ); ?>
						</span>
					</div>

					<h1 class="font-headline text-2xl font-extrabold leading-[1.1] tracking-[0.005em] text-ink-primary sm:text-[2.25rem]">
						<a href="<?php echo esc_url( $tg_h_url ); ?>" class="hover:text-brand">
							<?php echo esc_html( $tg_h_title ); ?>
						</a>
					</h1>

					<?php if ( '' !== $tg_h_lead ) : ?>
						<p class="line-clamp-2 font-reading text-sm leading-relaxed text-ink-secondary sm:text-base">
							<?php echo esc_html( $tg_h_lead ); ?>
						</p>
					<?php endif; ?>

					<?php if ( ! empty( $tg_h_bullets ) ) : ?>
						<ul class="space-y-1.5 border-l-4 border-brand pl-4 font-reading text-sm text-ink-secondary">
							<?php foreach ( array_slice( $tg_h_bullets, 0, 3 ) as $tg_bullet ) : ?>
								<li class="leading-snug"><?php echo esc_html( $tg_bullet ); ?></li>
							<?php endforeach; ?>
						</ul>
					<?php endif; ?>

					<div class="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4">
						<span class="font-mono text-xs font-medium text-ink-secondary">
							<?php echo esc_html( sprintf( __( 'Por %s', 'teoriageek' ), $tg_h_author ) ); ?>
						</span>

						<a href="<?php echo esc_url( $tg_h_url ); ?>" class="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-brand hover:underline">
							<span><?php esc_html_e( 'Ler matéria', 'teoriageek' ); ?></span>
							<?php echo teoriageek_icon( 'arrow-right', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						</a>
					</div>
				</div>
			</article>
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

	<aside aria-label="<?php esc_attr_e( 'Reels em Destaque e Radar da Redação', 'teoriageek' ); ?>" class="space-y-6 lg:col-span-4">
		<?php if ( $tg_reel ) : ?>
			<?php
			$tg_r_id    = (int) $tg_reel->ID;
			$tg_r_cat   = teoriageek_get_primary_category( $tg_r_id );
			$tg_r_title = teoriageek_clean_title( get_the_title( $tg_r_id ) );
			?>
			<div data-chrome="dark" class="overflow-hidden rounded-lg border-2 border-border-strong bg-chrome text-chrome-ink shadow-hard">
				<div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
					<div class="flex items-center gap-2">
						<span class="text-highlight"><?php echo teoriageek_icon( 'film', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
						<h2 class="font-display text-xl tracking-wider text-highlight">
							<?php esc_html_e( 'REELS EM DESTAQUE', 'teoriageek' ); ?>
						</h2>
					</div>
					<a href="<?php echo esc_url( teoriageek_get_reels_url() ); ?>" class="font-mono text-[11px] font-bold uppercase tracking-wider text-chrome-ink hover:text-highlight">
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
							<button type="button" data-tg-reel-facade-play aria-label="<?php echo esc_attr( sprintf( __( 'Reproduzir resumo rápido: %s', 'teoriageek' ), $tg_r_title ) ); ?>" class="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#0B0F19] bg-highlight text-ink-highlight shadow-hard-sm transition-transform hover:scale-105">
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

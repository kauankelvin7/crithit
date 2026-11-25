<?php
/**
 * Template Part: Dobra Principal da Home (Hero 8 cols + 3 Secundárias + Reels & Urgente 4 cols).
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
			$tg_h_title   = html_entity_decode( get_the_title( $tg_h_id ), ENT_QUOTES, 'UTF-8' );
			$tg_h_lead    = teoriageek_get_post_lead( $tg_h_id, 240 );
			$tg_h_bullets = teoriageek_get_post_bullets( $tg_h_id, true );
			$tg_h_author  = get_the_author_meta( 'display_name', (int) $tg_hero->post_author );
			$tg_h_url     = get_permalink( $tg_h_id );
			?>
			<article class="editorial-card group overflow-hidden rounded border-2 border-border-strong bg-surface shadow-hard">
				<div class="relative overflow-hidden">
					<a href="<?php echo esc_url( $tg_h_url ); ?>" class="block overflow-hidden">
						<?php
						get_template_part(
							'template-parts/cover-media',
							null,
							array(
								'post_id'      => $tg_h_id,
								'size'         => 'tg-hero',
								'aspect_class' => 'aspect-[16/9]',
								'priority'     => true,
							)
						);
						?>
					</a>
					<?php if ( null !== $tg_h_score ) : ?>
						<div class="absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded border-2 border-[#111111] bg-highlight px-2.5 py-1 font-display text-xl leading-none text-ink-highlight shadow-hard-sm">
							<?php echo teoriageek_icon( 'star', 'h-4 w-4 fill-current' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
							<span><?php echo esc_html( $tg_h_score ); ?></span>
						</div>
					<?php endif; ?>
				</div>

				<div class="space-y-4 p-5 sm:p-6">
					<div class="flex flex-wrap items-center gap-2.5">
						<?php teoriageek_category_badge( $tg_h_cat, true, 'md', true ); ?>
						<span class="inline-flex items-center gap-1 font-mono text-xs text-ink-muted">
							<?php echo teoriageek_icon( 'clock', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
							<?php echo esc_html( sprintf( __( '%d min de leitura', 'teoriageek' ), teoriageek_get_reading_time( $tg_h_id ) ) ); ?>
						</span>
						<span class="font-mono text-xs text-ink-muted">
							<?php echo esc_html( teoriageek_get_relative_date( $tg_h_id ) ); ?>
						</span>
					</div>

					<h1 class="font-headline text-3xl font-extrabold leading-[1.05] tracking-tight text-ink-primary sm:text-5xl">
						<a href="<?php echo esc_url( $tg_h_url ); ?>" class="hover:text-brand">
							<?php echo esc_html( $tg_h_title ); ?>
						</a>
					</h1>

					<?php if ( '' !== $tg_h_lead ) : ?>
						<p class="font-reading text-base leading-relaxed text-ink-secondary sm:text-lg">
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
						<div class="flex items-center gap-2 font-mono text-xs text-ink-secondary">
							<span class="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider" style="background-color:var(--accent-cinema-soft);color:var(--ink-on-cinema-soft);">
								<?php echo teoriageek_icon( 'pen-tool', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
								<?php esc_html_e( 'REDAÇÃO TG', 'teoriageek' ); ?>
							</span>
							<span><?php echo esc_html( sprintf( __( 'Por %s', 'teoriageek' ), $tg_h_author ) ); ?></span>
						</div>

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
			$tg_r_id  = (int) $tg_reel->ID;
			$tg_r_cat = teoriageek_get_primary_category( $tg_r_id );
			?>
			<div data-chrome="dark" class="overflow-hidden rounded border-2 border-border-strong bg-chrome text-chrome-ink shadow-hard">
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

				<a href="<?php echo esc_url( teoriageek_get_reels_url( $tg_reel->post_name ) ); ?>" class="group relative block aspect-[4/5] w-full overflow-hidden">
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
					<div class="absolute inset-0 z-20 flex flex-col justify-end p-5" style="background:linear-gradient(to top, var(--scrim-reels) 0%, rgba(8,11,18,0.84) 55%, rgba(8,11,18,0.16) 100%);">
						<div class="mb-2 flex items-center justify-between">
							<?php teoriageek_category_badge( $tg_r_cat, false, 'sm' ); ?>
							<span class="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0B0F19] bg-highlight text-ink-highlight transition-transform group-hover:scale-105">
								<?php echo teoriageek_icon( 'play', 'h-4 w-4 fill-current' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
							</span>
						</div>
						<h3 class="font-headline text-2xl font-bold leading-tight text-white group-hover:text-highlight">
							<?php echo esc_html( html_entity_decode( get_the_title( $tg_r_id ), ENT_QUOTES, 'UTF-8' ) ); ?>
						</h3>
						<p class="mt-2 line-clamp-2 font-reading text-xs leading-relaxed text-white/90">
							<?php echo esc_html( teoriageek_get_reels_summary( $tg_r_id ) ); ?>
						</p>
					</div>
				</a>
			</div>
		<?php endif; ?>

		<?php if ( ! empty( $tg_urgent ) ) : ?>
			<div class="rounded border-2 border-border-strong bg-surface p-4 shadow-hard">
				<div class="mb-4 flex items-center justify-between border-b-2 border-border-strong pb-2.5">
					<div class="flex items-center gap-2">
						<span class="inline-flex items-center gap-1 rounded border border-[#0B0F19] bg-highlight px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-ink-highlight">
							<?php echo teoriageek_icon( 'radio', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
							<?php esc_html_e( 'RADAR', 'teoriageek' ); ?>
						</span>
						<h2 class="font-headline text-xl font-extrabold uppercase tracking-tight text-ink-primary">
							<?php esc_html_e( 'Na Redação', 'teoriageek' ); ?>
						</h2>
					</div>
					<span class="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase text-ink-muted">
						<span class="relative flex h-2 w-2" aria-hidden="true">
							<span class="live-dot-ping absolute inline-flex h-full w-full rounded-full bg-brand-fill"></span>
							<span class="relative inline-flex h-2 w-2 rounded-full bg-brand-fill"></span>
						</span>
						<?php esc_html_e( 'ATUALIZADO', 'teoriageek' ); ?>
					</span>
				</div>

				<div class="space-y-3.5">
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

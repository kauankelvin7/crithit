<?php
/**
 * Template Part: Card horizontal compacto com borda suavizada (Giro Geek & Radar).
 *
 * @package TeoriaGeek
 * @var array $args { post?: WP_Post, surface?: string }
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_cpost = isset( $args['post'] ) && $args['post'] instanceof WP_Post ? $args['post'] : get_post();
if ( ! $tg_cpost instanceof WP_Post ) {
	return;
}

$tg_pid       = (int) $tg_cpost->ID;
$tg_surface   = isset( $args['surface'] ) && 'alt' === $args['surface'] ? 'bg-surface-alt hover:bg-surface-hover' : 'bg-surface';
$tg_cat       = teoriageek_get_primary_category( $tg_pid );
$tg_permalink = get_permalink( $tg_pid );
$tg_title     = teoriageek_clean_title( get_the_title( $tg_pid ) );
$tg_author    = get_the_author_meta( 'display_name', (int) $tg_cpost->post_author );
$tg_read_mins = teoriageek_get_reading_time( $tg_pid );
?>
<article class="editorial-card editorial-card-soft group flex flex-col justify-between rounded-lg border border-border-subtle p-3.5 shadow-sm <?php echo esc_attr( $tg_surface ); ?>">
	<div class="flex items-start gap-3">
		<a href="<?php echo esc_url( $tg_permalink ); ?>" tabindex="-1" aria-hidden="true" class="h-16 w-16 shrink-0 overflow-hidden rounded border border-border-subtle">
			<?php
			get_template_part(
				'template-parts/cover-media',
				null,
				array(
					'post_id'      => $tg_pid,
					'size'         => 'tg-thumb',
					'aspect_class' => 'h-full w-full',
					'decorative'   => true,
				)
			);
			?>
		</a>
		<div class="min-w-0 flex-1">
			<div class="mb-1.5 flex items-center justify-between gap-1.5">
				<?php teoriageek_category_badge( $tg_cat, false, 'sm' ); ?>
				<span class="shrink-0 font-mono text-[11px] text-ink-muted">
					<?php echo esc_html( teoriageek_get_relative_date( $tg_pid ) ); ?>
				</span>
			</div>
			<h3 class="line-clamp-3 font-sans text-sm font-bold leading-snug text-ink-primary group-hover:text-brand">
				<a href="<?php echo esc_url( $tg_permalink ); ?>" class="hover:underline">
					<?php echo esc_html( $tg_title ); ?>
				</a>
			</h3>
		</div>
	</div>
	<div class="mt-3 flex items-center justify-between border-t border-border-subtle pt-2 font-mono text-[11px] text-ink-muted">
		<span class="truncate"><?php echo esc_html( $tg_author ); ?></span>
		<span><?php echo esc_html( sprintf( '%d min', $tg_read_mins ) ); ?></span>
	</div>
</article>

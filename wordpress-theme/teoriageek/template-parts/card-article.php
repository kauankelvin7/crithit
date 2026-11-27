<?php
/**
 * Template Part: Card de Matéria reutilizável com bordas suaves e contain: layout style.
 *
 * @package TeoriaGeek
 * @var array $args { post?: WP_Post, variant?: string, heading_tag?: string }
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_card_post = isset( $args['post'] ) && $args['post'] instanceof WP_Post ? $args['post'] : get_post();
if ( ! $tg_card_post instanceof WP_Post ) {
	return;
}

$tg_pid         = (int) $tg_card_post->ID;
$tg_variant     = isset( $args['variant'] ) ? (string) $args['variant'] : 'default';
$tg_heading_tag = isset( $args['heading_tag'] ) && in_array( $args['heading_tag'], array( 'h2', 'h3', 'h4' ), true ) ? $args['heading_tag'] : 'h3';

$tg_cat         = teoriageek_get_primary_category( $tg_pid );
$tg_format      = teoriageek_get_post_format_badge( $tg_pid );
$tg_score       = teoriageek_get_post_score( $tg_pid );
$tg_has_spoiler = (bool) get_post_meta( $tg_pid, '_tg_has_spoilers', true );
$tg_permalink   = get_permalink( $tg_pid );
$tg_title       = teoriageek_clean_title( get_the_title( $tg_pid ) );
$tg_lead        = teoriageek_get_post_lead( $tg_pid, 145 );
$tg_author_id   = (int) $tg_card_post->post_author;
$tg_author_name = get_the_author_meta( 'display_name', $tg_author_id );
$tg_read_mins   = teoriageek_get_reading_time( $tg_pid );
$tg_rel_date    = teoriageek_get_relative_date( $tg_pid );
?>
<article class="tgx-article-card editorial-card editorial-card-soft group relative flex flex-col overflow-hidden">
	<div class="relative overflow-hidden rounded-sm">
		<a href="<?php echo esc_url( $tg_permalink ); ?>" class="block overflow-hidden" tabindex="-1" aria-hidden="true">
			<?php
			get_template_part(
				'template-parts/cover-media',
				null,
				array(
					'post_id'      => $tg_pid,
					'size'         => 'tg-card',
					'aspect_class' => 'aspect-[16/9]',
					'decorative'   => true,
				)
			);
			?>
		</a>

		<div class="tgx-card-scrim pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16"></div>
		<div class="absolute bottom-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between gap-2">
			<div class="min-w-0">
				<?php teoriageek_category_badge( $tg_cat, true, 'sm' ); ?>
			</div>
			<?php if ( $tg_has_spoiler ) : ?>
				<span class="tg-card-spoiler-pill"><?php esc_html_e( 'Spoiler', 'teoriageek' ); ?></span>
			<?php endif; ?>
		</div>

		<?php if ( null !== $tg_score ) : ?>
			<div aria-label="<?php echo esc_attr( sprintf( __( 'Nota editorial: %s de 10', 'teoriageek' ), $tg_score ) ); ?>" class="absolute right-2.5 top-2.5 z-20 inline-flex items-center gap-1 rounded-sm border border-[#0B0F19] bg-highlight px-2 py-0.5 font-display text-lg leading-none text-ink-highlight">
				<?php echo teoriageek_icon( 'star', 'h-3.5 w-3.5 fill-current' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<span><?php echo esc_html( $tg_score ); ?></span>
			</div>
		<?php endif; ?>
	</div>

	<div class="flex flex-1 flex-col gap-2.5 p-4">
		<<?php echo esc_attr( $tg_heading_tag ); ?> class="tgx-card-title font-sans text-[15.5px] font-bold leading-[1.32] text-ink-primary group-hover:text-brand">
			<a href="<?php echo esc_url( $tg_permalink ); ?>" class="hover:underline decoration-2 underline-offset-2">
				<?php echo esc_html( $tg_title ); ?>
			</a>
		</<?php echo esc_attr( $tg_heading_tag ); ?>>

		<?php if ( 'compact-grid' !== $tg_variant && '' !== $tg_lead ) : ?>
			<p class="line-clamp-2 font-reading text-xs leading-relaxed text-ink-secondary sm:text-sm">
				<?php echo esc_html( $tg_lead ); ?>
			</p>
		<?php endif; ?>

		<div class="mt-auto flex items-center justify-between gap-2 border-t border-border-subtle pt-2.5 font-sans text-[11px] text-ink-muted">
			<?php teoriageek_render_author_chip( $tg_author_id, 20, false ); ?>
			<span class="shrink-0 whitespace-nowrap"><?php echo esc_html( sprintf( '%s · %d min', $tg_rel_date, $tg_read_mins ) ); ?></span>
		</div>
	</div>
</article>

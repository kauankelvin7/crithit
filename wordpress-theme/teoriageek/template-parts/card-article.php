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
$tg_permalink   = get_permalink( $tg_pid );
$tg_title       = teoriageek_clean_title( get_the_title( $tg_pid ) );
$tg_lead        = teoriageek_get_post_lead( $tg_pid, 145 );
$tg_author_id   = (int) $tg_card_post->post_author;
$tg_author_name = get_the_author_meta( 'display_name', $tg_author_id );
$tg_read_mins   = teoriageek_get_reading_time( $tg_pid );
$tg_rel_date    = teoriageek_get_relative_date( $tg_pid );
?>
<article class="editorial-card editorial-card-soft group flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-sm">
	<div class="relative overflow-hidden">
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

		<?php if ( null !== $tg_score ) : ?>
			<div aria-label="<?php echo esc_attr( sprintf( __( 'Nota editorial: %s de 10', 'teoriageek' ), $tg_score ) ); ?>" class="absolute right-2.5 top-2.5 z-20 inline-flex items-center gap-1 rounded border-2 border-[#0B0F19] bg-highlight px-2 py-0.5 font-display text-lg leading-none text-ink-highlight shadow-hard-sm">
				<?php echo teoriageek_icon( 'star', 'h-3.5 w-3.5 fill-current' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<span><?php echo esc_html( $tg_score ); ?></span>
			</div>
		<?php endif; ?>
	</div>

	<div class="flex flex-1 flex-col gap-2.5 p-4">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<div class="flex flex-wrap items-center gap-1.5">
				<?php if ( 'review' === $tg_variant ) : ?>
					<span class="rounded bg-brand-fill px-1.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-white">
						<?php echo esc_html( $tg_format['label'] ); ?>
					</span>
				<?php endif; ?>
				<?php teoriageek_category_badge( $tg_cat, true, 'sm' ); ?>
			</div>
			<span class="font-mono text-[11px] text-ink-muted">
				<?php echo esc_html( $tg_rel_date ); ?>
			</span>
		</div>

		<<?php echo esc_attr( $tg_heading_tag ); ?> class="font-sans text-[15px] font-bold leading-snug text-ink-primary group-hover:text-brand">
			<a href="<?php echo esc_url( $tg_permalink ); ?>" class="hover:underline decoration-2 underline-offset-2">
				<?php echo esc_html( $tg_title ); ?>
			</a>
		</<?php echo esc_attr( $tg_heading_tag ); ?>>

		<?php if ( 'compact-grid' !== $tg_variant && '' !== $tg_lead ) : ?>
			<p class="line-clamp-2 font-reading text-xs leading-relaxed text-ink-secondary sm:text-sm">
				<?php echo esc_html( $tg_lead ); ?>
			</p>
		<?php endif; ?>

		<div class="mt-auto flex items-center justify-between gap-2 border-t border-border-subtle pt-2.5 font-mono text-[11px] text-ink-muted">
			<span class="truncate font-medium text-ink-secondary">
				<?php echo esc_html( sprintf( __( 'Por %s', 'teoriageek' ), $tg_author_name ) ); ?>
			</span>
			<span class="shrink-0"><?php echo esc_html( sprintf( '%d min', $tg_read_mins ) ); ?></span>
		</div>
	</div>
</article>
